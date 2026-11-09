// Yalnız /tmp Unix socket. Gerçek PM09 RPC ve yeni süre SQL'i, sahte temel tablolar.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
const bin=process.env.ESNEK_PG_BIN;if(!bin)throw Error('ESNEK_PG_BIN gerekli.');
const root=mkdtempSync('/tmp/eczanem-30gun-'),data=join(root,'data'),socket=join(root,'socket');mkdirSync(socket);
const cfg={host:socket,port:55465,user:'sure_test',database:'postgres',statement_timeout:8000};
const clients=[],tests=[];let started=false,db;
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const sql=readFileSync('scripts/sql/eczanem_yayin_gonderim_30_gun.sql','utf8');
const check=async(n,f)=>{await f();tests.push(n);console.log(`OK ${tests.length}: ${n}`);};
async function connect(){const c=new pg.Client(cfg);await c.connect();clients.push(c);return c;}
const send=async(n,c=db)=>(await c.query('SELECT * FROM eczanem_musterilere_video_gonder($1,$2,$3,$4)',[id(10),id(20),id(n),[id(30)]])).rows[0];
const utt=async(n,c=db)=>(await c.query('SELECT * FROM eczanem_utt_eczaneye_gonder($1,$2,$3)',[id(2),id(n),id(10)])).rows[0];
try{
 execFileSync(join(bin,'initdb'),['-D',data,'-U','sure_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',data,'-l',join(root,'log'),'-o',`-k ${socket} -h '' -p 55465`,'-w','start'],{stdio:'pipe'});started=true;db=await connect();
 assert.equal((await db.query('SELECT inet_server_addr() a')).rows[0].a,null);
 await db.query(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean,eczanem_aktif boolean);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,takim_id uuid,rol text,aktif_mi boolean);
 CREATE TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,firma_id uuid,takim_id uuid,durum text,hedef_roller text[],yayin_tarihi timestamptz,uretici_id uuid);
 CREATE VIEW v_yayin_detay AS SELECT * FROM yayin_yonetimi;
 CREATE TABLE yayin_tekrar_kayitlari(yayin_id uuid,tur_no integer,baslangic_tarihi timestamptz);
 CREATE TABLE eclub_eczane_firma(id uuid PRIMARY KEY,eczane_id uuid,firma_id uuid,aktif_mi boolean);
 CREATE TABLE eclub_utt_eczane(eczane_firma_id uuid,utt_id uuid,aktif_mi boolean);
 CREATE TABLE sistem_ayarlari(anahtar text,deger jsonb);
 CREATE TABLE eczanem_uyelikler(eczane_id uuid,musteri_id uuid,aktif_mi boolean);
 CREATE TABLE eczanem_musteriler(musteri_id uuid PRIMARY KEY,aktif_mi boolean);
 CREATE TABLE eczanem_eczane_gonderimleri(gonderim_id uuid DEFAULT gen_random_uuid(),yayin_id uuid REFERENCES yayin_yonetimi,eczane_id uuid,gonderen_utt_id uuid,created_at timestamptz DEFAULT now(),UNIQUE(yayin_id,eczane_id));
 CREATE TABLE eczanem_gonderimler(gonderim_id uuid DEFAULT gen_random_uuid(),yayin_id uuid REFERENCES yayin_yonetimi,eczane_id uuid,musteri_id uuid,gonderen_kisi_id uuid,UNIQUE(yayin_id,musteri_id,eczane_id));
 CREATE TABLE test_tuketim(yayin_id uuid);
 CREATE FUNCTION eczanem_personel_eczane_yetkili_mi(uuid,uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT $1='${id(20)}' AND $2='${id(10)}' $$;
 CREATE FUNCTION test_token_kaydet() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN INSERT INTO test_tuketim VALUES(NEW.yayin_id);RETURN NEW;END$$;
 CREATE TRIGGER test_token AFTER INSERT ON eczanem_gonderimler FOR EACH ROW EXECUTE FUNCTION test_token_kaydet();
 CREATE FUNCTION eczanem_utt_gonderim_oncesi_inceleme(p_utt uuid,p_yayin uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
 INSERT INTO firmalar VALUES('${id(1)}',true,true);
 INSERT INTO kullanicilar VALUES('${id(2)}','${id(1)}',NULL,'utt',true),('${id(3)}','${id(1)}',NULL,'pm',true),('${id(4)}','${id(1)}',NULL,'med_md',true),('${id(5)}','${id(1)}',NULL,'jr_pm',true),('${id(6)}','${id(1)}',NULL,'kd_pm',true);
 INSERT INTO eclub_eczane_firma VALUES('${id(11)}','${id(10)}','${id(1)}',true);
 INSERT INTO eclub_utt_eczane VALUES('${id(11)}','${id(2)}',true);
 INSERT INTO eczanem_uyelikler VALUES('${id(10)}','${id(30)}',true);
 INSERT INTO eczanem_musteriler VALUES('${id(30)}',true);
 INSERT INTO sistem_ayarlari VALUES('eczanem_aktif_uye_esigi','1');`);
 await db.query(readFileSync('scripts/sql/pm09_eczanem_yayin_durdurma_kapisi.sql','utf8'));
 const publication=async(n,age='1 day',status='yayinda',target='eczanem',producer=3)=>db.query(`INSERT INTO yayin_yonetimi VALUES($1,$2,NULL,$3,$4,statement_timestamp()-$5::interval,$6)`,[id(n),id(1),status,[target],age,id(producer)]);
 await publication(100,'40 days');await publication(101,'2 days');
 await db.query("INSERT INTO yayin_tekrar_kayitlari VALUES($1,1,now()-interval '45 days')",[id(101)]);
 await publication(102,'-5 days','planlandi');
 await db.query(`CREATE TABLE eczanem_yayin_gonderim_sureleri(yayin_id uuid PRIMARY KEY REFERENCES yayin_yonetimi ON DELETE CASCADE,baslangic_at timestamptz NOT NULL,created_at timestamptz DEFAULT now());
 INSERT INTO eczanem_yayin_gonderim_sureleri(yayin_id,baslangic_at) SELECT yayin_id,yayin_tarihi FROM yayin_yonetimi WHERE yayin_id='${id(100)}';`);
 await check('ilk ve tekrar kurulum geçmiş süreyi yenilemez',async()=>{
  await db.query(sql);const before=(await db.query('SELECT * FROM eczanem_yayin_gonderim_sureleri ORDER BY yayin_id')).rows;await db.query(sql);assert.deepEqual((await db.query('SELECT * FROM eczanem_yayin_gonderim_sureleri ORDER BY yayin_id')).rows,before);
  assert.equal(before.length,2);assert.ok(Date.now()-before[1].baslangic_at.getTime()>44*86400000);
 });
 await check('planlanan yayın başlangıcı ilk gerçek aktivasyonda oluşur',async()=>{
  assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(102)])).rows[0].n,0);
  await db.query("UPDATE yayin_yonetimi SET durum='yayinda',yayin_tarihi=now() WHERE yayin_id=$1",[id(102)]);
  assert.ok(Date.now()-(await db.query('SELECT baslangic_at FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(102)])).rows[0].baslangic_at.getTime()<3000);
 });
 await check('30 gün içindeki gerçek UTT ve danışan RPC gönderimleri başarılıdır',async()=>{assert.equal((await utt(102)).ok,true);assert.equal((await send(102)).gonderilen,1);assert.equal((await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n,1);});
 await check('süresi dolmuş yayın UTT gönderiminde ve doğrudan INSERTte reddedilir',async()=>{
  await assert.rejects(utt(100),/ECZANEM_GONDERIM:sure_doldu/);
  await assert.rejects(db.query('INSERT INTO eczanem_eczane_gonderimleri(yayin_id,eczane_id) VALUES($1,$2)',[id(100),id(10)]),/sure_doldu/);
 });
 await check('eczane danışan gönderiminde süre dolunca tüketim oluşmaz',async()=>{
  await publication(103);assert.equal((await utt(103)).ok,true);
  await db.query("UPDATE eczanem_yayin_gonderim_sureleri SET baslangic_at=now()-interval '720 hours' WHERE yayin_id=$1",[id(103)]);
  const before=(await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n;await assert.rejects(send(103),/sure_doldu/);assert.equal((await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n,before);
 });
 await check('durdur/devam et ve yayın tarihini güncellemek süreyi sıfırlamaz',async()=>{
  const before=(await db.query('SELECT baslangic_at FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(103)])).rows[0].baslangic_at;
  await db.query("UPDATE yayin_yonetimi SET durum='Durduruldu' WHERE yayin_id=$1",[id(103)]);await db.query("UPDATE yayin_yonetimi SET durum='yayinda',yayin_tarihi=now() WHERE yayin_id=$1",[id(103)]);
  assert.deepEqual((await db.query('SELECT baslangic_at FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(103)])).rows[0].baslangic_at,before);await assert.rejects(send(103),/sure_doldu/);
 });
 await check('kilitte bekleyen gönderim süre dolduktan sonra ilerleyemez',async()=>{
  await publication(104);await utt(104);const a=await connect(),b=await connect();
  await db.query("UPDATE eczanem_yayin_gonderim_sureleri SET baslangic_at=clock_timestamp()-interval '720 hours'+interval '350 milliseconds' WHERE yayin_id=$1",[id(104)]);
  await a.query('BEGIN');await a.query('SELECT 1 FROM yayin_yonetimi WHERE yayin_id=$1 FOR UPDATE',[id(104)]);
  const pending=send(104,b).then(()=>({ok:true}),e=>({error:e}));await a.query('SELECT pg_sleep(0.5)');await a.query('COMMIT');const r=await pending;assert.match(r.error?.message ?? '',/sure_doldu/);
 });
 await check('çoklu gönderimde süresi dolan kayıt önceki gönderimleri de geri alır',async()=>{
  await publication(105);await utt(105);await db.query('BEGIN');
  try{await send(105);await assert.rejects(send(103),/sure_doldu/);}finally{await db.query('ROLLBACK');}
  assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_gonderimler WHERE yayin_id=$1',[id(105)])).rows[0].n,0);
 });
 await check('önceden teslim edilen kayıt silinmez ve Eczanem dışı yayın değişmez',async()=>{
  await db.query("UPDATE eczanem_yayin_gonderim_sureleri SET baslangic_at=now()-interval '40 days' WHERE yayin_id=$1",[id(102)]);
  assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_gonderimler WHERE yayin_id=$1',[id(102)])).rows[0].n,1);
  await publication(106,'1 day','yayinda','utt');assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(106)])).rows[0].n,0);
 });
 await check('başlangıcı olmayan kayıt güvenli kapanır; service_role başlangıcı değiştiremez',async()=>{
  await db.query('DELETE FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(105)]);await assert.rejects(send(105),/pm_kaynagi_dogrulanamadi/);
  await db.query('SET ROLE service_role');try{await assert.rejects(db.query('UPDATE eczanem_yayin_gonderim_sureleri SET baslangic_at=now()'),e=>e.code==='42501');assert.ok((await db.query('SELECT * FROM eczanem_yayin_gonderim_sureleri')).rows.length>0);}finally{await db.query('RESET ROLE');}
 });
 await check('PM/Jr PM/Kıdemli PM kaynakları kabul edilir; Medikal kaynak reddedilir',async()=>{
  for(const [n,producer] of [[110,3],[111,5],[112,6]]){await publication(n,'1 day','yayinda','eczanem',producer);assert.equal((await utt(n)).ok,true);assert.equal((await send(n)).gonderilen,1);}
  await publication(113,'1 day','yayinda','eczanem',4);await assert.rejects(utt(113),/pm_kaynagi_dogrulanamadi/);
  await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(4)]);await db.query("UPDATE yayin_yonetimi SET yayin_tarihi=now() WHERE yayin_id=$1",[id(113)]);await assert.rejects(utt(113),/pm_kaynagi_dogrulanamadi/);await db.query("UPDATE kullanicilar SET rol='med_md' WHERE kullanici_id=$1",[id(4)]);
  await assert.rejects(db.query('INSERT INTO eczanem_gonderimler(yayin_id,eczane_id,musteri_id,gonderen_kisi_id) VALUES($1,$2,$3,$4)',[id(113),id(10),id(30),id(20)]),/pm_kaynagi_dogrulanamadi/);
 });
 await check('çıkış rolü korunur; sonradan rol veya yayın sahibi değiştirmek başlangıcı yenilemez',async()=>{
  await publication(114);const before=(await db.query('SELECT baslangic_at FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(114)])).rows[0].baslangic_at;
  await db.query("UPDATE kullanicilar SET rol='med_md' WHERE kullanici_id=$1",[id(3)]);
  assert.equal((await utt(114)).ok,true);assert.equal((await send(114)).gonderilen,1);
  await db.query('UPDATE yayin_yonetimi SET uretici_id=$1 WHERE yayin_id=$2',[id(4),id(114)]);
  await assert.rejects(db.query('INSERT INTO eczanem_eczane_gonderimleri(yayin_id,eczane_id) VALUES($1,$2)',[id(114),id(99)]),/pm_kaynagi_dogrulanamadi/);
  assert.deepEqual((await db.query('SELECT baslangic_at FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(114)])).rows[0].baslangic_at,before);
  await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(3)]);
 });
 const version=(await db.query('SHOW server_version')).rows[0].server_version;
 if(process.env.ECZANEM_BLOK_TEST==='1'){const {testBlok}=await import('./eczanemPmTokenBlok.postgres.mjs');await testBlok({db,connect,id,utt,send,publication,version});}
 if(process.env.ECZANEM_MEDIKAL_TEST==='1'){const {testMedikal}=await import('./eczanemMedikalYetki.postgres.mjs');await testMedikal({db,id,utt,send,version});}
 if(process.env.ECZANEM_ORTAK_TEST==='1'){const {testOrtak}=await import('./eczanemOrtakUreticiToken.postgres.mjs');await testOrtak({db,id,utt,send,version});}
 writeFileSync('docs/ECZANEM_GONDERIM_30_GUN_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket ve sahte temel tablolar; değiştirilmemiş PM09 ve 30 gün SQL. Canlı DB/gerçek push/izleme testi değildir.'},null,2)+'\n');
}finally{for(const c of clients)await c.end().catch(()=>{});if(started)execFileSync(join(bin,'pg_ctl'),['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});rmSync(root,{recursive:true,force:true});}
