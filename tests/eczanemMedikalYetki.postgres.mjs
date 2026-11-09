import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
export async function testMedikal({db,id,utt,send,version}){
 const tests=[];const check=async(n,f)=>{await f();tests.push(n);console.log(`MEDIKAL ${tests.length}: ${n}`);};
 const sql=readFileSync('scripts/sql/eczanem_medikal_yayin_yetkisi_duzelt.sql','utf8');
 await check('Düzeltme mevcut süre/blok kurulumlarının üstüne iki kez kurulur',async()=>{await db.query(sql);await db.query(sql);});
 const pub=async(n,status='yayinda',hesap=null,producer=4)=>db.query("INSERT INTO yayin_yonetimi(yayin_id,firma_id,durum,hedef_roller,yayin_tarihi,uretici_id,eczanem_token_hesap_turu) VALUES($1,$2,$3,ARRAY['eczanem'],now()-interval '60 days',$4,$5)",[id(n),id(1),status,id(producer),hesap]);
 await check('Medikal yayını PM hesabı seçmeden açılır ve 60 gün sonra UTT→eczane→danışan iletilir',async()=>{
  await pub(900);assert.equal((await utt(900)).ok,true);const before=(await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n;
  assert.equal((await send(900)).gonderilen,1);assert.equal((await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n,before+1);
  for(const t of ['eczanem_yayin_token_hesaplari','eczanem_token_bloklari'])assert.equal((await db.query(`SELECT count(*)::int n FROM ${t} WHERE yayin_id=$1`,[id(900)])).rows[0].n,0);
  assert.equal((await send(900)).gonderilen,0);
 });
 await check('Medikal kaynak PM özel hesap seçemez; diğer üreticilere Eczanem açılmaz',async()=>{
  await assert.rejects(pub(901,'yayinda','kisisel'),e=>e.code==='42501');
  await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi) VALUES($1,$2,'egt_md',true)",[id(90),id(1)]);
  await assert.rejects(pub(902,'yayinda',null,90),/hesap_secilmedi/);
 });
 await check('Medikal plan kaydı ve gerçek aktivasyonu PM hesabına zorlanmaz',async()=>{await pub(903,'planlandi');await db.query("UPDATE yayin_yonetimi SET durum='yayinda',yayin_tarihi=now() WHERE yayin_id=$1",[id(903)]);assert.equal((await utt(903)).ok,true);assert.equal((await send(903)).gonderilen,1);});
 await check('Medikal kaynak sonradan PM olsa da geçmiş çıkış türü değişmez',async()=>{
  await pub(904);await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(4)]);try{assert.equal((await utt(904)).ok,true);}finally{await db.query("UPDATE kullanicilar SET rol='med_md' WHERE kullanici_id=$1",[id(4)]);}
 });
 await check('PM kaynağı Medikal unvanıyla 30 gün ve hesap kurallarını aşamaz',async()=>{
  await db.query("UPDATE kullanicilar SET rol='med_md' WHERE kullanici_id=$1",[id(3)]);try{await assert.rejects(utt(100),/sure_doldu/);}finally{await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(3)]);}
  await assert.rejects(pub(905,'yayinda',null,3),/hesap_secilmedi/);
 });
 await check('Medikal yayın sahibi değiştirilerek izin taşınamaz; kapalı yayın doğrudan dağıtılamaz',async()=>{
  await pub(906);await assert.rejects(db.query('UPDATE yayin_yonetimi SET uretici_id=$1 WHERE yayin_id=$2',[id(3),id(906)]),/hesap_secilmedi/);
  await pub(907,'Durduruldu');await assert.rejects(db.query('INSERT INTO eczanem_eczane_gonderimleri(yayin_id,eczane_id) VALUES($1,$2)',[id(907),id(10)]),/pm_kaynagi_dogrulanamadi|yayin_kapali/);
 });
 await check('Düzeltmeden sonra PM seçilen hesapla bloklar ve teslimde bir token tüketir',async()=>{
  await db.query("INSERT INTO yayin_yonetimi(yayin_id,firma_id,durum,hedef_roller,yayin_tarihi,uretici_id,eczanem_token_hesap_turu) VALUES($1,$2,'yayinda',ARRAY['eczanem'],now()-interval '1 day',$3,'kisisel')",[id(908),id(1),id(6)]);
  assert.equal((await utt(908)).ok,true);
  const before=(await db.query('SELECT count(*)::int n FROM eczanem_token_bloklari WHERE yayin_id=$1',[id(908)])).rows[0].n;assert.ok(before>0);
  assert.equal((await send(908)).gonderilen,1);
  assert.equal((await db.query("SELECT count(*)::int n FROM eczanem_token_bloklari WHERE yayin_id=$1 AND durum='tuketildi'",[id(908)])).rows[0].n,1);
 });
 writeFileSync('docs/ECZANEM_MEDIKAL_YETKI_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'İzole yerel PostgreSQL, sahte temel tablolar, gerçek PM09/süre/blok/düzeltme SQLleri. Eski firma tüketimi gözlemci stub ile doğrulanır; canlı kullanıcı testi değildir.'},null,2)+'\n');
}
