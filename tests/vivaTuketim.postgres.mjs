// Sadece /tmp PostgreSQL ve sahte veriler; Supabase/Daily bağlantısı kurulmaz.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
const repo=process.cwd();
const stage=repo;
const read=p=>readFileSync(existsSync(join(stage,p))?join(stage,p):join(repo,p),'utf8');
const bin=process.env.VIVA_PG_BIN;
if(!bin)throw new Error('Yerel PostgreSQL bin dizinini VIVA_PG_BIN ile belirtin.');
const root=mkdtempSync('/tmp/viva-kullanim-pg-'),dir=join(root,'data'),sock=join(root,'socket');mkdirSync(sock);
const opts={host:sock,port:55450,user:'viva_test',database:'postgres'};
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let started=false,db,other,passed=0;
async function check(name,fn){await fn();console.log(`OK ${++passed}: ${name}`);}
try{
 execFileSync(join(bin,'initdb'),['-D',dir,'-U','viva_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',dir,'-l',join(root,'log'),'-o',`-k ${sock} -h '' -p 55450`,'-w','start'],{stdio:'pipe'});started=true;
 db=new pg.Client(opts);other=new pg.Client(opts);await db.connect();await other.connect();
 await db.query(read('tests/fixtures/viva-asama1-postgres.sql'));
 await db.query('ALTER TABLE eclub_kisiler ADD COLUMN eposta text');
 await db.query(`CREATE SCHEMA cron; CREATE TABLE cron.job(jobid bigint,jobname text,schedule text,active boolean); CREATE FUNCTION cron.schedule(text,text,text) RETURNS bigint LANGUAGE plpgsql AS $$ BEGIN INSERT INTO cron.job VALUES(1,$1,$2,true);RETURN 1;END $$;`);
 for(const name of ['viva_asama1.sql','viva_anlik_planlama.sql','viva_asama2_1.sql','viva_asama2_4.sql','viva_asama2_5.sql','cogniti_token_veri_modeli.sql','cogniti_token_suresi_dolmus_yukleme_duzeltmesi.sql','cogniti_token_bakiye.sql','cogniti_token_admin_hesap.sql','cogniti_token_aylik_kurulum.sql','cogniti_token_kko_kurulum.sql','cogniti_token_pasif_kurulum.sql','cogniti_token_kko_aylik_kurulum.sql','cogniti_token_viva_kurulum.sql']){
  try{await db.query(read('scripts/sql/'+name));}catch(e){console.log('INSTALL',name);throw e;}
 }
 await db.query("INSERT INTO firmalar VALUES($1,'KKÖ',true,true),($2,'Aylık',true,true)",[id(100),id(101)]);
 await db.query("INSERT INTO kullanicilar(kullanici_id,ad,soyad,rol,firma_id,aktif_mi) VALUES($1,'Test','UTT','utt',$2,true),($3,'Test','GM','gm',$4,true)",[id(200),id(100),id(201),id(101)]);
 await db.query("INSERT INTO cogniti_token_hesaplari(firma_id,paket_turu,aylik_paket_miktari) VALUES($1,'kullandigin_kadar_ode',NULL),($2,'aylik',10000)",[id(100),id(101)]);
 await db.query("SELECT cogniti_token_yukle($1,'kko',1500,'ilk')",[id(100)]);
 await db.query("SELECT cogniti_token_aylik_donemi_yukle($1)",[id(101)]);
 await db.query("INSERT INTO viva_etkinlikler(etkinlik_id,firma_id,sahip_id,baslik,baslangic,bitis,olusturma_ozeti,durum) VALUES($1,$2,$3,'Eski yayın',now(),now()+interval '1 hour','{}','planlandi')",[id(299),id(101),id(201)]);
 await db.query("INSERT INTO viva_katilimcilar(etkinlik_id,tur,kullanici_id) VALUES($1,'ic',$2)",[id(299),id(201)]);
 const sql=read('scripts/sql/cogniti_token_viva_kullanim_kurulum.sql');
 await check('Kullanım migration iki kez uygulanır; eski veriler silinmez',async()=>{await db.query(sql);await db.query(sql);});
 await check('Kuyruk yaması eski fonksiyonu yükseltir ve tekrar uygulanabilir',async()=>{
  const q="SELECT pg_get_functiondef('public.cogniti_token_viva_islem(text,jsonb)'::regprocedure) s";
  let source=(await db.query(q)).rows[0].s;
  const filter="    AND NOT EXISTS(SELECT 1 FROM public.viva_daily_yasam yasam_is JOIN public.viva_daily_odalar oda_is USING(etkinlik_id) WHERE yasam_is.etkinlik_id=i.etkinlik_id AND yasam_is.durum<>'tamam' AND oda_is.oda_adi IS NOT NULL)\n";
  assert.ok(source.includes(filter));source=source.replace(filter,'');
  const price="  IF (p_veri->>'kko_fiyat')::numeric<=0";
  source=source.replace(price,"  IF EXISTS(SELECT 1 FROM public.viva_daily_yasam WHERE etkinlik_id=j.etkinlik_id AND durum<>'tamam') THEN RETURN NULL; END IF;\n"+price);
  source=source.replace("   RETURN jsonb_build_object('tamam',true,'token',0);","   RETURN NULL;");
  await db.query(source);
  const patch=read('scripts/sql/cogniti_token_viva_kuyruk_duzeltmesi.sql');await db.query(patch);await db.query(patch);
  assert.ok((await db.query(q)).rows[0].s.includes(filter));
 });
 await check('Geçişten önceki etkinlikte eski davet ücreti korunur; yeni ücret işi oluşmaz',async()=>{
  await db.query("INSERT INTO viva_katilimcilar(etkinlik_id,tur,kullanici_id) VALUES($1,'ic',$2)",[id(299),id(200)]);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri WHERE kaynak_id=$1',[id(299)])).rows[0].n,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_viva_tuketim_isleri WHERE etkinlik_id=$1',[id(299)])).rows[0].n,0);
 });
 const create=async(n,owner=200,client=db)=>{
  const r=await client.query("SELECT viva_islem($1,'olustur',$2::jsonb) r",[id(owner),JSON.stringify({etkinlik_id:id(n),baslik:'Token test',yayin_turu:'anlik',sure_dakika:60,durum:'planlandi',katilimcilar:[]})]);return r.rows[0].r.etkinlik;
 };
 const close=async n=>{
  await db.query("UPDATE viva_etkinlikler SET durum='sona_erdi' WHERE etkinlik_id=$1",[id(n)]);
  await db.query("INSERT INTO viva_daily_odalar(etkinlik_id,domain,oda_adi,oda_id,durum,hedef_surumu,hedef_baslangic,hedef_bitis) SELECT etkinlik_id,'cogniti-viva.daily.co','viva-'||replace(etkinlik_id::text,'-','')||'-n1','daily-id','kapali',surum,baslangic,bitis FROM viva_etkinlikler WHERE etkinlik_id=$1",[id(n)]);
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET kapanis=now()-interval '2 minutes',tekrar=now()-interval '1 minute' WHERE etkinlik_id=$1",[id(n)]);
 };
 const rpc=async(i,v={},client=db)=>(await client.query('SELECT cogniti_token_viva_islem($1,$2::jsonb) r',[i,JSON.stringify(v)])).rows[0].r;
 const fiyat={kko_fiyat:9.9,usd_dakika:.004,kur:55,katsayi:1.5};
 const measurement=(job,seconds)=>({etkinlik_id:job.etkinlik_id,kira:job.kira,ozet:'a'.repeat(64),toplam_saniye:seconds,oturum_sayisi:1,katilim_sayisi:1,oturum_idleri:[id(900)],katilimlar:[{id:id(901),saniye:seconds}]});
 const settle=async(n,seconds)=>{
  await close(n);let job=await rpc('ayir',fiyat);assert.equal(job.etkinlik_id,id(n));
  assert.equal((await rpc('kaydet',measurement(job,seconds))).tamam,false);
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET olcum_at=now()-interval '1 minute',tekrar=now()-interval '1 minute' WHERE etkinlik_id=$1",[id(n)]);
  job=await rpc('ayir',fiyat);return rpc('kaydet',measurement(job,seconds));
 };
 await check('Yeni Viva daveti token tüketmez',async()=>{
  await create(300);
  await db.query("INSERT INTO viva_katilimcilar(etkinlik_id,tur,kullanici_id) VALUES($1,'ic',$2)",[id(300),id(200)]);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri WHERE kaynak_id=$1',[id(300)])).rows[0].n,0);
 });
 await check('KKÖ 30 bakiye, 35 tüketim: 5 cari ay aşımı; taşıma borcu yok',async()=>{
  await db.query('UPDATE cogniti_token_yuklemeleri SET kalan=30 WHERE firma_id=$1',[id(100)]);
  const r=await settle(300,63000);assert.equal(r.token,35);assert.equal(r.asim,5);
  const b=(await db.query('SELECT * FROM cogniti_token_bakiye($1)',[id(100)])).rows[0];assert.equal(b.net_bakiye,'0');assert.equal(b.paket_asimi,'5');
  assert.equal((await db.query('SELECT asim_borcu FROM cogniti_token_hesaplari WHERE firma_id=$1',[id(100)])).rows[0].asim_borcu,'0');
  assert.equal((await db.query('SELECT sum(miktar)::int n FROM cogniti_token_tuketimleri WHERE firma_id=$1',[id(100)])).rows[0].n,35);
  assert.equal((await db.query('SELECT aktif FROM firmalar WHERE firma_id=$1',[id(100)])).rows[0].aktif,true);
 });
 await check('Tekrar hesaplama ikinci tüketim yazmaz',async()=>{
  const r=await rpc('kaydet',{etkinlik_id:id(300)});assert.equal(r.tamam,true);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri WHERE kaynak_id=$1',[id(300)])).rows[0].n,1);
 });
 await check('Aylık pakette 30 bakiye, 35 tüketim: 5 borç sonraki pakete mahsup edilir',async()=>{
  await create(301,201);await db.query('UPDATE cogniti_token_yuklemeleri SET kalan=30 WHERE firma_id=$1',[id(101)]);
  const r=await settle(301,63000);assert.equal(r.token,35);assert.equal(r.asim,5);
  assert.equal((await db.query('SELECT net_bakiye FROM cogniti_token_bakiye($1)',[id(101)])).rows[0].net_bakiye,'-5');
  await db.query("SELECT cogniti_token_yukle($1,'admin_duzeltme',100,'ek',NULL,NULL,NULL,'test')",[id(101)]);
  assert.equal((await db.query('SELECT net_bakiye FROM cogniti_token_bakiye($1)',[id(101)])).rows[0].net_bakiye,'95');
 });
 await check('0,5 altı sıfır; 0,5 ve üstü yukarı yuvarlanır; her yayında tek yuvarlama',async()=>{
  for(const [n,seconds,expected] of [[302,899,0],[303,900,1],[304,36000,20]]){await create(n,201);assert.equal((await settle(n,seconds)).token,expected);}
 });
 await check('Sıfır KKÖ bakiyesinde yeni yayın başlatılmaz',async()=>{
  await create(305);await assert.rejects(db.query('SELECT cogniti_token_viva_baslangic($1,$2)',[id(305),id(200)]),{code:'P0001'});
  await db.query("UPDATE viva_etkinlikler SET durum='iptal' WHERE etkinlik_id=$1",[id(305)]);
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET durum='tamam',token=0 WHERE etkinlik_id=$1",[id(305)]);
 });
 await check('Eksik Daily oturumu kesinleşmez; hata geri alınır',async()=>{
  await create(306,201);await close(306);
  await db.query("INSERT INTO viva_daily_olaylar(anahtar,domain,tur,veri,durum) VALUES($1,'cogniti-viva.daily.co','meeting.ended',$2::jsonb,'tamam')",['b'.repeat(64),JSON.stringify({room:`viva-${id(306).replaceAll('-','')}-n1`,meeting_id:id(999)})]);
  const job=await rpc('ayir',fiyat);await assert.rejects(rpc('kaydet',measurement(job,100)),{code:'40001'});
  await rpc('hata',{etkinlik_id:job.etkinlik_id,kira:job.kira});
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri WHERE kaynak_id=$1',[id(306)])).rows[0].n,0);
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET durum='tamam',token=0 WHERE etkinlik_id=$1",[id(306)]);
 });
 await check('Kısa katılım APIde yoksa imzalı Daily ayrılış süresi kaybolmaz',async()=>{
  await create(307,201);await close(307);
  const room=`viva-${id(307).replaceAll('-','')}-n1`;
  await db.query("INSERT INTO viva_daily_olaylar(anahtar,domain,tur,veri,durum) VALUES($1,'cogniti-viva.daily.co','participant.left',$2::jsonb,'tamam')",['c'.repeat(64),JSON.stringify({room,session_id:id(902),duration:900})]);
  let job=await rpc('ayir',fiyat);await rpc('kaydet',measurement(job,0));
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET olcum_at=now()-interval '1 minute',tekrar=now()-interval '1 minute' WHERE etkinlik_id=$1",[id(307)]);
  job=await rpc('ayir',{...fiyat,kko_fiyat:10});assert.equal((await rpc('kaydet',measurement(job,0))).token,1);
  assert.equal((await db.query('SELECT kko_fiyat FROM cogniti_viva_tuketim_isleri WHERE etkinlik_id=$1',[id(307)])).rows[0].kko_fiyat,'9.9');
 });
 await check('Yeni ayda kesinleşen önceki ay KKÖ yayını yeni 1500 hakkından düşmez',async()=>{
  await create(308);await close(308);
  const month=(await db.query("SELECT date_trunc('month',now() AT TIME ZONE 'Europe/Istanbul')::date d")).rows[0].d;
  await db.query("INSERT INTO cogniti_token_kko_devir_kayitlari(firma_id,donem,yukleme_id,sifirlanan) SELECT $1,(date_trunc('month',now() AT TIME ZONE 'Europe/Istanbul')-interval '1 month')::date,yukleme_id,30 FROM cogniti_token_yuklemeleri WHERE firma_id=$1 LIMIT 1",[id(100)]);
  await db.query('UPDATE cogniti_token_yuklemeleri SET kalan=1500 WHERE firma_id=$1',[id(100)]);
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET kapanis=date_trunc('month',now() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul'-interval '1 minute' WHERE etkinlik_id=$1",[id(308)]);
  let job=await rpc('ayir',fiyat);await rpc('kaydet',measurement(job,63000));
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET olcum_at=now()-interval '1 minute',tekrar=now()-interval '1 minute' WHERE etkinlik_id=$1",[id(308)]);
  job=await rpc('ayir',fiyat);assert.equal((await rpc('kaydet',measurement(job,63000))).asim,5);
  assert.equal((await db.query('SELECT sum(kalan)::int n FROM cogniti_token_yuklemeleri WHERE firma_id=$1',[id(100)])).rows[0].n,1500);
  assert.equal((await db.query('SELECT asim_borcu FROM cogniti_token_hesaplari WHERE firma_id=$1',[id(100)])).rows[0].asim_borcu,'0');
  void month;
 });
 await check('İki işleyici aynı yayını aynı anda kesinleştirince yalnız bir tüketim oluşur',async()=>{
  await create(309,201);await close(309);let job=await rpc('ayir',fiyat);await rpc('kaydet',measurement(job,36000));
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET olcum_at=now()-interval '1 minute',tekrar=now()-interval '1 minute' WHERE etkinlik_id=$1",[id(309)]);
  job=await rpc('ayir',fiyat);const m=measurement(job,36000);
  const [a,b]=await Promise.all([rpc('kaydet',m),rpc('kaydet',m,other)]);assert.equal(a.token,20);assert.equal(b.token,20);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri WHERE kaynak_id=$1',[id(309)])).rows[0].n,1);
 });
 await check('UTT, KD_UTT, BM, TM, üretici, yönetici ve admin yeni kullanım kuralını kullanır',async()=>{
  const src=read('lib/utils/roller.ts');const named=key=>[...src.split(`export const ${key} = [`)[1].split('];')[0].matchAll(/"([a-z_]+)"/g)].map(x=>x[1]);
  const roles=[...new Set([...named('URETICI_ROLLER'),...named('YONETICI_ROLLER'),'admin','tm','bm','utt','kd_utt','iu'])];
  for(let i=0;i<roles.length;i++){
   await db.query("INSERT INTO kullanicilar(kullanici_id,ad,soyad,rol,firma_id,aktif_mi) VALUES($1,'Test','Rol',$2,$3,true)",[id(500+i),roles[i],id(101)]);
   await create(1000+i,500+i);await close(1000+i);let job=await rpc('ayir',fiyat);await rpc('kaydet',measurement(job,900));
   await db.query("UPDATE cogniti_viva_tuketim_isleri SET olcum_at=now()-interval '1 minute',tekrar=now()-interval '1 minute' WHERE etkinlik_id=$1",[id(1000+i)]);
   job=await rpc('ayir',fiyat);assert.equal((await rpc('kaydet',measurement(job,900))).token,1);
  }
 });
 await check('Kapanışı hatalı eski iş sağlıklı sonraki işi engellemez; sonra tekrar işlenir',async()=>{
  await create(310,201);await close(310);await create(311,201);await close(311);
  await db.query("INSERT INTO viva_daily_yasam(etkinlik_id,durum) VALUES($1,'hata')",[id(310)]);
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET tekrar=now()-interval '2 minutes' WHERE etkinlik_id=$1",[id(310)]);
  let job=await rpc('ayir',fiyat);assert.equal(job.etkinlik_id,id(311));
  await rpc('kaydet',measurement(job,900));
  await db.query("UPDATE viva_daily_yasam SET durum='tamam' WHERE etkinlik_id=$1",[id(310)]);
  job=await rpc('ayir',fiyat);assert.equal(job.etkinlik_id,id(310));
  await rpc('kaydet',measurement(job,900));
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET durum='tamam',token=0 WHERE etkinlik_id=ANY($1::uuid[])",[[id(310),id(311)]]);
 });
 await check('Hiç açılmamış oda sıfır sonuç döndürür; sonraki iş alınabilir',async()=>{
  await create(312,201);await db.query("UPDATE viva_etkinlikler SET durum='iptal' WHERE etkinlik_id=$1",[id(312)]);
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET kapanis=now()-interval '2 minutes',tekrar=now()-interval '2 minutes' WHERE etkinlik_id=$1",[id(312)]);
  await db.query("INSERT INTO viva_daily_yasam(etkinlik_id,durum) VALUES($1,'bekliyor')",[id(312)]);
  await create(313,201);await close(313);
  assert.deepEqual(await rpc('ayir',fiyat),{tamam:true,token:0});
  const zero=(await db.query('SELECT durum,token,toplam_saniye FROM cogniti_viva_tuketim_isleri WHERE etkinlik_id=$1',[id(312)])).rows[0];
  assert.deepEqual(zero,{durum:'tamam',token:'0',toplam_saniye:'0'});
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri WHERE kaynak_id=$1',[id(312)])).rows[0].n,0);
  const job=await rpc('ayir',fiyat);assert.equal(job.etkinlik_id,id(313));
  await rpc('kaydet',measurement(job,900));
  await db.query("UPDATE cogniti_viva_tuketim_isleri SET durum='tamam',token=0 WHERE etkinlik_id=$1",[id(313)]);
 });
 await check('Anon ve üye fiyat veya tüketim RPCsi çağıramaz',async()=>{
  const r=(await db.query("SELECT has_function_privilege('anon','cogniti_token_viva_islem(text,jsonb)','EXECUTE') a,has_function_privilege('authenticated','cogniti_token_viva_islem(text,jsonb)','EXECUTE') b")).rows[0];assert.equal(r.a,false);assert.equal(r.b,false);
 });
 console.log(`Toplam ${passed}/${passed}; yalnız sentetik yerel PostgreSQL.`);
} finally {await other?.end().catch(()=>{});await db?.end().catch(()=>{});if(started)execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop'],{stdio:'pipe'});}
