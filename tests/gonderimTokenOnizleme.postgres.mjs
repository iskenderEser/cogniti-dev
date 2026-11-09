// Yerel PostgreSQL ve sahte tablolar; gerçek E-Club SQL'leri değiştirilmeden kurulur.
import { execFileSync } from 'node:child_process';
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
const bin=process.env.ESNEK_PG_BIN;if(!bin)throw Error('ESNEK_PG_BIN gerekli.');
const root=mkdtempSync('/tmp/cogniti-onizleme-adim3-'),data=join(root,'data'),socket=join(root,'socket');mkdirSync(socket);
let started=false,db;const tests=[];
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const check=async(name,fn)=>{await fn();tests.push(name);console.log(`OK ${tests.length}: ${name}`);};
const sql=n=>readFileSync(`scripts/sql/${n}.sql`,'utf8');
const preview=async({user=100,flow='yayin_acilis',wallet='kisisel',sources=[id(600)],recipients=[],date=null}={})=>(await db.query('SELECT cogniti_gonderim_token_onizle($1,$2,$3,$4,$5,$6) r',[id(user),flow,wallet,sources,recipients,date])).rows[0].r;
try{
 execFileSync(join(bin,'initdb'),['-D',data,'-U','onizleme_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',data,'-l',join(root,'log'),'-o',`-k ${socket} -h '' -p 55464`,'-w','start'],{stdio:'pipe'});started=true;
 db=new pg.Client({host:socket,port:55464,user:'onizleme_test',database:'postgres',statement_timeout:8000});await db.connect();assert.equal((await db.query('SELECT inet_server_addr() a')).rows[0].a,null);
 const version=(await db.query('SHOW server_version')).rows[0].server_version;
 await db.query(readFileSync('tests/fixtures/eclub-gonderim-postgres.sql','utf8'));
 await db.query(`ALTER TABLE kullanicilar ADD COLUMN ad text DEFAULT 'Test',ADD COLUMN soyad text DEFAULT 'Kişi',ADD COLUMN bolge_id uuid;
 CREATE TABLE bolgeler(bolge_id uuid PRIMARY KEY,takim_id uuid);
 ALTER TABLE yayin_yonetimi ADD COLUMN soru_seti_durum_id uuid;
 CREATE TABLE talepler(talep_id uuid PRIMARY KEY,uretici_id uuid,firma_id uuid,takim_id uuid,hedef_roller text[],taslak_mi boolean DEFAULT false,yayin_oncesi_silme_durumu text);
 CREATE TABLE soru_setleri(soru_seti_id uuid PRIMARY KEY,talep_id uuid);
 CREATE TABLE soru_seti_durumu(soru_seti_durum_id uuid PRIMARY KEY,soru_seti_id uuid,durum text);
 CREATE TABLE cogniti_fiyat_tarifesi(tekil boolean PRIMARY KEY,surum integer,degerler jsonb);
 CREATE TABLE cogniti_sm2_fiyat_oranlari(token_adedi integer,ay integer,katsayi numeric,PRIMARY KEY(token_adedi,ay));
 INSERT INTO cogniti_fiyat_tarifesi VALUES(true,1,'{"kko_token_tl":9.90}');INSERT INTO cogniti_sm2_fiyat_oranlari VALUES(3000,0,8.2/9.9);`);
 for(const f of ['eclub_yayin_gonderim_planlari','eclub_gonderim_kota_ve_tarih_kontrolu','eclub_gonderim_rpc_yeni_kurgu','eclub_gonderim_api_toplu','cogniti_esnek_paket_siparis_adim1','cogniti_token_bakiye_ozeti_adim2'])await db.query(sql(f));
 await check('önizleme SQL kurulur ve tekrar kurulabilir',async()=>{await db.query(sql('cogniti_gonderim_onizleme_adim3'));await db.query(sql('cogniti_gonderim_onizleme_adim3'));});
 await db.query('INSERT INTO firmalar VALUES($1,true,true),($2,true,true)',[id(1),id(2)]);
 await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,takim_id,rol,aktif_mi) VALUES($1,$2,NULL,'pm',true),($3,$2,NULL,'gm',true),($4,$2,$5,'utt',true),($6,$2,NULL,'bm',true),($7,$8,NULL,'pm',true)",[id(100),id(1),id(200),id(300),id(10),id(301),id(400),id(2)]);
 await db.query('INSERT INTO bolgeler VALUES($1,$2)',[id(20),id(10)]);
 await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,bolge_id,rol,aktif_mi) VALUES($1,$2,$3,'kd_utt',true),($4,$2,NULL,'utt',false)",[id(302),id(1),id(20),id(303)]);
 for(const user of [100,200])await db.query('SELECT cogniti_esnek_paket_siparis_olustur($1,3000,1,8.2,$2)',[id(user),randomUUID()]);
 await db.query('INSERT INTO talepler VALUES($1,$2,$3,$4,$5,false,NULL)',[id(700),id(100),id(1),id(10),['utt','bm']]);
 await db.query("INSERT INTO soru_setleri VALUES($1,$2);",[id(710),id(700)]);
 await db.query("INSERT INTO soru_seti_durumu VALUES($1,$2,'onaylandi')",[id(600),id(710)]);
 await check('yayın açılışı aktif hedefleri ve bölgeden takım eşleşmesini sunucuda sayar',async()=>{const x=await preview();assert.equal(x.gereken_token,3);assert.equal(x.uygun_kayit,1);assert.equal(x.kullanilabilir_token,3000);assert.equal(x.islem_sonrasi,2997);assert.equal(x.gercek_gonderim_acik,false);});
 await check('kişisel/ortak seçim ayrı kalır; yetersizlikte kendiliğinden geçiş yok',async()=>{
  await db.query('UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=2 WHERE siparis_id IN(SELECT siparis_id FROM cogniti_esnek_paket_siparisleri WHERE satin_alan_id=$1)',[id(100)]);
  const x=await preview();assert.equal(x.eksik_token,1);assert.equal(x.yeterli,false);assert.equal(x.bakiye_turu,'kisisel');
  assert.equal((await preview({wallet:'firma_ortak'})).kullanilabilir_token,3000);
 });
 await check('başka üretici veya firma içeriği reddedilir; bulunamayan kaynak sayılmaz',async()=>{
  await assert.rejects(preview({user:400,wallet:'firma_ortak'}),e=>e.code==='42501');
  await assert.rejects(preview({sources:[id(999)]}),e=>e.code==='22023');
 });
 await check('onaysız/taslak/yayına alınmış adaylar tekrar ücretlendirilmez',async()=>{
  await db.query("UPDATE soru_seti_durumu SET durum='bekliyor'");assert.equal((await preview()).uygun_kayit,0);await db.query("UPDATE soru_seti_durumu SET durum='onaylandi'");
  await db.query('UPDATE talepler SET taslak_mi=true');assert.equal((await preview()).gereken_token,0);await db.query('UPDATE talepler SET taslak_mi=false');
  await db.query("INSERT INTO yayin_yonetimi(yayin_id,soru_seti_durum_id) VALUES($1,$2)",[id(900),id(600)]);assert.equal((await preview()).gereken_token,0);await db.query('DELETE FROM yayin_yonetimi WHERE yayin_id=$1',[id(900)]);
 });
 await check('E-Club/Eczanem sonraki dağıtımı ilk yayın açılışına eklenmez',async()=>{
  await db.query('UPDATE talepler SET hedef_roller=$1',[['eczanem']]);const x=await preview();assert.equal(x.gereken_token,0);assert.match(x.aciklama,/sonraki dağıtımları/);await db.query('UPDATE talepler SET hedef_roller=$1',[['utt','bm']]);
 });
 const future=(await db.query("SELECT to_char(d,'YYYY-MM-DD') d FROM generate_series(current_date+1,current_date+7,interval '1 day') d WHERE extract(isodow FROM d)<6 ORDER BY d LIMIT 1")).rows[0].d;
 const nextYear=(await db.query("SELECT (extract(year FROM current_date)::int+1)::text||'-01-05' d")).rows[0].d;
 await check('plan tarihinde sona ermiş yükleme kullanılabilir sayılmaz; geçmiş tarih reddedilir',async()=>{
  const x=await preview({date:nextYear});assert.equal(x.planli,true);assert.equal(x.kullanilabilir_token,0);assert.equal(x.eksik_token,3);
  await assert.rejects(preview({date:'2020-01-01'}),e=>e.code==='22023');
 });
 await db.query('INSERT INTO urunler VALUES($1)',[id(30)]);
 await db.query("INSERT INTO eclub_kisiler VALUES($1,'eczaci',$1,true)",[id(500)]);
 await db.query('INSERT INTO eclub_kisi_eczane VALUES($1,$2,$3,true)',[id(501),id(500),id(502)]);
 await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,$3,true)',[id(503),id(502),id(1)]);
 await db.query('INSERT INTO eclub_utt_eczane VALUES($1,$2,$3,true)',[id(504),id(503),id(300)]);
 for(let i=0;i<4;i++){
  await db.query('INSERT INTO ogrenme_araclari VALUES($1,NULL)',[id(810+i)]);
  await db.query("INSERT INTO yayin_yonetimi(yayin_id,firma_id,takim_id,durum,hedef_roller,urun_id,arac_id,arac_turu,yayin_tarihi) VALUES($1,$2,$3,'yayinda',$4,$5,$6,'video',now()-interval '1 day')",[id(800+i),id(1),id(10),['eczaci'],id(30),id(810+i)]);
  await db.query('INSERT INTO eclub_utt_yayin_incelemeleri VALUES($1,$2,now())',[id(300),id(800+i)]);
 }
 const eclubArgs={user:300,flow:'eclub_oneri',wallet:'firma_ortak',sources:[id(800),id(801),id(802),id(803)],recipients:[id(500)],date:future};
 await check('gerçek E-Club SQL toplu kontrolü haftalık kotayı hesaba katar',async()=>{
  const x=await preview(eclubArgs);assert.equal(x.gereken_token,3);assert.equal(x.uygun_kayit,3);assert.equal(x.atlanan_kayit,1);assert.equal(x.planli,true);
 });
 await check('önizleme öneri, plan, sipariş veya tüketim kaydı üretmez',async()=>{
  const before=(await db.query('SELECT count(*)::int n FROM cogniti_esnek_paket_siparisleri')).rows[0].n;
  await preview(eclubArgs);await preview();
  for(const table of ['eclub_oneri_kayitlari','eclub_yayin_gonderim_planlari'])assert.equal((await db.query(`SELECT count(*)::int n FROM ${table}`)).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_esnek_paket_siparisleri')).rows[0].n,before);
  assert.equal((await preview()).kullanilabilir_token,2);
 });
 await check('alakasız rol, kişisel bakiye sahteciliği ve anonim çağrı reddedilir',async()=>{
  await assert.rejects(preview({...eclubArgs,wallet:'kisisel'}),e=>e.code==='42501');
  await assert.rejects(preview({user:200,wallet:'firma_ortak'}),e=>e.code==='42501');
  for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);try{await assert.rejects(preview(),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}}
 });
 if(process.env.ESNEK_GONDERIM_TEST==='1'){const {testGonderim}=await import('./esnekGonderimAdim4.postgres.mjs');await testGonderim({db,id,version,connection:{host:socket,port:55464,user:'onizleme_test',database:'postgres',statement_timeout:8000}});}
 writeFileSync('docs/COGNITI_GONDERIM_ONIZLEME_ADIM3_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket, sahte temel tablolar; gerçek değiştirilmemiş E-Club kota/toplu önizleme ve Adım 1–3 SQLleri. Gerçek gönderim veya Supabase testi değildir.'},null,2)+'\n');
}finally{if(db)await db.end();if(started)execFileSync(join(bin,'pg_ctl'),['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});rmSync(root,{recursive:true,force:true});}
