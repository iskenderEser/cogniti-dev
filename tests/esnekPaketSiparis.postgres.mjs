// Gerçek PostgreSQL, yalnız /tmp Unix socket ve sahte kayıtlar. Supabase'e bağlanmaz.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
const bin=process.env.ESNEK_PG_BIN;
if(!bin)throw Error('ESNEK_PG_BIN yerel PostgreSQL bin dizini olmalı.');
const root=mkdtempSync('/tmp/cogniti-esnek-adim1-test-'),data=join(root,'data'),socket=join(root,'socket');mkdirSync(socket);
const config={host:socket,port:55463,user:'esnek_test',database:'postgres',connectionTimeoutMillis:5000,statement_timeout:8000};
let started=false;const clients=[],results=[];let db;
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const sql=readFileSync('scripts/sql/cogniti_esnek_paket_siparis_adim1.sql','utf8');
async function connect(){const c=new pg.Client(config);await c.connect();clients.push(c);return c;}
async function check(name,fn){await fn();results.push(name);console.log(`OK ${results.length}: ${name}`);}
async function buy(user,key=randomUUID(),client=db,{amount=3000,version=7,price=8.2}={}){return (await client.query('SELECT public.cogniti_esnek_paket_siparis_olustur($1,$2,$3,$4,$5) r',[id(user),amount,version,price,key])).rows[0].r;}
const count=async(table)=>(await db.query(`SELECT count(*)::int n FROM ${table}`)).rows[0].n;
try{
 execFileSync(join(bin,'initdb'),['-D',data,'-U','esnek_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',data,'-l',join(root,'log'),'-o',`-k ${socket} -h '' -p 55463`,'-w','start'],{stdio:'pipe'});started=true;
 db=await connect();assert.equal((await db.query('SELECT inet_server_addr() a')).rows[0].a,null);
 const version=(await db.query('SHOW server_version')).rows[0].server_version;
 await db.query(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean,firma_adi text);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid REFERENCES firmalar,rol text,aktif_mi boolean,ad text,soyad text);
 CREATE TABLE cogniti_fiyat_tarifesi(tekil boolean PRIMARY KEY CHECK(tekil),surum integer,degerler jsonb);
 CREATE TABLE cogniti_sm2_fiyat_oranlari(token_adedi integer,ay integer,katsayi numeric,PRIMARY KEY(token_adedi,ay));
 CREATE TABLE cogniti_token_hesaplari(firma_id uuid PRIMARY KEY,asim_borcu bigint);
 CREATE TABLE cogniti_token_yuklemeleri(firma_id uuid,miktar bigint,kalan bigint);
 INSERT INTO cogniti_fiyat_tarifesi VALUES(true,7,'{"kko_token_tl":9.90}');
 INSERT INTO cogniti_sm2_fiyat_oranlari VALUES(3000,0,8.20/9.90),(6500,0,6.91/9.90);`);
 await db.query('INSERT INTO firmalar VALUES($1,true,$2),($3,true,$4)',[id(1),'Firma A',id(2),'Firma B']);
 const producers=['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'];
 const managers=['gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin'];
 const blocked=['tm','admin','iu','utt','kd_utt','bm','eczaci','partner','bilinmeyen'];
 for(const [i,rol] of [...producers,...managers,...blocked].entries())await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,true,$4,$5)',[id(100+i),id(1),rol,'Test',String(i)]);
 await db.query("INSERT INTO kullanicilar VALUES($1,$2,'pm',true,'Diğer','Firma'),($3,$2,'gm',true,'Diğer','Yönetici')",[id(200),id(2),id(201)]);
 await db.query('INSERT INTO cogniti_token_hesaplari VALUES($1,10);INSERT INTO cogniti_token_yuklemeleri VALUES($1,1500,750)',[id(1)]).catch(async()=>{
  await db.query('INSERT INTO cogniti_token_hesaplari VALUES($1,10)',[id(1)]);await db.query('INSERT INTO cogniti_token_yuklemeleri VALUES($1,1500,750)',[id(1)]);
 });
 await check('SQL ilk kurulum ve tekrar kurulumda çalışır',async()=>{await db.query(sql);await db.query(sql);});
 await check('13 üretici rol kişisel, 8 yönetici/firma admin rolü ortak bakiye oluşturur',async()=>{
  for(const [i,rol] of [...producers,...managers].entries()){
   const r=await buy(100+i);const row=(await db.query('SELECT b.*,s.satin_alan_id,s.satin_alan_rol,s.birim_fiyat,s.toplam_tutar,y.miktar,y.kalan,y.son_kullanim_at FROM cogniti_esnek_paket_siparisleri s JOIN cogniti_satin_alma_bakiyeleri b USING(bakiye_id,firma_id) JOIN cogniti_esnek_paket_yuklemeleri y USING(siparis_id,firma_id,bakiye_id) WHERE s.siparis_id=$1',[r.siparis_id])).rows[0];
   assert.equal(row.bakiye_turu,i<producers.length?'kisisel':'firma_ortak',rol);assert.equal(row.sahip_id,i<producers.length?id(100+i):null);
   assert.equal(row.satin_alan_id,id(100+i));assert.equal(row.satin_alan_rol,rol);assert.equal(row.birim_fiyat,'8.20');assert.equal(row.toplam_tutar,'24600.00');assert.equal(row.kalan,3000);
   const year=(await db.query("SELECT extract(year FROM statement_timestamp() AT TIME ZONE 'Europe/Istanbul')::int y")).rows[0].y;
   assert.equal(row.son_kullanim_at.toISOString(),`${year}-12-31T21:00:00.000Z`);
  }
  assert.equal(await count('cogniti_satin_alma_bakiyeleri'),14);
 });
 await check('TM, Cogniti Admin ve diğer kapalı roller satın alamaz',async()=>{
  for(let i=0;i<blocked.length;i++)await assert.rejects(buy(100+producers.length+managers.length+i),e=>e.code==='42501');
 });
 await check('pasif kullanıcı ve pasif firma satın alamaz',async()=>{
  await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(200)]);await assert.rejects(buy(200),e=>e.code==='42501');
  await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[id(200)]);await db.query('UPDATE firmalar SET aktif=false WHERE firma_id=$1',[id(2)]);await assert.rejects(buy(200),e=>e.code==='42501');
  await db.query('UPDATE firmalar SET aktif=true WHERE firma_id=$1',[id(2)]);
 });
 await check('firma ve kişi bakiyeleri birbirinden ayrıdır',async()=>{
  await buy(200);await buy(201);
  const wallets=(await db.query('SELECT firma_id,sahip_id,bakiye_turu FROM cogniti_satin_alma_bakiyeleri WHERE firma_id=$1',[id(2)])).rows;
  assert.equal(wallets.length,2);assert.ok(wallets.some(w=>w.sahip_id===id(200)));assert.ok(wallets.some(w=>w.bakiye_turu==='firma_ortak'));
 });
 await check('geçersiz adet, fiyat ve eski tarife kayıt oluşturmaz',async()=>{
  const before=await count('cogniti_esnek_paket_siparisleri');
  for(const opts of [{amount:3001},{price:8.19},{version:6},{price:8.201},{price:'NaN'},{price:'Infinity'},{amount:null},{version:null}])await assert.rejects(buy(100,randomUUID(),db,opts));
  assert.equal(await count('cogniti_esnek_paket_siparisleri'),before);
 });
 const a=await connect(),b=await connect();
 await check('eş zamanlı aynı onay tek sipariş ve tek yükleme oluşturur',async()=>{
  const key=randomUUID();const before=await count('cogniti_esnek_paket_siparisleri');
  const [x,y]=await Promise.all([buy(100,key,a),buy(100,key,b)]);assert.equal(x.siparis_id,y.siparis_id);assert.notEqual(x.yeniden_deneme,y.yeniden_deneme);
  assert.equal(await count('cogniti_esnek_paket_siparisleri'),before+1);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_esnek_paket_yuklemeleri WHERE siparis_id=$1',[x.siparis_id])).rows[0].n,1);
  await assert.rejects(buy(100,key,db,{amount:6500,price:6.91}),e=>e.code==='22023');
 });
 await check('ortak bakiyenin eş zamanlı ilk alımları tek ortak hesapta birikir',async()=>{
  await db.query("INSERT INTO firmalar VALUES($1,true,'Yeni Firma')",[id(3)]);
  for(const u of [300,301])await db.query("INSERT INTO kullanicilar VALUES($1,$2,'gm',true,'Yeni','Yönetici')",[id(u),id(3)]);
  await Promise.all([buy(300,randomUUID(),a),buy(301,randomUUID(),b)]);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_satin_alma_bakiyeleri WHERE firma_id=$1',[id(3)])).rows[0].n,1);
  assert.equal((await db.query('SELECT sum(kalan)::int n FROM cogniti_esnek_paket_yuklemeleri WHERE firma_id=$1',[id(3)])).rows[0].n,6000);
 });
 await check('yükleme hatasında sipariş ve yeni kişisel bakiye birlikte geri alınır',async()=>{
  await db.query("INSERT INTO kullanicilar VALUES($1,$2,'pm',true,'Hata','Test')",[id(400),id(1)]);
  await db.query("CREATE FUNCTION esnek_test_hata() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test-yukleme-hatasi'; END $$;CREATE TRIGGER esnek_test_hata BEFORE INSERT ON cogniti_esnek_paket_yuklemeleri FOR EACH ROW EXECUTE FUNCTION esnek_test_hata();");
  const before=await count('cogniti_esnek_paket_siparisleri');await assert.rejects(buy(400),/test-yukleme-hatasi/);assert.equal(await count('cogniti_esnek_paket_siparisleri'),before);
  assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_satin_alma_bakiyeleri WHERE sahip_id=$1',[id(400)])).rows[0].n,0);
  await db.query('DROP TRIGGER esnek_test_hata ON cogniti_esnek_paket_yuklemeleri;DROP FUNCTION esnek_test_hata();');
 });
 await check('tarife değişince eski sipariş fiyatı korunur; aynı onay tekrar yüklemez',async()=>{
  const key=randomUUID(),old=await buy(100,key);await db.query('UPDATE cogniti_fiyat_tarifesi SET surum=8');
  assert.equal((await buy(100,key)).siparis_id,old.siparis_id);await assert.rejects(buy(100),e=>e.code==='P0001');
  await db.query('UPDATE cogniti_fiyat_tarifesi SET surum=7');
 });
 await check('firma değiştiren kullanıcı eski onayı yeni firmaya taşıyamaz',async()=>{
  const key=randomUUID();await buy(200,key);await db.query('UPDATE kullanicilar SET firma_id=$1 WHERE kullanici_id=$2',[id(1),id(200)]);
  await assert.rejects(buy(200,key),e=>e.code==='22023');await db.query('UPDATE kullanicilar SET firma_id=$1 WHERE kullanici_id=$2',[id(2),id(200)]);
 });
 await check('anon/authenticated işleme erişemez; service_role doğrudan tablo yazamaz',async()=>{
  for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);try{await assert.rejects(buy(100),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}}
  await db.query('SET ROLE service_role');try{await assert.rejects(db.query('SELECT * FROM cogniti_esnek_paket_siparisleri'),e=>e.code==='42501');assert.ok((await buy(100)).siparis_id);}finally{await db.query('RESET ROLE');}
 });
 await check('eski KKÖ hesabı ve yüklemeleri değişmedi',async()=>{
  assert.equal((await db.query('SELECT asim_borcu::int n FROM cogniti_token_hesaplari')).rows[0].n,10);
  assert.deepEqual((await db.query('SELECT miktar::int,kalan::int FROM cogniti_token_yuklemeleri')).rows,[{miktar:1500,kalan:750}]);
 });
 writeFileSync('docs/COGNITI_ESNEK_SIPARIS_ADIM1_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:results.length,tests:results,scope:'Yerel Unix socket; sahte firma/kullanıcı/tarife tabloları; değiştirilmemiş adım 1 SQL. Gerçek gönderim veya Supabase testi değildir.'},null,2)+'\n');
 if(process.env.ESNEK_BAKIYE_TEST==='1'){const {testBakiyeOzeti}=await import('./esnekPaketBakiye.postgres.mjs');await testBakiyeOzeti({db,buy,id,version});}
}finally{
 for(const c of clients)await c.end().catch(()=>{});
 if(started)execFileSync(join(bin,'pg_ctl'),['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});
 rmSync(root,{recursive:true,force:true});
}
