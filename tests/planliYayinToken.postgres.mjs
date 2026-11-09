import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import pg from 'pg';
export async function testPlanToken({db,id,version,connection}){
 const tests=[];const check=async(n,f)=>{await f();tests.push(n);console.log(`PLAN TOKEN ${tests.length}: ${n}`);};
 // Ortak açılış testinin temel tablolarına, değiştirilmemiş Eczanem ayırıcı işlevinin bağımlılıklarını ekler.
 await db.query(`CREATE TABLE eczanem_yayin_token_hesaplari(yayin_id uuid PRIMARY KEY,firma_id uuid,pm_id uuid,bakiye_id uuid);
 CREATE TABLE eczanem_yayin_gonderim_sureleri(yayin_id uuid PRIMARY KEY,uretici_id uuid,uretici_rol text,baslangic_at timestamptz);
 CREATE TABLE eczanem_token_eski_yayinlar(yayin_id uuid PRIMARY KEY);
 CREATE TABLE eczanem_uyelikler(eczane_id uuid,musteri_id uuid,aktif_mi boolean);
 CREATE TABLE eczanem_musteriler(musteri_id uuid PRIMARY KEY,aktif_mi boolean);
 CREATE TABLE eczanem_eclub_gecis_talepleri(musteri_id uuid);
 CREATE TABLE eczanem_gonderimler(yayin_id uuid,eczane_id uuid,musteri_id uuid);
 ALTER TABLE eczanem_token_bloklari ADD COLUMN yayin_id uuid,ADD COLUMN eczane_id uuid,ADD COLUMN musteri_id uuid,ADD COLUMN firma_id uuid,ADD COLUMN bakiye_id uuid;
 ALTER TABLE eczanem_token_bloklari ADD UNIQUE(yayin_id,eczane_id,musteri_id);`);
 const sql=readFileSync('scripts/sql/cogniti_planli_yayin_token_rezervasyonu.sql','utf8');
 await check('Plan rezervasyonu SQLi iki kez kurulur',async()=>{await db.query(sql);await db.query(sql);});
 await db.query("DELETE FROM eczanem_token_bloklari;UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=100,son_kullanim_at=now()+interval '20 days';UPDATE yayin_yonetimi SET yayin_tarihi=now()+interval '2 days' WHERE durum='planlandi'");
 let serial=7000;
 const create=async({target=['utt'],tur='kisisel',producer=100,days=2,status='planlandi',c=db}={})=>{
  const pub=id(serial++),src=id(serial++),ss=id(serial++),talep=id(serial++);
  await c.query('INSERT INTO talepler VALUES($1,$2,$3,$4,$5,false,NULL)',[talep,id(producer),id(1),id(10),target]);await c.query('INSERT INTO soru_setleri VALUES($1,$2)',[ss,talep]);await c.query("INSERT INTO soru_seti_durumu VALUES($1,$2,'onaylandi')",[src,ss]);
  await c.query("INSERT INTO yayin_yonetimi(yayin_id,soru_seti_durum_id,firma_id,takim_id,uretici_id,hedef_roller,durum,token_hesap_turu,yayin_tarihi) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()+$9::int*interval '1 day')",[pub,src,id(1),id(10),id(producer),target,status,tur,days]);return {pub,src};
 };
 const ozet=async()=>(await db.query('SELECT cogniti_satin_alma_bakiye_ozeti($1) r',[id(100)])).rows[0].r;
 const head=async p=>(await db.query('SELECT * FROM cogniti_yayin_plan_tokenlari WHERE yayin_id=$1',[p.pub])).rows[0];
 const activate=async p=>(await db.query('SELECT yayin_planlananlari_aktive($1) n',[p.pub])).rows[0].n;
 const clear=async()=>{await db.query("UPDATE cogniti_yayin_plan_tokenlari SET durum='serbest' WHERE durum='ayrildi';UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=100,son_kullanim_at=now()+interval '20 days'");};
 await clear();let first;
 await check('İleri tarihli saha planı 2 token ayırır; kullanılanı artırmaz ve başka yayın harcayamaz',async()=>{
  first=await create();assert.equal((await head(first)).miktar,2);let x=(await ozet()).kisisel;assert.equal(x.kullanilan,2900);assert.equal(x.ayrilan,2);assert.equal(x.kalan,98);
  await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=2 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='kisisel')");await assert.rejects(create({status:'yayinda'}),/yetersiz/);assert.equal((await ozet()).kisisel.kalan,0);
 });
 await check('Ayrılan token gerçek aktivasyonda tek kez tüketilir; rezervasyon serbest kalır',async()=>{assert.equal(await activate(first),1);assert.equal((await head(first)).durum,'tuketildi');assert.equal((await ozet()).kisisel.ayrilan,0);assert.equal((await ozet()).kisisel.kalan,0);assert.equal(await activate(first),0);});
 await clear();
 await check('E-Club planı aynı mekanizmayla doğru üye sayısı kadar ayırır',async()=>{const p=await create({target:['eczaci','eczane_teknisyeni']});assert.equal((await head(p)).miktar,3);assert.equal((await ozet()).kisisel.ayrilan,3);await db.query('DELETE FROM yayin_yonetimi WHERE yayin_id=$1',[p.pub]);assert.equal((await head(p)).durum,'serbest');assert.equal((await ozet()).kisisel.ayrilan,0);});
 await check('Tarih değişikliği yeni tarihte geçerli yüklemeleri yeniden ayırır, yetersizse eski plan korunur',async()=>{
  const p=await create();const before=await head(p);await assert.rejects(db.query("UPDATE yayin_yonetimi SET yayin_tarihi=now()+interval '30 days' WHERE yayin_id=$1",[p.pub]),/ESNEK_PLAN:yetersiz/);assert.equal((await head(p)).hedef_at.getTime(),before.hedef_at.getTime());assert.equal((await head(p)).durum,'ayrildi');
  await db.query("UPDATE yayin_yonetimi SET yayin_tarihi=now()+interval '3 days' WHERE yayin_id=$1",[p.pub]);assert.ok((await head(p)).hedef_at>before.hedef_at);assert.equal((await ozet()).kisisel.ayrilan,2);await db.query('DELETE FROM yayin_yonetimi WHERE yayin_id=$1',[p.pub]);
 });
 await check('Aktivasyonda alıcı artarsa aynı hesaptan fark alınır; azalırsa fazla ayrım tüketilmez',async()=>{
  const p=await create();await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,takim_id,rol,aktif_mi) VALUES($1,$2,$3,'utt',true)",[id(399),id(1),id(10)]);assert.equal(await activate(p),1);assert.equal((await ozet()).kisisel.kalan,97);
  const q=await create();assert.equal((await head(q)).miktar,3);await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(399)]);assert.equal(await activate(q),1);assert.equal((await ozet()).kisisel.kalan,95);
 });
 await clear();
 await check('Gerçekleşmeyen aktivasyon kısmi tüketimi geri alır ve kullanılmayan plan tokenlarını serbest bırakır',async()=>{
  const p=await create();await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=2 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='kisisel')");await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[id(399)]);
  assert.equal(await activate(p),0);assert.equal((await head(p)).durum,'serbest');assert.equal((await ozet()).kisisel.kalan,2);assert.equal((await db.query('SELECT durum FROM yayin_yonetimi WHERE yayin_id=$1',[p.pub])).rows[0].durum,'planlandi');assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_esnek_gonderim_tuketimleri WHERE kaynak_id=$1',[p.pub])).rows[0].n,0);
  await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=10 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='kisisel')");assert.equal(await activate(p),1);assert.equal((await head(p)).durum,'tuketildi');await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(399)]);
 });
 await clear();
 await check('İptal rezervasyonu geçmişiyle saklar, token yaratmaz ve tüketim yazmaz',async()=>{const p=await create();const before=(await ozet()).kisisel;await db.query('DELETE FROM yayin_yonetimi WHERE yayin_id=$1',[p.pub]);const after=(await ozet()).kisisel;assert.equal(after.toplam,before.toplam);assert.equal(after.kullanilan,before.kullanilan);assert.equal(after.kalan,before.kalan+2);assert.equal((await head(p)).durum,'serbest');});
 await check('Firma hesabında rezervasyon kişisel hesabı değiştirmez',async()=>{const before=(await ozet()).kisisel;const p=await create({tur:'firma_ortak'});assert.equal((await ozet()).firma_ortak.ayrilan,2);assert.deepEqual((await ozet()).kisisel,before);await db.query('DELETE FROM yayin_yonetimi WHERE yayin_id=$1',[p.pub]);});
 await check('Plan yüklemenin son kullanımını aşamaz; önizleme de aynı sınırı kullanır',async()=>{
  await assert.rejects(create({days:30}),/ESNEK_PLAN:yetersiz/);
  const p=await create();const date=(await db.query("SELECT to_char(now()+interval '30 days','YYYY-MM-DD') d")).rows[0].d;
  // Önizleme için henüz yayınlanmamış yeni bir aday gerekir.
  await db.query('DELETE FROM yayin_yonetimi WHERE yayin_id=$1',[p.pub]);const r=(await db.query("SELECT cogniti_gonderim_token_onizle($1,'yayin_acilis','kisisel',$2,'{}',$3) r",[id(100),[p.src],date])).rows[0].r;assert.equal(r.plan_rezervasyonu_acik,true);assert.equal(r.kullanilabilir_token,0);
 });
 await check('Eczanem bloklayıcı ayrılmış plan tokenlarını harcayamaz',async()=>{
  await clear();const p=await create();await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=2 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='kisisel')");const b=(await db.query("SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE sahip_id=$1",[id(100)])).rows[0].bakiye_id;
  await db.query('INSERT INTO eczanem_yayin_token_hesaplari VALUES($1,$2,$3,$4)',[id(9990),id(1),id(100),b]);await db.query("INSERT INTO eczanem_yayin_gonderim_sureleri VALUES($1,$2,'pm',now())",[id(9990),id(100)]);await db.query('INSERT INTO eczanem_musteriler VALUES($1,true)',[id(9991)]);await db.query('INSERT INTO eczanem_uyelikler VALUES($1,$2,true)',[id(9992),id(9991)]);await assert.rejects(db.query('SELECT eczanem_pm_token_eczane_blokla($1,$2)',[id(9990),id(9992)]),/yetersiz/);await db.query('DELETE FROM yayin_yonetimi WHERE yayin_id=$1',[p.pub]);
 });
 await clear();
 await check('İki bağımsız plan aynı hesaptaki son tokenları fazla ayıramaz',async()=>{
  await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=2 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='kisisel')");const db2=new pg.Client(connection);await db2.connect();try{await db.query('BEGIN');await create();let done=false;const pending=create({c:db2}).then(()=>{done=true;return null},e=>{done=true;return e});await new Promise(r=>setTimeout(r,100));assert.equal(done,false);await db.query('COMMIT');assert.match((await pending).message,/ESNEK_PLAN:yetersiz/);assert.equal((await ozet()).kisisel.ayrilan,2);}finally{await db.query('ROLLBACK');await db2.end();}
 });
 await check('Zamanı gelen planlarda bir başarısızlık diğerini engellemez, cron tekrarı çift tüketmez',async()=>{
  await clear();await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=3 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='kisisel')");const bad=await create(),good=await create({target:['bm']});
  await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[id(399)]);
  // Sahte veride zamanı ileri almış gibi yalnız bu iki planı vadesi gelmiş duruma getir.
  await db.query('ALTER TABLE yayin_yonetimi DISABLE TRIGGER trg_00_plan_token_birak;ALTER TABLE yayin_yonetimi DISABLE TRIGGER trg_zzz_plan_token_kaydet');
  await db.query("UPDATE yayin_yonetimi SET yayin_tarihi=now()-interval '1 minute' WHERE yayin_id=ANY($1)",[[bad.pub,good.pub]]);
  await db.query('ALTER TABLE yayin_yonetimi ENABLE TRIGGER trg_00_plan_token_birak;ALTER TABLE yayin_yonetimi ENABLE TRIGGER trg_zzz_plan_token_kaydet');
  assert.equal((await db.query('SELECT yayin_planlananlari_aktive(NULL) n')).rows[0].n,1);assert.equal((await head(bad)).durum,'serbest');assert.equal((await head(good)).durum,'tuketildi');assert.equal((await ozet()).kisisel.kalan,2);
  assert.equal((await db.query('SELECT yayin_planlananlari_aktive(NULL) n')).rows[0].n,0);assert.equal((await ozet()).kisisel.kalan,2);await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(399)]);
 });
 await check('Yetki kalkınca gerçekleşmeyen planın rezervasyonu bırakılır',async()=>{
  await clear();const p=await create();await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(100)]);try{assert.equal(await activate(p),0);assert.equal((await head(p)).durum,'serbest');}finally{await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[id(100)]);}assert.equal((await ozet()).kisisel.ayrilan,0);
 });
 await check('Anonim/oturumlu kullanıcı rezervasyon tablolarını veya işlevlerini doğrudan kullanamaz',async()=>{for(const role of ['anon','authenticated','service_role']){await db.query(`SET ROLE ${role}`);try{await assert.rejects(db.query('SELECT * FROM cogniti_yayin_plan_tokenlari'),e=>e.code==='42501');await assert.rejects(db.query('SELECT cogniti_yayin_plan_token_ayir($1)',[first.pub]),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}}});
 writeFileSync('docs/COGNITI_PLANLI_YAYIN_TOKEN_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket; sahte temel tablolar; gerçek ortak açılış, plan rezervasyonu ve Eczanem ayırma SQLleri. Canlı sistem/tarayıcı testi değildir.'},null,2)+'\n');
}
