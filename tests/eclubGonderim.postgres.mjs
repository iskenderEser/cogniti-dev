// node tests/eclubGonderim.postgres.mjs
// Native PostgreSQL yalnız /tmp Unix socket üzerinden çalışır. Ortam DB URL'leri okunmaz.
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
const binaryRoot=process.env.ECLUB_TEST_PG_BINARY_ROOT ?? '/tmp/hapbilgi-eclub-pg11/node_modules/@embedded-postgres/darwin-arm64';
const {initdb,postgres,pg_ctl}=await import(pathToFileURL(resolve(binaryRoot,'dist/index.js')).href);
const root=await mkdtemp('/tmp/hapbilgi-eclub-pg11-run-');
const socket=join(root,'socket'),data=join(root,'data');await mkdir(socket);
const port=55431;const config={host:socket,port,user:'eclub_test_admin',database:'postgres',connectionTimeoutMillis:5000,statement_timeout:8000};
const clients=[];let server;let db;let passed=0;const results=[];
async function connect(){const c=new pg.Client(config);await c.connect();clients.push(c);return c;}
async function check(name,fn){await fn();passed++;results.push(name);console.log(`OK ${passed}: ${name}`);}
const id=(n)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const utt=id(1),member=id(2),member2=id(3),firm=id(4),product=id(5),product2=id(6);
const pub=Array.from({length:12},(_,i)=>id(100+i));
const tool=Array.from({length:12},(_,i)=>id(200+i));
async function reset(){await db.query('TRUNCATE eclub_yayin_gonderim_planlari,eclub_oneri_kayitlari CASCADE');}
async function replica(fn){await db.query("SET session_replication_role='replica'");try{return await fn();}finally{await db.query("SET session_replication_role='origin'");}}
async function history(y,time,k=member){return replica(()=>db.query(`INSERT INTO eclub_oneri_kayitlari(oneren_id,kisi_id,yayin_id,arac_id,arac_turu,oneri_baslangic,oneri_bitis) VALUES($1,$2,$3,$4,'video',$5::timestamptz,$5::timestamptz+interval '15 days')`,[utt,k,pub[y],tool[y],time]));}
async function planFixture(y,time,extras={}){
 const plan=randomUUID();await replica(()=>db.query(`INSERT INTO eclub_yayin_gonderim_planlari(plan_id,utt_id,kisi_id,yayin_id,urun_id,hedef_gonderim_at,islem_anahtari,durum,isleme_alindi_at,lease_bitis)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[plan,utt,extras.member??member,pub[y],y===8?product2:product,time,randomUUID(),extras.durum??'bekliyor',extras.claim??null,extras.lease??null]));return plan;
}
async function control(y,target,now=target,mode='gonder',plan=null){return (await db.query('SELECT eclub_gonderim_kontrol_hesapla($1,$2,$3,$4,$5,$6,$7) r',[utt,member,pub[y],target,mode,plan,now])).rows[0].r;}
async function batch(c,ys,ks=[member],target=null,key=null,preview=false){return (await c.query('SELECT eclub_yayin_toplu_islem($1,$2::uuid[],$3::uuid[],$4,$5,$6) r',[utt,ks,ys.map(y=>pub[y]),target,key,preview])).rows[0].r;}
async function send(c,y,k=member){return (await c.query('SELECT * FROM eclub_yayin_gonder($1,$2,$3,NULL)',[utt,k,pub[y]])).rows[0];}
async function worker(c=db,closed=[]){return (await c.query('SELECT eclub_planlanan_gonderimi_isle($1::text[]) r',[closed])).rows[0].r;}
async function count(table){assert.ok(['eclub_oneri_kayitlari','eclub_yayin_gonderim_planlari'].includes(table));return Number((await db.query(`SELECT count(*) n FROM ${table}`)).rows[0].n);}
async function expectReason(y,t,reason,now=t,mode='gonder'){assert.equal((await control(y,t,now,mode)).sebep,reason);}
try{
 execFileSync(initdb,['-D',data,'-U',config.user,'-A','trust','--locale=C','--encoding=UTF8'],{stdio:'pipe'});
 server=spawn(postgres,['-D',data,'-h','','-k',socket,'-p',String(port),'-c','fsync=off'],{stdio:['ignore','pipe','pipe']});
 let log='';server.stderr.on('data',b=>{log+=b;});
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(log||'Yerel PostgreSQL başlamadı.')),10000);
 server.on('exit',()=>{clearTimeout(timeout);reject(new Error(log));});
 server.stderr.on('data',()=>{if(log.includes('ready to accept connections')){clearTimeout(timeout);resolve();}});});
 db=await connect();
 assert.equal((await db.query('SELECT inet_server_addr() address')).rows[0].address,null);
 console.log(`Yerel PostgreSQL ${(await db.query('SHOW server_version')).rows[0].server_version}; yalnız Unix socket.`);
 await db.query(await readFile('tests/fixtures/eclub-gonderim-postgres.sql','utf8'));
 const migrations=['eclub_yayin_gonderim_planlari.sql','eclub_gonderim_kota_ve_tarih_kontrolu.sql','eclub_gonderim_rpc_yeni_kurgu.sql','eclub_gonderim_api_toplu.sql','eclub_planlanan_gonderim_isleyici.sql'];
 for(const f of migrations)await db.query(await readFile(`scripts/sql/${f}`,'utf8'));
 await db.query('INSERT INTO firmalar VALUES($1,true,true);',[firm]);
 await db.query('INSERT INTO urunler VALUES($1),($2)',[product,product2]);
 await db.query("INSERT INTO kullanicilar VALUES($1,$2,NULL,'utt',true)",[utt,firm]);
 for(const k of [member,member2]){
  await db.query("INSERT INTO eclub_kisiler VALUES($1,'eczaci',$1,true)",[k]);
  const e=randomUUID(),ef=randomUUID();await db.query('INSERT INTO eclub_kisi_eczane VALUES($1,$2,$3,true)',[randomUUID(),k,e]);
  await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,$3,true)',[ef,e,firm]);
  await db.query('INSERT INTO eclub_utt_eczane VALUES($1,$2,$3,true)',[randomUUID(),ef,utt]);
 }
 await db.query(await readFile('scripts/sql/eclub_puan_yazma_fonksiyonlari_eczane.sql','utf8'));
 const seekSource=await readFile('scripts/sql/eclub_ileri_sarma_kurali.sql','utf8');
 const seekFunction=seekSource.match(/CREATE OR REPLACE FUNCTION public\.eclub_ileri_sarma_kaydet\([\s\S]*?\n\$fonksiyon\$;/)?.[0];
 assert.ok(seekFunction,'Mevcut ileri sarma RPC tanımı bulunmalı');await db.query(seekFunction);
 for(let y=0;y<pub.length;y++){
  await db.query('INSERT INTO ogrenme_araclari VALUES($1,NULL)',[tool[y]]);
  await db.query("INSERT INTO yayin_yonetimi(yayin_id,firma_id,durum,hedef_roller,urun_id,arac_id,arac_turu,yayin_tarihi) VALUES($1,$2,'yayinda',ARRAY['eczaci'],$3,$4,$5,'2020-01-01')",[pub[y],firm,y===8?product2:product,tool[y],y<9?'video':['podcast','gorsel','flip_pdf'][y-9]]);
  await db.query("INSERT INTO eclub_utt_yayin_incelemeleri VALUES($1,$2,'2020-01-02')",[utt,pub[y]]);
 }
 const now=(await db.query('SELECT clock_timestamp() n')).rows[0].n;
 const dow=Number((await db.query("SELECT extract(isodow FROM clock_timestamp() AT TIME ZONE 'Europe/Istanbul') d")).rows[0].d);
 if(dow>5)throw new Error('Gerçek saatli anlık gönderim/işleyici testleri hafta içi çalıştırılmalıdır. Tarih hesap testleri sabit tarihlidir.');
 const future=(await db.query("SELECT clock_timestamp()+interval '2 minutes' n")).rows[0].n;
 await check('Beş migration gerçek PostgreSQL’de kurulur ve tekrar kurulabilir',async()=>{for(const f of migrations)await db.query(await readFile(`scripts/sql/${f}`,'utf8'));});
 await check('Haftalık üçüncü izinli, dördüncü reddedilir; farklı ürün ayrı sayılır',async()=>{
  await reset();await history(0,'2026-10-12T09:00:00+03:00');await history(1,'2026-10-13T09:00:00+03:00');
  assert.equal((await control(2,'2026-10-14T09:00:00+03:00')).uygun,true);await history(2,'2026-10-14T09:00:00+03:00');
  await expectReason(3,'2026-10-15T09:00:00+03:00','haftalik_urun_kotasi');assert.equal((await control(8,'2026-10-15T09:00:00+03:00')).uygun,true);
 });
 await check('Haftalık kota üye bazlıdır, diğer üye etkilenmez',async()=>{
  await reset();for(let y=0;y<3;y++)await history(y,'2026-10-13T09:00:00+03:00',member2);
  assert.equal((await control(3,'2026-10-13T10:00:00+03:00')).uygun,true);
 });
 await check('Gerçek gönderimler ile bekleyen planların haftalık toplamı üçtür',async()=>{
  await reset();await history(0,'2026-10-12T09:00:00+03:00');await planFixture(1,'2026-10-14T09:00:00+03:00');
  assert.equal((await control(2,'2026-10-15T09:00:00+03:00')).haftalik_kullanilan,2);
  await planFixture(2,'2026-10-16T09:00:00+03:00');await expectReason(3,'2026-10-15T09:00:00+03:00','haftalik_urun_kotasi');
 });
 await check('İlk gönderim ve iki tekrar izinli; üçüncü tekrar reddedilir',async()=>{
  await reset();assert.equal((await control(0,'2026-09-01T09:00:00+03:00')).adayla_donemlik_tekrar,0);
  for(const t of ['2026-09-01','2026-09-16','2026-10-01']){assert.equal((await control(0,`${t}T09:00:00+03:00`)).uygun,true);await history(0,`${t}T09:00:00+03:00`);}
  await expectReason(0,'2026-10-16T09:00:00+03:00','donemlik_tekrar_kotasi');
 });
 await check('Önceki dönemden gelen yayın hedef dönemde iki tekrar hakkını kullanır',async()=>{
  await reset();await history(0,'2026-08-03T09:00:00+03:00');
  assert.equal((await control(0,'2026-09-01T09:00:00+03:00')).adayla_donemlik_tekrar,1);
  await history(0,'2026-09-01T09:00:00+03:00');assert.equal((await control(0,'2026-09-16T09:00:00+03:00')).uygun,true);
  await history(0,'2026-09-16T09:00:00+03:00');await expectReason(0,'2026-10-01T09:00:00+03:00','donemlik_tekrar_kotasi');
 });
 await check('15 günün bir milisaniye öncesi kapalı; tam sınır ve sonrası açık',async()=>{
  await reset();await history(0,'2026-10-01T10:00:00+03:00');
  await expectReason(0,'2026-10-16T09:59:59.999+03:00','on_bes_gun_araligi');
  for(const t of ['2026-10-16T10:00:00+03:00','2026-10-16T10:00:00.001+03:00'])assert.equal((await control(0,t)).uygun,true);
 });
 await check('Sonraki planla 15 gün korunur; önceki plan da hesaba katılır',async()=>{
  await reset();await planFixture(0,'2026-10-16T10:00:00+03:00');
  await expectReason(0,'2026-10-01T10:00:00.001+03:00','on_bes_gun_araligi');assert.equal((await control(0,'2026-10-01T10:00:00+03:00')).uygun,true);
  await reset();await planFixture(0,'2026-10-01T10:00:00+03:00');await expectReason(0,'2026-10-16T09:59:59.999+03:00','on_bes_gun_araligi');
 });
 await check('Dönem sınırında 15 günlük bekleme kaybolmaz',async()=>{
  await reset();await history(0,'2026-10-30T10:00:00+03:00');await expectReason(0,'2026-11-02T10:00:00+03:00','on_bes_gun_araligi');
 });
 await check('Hafta sonu gönderim hedefi kapalı; hafta sonundan gelecek hafta planı açık',async()=>{
  await reset();await expectReason(0,'2026-10-17T10:00:00+03:00','hedef_hafta_sonu');
  assert.equal((await control(0,'2026-10-19T10:00:00+03:00','2026-10-17T10:00:00+03:00','planla')).uygun,true);
 });
 await check('Takip eden haftanın son iş günü izinli; ikinci ileri hafta kapalı',async()=>{
  await reset();assert.equal((await control(0,'2026-10-23T10:00:00+03:00','2026-10-13T10:00:00+03:00','planla')).uygun,true);
  await expectReason(0,'2026-10-26T10:00:00+03:00','takip_eden_hafta_asildi','2026-10-13T10:00:00+03:00','planla');
 });
 await check('Takip eden hafta mevcut dönemi aşamaz; yıl geçişi de kapalı',async()=>{
  await reset();await expectReason(0,'2026-11-02T10:00:00+03:00','ileri_donem_planlanamaz','2026-10-29T10:00:00+03:00','planla');
  await expectReason(0,'2027-01-01T10:00:00+03:00','ileri_donem_planlanamaz','2026-12-31T10:00:00+03:00','planla');
 });
 await check('Türkiye gece yarısı dönem ve hafta hesabında kullanılır',async()=>{
  await reset();await expectReason(0,'2026-11-01T22:00:00Z','ileri_donem_planlanamaz','2026-10-30T10:00:00+03:00','planla');
 });
 await check('Plan geçmişe/şimdiki ana yapılamaz',async()=>{
  await reset();await expectReason(0,'2026-10-13T10:00:00+03:00','hedef_gecmiste','2026-10-13T10:00:00+03:00','planla');
 });
 await check('Çoklu önizleme birlikte kota hesaplar ve hiç kayıt yazmaz',async()=>{
  await reset();const r=await batch(db,[0,1,2,3],[member],future,null,true);
  assert.equal(r.sonuclar.filter(s=>s.uygun).length,3);assert.equal(r.sonuclar[3].sebep,'haftalik_urun_kotasi');assert.equal(await count('eclub_oneri_kayitlari'),0);assert.equal(await count('eclub_yayin_gonderim_planlari'),0);
 });
 await check('Çoklu anlık gönderimde aynı ürünün dördüncüsü atlanır, diğer ürün geçer',async()=>{
  await reset();const r=await batch(db,[0,1,2,3,8]);assert.equal(r.sonuclar.filter(s=>s.kaydedildi).length,4);assert.equal(r.sonuclar[3].sebep,'haftalik_urun_kotasi');assert.equal(await count('eclub_oneri_kayitlari'),4);
 });
 await check('Gerçek gönderim süresi 15 gündür; eski RPC istemci tarihini/aracını kullanmaz',async()=>{
  await reset();const r=(await db.query('SELECT * FROM eclub_oneri_atomik_kaydet($1,$2,$3,$4,$5,$6)',[pub[0],utt,member,tool[8],'2000-01-01','2000-01-02'])).rows[0];assert.equal(r.kaydedildi,true);
  const o=(await db.query("SELECT arac_id,extract(epoch FROM (oneri_bitis-oneri_baslangic))/86400 gun FROM eclub_oneri_kayitlari")).rows[0];assert.equal(o.arac_id,tool[0]);assert.equal(Number(o.gun),15);
 });
 await check('Plan kaydı rezervasyon oluşturur; öneri oluşturmaz; tekrar anahtarı tekildir',async()=>{
  await reset();const key=randomUUID();const r=await batch(db,[0],[member],future,key);assert.equal(r.sonuclar[0].kaydedildi,true);assert.equal(await count('eclub_oneri_kayitlari'),0);
  const again=await batch(db,[0],[member],future,key);assert.equal(again.sonuclar[0].sebep,'plan_zaten_kayitli');assert.equal(await count('eclub_yayin_gonderim_planlari'),1);
  assert.equal((await batch(db,[0],[member],new Date(future.getTime()+1000),key)).sonuclar[0].sebep,'islem_anahtari_uyusmuyor');
 });
 await check('Plan kimliği/zamanı ve gerçekleşmiş gönderim süresi değiştirilemez',async()=>{
  await reset();await batch(db,[0],[member],future,randomUUID());await assert.rejects(db.query("UPDATE eclub_yayin_gonderim_planlari SET hedef_gonderim_at=hedef_gonderim_at+interval '1 minute'"),{code:'23514'});
  await reset();await send(db,0);await assert.rejects(db.query("UPDATE eclub_oneri_kayitlari SET oneri_bitis=oneri_bitis+interval '1 day'"),{code:'23514'});
 });
 await check('İki bağımsız oturumda üçüncü/dördüncü yarışını kilit sınırlar',async()=>{
  await reset();await send(db,0);await send(db,1);const a=await connect(),b=await connect();await a.query('BEGIN');assert.equal((await send(a,2)).kaydedildi,true);
  const pending=send(b,3);const pid=b.processID;
  for(let i=0;i<30;i++){const row=(await db.query('SELECT wait_event FROM pg_stat_activity WHERE pid=$1',[pid])).rows[0];if(row?.wait_event==='advisory')break;await new Promise(r=>setTimeout(r,10));}
  assert.equal((await db.query('SELECT wait_event FROM pg_stat_activity WHERE pid=$1',[pid])).rows[0].wait_event,'advisory');
  await a.query('COMMIT');assert.equal((await pending).sebep,'haftalik_urun_kotasi');assert.equal(await count('eclub_oneri_kayitlari'),3);
 });
 await check('Eş zamanlı anlık gönderim ve plan aynı haftalık kotayı aşamaz',async()=>{
  await reset();await send(db,0);await send(db,1);const a=await connect(),b=await connect();await a.query('BEGIN');await send(a,2);
  const pending=batch(b,[3],[member],future,randomUUID());await a.query('COMMIT');assert.equal((await pending).sonuclar[0].sebep,'haftalik_urun_kotasi');assert.equal(await count('eclub_yayin_gonderim_planlari'),0);
 });
 await check('Ters alıcı sıralı eş zamanlı toplu planlar deadlock oluşturmaz',async()=>{
  await reset();const a=await connect(),b=await connect();const rr=await Promise.all([batch(a,[0],[member,member2],future,randomUUID()),batch(b,[1],[member2,member],future,randomUUID())]);
  assert.equal(rr.flatMap(r=>r.sonuclar).filter(s=>s.kaydedildi).length,4);assert.equal(await count('eclub_yayin_gonderim_planlari'),4);
 });
 await check('Planın gerçekleşmesi rezervasyonu iki kere saymaz; plan başına tek öneri',async()=>{
  await reset();await send(db,0);await send(db,1);const plan=await planFixture(2,new Date(now.getTime()-1000));
  const r=await worker();assert.equal(r.durum,'gerceklesti');assert.equal(r.plan_id,plan);assert.equal(await count('eclub_oneri_kayitlari'),3);assert.equal(await worker(),null);
  const row=(await db.query('SELECT durum,oneri_id,gerceklesti_at FROM eclub_yayin_gonderim_planlari WHERE plan_id=$1',[plan])).rows[0];assert.equal(row.durum,'gerceklesti');assert.equal(row.oneri_id,r.oneri_id);
 });
 await check('Aynı planı iki eş zamanlı işleyici ikinci kez gönderemez',async()=>{
  await reset();await planFixture(0,new Date(now.getTime()-1000));const a=await connect(),b=await connect();await a.query('BEGIN');assert.equal((await worker(a)).durum,'gerceklesti');assert.equal(await worker(b),null);
  await a.query('COMMIT');assert.equal(await worker(b),null);assert.equal(await count('eclub_oneri_kayitlari'),1);
 });
 await check('Henüz gelmemiş plan ve aktif lease sahiplenilmez; süresi bitmiş lease işlenir',async()=>{
  await reset();await batch(db,[0],[member],future,randomUUID());assert.equal(await worker(),null);
  await reset();await planFixture(0,new Date(now.getTime()-2000),{durum:'isleniyor',claim:new Date(now.getTime()-1000),lease:future});assert.equal(await worker(),null);
  await reset();await planFixture(0,new Date(now.getTime()-3000),{durum:'isleniyor',claim:new Date(now.getTime()-2000),lease:new Date(now.getTime()-1000)});assert.equal((await worker()).durum,'gerceklesti');assert.equal(await count('eclub_oneri_kayitlari'),1);
 });
 await check('Planın günü geçtiğinde gönderim yapılmaz ve tarih kaydırılmaz',async()=>{
  await reset();const t=new Date(now.getTime()-86400000);const plan=await planFixture(0,t);const r=await worker();assert.equal(r.sebep,'plan_gunu_gecersiz');assert.equal(await count('eclub_oneri_kayitlari'),0);
  assert.equal((await db.query('SELECT hedef_gonderim_at FROM eclub_yayin_gonderim_planlari WHERE plan_id=$1',[plan])).rows[0].hedef_gonderim_at.getTime(),t.getTime());
 });
 await check('Yayın durduğunda, yetki kalktığında veya araç kapandığında plan gerçekleşmez',async()=>{
  for(const mode of ['yayin','yetki','arac']){await reset();await planFixture(0,new Date(now.getTime()-1000));
   if(mode==='yayin')await db.query("UPDATE yayin_yonetimi SET durum='durduruldu' WHERE yayin_id=$1",[pub[0]]);
   if(mode==='yetki')await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[utt]);
   try{const r=await worker(db,mode==='arac'?['video']:[]);assert.equal(r.sebep,mode==='yayin'?'yayin_aktif_degil':mode==='yetki'?'utt_yetkisiz':'arac_kullanima_kapali');assert.equal(await count('eclub_oneri_kayitlari'),0);}
   finally{await db.query("UPDATE yayin_yonetimi SET durum='yayinda' WHERE yayin_id=$1",[pub[0]]);await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[utt]);}
  }
 });
 await check('Transaction iptalinde öneri ve gerçekleşme birlikte geri alınır; yeniden işlenebilir',async()=>{
  await reset();await planFixture(0,new Date(now.getTime()-1000));await db.query('BEGIN');assert.equal((await worker()).durum,'gerceklesti');await db.query('ROLLBACK');assert.equal(await count('eclub_oneri_kayitlari'),0);
  assert.equal((await worker()).durum,'gerceklesti');assert.equal(await count('eclub_oneri_kayitlari'),1);
 });
 await check('Anon/authenticated plan tablosuna veya yeni gönderim RPC’sine erişemez',async()=>{
  await db.query('SET ROLE authenticated');try{await assert.rejects(db.query('SELECT * FROM eclub_yayin_gonderim_planlari'),{code:'42501'});await assert.rejects(db.query('SELECT * FROM eclub_yayin_gonder($1,$2,$3,NULL)',[utt,member,pub[0]]),{code:'42501'});}finally{await db.query('RESET ROLE');}
 });
 await check('Gerçek plan oluşturma → zamanı gelmesi → tek öneri/15 günlük süre zinciri',async()=>{
  await reset();const hedef=(await db.query("SELECT clock_timestamp()+interval '750 milliseconds' n")).rows[0].n;
  const r=await batch(db,[0],[member],hedef,randomUUID());assert.equal(r.sonuclar[0].kaydedildi,true);
  assert.equal(await count('eclub_oneri_kayitlari'),0);assert.equal(await worker(),null);
  await new Promise(r=>setTimeout(r,800));const done=await worker();assert.equal(done.durum,'gerceklesti');
  const o=(await db.query("SELECT plan_id,oneri_baslangic,extract(epoch FROM(oneri_bitis-oneri_baslangic))/86400 gun FROM eclub_oneri_kayitlari")).rows[0];
  assert.equal(o.plan_id,r.sonuclar[0].plan_id);assert.ok(o.oneri_baslangic>=hedef);assert.equal(Number(o.gun),15);
  assert.equal(await worker(),null);assert.equal(await count('eclub_oneri_kayitlari'),1);
 });
 await check('Aynı yayın iki eş zamanlı seçimde ikinci kez gönderilemez',async()=>{
  await reset();const a=await connect(),b=await connect();const rr=await Promise.all([send(a,0),send(b,0)]);
  assert.equal(rr.filter(r=>r.kaydedildi).length,1);assert.equal(rr.find(r=>!r.kaydedildi).sebep,'on_bes_gun_araligi');assert.equal(await count('eclub_oneri_kayitlari'),1);
 });
 await check('İki eş zamanlı aynı anahtarlı plan isteği tek kayıt oluşturur',async()=>{
  await reset();const a=await connect(),b=await connect(),key=randomUUID();const rr=await Promise.all([batch(a,[0],[member],future,key),batch(b,[0],[member],future,key)]);
  assert.equal(rr.flatMap(r=>r.sonuclar).filter(s=>s.kaydedildi).length,1);assert.equal(await count('eclub_yayin_gonderim_planlari'),1);
 });
 await check('Gerçekleşmeyen plan rezervasyonu kota tüketmez',async()=>{
  await reset();for(let y=0;y<3;y++){const p=await planFixture(y,new Date(now.getTime()-1000));await db.query("UPDATE eclub_yayin_gonderim_planlari SET durum='gerceklesmedi',son_hata_kodu='test',son_hata_at=clock_timestamp() WHERE plan_id=$1",[p]);}
  assert.equal((await control(3,now)).haftalik_kullanilan,0);assert.equal((await send(db,3)).kaydedildi,true);
 });
 await check('Doğrudan INSERT de kota kapısından geçer; RPC atlanarak dördüncü kayıt açılamaz',async()=>{
  await reset();for(let y=0;y<3;y++)await send(db,y);
  await assert.rejects(db.query("INSERT INTO eclub_oneri_kayitlari(oneren_id,kisi_id,yayin_id,arac_id,arac_turu,oneri_baslangic,oneri_bitis) VALUES($1,$2,$3,$4,'video',clock_timestamp(),clock_timestamp()+interval '99 days')",[utt,member,pub[3],tool[3]]),e=>e.code==='P0001'&&e.message.includes('haftalik_urun_kotasi'));
  assert.equal(await count('eclub_oneri_kayitlari'),3);
 });
 await check('Aynı üyenin diğer UTT gönderimleri ilk UTT kotasını tüketmez',async()=>{
  await reset();const other=id(900);await db.query("INSERT INTO kullanicilar VALUES($1,$2,NULL,'utt',true)",[other,firm]);
  const ef=(await db.query('SELECT ef.id FROM eclub_eczane_firma ef JOIN eclub_kisi_eczane ke ON ke.eczane_id=ef.eczane_id WHERE ke.kisi_id=$1',[member])).rows[0].id;
  await db.query('INSERT INTO eclub_utt_eczane VALUES($1,$2,$3,true)',[randomUUID(),ef,other]);
  for(let y=0;y<3;y++){await db.query("INSERT INTO eclub_utt_yayin_incelemeleri VALUES($1,$2,'2020-01-02')",[other,pub[y]]);await db.query('SELECT * FROM eclub_yayin_gonder($1,$2,$3,NULL)',[other,member,pub[y]]);}
  assert.equal((await control(3,now)).haftalik_kullanilan,0);assert.equal((await send(db,3)).kaydedildi,true);
 });
 await check('UTT incelemesi tamamlanmamış yayın gönderilemez veya planlanamaz',async()=>{
  await reset();await db.query('DELETE FROM eclub_utt_yayin_incelemeleri WHERE utt_id=$1 AND yayin_id=$2',[utt,pub[0]]);
  try{assert.equal((await send(db,0)).sebep,'inceleme_tamamlanmadi');assert.equal((await batch(db,[0],[member],future,randomUUID())).sonuclar[0].sebep,'inceleme_tamamlanmadi');assert.equal(await count('eclub_oneri_kayitlari'),0);assert.equal(await count('eclub_yayin_gonderim_planlari'),0);}
  finally{await db.query("INSERT INTO eclub_utt_yayin_incelemeleri VALUES($1,$2,'2020-01-02')",[utt,pub[0]]);}
 });
 await check('Alıcının aktif eczane bağı kalkınca plan gönderilmez',async()=>{
  await reset();await planFixture(0,new Date(now.getTime()-1000));await db.query('UPDATE eclub_kisi_eczane SET aktif_mi=false WHERE kisi_id=$1',[member]);
  try{assert.equal((await worker()).sebep,'aktif_alici_bagi_yok');assert.equal(await count('eclub_oneri_kayitlari'),0);}
  finally{await db.query('UPDATE eclub_kisi_eczane SET aktif_mi=true WHERE kisi_id=$1',[member]);}
 });
 async function learning(y,oneri=null,kanit=null){
  const rec=oneri??(await send(db,y)).oneri_id;assert.ok(rec);
  return (await db.query("INSERT INTO eclub_izleme_kayitlari(yayin_id,kisi_id,oneri_id,arac_turu,izleme_baslangic,tamamlama_kaniti) SELECT yayin_id,$2,$3,arac_turu,clock_timestamp()-interval '130 seconds',$4 FROM yayin_yonetimi WHERE yayin_id=$1 RETURNING izleme_id",[pub[y],member,rec,kanit])).rows[0].izleme_id;
 }
 async function finish(i){return (await db.query("SELECT * FROM eclub_izleme_tamamla($1,$2,'2020-01-01',ARRAY[0,1])",[i,member])).rows[0];}
 await check('Üyenin dört araçtaki tamamlaması mevcut RPC ile puan ve soru üretir',async()=>{
  const kanitlar=[null,{aracTuru:'podcast',surum:1,veri:{dogrulanmisSaniye:120,sonaUlasti:true}},
   {aracTuru:'gorsel',surum:1,veri:{aktifIncelemeSaniye:3,kullaniciOnayi:true}},
   {aracTuru:'flip_pdf',surum:1,veri:{toplamSayfa:2,okunanSayfalar:[1,2]}}];
  for(const [index,y] of [0,9,10,11].entries()){await reset();const i=await learning(y,null,kanitlar[index]);const r=await finish(i);assert.equal(r.yeni_tamamlandi,true);assert.equal(r.izleme_puani,40);assert.equal(r.soru_gosterilecek,true);
   const tekrar=await finish(i);assert.equal(tekrar.yeni_tamamlandi,false);assert.equal(Number((await db.query("SELECT count(*) n FROM eclub_kazanilan_puanlar WHERE izleme_id=$1 AND puan_turu='izleme'",[i])).rows[0].n),1);}
 });
 await check('İleri sarma mevcut davranışını korur: oransal kayıp ve soru hakkının kapanması',async()=>{
  await reset();const i=await learning(0);const event=randomUUID();const r=(await db.query('SELECT * FROM eclub_ileri_sarma_kaydet($1,$2,$3,20,50,10)',[i,member,event])).rows[0];assert.equal(r.kaybedilen_puan,10);
  assert.equal((await db.query('SELECT * FROM eclub_ileri_sarma_kaydet($1,$2,$3,20,50,10)',[i,member,event])).rows[0].tekrar_istek,true);
  const done=await finish(i);assert.equal(done.soru_gosterilecek,false);assert.equal(done.soru_hakki_nedeni,'ileri_sarma');
  assert.equal(Number((await db.query('SELECT sum(kaybedilen_puan) n FROM eclub_ileri_sarma_kayitlari WHERE izleme_id=$1',[i])).rows[0].n),10);
 });
 await check('Yanlış cevap sıfır kayıp, doğru cevap puan; aynı izleme tekrar cevaplanamaz',async()=>{
  await reset();const i=await learning(0);await finish(i);
  const answers=JSON.stringify([{soru_index:0,dogru_mu:false,kazanilan_puan:0},{soru_index:1,dogru_mu:true,kazanilan_puan:5}]);
  assert.equal((await db.query('SELECT * FROM eclub_cevaplari_kaydet($1,$2,$3)',[i,member,answers])).rows[0].kazanilan_puan,5);
  assert.equal(Number((await db.query('SELECT sum(kaybedilen_puan) n FROM eclub_yanlis_cevap_kayitlari')).rows[0].n),0);
  await assert.rejects(db.query('SELECT * FROM eclub_cevaplari_kaydet($1,$2,$3)',[i,member,answers]));
  assert.equal(Number((await db.query("SELECT count(*) n FROM eclub_kazanilan_puanlar WHERE puan_turu='cevaplama'")).rows[0].n),1);
 });
 await check('15 günlük süresi geçmiş öneri tamamlanır; puan ve sorular açılmaz',async()=>{
  await reset();await history(0,new Date(now.getTime()-16*86400000));const rec=(await db.query('SELECT oneri_id FROM eclub_oneri_kayitlari')).rows[0].oneri_id;
  const r=await finish(await learning(0,rec));assert.equal(r.yeni_tamamlandi,true);assert.equal(r.izleme_puani,0);assert.equal(r.soru_gosterilecek,false);assert.equal(r.soru_hakki_nedeni,'sure_gecmis');
 });
 await check('Adım 12 salt okunur kurulum kontrolünde tüm koşullar sağlanır',async()=>{
  const rr=await db.query(await readFile('scripts/sql/eclub_gonderim_kurulum_kontrol.sql','utf8'));
  const rows=rr.flatMap(r=>r.rows);assert.ok(rows.length>30);assert.deepEqual(rows.filter(r=>r.uygun!==true),[]);
 });
 await db.query(await readFile('tests/fixtures/eclub-gonderim-cron-postgres.sql','utf8'));
 await check('Cron doğrudan UPDATE yetkisi olmadan alter_job ile pasif kurulur',async()=>{
  await db.query('SET ROLE eclub_test_cron_operator');
  try{await assert.rejects(db.query('UPDATE cron.job SET active=true'),{code:'42501'});
   await db.query(await readFile('scripts/sql/eclub_planlanan_gonderim_cron.sql','utf8'));const rr=await db.query('SELECT * FROM cron.job');assert.equal(rr.rows.length,1);assert.equal(rr.rows[0].active,false);}
  finally{await db.query('RESET ROLE');}
 });
 await check('Canlı durum kontrolü salt okunurdur ve anahtar değerini döndürmez',async()=>{
  const rr=await db.query(await readFile('scripts/sql/eclub_gonderim_canli_durum_kontrol.sql','utf8'));const rows=rr.flatMap(r=>r.rows);
  assert.equal(rows.find(r=>r.kontrol==='cron_aktif').sonuc,'false');assert.equal(rows.find(r=>r.kontrol==='vault_secret_hazir').sonuc,'true');
  assert.ok(!JSON.stringify(rows).includes('SAHTE_TEST_ANAHTARI'));assert.equal((await db.query('SELECT active FROM cron.job')).rows[0].active,false);
 });
 await check('Cron etkinleştirme/durdurma tekrar çalışır, kayıt silmez ve doğrudan UPDATE gerektirmez',async()=>{
  await db.query('SET ROLE eclub_test_cron_operator');
  try{for(let i=0;i<2;i++)await db.query(await readFile('scripts/sql/eclub_planlanan_gonderim_cron_etkinlestir.sql','utf8'));
   assert.equal((await db.query('SELECT active FROM cron.job')).rows[0].active,true);
   await db.query(await readFile('scripts/sql/eclub_planlanan_gonderim_cron.sql','utf8'));assert.equal((await db.query('SELECT active FROM cron.job')).rows[0].active,true);
   for(let i=0;i<2;i++)await db.query(await readFile('scripts/sql/eclub_planlanan_gonderim_cron_durdur.sql','utf8'));
   const rr=await db.query('SELECT active FROM cron.job');assert.equal(rr.rows.length,1);assert.equal(rr.rows[0].active,false);}
  finally{await db.query('RESET ROLE');}
 });
 await check('Eksik Vault kaydı etkinleştirmeyi reddeder ve cron pasif kalır',async()=>{
  await db.query("DELETE FROM vault.decrypted_secrets WHERE name='hapbilgi_cron_secret'");
  await assert.rejects(db.query(await readFile('scripts/sql/eclub_planlanan_gonderim_cron_etkinlestir.sql','utf8')));
  await db.query('ROLLBACK');assert.equal((await db.query('SELECT active FROM cron.job')).rows[0].active,false);
 });
 await check('Saatli planlar Türkiye tarihine çevrilir; saatsiz migration tekrar çalışır',async()=>{
  await reset();const plan=await planFixture(0,'2026-10-20T14:30:00+03:00');
  const sql=await readFile('scripts/sql/eclub_gonderi_saatini_temizle.sql','utf8');
  const ilk=await db.query(sql);assert.deepEqual(ilk.at(-1).rows[0],{
   plan_saat_alani_temizlendi:true,tekrar_gun_esasli:true,
   toplu_islem_tarih_esasli:true,plan_kapisi_tarih_esasli:true,isleyici_tarih_esasli:true});
  assert.equal((await db.query('SELECT hedef_gonderim_at::text AS hedef FROM eclub_yayin_gonderim_planlari WHERE plan_id=$1',[plan])).rows[0].hedef,'2026-10-20');
  const tekrar=await db.query(sql);assert.equal(tekrar.at(-1).rows[0].plan_saat_alani_temizlendi,true);
 });
 await check('Saatsiz plan bugüne açılamaz; 15 gün takvim günleriyle ölçülür',async()=>{
  await reset();
  await expectReason(0,'2026-10-14T00:00:00+03:00','hedef_gecmiste','2026-10-14T10:00:00+03:00','planla');
  await history(0,'2026-09-29T23:59:00+03:00');
  assert.equal((await control(0,'2026-10-14T00:00:00+03:00','2026-10-13T10:00:00+03:00','planla')).uygun,true);
  await expectReason(0,'2026-10-13T23:59:00+03:00','on_bes_gun_araligi','2026-10-12T10:00:00+03:00','planla');
 });
 await writeFile(join(root,'rapor.json'),JSON.stringify({postgres:(await db.query('SHOW server_version')).rows[0].server_version,passed,tests:results,scope:'Yalnız yerel Unix socket, sahte temel tablolar, değiştirilmemiş gönderim SQLleri'},null,2));
 console.log(`${passed}/${passed} SQL testi başarılı. Rapor: ${join(root,'rapor.json')}`);
}catch(error){console.error(error);process.exitCode=1;}finally{
 for(const c of clients)await c.end().catch(()=>{});
 if(server && server.exitCode===null){try{execFileSync(pg_ctl,['-D',data,'-m','fast','-w','stop'],{stdio:'pipe'});}catch{server.kill('SIGTERM');}}
}
