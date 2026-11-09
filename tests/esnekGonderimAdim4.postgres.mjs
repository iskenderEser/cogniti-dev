// Var olan Adım 3 izole PostgreSQL kümesinde gerçek SQL/tetikleyici entegrasyonu.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
export async function testGonderim({db,id,version,connection}){
 const tests=[];const check=async(n,f)=>{await f();tests.push(n);console.log(`GONDERIM ${tests.length}: ${n}`);};
 const sql=n=>readFileSync(`scripts/sql/${n}.sql`,'utf8');
 await db.query(`ALTER TABLE yayin_yonetimi ADD COLUMN uretici_id uuid;
 CREATE OR REPLACE VIEW v_yayin_detay AS SELECT * FROM yayin_yonetimi;
 CREATE TABLE cogniti_token_hesaplari(firma_id uuid PRIMARY KEY);
 CREATE TABLE cogniti_token_tuketimleri(islem_turu text,kaynak_id uuid,alici_turu text,alici_kimligi text);
 CREATE FUNCTION cogniti_token_tuket(uuid,text,uuid,text,text,text,uuid,text) RETURNS void LANGUAGE sql AS $$INSERT INTO cogniti_token_tuketimleri VALUES($6,$7,$4,$5)$$;
 CREATE TABLE eczanem_token_bloklari(yukleme_id uuid,durum text,bitis_at timestamptz);
 INSERT INTO cogniti_token_hesaplari VALUES('${id(1)}');`);
 // Mevcut token tetikleyicileri değişmeden kurulur; yeni migration yalnız işlev gövdelerini günceller.
 for(const [file,name,table,event,trigger] of [
  ['cogniti_token_yayin_kurulum','cogniti_token_yayin_acilis_kaydet','yayin_yonetimi','INSERT OR UPDATE OF durum','trg_cogniti_token_yayin_acilis'],
  ['cogniti_token_eclub_kurulum','cogniti_token_eclub_oneri_kaydet','eclub_oneri_kayitlari','INSERT','trg_cogniti_token_eclub_oneri']]){
  const source=sql(file);await db.query(source.slice(source.indexOf(`CREATE OR REPLACE FUNCTION public.${name}()`),source.indexOf(`REVOKE ALL ON FUNCTION public.${name}()`)));
  await db.query(`CREATE TRIGGER ${trigger} AFTER ${event} ON ${table} FOR EACH ROW EXECUTE FUNCTION ${name}()`);
 }
 await check('Adım 4 SQL iki kez kurulur',async()=>{await db.query(sql('cogniti_esnek_gonderim_adim4'));await db.query(sql('cogniti_esnek_gonderim_adim4'));
 const p=await db.query("SELECT cogniti_gonderim_token_onizle($1,'yayin_acilis','kisisel',$2,'{}',NULL) r",[id(100),[id(600)]]);assert.equal(p.rows[0].r.gercek_gonderim_acik,true);});
 let serial=910;
 async function publish({user=100,tur='kisisel',targets=['utt','bm'],status='yayinda',source}={}){
  const pub=id(serial++),src=source??id(serial++);
  await db.query("INSERT INTO soru_seti_durumu VALUES($1,$2,'onaylandi') ON CONFLICT DO NOTHING",[src,id(710)]);
  await db.query('INSERT INTO yayin_yonetimi(yayin_id,soru_seti_durum_id,firma_id,takim_id,uretici_id,hedef_roller,durum,token_hesap_turu) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[pub,src,id(1),id(10),id(user),targets,status,tur]);return pub;
 }
 const remaining=async(tur='kisisel')=>Number((await db.query('SELECT sum(y.kalan) n FROM cogniti_esnek_paket_yuklemeleri y JOIN cogniti_satin_alma_bakiyeleri b USING(bakiye_id) WHERE b.bakiye_turu=$1',[tur])).rows[0].n);
 const reset=async(n=3000)=>db.query('UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=$1',[n]);
 await reset();
 await check('Gerçek yayın INSERT hedef başına tek tüketir; kişisel ve ortak ayrıdır',async()=>{const pub=await publish();assert.equal(await remaining(),2997);assert.equal(await remaining('firma_ortak'),3000);assert.equal((await db.query('SELECT * FROM cogniti_token_yayin_gonderim_alicilari($1)',[pub])).rowCount,3);assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri')).rows[0].n,0);
  await db.query("UPDATE yayin_yonetimi SET durum='Durduruldu' WHERE yayin_id=$1",[pub]);await db.query("UPDATE yayin_yonetimi SET durum='yayinda' WHERE yayin_id=$1",[pub]);assert.equal(await remaining(),2997);
  await assert.rejects(db.query("UPDATE yayin_yonetimi SET token_hesap_turu='firma_ortak' WHERE yayin_id=$1",[pub]),e=>e.code==='22023');
 });
 await check('Ortak hesaptan tüketim kişisel hesabı değiştirmez',async()=>{await publish({tur:'firma_ortak'});assert.equal(await remaining('firma_ortak'),2997);assert.equal(await remaining(),2997);});
 await check('Yetersiz hesapta bütün yayın ve önceki alıcı tüketimleri geri alınır',async()=>{await reset(2);const before=(await db.query('SELECT count(*)::int n FROM yayin_yonetimi')).rows[0].n;await assert.rejects(publish(),/ESNEK_GONDERIM:yetersiz/);assert.equal(await remaining(),2);assert.equal((await db.query('SELECT count(*)::int n FROM yayin_yonetimi')).rows[0].n,before);});
 await check('Hesapsız anlık yayın engellenir, plan kaydı tüketmez ve eski aktivasyon yolu korunur',async()=>{await assert.rejects(publish({tur:null}),/hesap_secin/);const old=await publish({tur:null,status:'planlandi'});const before=await remaining();await db.query("UPDATE yayin_yonetimi SET durum='yayinda' WHERE yayin_id=$1",[old]);assert.equal(await remaining(),before);assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_token_tuketimleri WHERE kaynak_id=$1',[old])).rows[0].n,3);});
 await check('Eczanem sonraki dağıtımı yayın açılışında tüketilmez',async()=>{const before=await remaining();await publish({tur:null,targets:['eczanem']});assert.equal(await remaining(),before);});
 await check('Aktif Eczanem blokları başka gönderimde harcanamaz',async()=>{await reset(3);const load=(await db.query("SELECT y.yukleme_id FROM cogniti_esnek_paket_yuklemeleri y JOIN cogniti_satin_alma_bakiyeleri b USING(bakiye_id) WHERE b.bakiye_turu='kisisel'")).rows[0].yukleme_id;
  await db.query("INSERT INTO eczanem_token_bloklari VALUES($1,'blokeli',now()+interval '1 day')",[load]);await assert.rejects(publish(),/yetersiz/);assert.equal(await remaining(),3);await db.query("UPDATE eczanem_token_bloklari SET bitis_at=now()-interval '1 second'");await publish();assert.equal(await remaining(),0);
 });
 await check('Süresi dolmuş yükleme tüketilmez',async()=>{await reset();await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET son_kullanim_at=clock_timestamp()-interval '1 millisecond'");await assert.rejects(publish(),/yetersiz/);await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET son_kullanim_at=clock_timestamp()+interval '1 day'");});
 await check('13 üretici rolü kişisel gönderir, kapalı roller ve başkasının kişisel hesabı reddedilir',async()=>{
  for(const role of ['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per']){await db.query('UPDATE kullanicilar SET rol=$1 WHERE kullanici_id=$2',[role,id(100)]);await publish();}
  for(const role of ['gm','firma_admin','admin','tm','utt','kd_utt','bm']){await db.query('UPDATE kullanicilar SET rol=$1 WHERE kullanici_id=$2',[role,id(100)]);await assert.rejects(publish(),e=>e.code==='42501');}
  await db.query("UPDATE kullanicilar SET rol='pm' WHERE kullanici_id=$1",[id(100)]);await assert.rejects(publish({user:400}),/yayin_firma_yok/);
  await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi) VALUES($1,$2,'pm',true)",[id(105),id(1)]);await assert.rejects(publish({user:105}),/hesap_yok/);
 });
 const send=(key=randomUUID(),wallet='firma_ortak',sources=[id(800)])=>db.query('SELECT cogniti_esnek_eclub_gonder($1,$2,$3,$4,$5) r',[id(300),wallet,[id(500)],sources,key]);
 await check('Gerçek E-Club anlık RPC aynı transaction içinde tüketir; tekrar aynı sonucu döndürür',async()=>{await reset();const key=randomUUID();const a=(await send(key)).rows[0].r;assert.equal(a.sonuclar.filter(s=>s.kaydedildi).length,1);assert.equal(await remaining('firma_ortak'),2999);const b=(await send(key)).rows[0].r;assert.equal(b.yeniden_deneme,true);assert.equal(await remaining('firma_ortak'),2999);await assert.rejects(send(key,'firma_ortak',[id(801)]),e=>e.code==='22023');});
 await check('E-Club kişisel hesap seçimi başkasının hesabına ulaşmaz',async()=>{await assert.rejects(send(randomUUID(),'kisisel',[id(801)]),/hesap_yok/);assert.equal(await remaining('firma_ortak'),2999);});
 await check('Toplu E-Club yetersizlikte hiçbir öneri veya kısmi tüketim bırakmaz',async()=>{await reset(1);const before=(await db.query('SELECT count(*)::int n FROM eclub_oneri_kayitlari')).rows[0].n;await assert.rejects(send(randomUUID(),'firma_ortak',[id(801),id(802)]),/yetersiz/);assert.equal((await db.query('SELECT count(*)::int n FROM eclub_oneri_kayitlari')).rows[0].n,before);assert.equal(await remaining('firma_ortak'),1);});
 await check('İki bağlantı aynı hesapla eş zamanlı yayın açarken tokenı aşamaz',async()=>{await reset(3);const db2=new pg.Client(connection);await db2.connect();try{
  await db.query('BEGIN');await publish();const pub=id(serial++);const source=id(serial++);await db2.query("INSERT INTO soru_seti_durumu VALUES($1,$2,'onaylandi')",[source,id(710)]);
  let done=false;const p=db2.query("INSERT INTO yayin_yonetimi(yayin_id,soru_seti_durum_id,firma_id,takim_id,uretici_id,hedef_roller,durum,token_hesap_turu) VALUES($1,$2,$3,$4,$5,$6,'yayinda','kisisel')",[pub,source,id(1),id(10),id(100),['utt','bm']]).then(()=>{done=true;return null},e=>{done=true;return e});
  await new Promise(r=>setTimeout(r,100));assert.equal(done,false);await db.query('COMMIT');assert.match((await p).message,/yetersiz/);assert.equal(await remaining(),0);
 }finally{await db.query('ROLLBACK');await db2.end();}});
 await check('Aynı adayın ikinci yayını ikinci tüketim oluşturmaz',async()=>{await reset();const source=id(1990);await publish({source});const before=await remaining();await assert.rejects(publish({source}),/zaten yayımlandı/);assert.equal(await remaining(),before);});
 await check('İki bağlantıyla aynı E-Club anahtarı tek gönderim/tüketim oluşturur',async()=>{await reset();const db2=new pg.Client(connection);await db2.connect();const key=randomUUID();try{
  await db.query('BEGIN');await send(key,'firma_ortak',[id(801)]);let done=false;
  const p=db2.query('SELECT cogniti_esnek_eclub_gonder($1,$2,$3,$4,$5) r',[id(300),'firma_ortak',[id(500)],[id(801)],key]).then(x=>{done=true;return x;});
  await new Promise(r=>setTimeout(r,100));assert.equal(done,false);await db.query('COMMIT');assert.equal((await p).rows[0].r.yeniden_deneme,true);assert.equal(await remaining('firma_ortak'),2999);
 }finally{await db.query('ROLLBACK');await db2.end();}});
 await check('Anonim/oturumlu doğrudan tüketim, yeni tablolar ve RPC kapalıdır',async()=>{for(const role of ['anon','authenticated','service_role']){await db.query(`SET ROLE ${role}`);try{await assert.rejects(db.query('SELECT * FROM cogniti_esnek_gonderim_tuketimleri'),e=>e.code==='42501');await assert.rejects(db.query('SELECT cogniti_esnek_gonderim_tuket($1,$2,$3,$4,$5,$6)',[id(100),'kisisel','yayin_acilis',id(999),id(300),'forge']),e=>e.code==='42501');if(role!=='service_role')await assert.rejects(send(),e=>e.code==='42501');}finally{await db.query('RESET ROLE');}}});
 if(process.env.ECLUB_UTT_GERIAL_TEST==='1'){const {testGeriAl}=await import('./eclubUttHesapSecimiGeriAl.postgres.mjs');await testGeriAl({db,id,version});}
 if(process.env.ORTAK_YAYIN_TEST==='1'){const {testOrtakYayin}=await import('./ortakYayinAnlikTuketim.postgres.mjs');await testOrtakYayin({db,id,version,connection});}
 writeFileSync('docs/COGNITI_ESNEK_GONDERIM_ADIM4_TEST_SONUCLARI.json',JSON.stringify({postgres:version,passed:tests.length,tests,scope:'Yerel Unix socket, sahte temel tablolar; gerçek Adım 4, yayın/E-Club tetikleyicileri ve E-Club gönderim SQLleri. Eski tüketim gözlemci stub ile sınanır; canlı sistem/tarayıcı testi değildir.'},null,2)+'\n');
}
