// ESNEK_BAKIYE_TEST=1 ile esnekPaketSiparis.postgres.mjs koşucusu çağırır.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
export async function testBakiyeOzeti({db,buy,id,version}) {
 const tests=[];
 const check=async(name,run)=>{await run();tests.push(name);console.log(`BAKIYE OK ${tests.length}: ${name}`);};
 const read=async user=>(await db.query('SELECT cogniti_satin_alma_bakiye_ozeti($1) r',[id(user)])).rows[0].r;
 const sql=readFileSync('scripts/sql/cogniti_token_bakiye_ozeti_adim2.sql','utf8');
 await check('salt okuma SQL ilk ve tekrar kurulumda çalışır',async()=>{await db.query(sql);await db.query(sql);});
 await check('kişisel ve ortak toplamları ayrılır; başka üreticinin alımı görünmez',async()=>{
  const a=await read(101),b=await read(102);assert.equal(a.kisisel.toplam,3000);assert.equal(b.kisisel.toplam,3000);
  const common=(await db.query("SELECT sum(y.miktar)::int n FROM cogniti_esnek_paket_yuklemeleri y JOIN cogniti_satin_alma_bakiyeleri b USING(bakiye_id,firma_id) WHERE b.firma_id=$1 AND b.bakiye_turu='firma_ortak'",[id(1)])).rows[0].n;
  assert.equal(a.firma_ortak.toplam,common);assert.deepEqual(a.firma_ortak,b.firma_ortak);
 });
 await check('gerçek tüketim ile süresi dolmuş kalan birbirine karışmaz',async()=>{
  await db.query('UPDATE cogniti_esnek_paket_yuklemeleri y SET kalan=1000 FROM cogniti_esnek_paket_siparisleri s WHERE s.siparis_id=y.siparis_id AND s.satin_alan_id=$1',[id(101)]);
  const expired=await buy(101);
  await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET created_at='2025-01-01T00:00:00Z',son_kullanim_at='2026-01-01T00:00:00Z' WHERE siparis_id=$1",[expired.siparis_id]);
  const p=(await read(101)).kisisel;assert.deepEqual(p,{paket:'esnek',toplam:6000,kullanilan:2000,kalan:1000,suresi_dolan:3000,ayrilan:0});
  assert.equal((await read(102)).kisisel.toplam,3000);
 });
 await check('alımı olmayan TM ortak bakiyeyi görür; satın alma yetkisi kazanmaz',async()=>{
  const x=await read(121);assert.equal(x.kisisel,null);assert.ok(x.firma_ortak.toplam>0);await assert.rejects(buy(121),e=>e.code==='42501');
 });
 await check('diğer firma yalnız kendi alımlarını görür',async()=>{
  const x=await read(200);assert.equal(x.kisisel.toplam,6000);assert.equal(x.firma_ortak.toplam,3000);
 });
 await check('firma değişince eski kişisel ve ortak bakiye taşınmaz',async()=>{
  await db.query("INSERT INTO firmalar VALUES($1,true,'Boş Firma')",[id(4)]);
  await db.query('UPDATE kullanicilar SET firma_id=$1 WHERE kullanici_id=$2',[id(4),id(200)]);
  const x=await read(200);assert.equal(x.kisisel,null);assert.deepEqual(x.firma_ortak,{paket:null,toplam:0,kullanilan:0,kalan:0,suresi_dolan:0,ayrilan:0});
  await db.query('UPDATE kullanicilar SET firma_id=$1 WHERE kullanici_id=$2',[id(2),id(200)]);
 });
 await check('Cogniti Admin, partner, eczane ve bilinmeyen kimlikler reddedilir',async()=>{
  for(const n of [122,127,128,129,999])await assert.rejects(read(n),e=>e.code==='42501');
 });
 await check('pasif kullanıcı ve pasif firma özet alamaz',async()=>{
  await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(200)]);await assert.rejects(read(200),e=>e.code==='42501');
  await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[id(200)]);await db.query('UPDATE firmalar SET aktif=false WHERE firma_id=$1',[id(2)]);await assert.rejects(read(200),e=>e.code==='42501');
  await db.query('UPDATE firmalar SET aktif=true WHERE firma_id=$1',[id(2)]);
 });
 await check('anon/authenticated okuyamaz; service_role yalnız fonksiyonla özet alır',async()=>{
  for(const rol of ['anon','authenticated']){await db.query(`SET ROLE ${rol}`);try{await assert.rejects(read(101),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}}
  await db.query('SET ROLE service_role');try{assert.equal((await read(101)).kisisel.kullanilan,2000);}finally{await db.query('RESET ROLE');}
 });
 await check('özet okuma yüklemeleri değiştirmez; KKÖ toplamına eklenmez',async()=>{
  const before=(await db.query('SELECT * FROM cogniti_esnek_paket_yuklemeleri ORDER BY yukleme_id')).rows;
  const x=await read(101);assert.equal(x.kisisel.toplam,6000);assert.deepEqual((await db.query('SELECT * FROM cogniti_esnek_paket_yuklemeleri ORDER BY yukleme_id')).rows,before);
  assert.equal((await db.query('SELECT kalan::int n FROM cogniti_token_yuklemeleri')).rows[0].n,750);
 });
 writeFileSync('docs/COGNITI_ESNEK_BAKIYE_ADIM2_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket; sahte temel tablolar; değiştirilmemiş adım 1 ve 2 SQL. Supabase ve gerçek gönderim testi değildir.'},null,2)+'\n');
}
