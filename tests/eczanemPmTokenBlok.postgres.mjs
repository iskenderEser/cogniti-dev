import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function testBlok({db,connect,id,utt,send,publication:legacyPublication,version}){
 const tests=[];const check=async(name,fn)=>{await fn();tests.push(name);console.log(`BLOK OK ${tests.length}: ${name}`);};
 const sql=n=>readFileSync(`scripts/sql/${n}.sql`,'utf8');
 await db.query(`ALTER TABLE kullanicilar ADD COLUMN ad text DEFAULT 'Test',ADD COLUMN soyad text DEFAULT 'Kişi';
 CREATE TABLE cogniti_fiyat_tarifesi(tekil boolean PRIMARY KEY,surum integer,degerler jsonb);
 CREATE TABLE cogniti_sm2_fiyat_oranlari(token_adedi integer,ay integer,katsayi numeric,PRIMARY KEY(token_adedi,ay));
 INSERT INTO cogniti_fiyat_tarifesi VALUES(true,1,'{"kko_token_tl":9.90}');INSERT INTO cogniti_sm2_fiyat_oranlari VALUES(3000,0,8.2/9.9);
 CREATE TABLE eczanem_eclub_gecis_talepleri(musteri_id uuid);
 CREATE TABLE cogniti_token_hesaplari(firma_id uuid PRIMARY KEY);
 DROP TRIGGER test_token ON eczanem_gonderimler;`);
 await db.query(`CREATE FUNCTION cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text) RETURNS uuid LANGUAGE plpgsql AS $$BEGIN INSERT INTO public.test_tuketim VALUES($7); RETURN gen_random_uuid();END$$;`);
 await db.query(sql('cogniti_esnek_paket_siparis_adim1'));await db.query(sql('cogniti_token_bakiye_ozeti_adim2'));
 await check('bloklama migration ilk ve tekrar kurulur',async()=>{await db.query(sql('eczanem_pm_token_bloklama'));await db.query(sql('eczanem_pm_token_bloklama'));});
 const buy=async user=>db.query('SELECT cogniti_esnek_paket_siparis_olustur($1,3000,1,8.2,$2)',[id(user),randomUUID()]);
 await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi,ad,soyad) VALUES($1,$2,'gm',true,'Test','GM')",[id(8),id(1)]);
 await buy(3);await buy(8);const summary=async user=>(await db.query('SELECT cogniti_satin_alma_bakiye_ozeti($1) r',[id(user)])).rows[0].r;
 const publication=async(n,age='1 day',status='yayinda',target='eczanem',producer=3,type='kisisel')=>db.query(`INSERT INTO yayin_yonetimi(yayin_id,firma_id,takim_id,durum,hedef_roller,yayin_tarihi,uretici_id,eczanem_token_hesap_turu) VALUES($1,$2,NULL,$3,$4,statement_timestamp()-$5::interval,$6,$7)`,[id(n),id(1),status,[target],age,id(producer),type]);
 const set=async(n,type='kisisel',pm=3)=>(await db.query('SELECT eczanem_pm_token_hesabi($1,$2,$3) r',[id(pm),id(n),type])).rows[0].r;
 const rows=async n=>(await db.query('SELECT * FROM eczanem_token_bloklari WHERE yayin_id=$1 ORDER BY musteri_id',[id(n)])).rows;
 // Üç aktif uygun; bir pasif; biri E-Club geçişinde.
 for(const [n,active,transition] of [[31,true,false],[32,true,false],[33,false,false],[34,true,true]]){
  await db.query('INSERT INTO eczanem_musteriler VALUES($1,$2)',[id(n),active]);await db.query('INSERT INTO eczanem_uyelikler VALUES($1,$2,true)',[id(10),id(n)]);if(transition)await db.query('INSERT INTO eczanem_eclub_gecis_talepleri VALUES($1)',[id(n)]);
 }
 await check('kişisel hesabı PM açık seçer; UTT tesliminde 3 uygun üye bloklanır',async()=>{
  await publication(200);await set(200);assert.equal((await utt(200)).ok,true);assert.equal((await rows(200)).length,3);
  const x=(await summary(3)).kisisel;assert.equal(x.toplam,3000);assert.equal(x.kullanilan,0);assert.equal(x.ayrilan,3);assert.equal(x.kalan,2997);
  assert.equal((await summary(8)).firma_ortak.ayrilan,0);
 });
 await check('başarılı teslim bloktan tüketir; tekrar gönderim çift düşmez',async()=>{
  assert.equal((await send(200)).gonderilen,1);assert.equal((await send(200)).gonderilen,0);
  const x=(await summary(3)).kisisel;assert.equal(x.kullanilan,1);assert.equal(x.ayrilan,2);assert.equal(x.kalan,2997);
  const r=(await rows(200)).find(r=>r.musteri_id===id(30));assert.equal(r.durum,'tuketildi');assert.ok(r.gonderim_id);
 });
 await check('snapshot dışı yeni danışan bloktan veya başka hesaptan tüketemez',async()=>{
  await db.query('INSERT INTO eczanem_musteriler VALUES($1,true)',[id(35)]);await db.query('INSERT INTO eczanem_uyelikler VALUES($1,$2,true)',[id(10),id(35)]);
  await assert.rejects(db.query('SELECT * FROM eczanem_musterilere_video_gonder($1,$2,$3,$4)',[id(10),id(20),id(200),[id(35)]]),/ECZANEM_TOKEN:blok_yok/);
  assert.equal((await summary(3)).kisisel.kullanilan,1);
 });
 await check('30 gün sonunda harcanmayan blok çözülür; yeni token yaratılmaz',async()=>{
  await db.query("UPDATE eczanem_token_bloklari SET bitis_at=now()-interval '1 second' WHERE yayin_id=$1 AND durum='blokeli'",[id(200)]);
  const x=(await summary(3)).kisisel;assert.equal(x.toplam,3000);assert.equal(x.kullanilan,1);assert.equal(x.ayrilan,0);assert.equal(x.kalan,2999);
  const r=await db.query('SELECT eczanem_pm_token_hesabi($1,$2,NULL) r',[id(3),id(200)]);assert.equal(r.rows[0].r.serbest,2);
 });
 await check('firma hesabı seçilirse yalnız ortak blok ve tüketim artar',async()=>{
  await publication(201,'1 day','yayinda','eczanem',3,'firma_ortak');await set(201,'firma_ortak');await utt(201);await send(201);
  const x=await summary(3);assert.equal(x.firma_ortak.ayrilan,3);assert.equal(x.firma_ortak.kullanilan,1);assert.equal(x.kisisel.kullanilan,1);
 });
 await check('hesap seçilmemiş yayın teslimi reddedilir; eczane kaydı ve blok oluşmaz',async()=>{
  await assert.rejects(publication(202,'1 day','yayinda','eczanem',3,null),/hesap_secilmedi/);assert.equal((await rows(202)).length,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_eczane_gonderimleri WHERE yayin_id=$1',[id(202)])).rows[0].n,0);
 });
 await check('tekrar kurulum yeni yayınları eski hesap kapsamına almaz',async()=>{
  await db.query(sql('eczanem_pm_token_bloklama'));
  assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_token_eski_yayinlar WHERE yayin_id=$1',[id(200)])).rows[0].n,0);
  assert.equal((await rows(200)).length,3);
 });
 await check('Medikal, UTT ve başka PM yayın hesabını seçemez; seçilmiş hesap değişemez',async()=>{
  for(const pm of [2,4,5])await assert.rejects(set(201,'kisisel',pm),e=>e.code==='42501');
  await assert.rejects(set(201,'kisisel'),/hesap_degistirilemez/);
  await assert.rejects(db.query('UPDATE yayin_yonetimi SET eczanem_token_hesap_turu=NULL WHERE yayin_id=$1',[id(201)]),/hesap_degistirilemez/);
 });
 await check('yetersiz token durumunda eczane teslimi ve kısmi blok birlikte geri alınır',async()=>{
  await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=1 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE sahip_id=$1)",[id(3)]);
  await publication(203);await set(203);await assert.rejects(utt(203),/ECZANEM_TOKEN:yetersiz/);assert.equal((await rows(203)).length,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_eczane_gonderimleri WHERE yayin_id=$1',[id(203)])).rows[0].n,0);
 });
 await check('eski yayın mevcut tüketim fonksiyonuyla sürer; yeni hesaba taşınmaz',async()=>{
  // Önceki 30 gün testinde 110 eczaneye ve danışan 30'a teslim edildi.
  await assert.rejects(set(110,'firma_ortak'),/eski_yayin/);
  const info=(await db.query('SELECT eczanem_pm_token_hesabi($1,$2,NULL) r',[id(3),id(110)])).rows[0].r;assert.equal(info.eski_yayin,true);
  const before=(await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n;
  const r=(await db.query('SELECT * FROM eczanem_musterilere_video_gonder($1,$2,$3,$4)',[id(10),id(20),id(110),[id(31)]])).rows[0];assert.equal(r.gonderilen,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n,before+1);assert.equal((await rows(110)).length,0);
 });
 await check('aynı kişisel hesapta eş zamanlı iki yayın bloku bakiyeyi aşamaz',async()=>{
  await buy(5);await db.query('UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=4 WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE sahip_id=$1)',[id(5)]);
  for(const n of [205,206]){await publication(n,'1 day','yayinda','eczanem',5);await set(n,'kisisel',5);}
  const a=await connect(),b=await connect();const r=await Promise.allSettled([utt(205,a),utt(206,b)]);
  assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(r.filter(x=>x.status==='rejected').length,1);
  const winner=r[0].status==='fulfilled'?205:206;
  assert.equal((await summary(5)).kisisel.ayrilan,4);assert.equal((await summary(5)).kisisel.kalan,0);
  const x=await Promise.all([send(winner,a),send(winner,b)]);assert.equal(x.reduce((n,r)=>n+r.gonderilen,0),1);assert.equal((await summary(5)).kisisel.kullanilan,2997);
 });
 await check('karma danışan seçiminde bir blok yoksa önceki tüketim de geri alınır',async()=>{
  await buy(6);await publication(207,'1 day','yayinda','eczanem',6);await set(207,'kisisel',6);await utt(207);
  await db.query('INSERT INTO eczanem_musteriler VALUES($1,true)',[id(36)]);await db.query('INSERT INTO eczanem_uyelikler VALUES($1,$2,true)',[id(10),id(36)]);
  await assert.rejects(db.query('SELECT cogniti_token_eczanem_toplu_gonder($1,$2,$3,$4)',[id(10),id(20),[id(207)],[id(31),id(36)]]),/blok_yok/);
  assert.equal((await summary(6)).kisisel.kullanilan,0);assert.equal((await rows(207)).filter(r=>r.durum==='tuketildi').length,0);
 });
 await check('tüm snapshot üyelerine teslim bitince o yayının bloku sıfırlanır',async()=>{
  await publication(208,'1 day','yayinda','eczanem',6);await utt(208);
  const selected=(await rows(208)).map(r=>r.musteri_id);
  const r=(await db.query('SELECT * FROM eczanem_musterilere_video_gonder($1,$2,$3,$4)',[id(10),id(20),id(208),selected])).rows[0];assert.equal(r.gonderilen,selected.length);
  const x=(await db.query('SELECT eczanem_pm_token_hesabi($1,$2,NULL) r',[id(6),id(208)])).rows[0].r;assert.equal(x.blokeli,0);assert.equal(x.tuketilen,selected.length);assert.equal(x.serbest,0);
 });
 await check('yükleme süresi dolunca blok kullanılabilir bakiyeye dönmez ve tüketilemez',async()=>{
  await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET created_at=now()-interval '2 days',son_kullanim_at=now()-interval '1 day' WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='firma_ortak')");
  // Normalde blok bitişi yükleme ömründen geç olamaz. Testte ömür geriye çekildiğinden birlikte taşı.
  await db.query("UPDATE eczanem_token_bloklari SET bitis_at=now()-interval '1 day' WHERE bakiye_id IN(SELECT bakiye_id FROM cogniti_satin_alma_bakiyeleri WHERE bakiye_turu='firma_ortak') AND durum='blokeli'");
  const x=(await summary(3)).firma_ortak;assert.equal(x.kalan,0);assert.equal(x.ayrilan,0);assert.equal(x.suresi_dolan,2999);
 });
 await check('anon/authenticated blok tabloları ve PM işlemine erişemez',async()=>{
  for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);try{await assert.rejects(db.query('SELECT * FROM eczanem_token_bloklari'),e=>e.code==='42501');await assert.rejects(set(200),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}}
 });
 writeFileSync('docs/ECZANEM_PM_TOKEN_BLOK_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket, sahte temel tablolar; değiştirilmemiş PM09/30 gün/Esnek hesap ve yeni bloklama SQL. Canlı sipariş/push veya tarayıcı testi değildir.'},null,2)+'\n');
}
