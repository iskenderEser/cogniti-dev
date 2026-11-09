import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import pg from 'pg';
export async function testOrtakYayin({db,id,version,connection}){
 const tests=[];const check=async(n,f)=>{await f();tests.push(n);console.log(`ORTAK YAYIN ${tests.length}: ${n}`);};
 const sql=readFileSync('scripts/sql/cogniti_ortak_yayin_anlik_tuketim.sql','utf8');
 await db.query(readFileSync('scripts/sql/eclub_utt_hesap_secimi_geri_al.sql','utf8'));
 await db.query("ALTER TABLE yayin_tekrar_kayitlari ADD COLUMN acilis_turu text;ALTER TABLE yayin_tekrar_kayitlari ADD UNIQUE(yayin_id,tur_no);ALTER TABLE yayin_yonetimi ADD COLUMN urun_adi text DEFAULT 'Test';CREATE OR REPLACE VIEW v_yayin_detay AS SELECT * FROM yayin_yonetimi;CREATE TABLE bildirimler(alici_id uuid,gonderen_id uuid,kayit_turu text,kayit_id uuid,mesaj text,goruldu_mu boolean,UNIQUE(alici_id,kayit_turu,kayit_id));");
 const kalan=async(tur='kisisel')=>Number((await db.query('SELECT sum(y.kalan) n FROM cogniti_esnek_paket_yuklemeleri y JOIN cogniti_satin_alma_bakiyeleri b USING(bakiye_id) WHERE b.bakiye_turu=$1',[tur])).rows[0].n);
 const reset=async(n=3000)=>db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=$1,son_kullanim_at=now()+interval '1 day'",[n]);
 let serial=3000;
 const candidate=async(targets=['eczaci'],producer=100,team=10)=>{
  const pub=id(serial++),src=id(serial++),ss=id(serial++),talep=id(serial++);
  await db.query('INSERT INTO talepler VALUES($1,$2,$3,$4,$5,false,NULL)',[talep,id(producer),id(1),team===null?null:id(team),targets]);
  await db.query('INSERT INTO soru_setleri VALUES($1,$2)',[ss,talep]);await db.query("INSERT INTO soru_seti_durumu VALUES($1,$2,'onaylandi')",[src,ss]);return {pub,src,targets,producer,team};
 };
 const publish=async(c,tur='kisisel',status='yayinda')=>db.query("INSERT INTO yayin_yonetimi(yayin_id,soru_seti_durum_id,firma_id,takim_id,uretici_id,hedef_roller,durum,token_hesap_turu,urun_id,arac_id,arac_turu,yayin_tarihi) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'video',now())",[c.pub,c.src,id(1),c.team===null?null:id(c.team),id(c.producer),c.targets,status,tur,id(30),id(810)]);
 const preview=async c=>(await db.query("SELECT cogniti_gonderim_token_onizle($1,'yayin_acilis','kisisel',$2,'{}',NULL) r",[id(c.producer),[c.src]])).rows[0].r;
 const snapshot=async c=>(await db.query('SELECT * FROM cogniti_yayin_acilis_token_kayitlari WHERE yayin_id=$1',[c.pub])).rows[0];
 await check('Ortak SQL ilk ve tekrar kurulur; eski yayınlar tek seferlik işaretlenir',async()=>{await db.query(sql);await db.query(sql);assert.equal((await db.query("SELECT to_regprocedure('public.cogniti_esnek_eclub_gonder(uuid,text,uuid[],uuid[],uuid)') x")).rows[0].x,null);});
 // Kayıtlı eczacı1 iki UTT bağıyla tek sayılır; teknisyen, yardımcı eczacı, pasif/hesapsız ve başka takım da bulunur.
 for(const [n,role,auth] of [[510,'eczane_teknisyeni',true],[511,'yardimci_eczaci',true],[512,'eczaci',false],[513,'eczaci',true]]){
  await db.query('INSERT INTO eclub_kisiler(kisi_id,rol,auth_user_id) VALUES($1,$2,$3)',[id(n),role,auth?id(n):null]);
  await db.query('INSERT INTO eclub_kisi_eczane VALUES($1,$2,$3,$4)',[id(n+100),id(n),id(502),n!==513]);
 }
 await db.query('INSERT INTO eclub_utt_eczane VALUES($1,$2,$3,true)',[id(650),id(503),id(302)]);
 await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,takim_id,rol,aktif_mi) VALUES($1,$2,$3,'utt',true)",[id(320),id(1),id(11)]);
 await db.query("INSERT INTO eclub_kisiler(kisi_id,rol,auth_user_id) VALUES($1,'eczaci',$1)",[id(514)]);
 await db.query('INSERT INTO eclub_kisi_eczane VALUES($1,$2,$3,true)',[id(654),id(514),id(552)]);
 await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,$3,true)',[id(553),id(552),id(1)]);
 await db.query('INSERT INTO eclub_utt_eczane VALUES($1,$2,$3,true)',[id(554),id(553),id(320)]);
 await reset();
 await check('E-Club önizleme hedef unvan/aktif bağ/takım ve tekil kişi sayısını kullanır',async()=>{
  for(const [targets,n] of [[['eczaci'],2],[['eczane_teknisyeni'],1],[['eczaci','eczane_teknisyeni'],3]]){const c=await candidate(targets);const r=await preview(c);assert.equal(r.gereken_token,n);assert.equal(r.gercek_gonderim_acik,true);}
  const c=await candidate(['eczaci'],100,null);assert.equal((await preview(c)).gereken_token,3);
 });
 let eclub;
 await check('E-Club açılışı üreticinin kişisel hesabından tekil üye başına anında tüketir',async()=>{eclub=await candidate(['eczaci','eczane_teknisyeni']);const before=await kalan();await publish(eclub);assert.equal(await kalan(),before-3);assert.equal((await snapshot(eclub)).alici_sayisi,3);const r=await db.query('SELECT * FROM cogniti_esnek_gonderim_tuketimleri WHERE kaynak_id=$1',[eclub.pub]);assert.equal(r.rowCount,3);assert.ok(r.rows.every(x=>x.alici_turu==='eclub_kisi'&&x.gonderen_id===id(100)));assert.equal(await kalan('firma_ortak'),3000);});
 await check('UTTnin gerçek üye dağıtımı ve aynı anahtarlı deneme ikinci tüketim yaratmaz',async()=>{
  await db.query('INSERT INTO eclub_utt_yayin_incelemeleri VALUES($1,$2,now())',[id(300),eclub.pub]);const before=await kalan(),old=(await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri')).rows[0].n;
  const r=(await db.query('SELECT eclub_yayin_toplu_islem($1,$2,$3,NULL,NULL,false) r',[id(300),[id(510)],[eclub.pub]])).rows[0].r;assert.equal(r.sonuclar.filter(x=>x.kaydedildi).length,1);
  await db.query('SELECT eclub_yayin_toplu_islem($1,$2,$3,NULL,NULL,false)',[id(300),[id(510)],[eclub.pub]]);assert.equal(await kalan(),before);assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri')).rows[0].n,old);
 });
 await check('Durdur/devam et ve migration tekrarı tekrar tüketmez/geçmişe katmaz',async()=>{const before=await kalan();await db.query("UPDATE yayin_yonetimi SET durum='Durduruldu' WHERE yayin_id=$1",[eclub.pub]);await db.query("UPDATE yayin_yonetimi SET durum='yayinda' WHERE yayin_id=$1",[eclub.pub]);await db.query(sql);assert.equal(await kalan(),before);assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_yayin_anlik_eski_yayinlar WHERE yayin_id=$1',[eclub.pub])).rows[0].n,0);});
 await check('E-Club ve saha ortak hesap seçimi aynı motoru kullanır; İK saha yayınını açabilir',async()=>{
  const before=await kalan('firma_ortak');await publish(await candidate(['eczaci']),'firma_ortak');assert.equal(await kalan('firma_ortak'),before-2);
  await db.query("UPDATE kullanicilar SET rol='ik_md' WHERE kullanici_id=$1",[id(100)]);try{const c=await candidate(['utt']);assert.equal((await preview(c)).gereken_token,2);const n=await kalan();await publish(c);assert.equal(await kalan(),n-2);}finally{await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(100)]);}
 });
 await check('İKnın E-Club hedefi hem önizleme hem gerçek SQL yazımında reddedilir',async()=>{await db.query("UPDATE kullanicilar SET rol='ik_md' WHERE kullanici_id=$1",[id(100)]);try{const c=await candidate();await assert.rejects(preview(c),e=>e.code==='42501');await assert.rejects(publish(c),e=>e.code==='42501');}finally{await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(100)]);}});
 await check('PM/Medikal/Eğitim aileleri E-Club açabilir; UTT/yönetici açamaz',async()=>{
  for(const role of ['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz']){await db.query('UPDATE kullanicilar SET rol=$1 WHERE kullanici_id=$2',[role,id(100)]);await publish(await candidate());}
  for(const role of ['utt','kd_utt','tm','gm','firma_admin','admin']){await db.query('UPDATE kullanicilar SET rol=$1 WHERE kullanici_id=$2',[role,id(100)]);await assert.rejects(publish(await candidate()),e=>e.code==='42501');}await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(100)]);
 });
 await check('Yetersizlikte yayın/açılış kaydı/tüketim birlikte geri alınır; ortak hesaba geçiş olmaz',async()=>{await reset(1);const c=await candidate();await assert.rejects(publish(c),/yetersiz/);assert.equal(await kalan(),1);assert.equal(await snapshot(c),undefined);assert.equal((await db.query('SELECT count(*)::int n FROM yayin_yonetimi WHERE yayin_id=$1',[c.pub])).rows[0].n,0);});
 await check('Sıfır üyeli açılış ücretli açılış kaydını korur; UTTde sonradan ikinci tüketim olmaz',async()=>{await reset();const c=await candidate(['eczane_teknisyeni'],100,11);const before=await kalan();await publish(c);assert.equal((await snapshot(c)).alici_sayisi,0);assert.equal(await kalan(),before);});
 await check('Yeni plan kaydı tüketmez, gerçek aktivasyonda tek kez tüketir',async()=>{const c=await candidate();const before=await kalan();await publish(c,'kisisel','planlandi');assert.equal(await kalan(),before);await db.query("UPDATE yayin_yonetimi SET durum='yayinda' WHERE yayin_id=$1",[c.pub]);assert.equal(await kalan(),before-2);await db.query("UPDATE yayin_yonetimi SET durum='planlandi' WHERE yayin_id=$1",[c.pub]);await db.query("UPDATE yayin_yonetimi SET durum='yayinda' WHERE yayin_id=$1",[c.pub]);assert.equal(await kalan(),before-2);});
 await check('E-Club bildirimi için yalnız firma UTT kimlikleri döner, üye UUIDleri karışmaz',async()=>{const r=await db.query('SELECT * FROM cogniti_token_yayin_gonderim_alicilari($1)',[eclub.pub]);assert.ok(r.rows.some(x=>x.kullanici_id===id(300)));assert.ok(!r.rows.some(x=>[id(500),id(510),id(511)].includes(x.kullanici_id)));});
 await check('Hesap/üretici/hedef sahteciliği ve aynı adayın ikinci yayını engellenir',async()=>{const c=await candidate();await assert.rejects(publish(c,null),/hesap_secin/);await publish(c);await assert.rejects(publish({...c,pub:id(serial++)}),/zaten yayımlandı/);await assert.rejects(publish({...await candidate(),producer:400}),e=>e.code==='42501');await assert.rejects(publish({...await candidate(['utt']),targets:['eczaci']}),e=>e.code==='42501');});
 await check('İki bağımsız bağlantıda aynı hesabın eş zamanlı açılışı fazla token harcayamaz',async()=>{await reset(2);const a=await candidate(),b=await candidate();const db2=new pg.Client(connection);await db2.connect();try{await db.query('BEGIN');await publish(a);let done=false;const p=db2.query("INSERT INTO yayin_yonetimi(yayin_id,soru_seti_durum_id,firma_id,takim_id,uretici_id,hedef_roller,durum,token_hesap_turu) VALUES($1,$2,$3,$4,$5,$6,'yayinda','kisisel')",[b.pub,b.src,id(1),id(10),id(100),b.targets]).then(()=>{done=true;return null},e=>{done=true;return e});await new Promise(r=>setTimeout(r,100));assert.equal(done,false);await db.query('COMMIT');assert.match((await p).message,/yetersiz/);assert.equal(await kalan(),0);}finally{await db.query('ROLLBACK');await db2.end();}});
 await check('Gerçek plan aktivasyonu açılış/tüketim/bildirimleri tek kez oluşturur',async()=>{
  await reset();const c=await candidate();await publish(c,'kisisel','planlandi');const before=await kalan();
  assert.equal((await db.query('SELECT yayin_planlananlari_aktive($1) n',[c.pub])).rows[0].n,1);assert.equal(await kalan(),before-2);
  assert.equal((await db.query('SELECT count(*)::int n FROM bildirimler WHERE kayit_id=$1',[c.pub])).rows[0].n,1);
  assert.equal((await db.query('SELECT yayin_planlananlari_aktive($1) n',[c.pub])).rows[0].n,0);assert.equal(await kalan(),before-2);
 });
 await check('Plan aktivasyonunda yetersizlik yayını planlı bırakır; kısmi tüketim/bildirim yoktur',async()=>{
  await reset(1);const c=await candidate();await publish(c,'kisisel','planlandi');await assert.rejects(db.query('SELECT yayin_planlananlari_aktive($1)',[c.pub]),/yetersiz/);assert.equal(await kalan(),1);assert.equal(await snapshot(c),undefined);assert.equal((await db.query('SELECT durum FROM yayin_yonetimi WHERE yayin_id=$1',[c.pub])).rows[0].durum,'planlandi');
 });
 await check('Eczanem hedefi ortak anlık tüketim dışında kalır',async()=>{
  const before=await kalan();const c=await candidate(['eczanem']);await publish(c,null);assert.equal(await kalan(),before);assert.equal(await snapshot(c),undefined);
 });
 await check('UTT hesaplı eski RPC ve hesap önizlemesi kapalı; dahili tüketim doğrudan çağrılamaz',async()=>{await assert.rejects(db.query("SELECT cogniti_gonderim_token_onizle($1,'eclub_oneri','firma_ortak',$2,$3,NULL)",[id(300),[eclub.pub],[id(510)]]),e=>e.code==='42501');await db.query('SET ROLE service_role');try{await assert.rejects(db.query('SELECT cogniti_yayin_token_alicilari($1,$2)',[id(100),eclub.src]),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}});
 if(process.env.PLAN_TOKEN_TEST==='1'){const {testPlanToken}=await import('./planliYayinToken.postgres.mjs');await testPlanToken({db,id,version,connection});}
 writeFileSync('docs/COGNITI_ORTAK_YAYIN_ANLIK_TUKETIM_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket, sahte temel tablolar; gerçek ortak SQL ve E-Club kota/gönderim SQLleri. Supabase/gerçek kullanıcı/push testi değildir.'},null,2)+'\n');
}
