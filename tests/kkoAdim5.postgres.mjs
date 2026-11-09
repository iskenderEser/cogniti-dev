// Yerel Unix socket; sahte temel tablolar; canlı Supabase'e bağlanmaz.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
const bin=process.env.ESNEK_PG_BIN||process.argv[2];if(!bin)throw Error('ESNEK_PG_BIN gerekli');
const root=mkdtempSync('/tmp/cogniti-kko-adim5-'),data=join(root,'data'),socket=join(root,'socket');mkdirSync(socket);
const config={host:socket,port:55469,user:'kko_test',database:'postgres',statement_timeout:8000};
let started=false;const clients=[],tests=[];let db;
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const connect=async()=>{const c=new pg.Client(config);await c.connect();clients.push(c);return c;};
const check=async(n,f)=>{await f();tests.push(n);console.log(`OK ${tests.length}: ${n}`);};
const select=async(u=100,tur='kisisel',key=randomUUID(),c=db,price=9.9)=>(await c.query('SELECT cogniti_kko_secimini_kaydet($1,$2,$3,$4) r',[id(u),tur,price,key])).rows[0].r;
const summary=async(u=100)=>(await db.query('SELECT cogniti_satin_alma_bakiye_ozeti($1) r',[id(u)])).rows[0].r;
const buy=async(u=100,key=randomUUID())=>(await db.query('SELECT cogniti_esnek_paket_siparis_olustur($1,3000,7,8.2,$2) r',[id(u),key])).rows[0].r;
try{
 execFileSync(join(bin,'initdb'),['-D',data,'-U','kko_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',data,'-l',join(root,'log'),'-o',`-k ${socket} -h '' -p 55469`,'-w','start'],{stdio:'pipe'});started=true;
 db=await connect();assert.equal((await db.query('SELECT inet_server_addr() a')).rows[0].a,null);
 await db.query(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean,firma_admin_aktif boolean,firma_adi text);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid REFERENCES firmalar,rol text,aktif_mi boolean,ad text,soyad text);
 CREATE TABLE cogniti_fiyat_tarifesi(tekil boolean PRIMARY KEY,surum integer,degerler jsonb);
 CREATE TABLE cogniti_sm2_fiyat_oranlari(token_adedi integer,ay integer,katsayi numeric,PRIMARY KEY(token_adedi,ay));
 INSERT INTO cogniti_fiyat_tarifesi VALUES(true,7,'{"kko_token_tl":9.90}');INSERT INTO cogniti_sm2_fiyat_oranlari VALUES(3000,0,8.2/9.9);`);
 await db.query('INSERT INTO firmalar VALUES($1,true,true,$2),($3,true,true,$4)',[id(1),'Test Firma',id(2),'Diğer Firma']);
 const producers=['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per'];
 const managers=['gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','firma_admin'];
 const blocked=['tm','admin','iu','utt','kd_utt','bm','eczaci','partner'];
 for(const [i,rol] of [...producers,...managers,...blocked].entries())await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,true,$4,$5)',[id(100+i),id(1),rol,'Test',rol]);
 await db.query(readFileSync('scripts/sql/cogniti_esnek_paket_siparis_adim1.sql','utf8'));
 await db.query(`CREATE TABLE eczanem_yayin_token_hesaplari(yayin_id uuid,firma_id uuid,pm_id uuid,bakiye_id uuid);
 CREATE TABLE eczanem_token_bloklari(blok_id uuid,yukleme_id uuid,durum text,bitis_at timestamptz,bakiye_id uuid,firma_id uuid,yayin_id uuid,tuketildi_at timestamptz);
 CREATE TABLE cogniti_yayin_plan_tokenlari(yayin_id uuid,durum text);
 CREATE TABLE cogniti_yayin_plan_token_dagilimi(yayin_id uuid,yukleme_id uuid,miktar integer);
 CREATE TABLE yayin_yonetimi(yayin_id uuid PRIMARY KEY,uretici_id uuid,token_hesap_turu text,hedef_roller text[]);
 CREATE TABLE cogniti_esnek_gonderim_tuketimleri(tuketim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),firma_id uuid,bakiye_id uuid,yukleme_id uuid,gonderen_id uuid,akis text,kaynak_id uuid,alici_id uuid,islem_kimligi text UNIQUE,miktar integer DEFAULT 1,created_at timestamptz DEFAULT now(),alici_turu text);
 CREATE VIEW v_yayin_detay AS SELECT NULL::uuid yayin_id,NULL::uuid firma_id,NULL::text firma_adi,NULL::int talep_no,NULL::text urun_adi,NULL::text arac_turu WHERE false;
 CREATE FUNCTION cogniti_yukleme_ayrilan(uuid) RETURNS bigint LANGUAGE sql SET search_path=public AS $$SELECT coalesce((SELECT count(*) FROM eczanem_token_bloklari WHERE yukleme_id=$1 AND durum='blokeli' AND bitis_at>statement_timestamp()),0)+coalesce((SELECT sum(d.miktar) FROM cogniti_yayin_plan_token_dagilimi d JOIN cogniti_yayin_plan_tokenlari h USING(yayin_id) WHERE d.yukleme_id=$1 AND h.durum='ayrildi'),0)$$;`);
 const sql=readFileSync('scripts/sql/cogniti_rol_kko_adim5.sql','utf8');
 await check('KKÖ SQL iki kez kurulabilir',async()=>{await db.query(sql);await db.query(sql);});
 await check('13 üretici kişisel ve 8 yönetici firma hesabı seçebilir; yanlış hesap reddedilir',async()=>{
  for(const [i,rol] of [...producers,...managers].entries()){
   await db.query('BEGIN');try{const tur=i<13?'kisisel':'firma_ortak';await assert.rejects(select(100+i,tur==='kisisel'?'firma_ortak':'kisisel'),e=>e.code==='42501');await db.query('ROLLBACK');await db.query('BEGIN');const x=await select(100+i,tur);assert.ok(x.bakiye_id,rol);const s=(await summary(100+i))[tur];assert.equal(s.paket,'kko');assert.equal(s.toplam,1500);assert.equal(s.kalan,1500);}finally{await db.query('ROLLBACK');}
  }
 });
 await check('TM, Cogniti Admini ve diğer kapalı roller reddedilir',async()=>{for(let i=0;i<blocked.length;i++)await assert.rejects(select(121+i,'firma_ortak'),e=>e.code==='42501');});
 let wallet;
 await check('Tek onayın tekrarı ikinci yükleme oluşturmaz; yeni anahtarla mükerrer onay reddedilir',async()=>{const key=randomUUID();const x=await select(100,'kisisel',key);wallet=x.bakiye_id;assert.equal((await select(100,'kisisel',key)).yeniden_deneme,true);await assert.rejects(select(),e=>e.code==='P0003');assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_esnek_paket_yuklemeleri WHERE bakiye_id=$1',[wallet])).rows[0].n,1);});
 await check('Kişisel hesap diğer kişiye gösterilmez; firma KKÖ tüm firma rollerinde görünür',async()=>{assert.equal((await summary(101)).kisisel,null);await select(113,'firma_ortak');assert.equal((await summary(124)).firma_ortak.paket,'kko');});
 let serial=800;
 const consume=async()=>{const pub=id(serial++),recipient=id(serial++);await db.query("INSERT INTO yayin_yonetimi VALUES($1,$2,'kisisel',ARRAY['eczaci'])",[pub,id(100)]);await db.query("SELECT cogniti_esnek_gonderim_tuket($1,'kisisel','yayin_acilis',$2,$3,$4)",[id(100),pub,recipient,'test:'+pub]);};
 await check('Gerçek ortak tüketim KKÖ hakkını azaltır; limit bittiğinde yeni tüketim reddedilir',async()=>{await consume();assert.equal((await summary()).kisisel.kullanilan,1);await db.query('UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=0 WHERE bakiye_id=$1',[wallet]);await assert.rejects(consume(),/yetersiz/);await db.query('UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=1499 WHERE bakiye_id=$1',[wallet]);});
 await check('KKÖ’den Esnek’e geçiş önceki tüketimi korur ve yeni paketi eksiksiz yükler',async()=>{await buy();assert.equal((await summary()).kisisel.paket,'esnek');assert.equal((await summary()).kisisel.kalan,3000);const old=(await db.query('SELECT miktar,kalan FROM cogniti_esnek_paket_yuklemeleri WHERE bakiye_id=$1 AND kko_donem IS NOT NULL',[wallet])).rows[0];assert.deepEqual(old,{miktar:1500,kalan:1499});await assert.rejects(select(),/paket_veya_bloke_var/);await consume();assert.equal((await summary()).kisisel.kalan,2999);assert.equal((await db.query('SELECT kalan FROM cogniti_esnek_paket_yuklemeleri WHERE bakiye_id=$1 AND kko_donem IS NOT NULL',[wallet])).rows[0].kalan,1499);});
 await check('Kalan paket bittiğinde dahi bloke varsa KKÖ reddedilir; bloke bitince aynı ay ek hak yüklenmez',async()=>{await db.query('UPDATE cogniti_esnek_paket_yuklemeleri SET kalan=0 WHERE bakiye_id=$1 AND kko_donem IS NULL',[wallet]);await db.query("INSERT INTO eczanem_token_bloklari(blok_id,yukleme_id,durum,bitis_at) SELECT $2,yukleme_id,'blokeli',now()+interval '1 day' FROM cogniti_esnek_paket_yuklemeleri WHERE bakiye_id=$1 AND kko_donem IS NOT NULL",[wallet,id(950)]);await assert.rejects(select(),/paket_veya_bloke_var/);await db.query('DELETE FROM eczanem_token_bloklari');await select();assert.equal((await summary()).kisisel.kalan,1499);});
 await check('Başarısız paket yüklemesi KKÖ kapanışını da geri alır',async()=>{await db.query("CREATE FUNCTION test_fail() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'test-fail';END$$;CREATE TRIGGER test_fail BEFORE INSERT ON cogniti_esnek_paket_yuklemeleri FOR EACH ROW EXECUTE FUNCTION test_fail()");try{await assert.rejects(buy(),/test-fail/);}finally{await db.query('DROP TRIGGER test_fail ON cogniti_esnek_paket_yuklemeleri;DROP FUNCTION test_fail()');}assert.equal((await summary()).kisisel.paket,'kko');});
 await check('Ay yenilemesi eski tüketimi korur; yeni ay 1500 ile başlar ve yeniden yenilemez',async()=>{await db.query("UPDATE cogniti_esnek_paket_yuklemeleri SET created_at=created_at-interval '1 month',kko_donem=(kko_donem-interval '1 month')::date,son_kullanim_at=statement_timestamp()-interval '1 second' WHERE bakiye_id=$1 AND kko_donem IS NOT NULL",[wallet]);assert.equal((await summary()).kisisel.kalan,1500);assert.equal((await summary()).kisisel.kalan,1500);assert.equal((await db.query('SELECT count(*)::int n FROM cogniti_esnek_paket_yuklemeleri WHERE bakiye_id=$1 AND kko_donem IS NOT NULL',[wallet])).rows[0].n,2);});
 await check('İki bağlantının aynı onayı tek kez uygulanır',async()=>{const a=await connect(),b=await connect(),key=randomUUID();const r=await Promise.all([select(101,'kisisel',key,a),select(101,'kisisel',key,b)]);assert.equal(r[0].bakiye_id,r[1].bakiye_id);assert.notEqual(r[0].yeniden_deneme,r[1].yeniden_deneme);});
 await check('Pasif kullanıcı, pasif firma, eski fiyat ve anahtar içeriği uyuşmazlığı reddedilir',async()=>{await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(102)]);await assert.rejects(select(102),e=>e.code==='42501');await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[id(102)]);await db.query('UPDATE firmalar SET aktif=false WHERE firma_id=$1',[id(1)]);await assert.rejects(select(102),e=>e.code==='42501');await db.query('UPDATE firmalar SET aktif=true WHERE firma_id=$1',[id(1)]);await assert.rejects(select(102,'kisisel',randomUUID(),db,9.8),/fiyat_degisti/);const key=randomUUID();await select(102,'kisisel',key);await assert.rejects(select(102,'kisisel',key,db,9.8),/anahtar_uyusmaz/);});
 await check('Doğrudan tablo ve iç işlev erişimleri kapalı; yalnız sunucu seçim/özet uçları açık',async()=>{for(const role of ['anon','authenticated','service_role']){await db.query(`SET ROLE ${role}`);try{await assert.rejects(db.query('SELECT * FROM cogniti_kko_hesap_secimleri'),e=>e.code==='42501');await assert.rejects(db.query('SELECT cogniti_kko_hesap_yenile($1)',[wallet]),e=>e.code==='42501');if(role!=='service_role')await assert.rejects(select(103),e=>e.code==='42501');else assert.equal((await summary()).kisisel.paket,'kko');}finally{await db.query('RESET ROLE');}}});
 await check('Firma yönetimi KKÖ tercihini ve gerçek tüketim kaydını okur; üretici admin raporuna erişemez',async()=>{const r=(await db.query('SELECT cogniti_firma_esnek_token_kullanimi($1,$2,NULL,0) r',[id(122),id(1)])).rows[0].r;assert.ok(r.hesaplar.some(h=>h.bakiye_id===wallet&&h.paket_turu==='kko'));assert.ok(r.satirlar.some(s=>s.gonderen_id===id(100)));await assert.rejects(db.query('SELECT cogniti_firma_esnek_token_kullanimi($1,$2,NULL,0)',[id(100),id(1)]),e=>e.code==='42501');});
 writeFileSync('docs/COGNITI_KKO_ADIM5_TEST_SONUCLARI.json',JSON.stringify({postgres:(await db.query('SHOW server_version')).rows[0].server_version,passed:tests.length,tests,scope:'Yerel Unix socket; sahte temel tablolar; gerçek KKÖ SQL, sipariş ve ortak tüketim fonksiyonu. Gerçek ay sınırı/cron, tam Eczanem zinciri, Viva ve tarayıcı/canlı kullanıcı doğrulanmadı.'},null,2)+'\n');
}finally{for(const c of clients)await c.end().catch(()=>{});if(started)execFileSync(join(bin,'pg_ctl'),['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});rmSync(root,{recursive:true,force:true});}
