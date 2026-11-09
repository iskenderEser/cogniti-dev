import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
export async function testOrtak({db,id,utt,send,version}){
 const tests=[];const check=async(n,f)=>{await f();tests.push(n);console.log(`ORTAK ${tests.length}: ${n}`);};
 const sql=readFileSync('scripts/sql/eczanem_ortak_uretici_token.sql','utf8');
 const publish=(n,hesap='kisisel',producer=4,status='yayinda')=>db.query("INSERT INTO yayin_yonetimi(yayin_id,firma_id,durum,hedef_roller,yayin_tarihi,uretici_id,eczanem_token_hesap_turu) VALUES($1,$2,$3,ARRAY['eczanem'],now()-interval '1 day',$4,$5)",[id(n),id(1),status,id(producer),hesap]);
 const rows=async n=>(await db.query('SELECT * FROM eczanem_token_bloklari WHERE yayin_id=$1 ORDER BY musteri_id',[id(n)])).rows;
 const summary=async()=>(await db.query('SELECT cogniti_satin_alma_bakiye_ozeti($1) r',[id(4)])).rows[0].r;
 // Geçişten önceki plan da geçmiş yayın sayılır, başlangıcı ileri taşınmaz.
 await publish(910,null,4,'planlandi');
 await check('Ortak migration tekrar kurulabilir, geçmiş Medikal yayın/planlar bir defa işaretlenir',async()=>{
  await db.query(sql);const first=(await db.query('SELECT * FROM eczanem_medikal_eski_yayinlar ORDER BY yayin_id')).rows;assert.ok(first.some(x=>x.yayin_id===id(900)));assert.ok(first.some(x=>x.yayin_id===id(910)));await db.query(sql);assert.deepEqual((await db.query('SELECT * FROM eczanem_medikal_eski_yayinlar ORDER BY yayin_id')).rows,first);
 });
 await check('Geçmiş 60 günlük Medikal yayın mevcut tüketimle sürer; geriye dönük blok yazılmaz',async()=>{
  const before=(await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n;
  assert.equal((await db.query('SELECT * FROM eczanem_musterilere_video_gonder($1,$2,$3,$4)',[id(10),id(20),id(900),[id(31)]])).rows[0].gonderilen,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM test_tuketim')).rows[0].n,before+1);assert.equal((await rows(900)).length,0);
  const r=(await db.query('SELECT eczanem_pm_token_hesabi($1,$2,NULL) r',[id(4),id(900)])).rows[0].r;assert.equal(r.eski_yayin,true);await assert.rejects(db.query("SELECT eczanem_pm_token_hesabi($1,$2,'kisisel')",[id(4),id(900)]),/eski_yayin/);
 });
 await check('Geçmiş plan aktive olunca da yeni hesap/blok gerektirmez',async()=>{await db.query("UPDATE yayin_yonetimi SET durum='yayinda' WHERE yayin_id=$1",[id(910)]);assert.equal((await utt(910)).ok,true);assert.equal((await send(910)).gonderilen,1);assert.equal((await rows(910)).length,0);});
 await db.query('SELECT cogniti_esnek_paket_siparis_olustur($1,3000,1,8.2,$2)',[id(4),randomUUID()]);
 await check('Yeni Medikal yayın hesabını açık seçer; UTT tesliminde uygun üyeler ortak mekanizmayla bloklanır',async()=>{
  await assert.rejects(publish(920,null),/hesap_secilmedi/);await publish(920);assert.equal((await utt(920)).ok,true);assert.ok((await rows(920)).length>0);
  const r=(await db.query('SELECT eczanem_pm_token_hesabi($1,$2,NULL) r',[id(4),id(920)])).rows[0].r;assert.equal(r.eski_yayin,false);assert.equal(r.hesap_turu,'kisisel');assert.equal(r.blokeli,(await rows(920)).length);
  assert.equal((await summary()).kisisel.kullanilan,0);assert.equal((await summary()).kisisel.ayrilan,r.blokeli);
 });
 await check('Danışana teslim aynı bloktan bir token tüketir, tekrar çift düşmez',async()=>{assert.equal((await send(920)).gonderilen,1);assert.equal((await send(920)).gonderilen,0);assert.equal((await summary()).kisisel.kullanilan,1);assert.equal((await rows(920)).filter(x=>x.durum==='tuketildi').length,1);});
 await check('30 gün dolunca kalan bloklar serbestleşir; yayın gönderilemez ve yeni token üretilmez',async()=>{
  const before=(await summary()).kisisel;await db.query("UPDATE eczanem_yayin_gonderim_sureleri SET baslangic_at=now()-interval '720 hours' WHERE yayin_id=$1",[id(920)]);await db.query("UPDATE eczanem_token_bloklari SET bitis_at=now() WHERE yayin_id=$1 AND durum='blokeli'",[id(920)]);
  const after=(await summary()).kisisel;assert.equal(after.toplam,before.toplam);assert.equal(after.kullanilan,1);assert.equal(after.kalan,before.kalan+before.ayrilan);assert.equal(after.ayrilan,0);
  await assert.rejects(db.query('SELECT * FROM eczanem_musterilere_video_gonder($1,$2,$3,$4)',[id(10),id(20),id(920),[id(31)]]),/sure_doldu/);
  await assert.rejects(db.query('INSERT INTO eczanem_eczane_gonderimleri(yayin_id,eczane_id) VALUES($1,$2)',[id(920),id(99)]),/sure_doldu/);
 });
 await check('Tekrar kurulum yeni Medikal yayını geçmişe katmaz, süresini ve hesabını değiştirmez',async()=>{await db.query(sql);assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_medikal_eski_yayinlar WHERE yayin_id=$1',[id(920)])).rows[0].n,0);assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_token_eski_yayinlar WHERE yayin_id=$1',[id(920)])).rows[0].n,0);await assert.rejects(utt(920),/sure_doldu/);});
 await check('Yeni Medikal planında 30 gün yalnız gerçek aktivasyonda başlar',async()=>{
  await publish(921,'kisisel',4,'planlandi');assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(921)])).rows[0].n,0);assert.equal((await rows(921)).length,0);
  await db.query("UPDATE yayin_yonetimi SET durum='yayinda',yayin_tarihi=now() WHERE yayin_id=$1",[id(921)]);const row=(await db.query('SELECT * FROM eczanem_yayin_gonderim_sureleri WHERE yayin_id=$1',[id(921)])).rows[0];assert.equal(row.uretici_rol,'med_md');assert.ok(Date.now()-row.baslangic_at.getTime()<2000);assert.equal((await utt(921)).ok,true);
 });
 await check('Hesap değişimi/başkasının yayını ve yetkisiz üretici reddedilir',async()=>{
  await assert.rejects(db.query("SELECT eczanem_pm_token_hesabi($1,$2,'firma_ortak')",[id(4),id(921)]),/hesap_degistirilemez/);
  await assert.rejects(db.query('SELECT eczanem_pm_token_hesabi($1,$2,NULL)',[id(3),id(921)]),e=>e.code==='42501');
  await assert.rejects(publish(922,'kisisel',90),e=>e.code==='42501');
 });
 await check('Firma hesabı kişiselden ayrı kullanılır, yetersizlikte UTT teslimi/blok birlikte geri alınır',async()=>{
  await publish(923,'firma_ortak');const before=(await summary()).kisisel;await assert.rejects(utt(923),/yetersiz/);assert.equal((await rows(923)).length,0);assert.equal((await db.query('SELECT count(*)::int n FROM eczanem_eczane_gonderimleri WHERE yayin_id=$1',[id(923)])).rows[0].n,0);assert.deepEqual((await summary()).kisisel,before);
 });
 await check('Anon/authenticated geçmiş işaretlerini değiştiremez ve ortak RPCyi çağıramaz',async()=>{for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);try{await assert.rejects(db.query('SELECT * FROM eczanem_medikal_eski_yayinlar'),e=>e.code==='42501');await assert.rejects(db.query('SELECT eczanem_pm_token_hesabi($1,$2,NULL)',[id(4),id(921)]),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}}});
 writeFileSync('docs/ECZANEM_ORTAK_URETICI_TOKEN_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel PostgreSQL Unix socket, sahte temel tablolar; gerçek süre, blok, Medikal düzeltmesi ve ortaklaştırma migrationları. Eski tüketim gözlemci stub kullanır. Canlı/tarayıcı testi değildir.'},null,2)+'\n');
}
