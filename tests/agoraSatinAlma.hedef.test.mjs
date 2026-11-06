
import {PGlite} from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();let passed=0;
const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const uid=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const e1=uid(21),e2=uid(22),partner1=uid(11),partner2=uid(12),p1=uid(1),p2=uid(2),pm=uid(3),tm=uid(4),bm=uid(5),gm=uid(6);
try{
 await db.exec(`
 CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,firma_id uuid,rol text,aktif_mi boolean);
 CREATE TABLE agora_is_partnerleri(partner_id uuid PRIMARY KEY,ilk_giris_durumu text,uyelik_durumu text);
 CREATE TABLE agora_partner_profilleri(partner_id uuid PRIMARY KEY,sirket_adi text);
 CREATE TABLE agora_partner_egitimleri(egitim_id uuid PRIMARY KEY,partner_id uuid,partner_egitim_id text,egitim_adi text,kategori text,yayin_araci text,fiyat_tl numeric,bilgiler jsonb,yayinlandi_at timestamptz,durum text,silindi_at timestamptz,koruma_surumu integer,koruma_kaynak_id uuid,yayin_egitim_video_id uuid,yayin_podcast_id uuid);
 CREATE TABLE agora_partner_videolari(yukleme_id uuid PRIMARY KEY,egitim_id uuid,rol text,durum text,video_guid uuid);
 CREATE TABLE agora_partner_podcastleri(yukleme_id uuid PRIMARY KEY,egitim_id uuid,durum text,dosya_yolu text,mime_type text);
 CREATE FUNCTION agora_partner_kart_video_guid(uuid) RETURNS uuid LANGUAGE sql AS $$ SELECT video_guid FROM public.agora_partner_videolari WHERE egitim_id=$1 $$;
 `);
 const original=await readFile(new URL('../scripts/sql/agora_partner_koruma_paketi.sql',import.meta.url),'utf8');
 await db.exec(original.slice(original.indexOf('CREATE OR REPLACE VIEW public.agora_yayindaki_egitimler'),original.indexOf('COMMIT;',original.indexOf('CREATE OR REPLACE VIEW public.agora_yayindaki_egitimler'))));
 const sql=await readFile(new URL('../scripts/sql/agora_vitrin_kurulum.sql',import.meta.url),'utf8');
 await db.exec(sql);await db.exec(sql);
 await db.query('INSERT INTO firmalar VALUES($1,true),($2,true)',[p1,p2]);
 await db.query("INSERT INTO kullanicilar VALUES($1,$2,'pm',true),($3,$2,'tm',true),($4,$2,'bm',true),($5,$6,'gm',true)",[pm,p1,tm,bm,gm,p2]);
 await db.query("INSERT INTO agora_is_partnerleri VALUES($1,'onaylandi','onaylandi'),($2,'onaylandi','onaylandi')",[partner1,partner2]);
 await db.query("INSERT INTO agora_partner_profilleri VALUES($1,'Birinci'),($2,'İkinci')",[partner1,partner2]);
 async function add(id,partner,code){
  const media=uid(Number(id.slice(-2))+100);
  await db.query("INSERT INTO agora_partner_videolari VALUES($1,$2,'egitim','hazir',$3)",[media,id,uid(99)]);
  await db.query(`INSERT INTO agora_partner_egitimleri VALUES($1,$2,$3,'SPIN','egitim','video',4950,'{"hedef_roller":["utt"],"aciklama":"Özet"}',now(),'yayinda',NULL,1,$4,$4,NULL)`,[id,partner,code,media]);
 }
 await add(e1,partner1,'PE-10001');await add(e2,partner1,'PE-10002');

 await db.exec(`
 ALTER TABLE kullanicilar ADD COLUMN takim_id uuid;
 ALTER TABLE agora_partner_egitimleri ADD COLUMN surum integer DEFAULT 1;
 ALTER TABLE agora_partner_videolari ADD COLUMN dosya_boyutu bigint DEFAULT 100, ADD COLUMN sure_saniye integer DEFAULT 15;
 ALTER TABLE agora_partner_podcastleri ADD COLUMN sure_saniye integer DEFAULT 120, ADD COLUMN dosya_boyutu bigint DEFAULT 100,ADD COLUMN checksum_sha256 text DEFAULT repeat('a',64);
 CREATE TABLE talepler(talep_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),uretici_id uuid,firma_id uuid,takim_id uuid,egitim_turu text,hedef_roller text[],icerik_turu text,ogrenme_araci_turu text,ogrenme_araci_tercihleri jsonb,urun_id uuid,teknik_id uuid,urun_adi text,aciklama text,hazir_video boolean,hazir_video_url text,hazir_soru_seti boolean,hazir_soru_seti_verisi jsonb,soru_seti_buyuklugu integer,secenek_sayisi integer,video_basi_soru_sayisi integer);
 CREATE TABLE uretim_islem_kayitlari(islem_anahtari uuid PRIMARY KEY,islem_turu text,gorev_id uuid,talep_id uuid,sonuc jsonb);
 CREATE TABLE ogrenme_araclari(arac_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),talep_id uuid,arac_turu text,kaynak text,dosya_yolu text,mime_type text,dosya_boyutu bigint,checksum_sha256 text,sure_saniye integer,kapak_yolu text,metadata jsonb DEFAULT '{}',metadata_dogrulandi boolean,created_at timestamptz DEFAULT now());
 CREATE UNIQUE INDEX ux_ogrenme_araclari_dosya_yolu ON ogrenme_araclari(dosya_yolu) WHERE dosya_yolu IS NOT NULL;
 CREATE TABLE ogrenme_araci_durumu(arac_durum_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),arac_id uuid,durum text,degistiren_id uuid,notlar text,created_at timestamptz DEFAULT now());
 CREATE TABLE soru_setleri(soru_seti_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),talep_id uuid,arac_durum_id uuid,kaynak text,iu_id uuid,sorular jsonb,created_at timestamptz DEFAULT now());
 CREATE TABLE soru_seti_durumu(soru_seti_durum_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),soru_seti_id uuid,durum text,degistiren_id uuid,notlar text);
 `);
 const file=async name=>readFile(new URL('../scripts/sql/'+name,import.meta.url),'utf8');
 let chain=await file('ogrenme_araclari_tamamlama_faz4_uretim_hatti.sql');
 await db.exec(chain.slice(chain.indexOf('CREATE OR REPLACE FUNCTION public.uretim_talep_ilk_gorevini_ac'),chain.indexOf('COMMIT;')));
 const valid=await file('uretim_atomik_rpc.sql');await db.exec(valid.slice(valid.indexOf('CREATE OR REPLACE FUNCTION'),valid.indexOf('CREATE OR REPLACE FUNCTION public.uretim_senaryo_teslim_et')));
 await db.exec(await file('talep_olusturma_idempotent.sql'));
 await db.exec(await file('cogniti_token_veri_modeli.sql'));
 await db.exec(`ALTER TABLE cogniti_token_tuketimleri ADD COLUMN miktar bigint NOT NULL DEFAULT 1;
 ALTER TABLE cogniti_token_tuketimleri DROP CONSTRAINT cogniti_token_tuketimleri_asim_miktari_check;
 ALTER TABLE cogniti_token_tuketimleri ADD CHECK(asim_miktari BETWEEN 0 AND miktar);
 -- Dönem yenileme önkoşulu bu testte etkisizdir; token/sipariş SQL'i gerçektir.
 CREATE FUNCTION cogniti_token_aylik_donemi_yukle(uuid) RETURNS void LANGUAGE sql AS $$ SELECT $$;
 CREATE FUNCTION cogniti_token_kko_aylik_yukle(uuid) RETURNS void LANGUAGE sql AS $$ SELECT $$;
 `);
 await db.exec(`CREATE TABLE agora_partner_podcast_ekleri(yukleme_id uuid PRIMARY KEY,kapak_yolu text,transkript jsonb);`);
 const ekSql=await file('agora_partner_podcast_ekleri.sql');
 await db.exec(ekSql.slice(ekSql.indexOf('CREATE OR REPLACE FUNCTION public.agora_partner_podcast_ek_paket'),ekSql.indexOf('CREATE OR REPLACE FUNCTION public.agora_partner_podcast_ek_yayin_kapisi')));
 const purchase=await file('agora_kurulum_tamamlama.sql');await db.exec(purchase);await db.exec(purchase);passed++;
 await db.query("INSERT INTO cogniti_token_hesaplari(firma_id,paket_turu) VALUES($1,'kullandigin_kadar_ode'),($2,'aylik')",[p1,p2]);
 await db.query("INSERT INTO cogniti_token_yuklemeleri(firma_id,yukleme_turu,miktar,kalan,islem_anahtari) VALUES($1,'kko',100,100,'ilk')",[p1]);
 const arzu=uid(7);await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi) VALUES($1,$2,'pm',true)",[arzu,p1]);
 const questions=Array.from({length:10},(_,i)=>({soru_metni:'Soru '+i,secenekler:['Bir','İki'],dogru:0}));
 const info={kategori:'satis_teknikleri',aciklama:'Özet',hedef_roller:['utt'],soru_seti_buyuklugu:10,secenek_sayisi:2,yayin_basi_soru:2,soru_taslaklari:questions};
 await db.query('UPDATE agora_partner_egitimleri SET bilgiler=$1',[info]);
 const buy=async(user,id=e1,price=4950,surum=1)=>(await db.query('SELECT agora_satin_al($1,$2,$3,$4,9.90) d',[user,id,surum,price])).rows[0].d;
 const read=async(user)=>(await db.query('SELECT agora_vitrin_oku($1) d',[user])).rows[0].d;
 const pool=async(user)=>(await db.query('SELECT agora_havuz_oku($1) d',[user])).rows[0].d;
 const prep=async(user,order,hedef='utt',key=uid(301))=>(await db.query('SELECT agora_yayin_hazirla($1,$2,$3,$4) d',[user,order,hedef,key])).rows[0].d;
 await assert.rejects(buy(tm));passed++;await assert.rejects(buy(gm));passed++;
 await assert.rejects(buy(pm,e1,5000));passed++;
 let first=await buy(pm);eq(first.token_tutari,500);eq(first.borca_yazilan_token,400);
 eq((await db.query('SELECT aktif FROM firmalar WHERE firma_id=$1',[p1])).rows[0].aktif,true);
 eq((await buy(pm)).mevcut,true);
 eq((await db.query('SELECT count(*) n FROM cogniti_token_tuketimleri')).rows[0].n,1);
 eq((await read(pm)).yayinlar.find(y=>y.egitim_id===e1).satin_alindi,true);
 eq((await read(arzu)).yayinlar.find(y=>y.egitim_id===e1).satin_alindi,false);
 eq((await pool(arzu)).length,0);
 await assert.rejects(prep(arzu,first.siparis_id));passed++;
 let second=await buy(arzu);eq(second.mevcut,false);eq(second.borca_yazilan_token,500);
 eq((await db.query('SELECT asim_borcu FROM cogniti_token_hesaplari WHERE firma_id=$1',[p1])).rows[0].asim_borcu,900);
 eq((await read(pm)).yayinlar.find(y=>y.egitim_id===e1).siparis_sayisi,2);
 eq((await pool(arzu)).length,1);
 let t=await prep(pm,first.siparis_id);eq(t.mevcut,false);
 eq((await prep(pm,first.siparis_id)).talep_id,t.talep_id);
 await assert.rejects(prep(pm,first.siparis_id,'bm'));passed++;
 let a=await prep(arzu,second.siparis_id,'bm',uid(302));eq(a.mevcut,false);
 eq((await db.query('SELECT count(*) n FROM ogrenme_araclari')).rows[0].n,2);
 eq((await db.query('SELECT uretici_id FROM talepler WHERE talep_id=$1',[a.talep_id])).rows[0].uretici_id,arzu);
 eq((await db.query('SELECT sorular FROM soru_setleri WHERE talep_id=$1',[t.talep_id])).rows[0].sorular[0].secenekler[0].dogru,true);
 eq((await db.query("SELECT count(*) n FROM soru_seti_durumu WHERE durum='onaylandi'")).rows[0].n,2);
 await prep(pm,first.siparis_id,'bm',uid(303));eq((await db.query('SELECT count(*) n FROM talepler')).rows[0].n,3);
 // Kaynak yayından kalkınca alıcı paketi kaybolmaz; yeni alım kapanır.
 await db.query("UPDATE agora_partner_egitimleri SET durum='pasif',bilgiler='{}' WHERE egitim_id=$1",[e1]);
 eq((await pool(pm)).length,1);await prep(pm,first.siparis_id,'utt',uid(304));passed++;
 // Geçersiz soru setinde tüm hazırlık transaction'ı geri alınır.
 await db.query("UPDATE agora_partner_egitimleri SET bilgiler=$1,fiyat_tl=4.95 WHERE egitim_id=$2",[info,e2]);
 const half=await buy(pm,e2,4.95);eq(half.token_tutari,1);
 await db.query("UPDATE agora_partner_egitimleri SET fiyat_tl=0 WHERE egitim_id=$1",[e2]);
 const free=await buy(arzu,e2,0);eq(free.token_tutari,0);
 eq((await db.query('SELECT count(*) n FROM cogniti_token_tuketimleri')).rows[0].n,3);

 // Podcast satın alma sahipliği. Süre aktarımı kullanıcı talimatıyla geri alındı.
 const ep=uid(40),media=uid(140);
 await db.query("INSERT INTO agora_partner_podcastleri(yukleme_id,egitim_id,durum,dosya_yolu,mime_type) VALUES($1,$2,'hazir','podcast/test.mp3','audio/mpeg')",[media,ep]);
 await db.query("INSERT INTO agora_partner_egitimleri(egitim_id,partner_id,partner_egitim_id,egitim_adi,kategori,yayin_araci,fiyat_tl,bilgiler,yayinlandi_at,durum,koruma_surumu,koruma_kaynak_id,yayin_podcast_id) VALUES($1,$2,'PE-10040','Sesli eğitim','egitim','podcast',99,$3,now(),'yayinda',1,$4,$4)",[ep,partner1,info,media]);
 await db.query("INSERT INTO agora_partner_podcast_ekleri VALUES($1,'agora/cover.png',$2)",[media,{durum:'onaylandi',kaynak:'manuel',onaylanan_metin:'Satın alınan onaylı transkript.'}]);
 const pod=await buy(pm,ep,99);
 const tp=await prep(pm,pod.siparis_id,'utt',uid(310));
 eq((await db.query('SELECT sure_saniye FROM ogrenme_araclari WHERE talep_id=$1',[tp.talep_id])).rows[0].sure_saniye,120);
 eq((await db.query('SELECT kapak_yolu,metadata FROM ogrenme_araclari WHERE talep_id=$1',[tp.talep_id])).rows[0].metadata.transkript.onaylanan_metin,'Satın alınan onaylı transkript.');
 eq((await db.query('SELECT kapak_yolu FROM ogrenme_araclari WHERE talep_id=$1',[tp.talep_id])).rows[0].kapak_yolu,'agora/cover.png');
 // Aylık hesapta da borç oluşur; firma kapanmaz.
 const pm2=uid(8);await db.query("INSERT INTO kullanicilar(kullanici_id,firma_id,rol,aktif_mi) VALUES($1,$2,'egt_uz',true)",[pm2,p2]);
 const monthly=await buy(pm2,ep,99);eq(monthly.borca_yazilan_token,10);
 eq((await db.query('SELECT aktif FROM firmalar WHERE firma_id=$1',[p2])).rows[0].aktif,true);
 // Soru doğrulaması hata verirse talep, araç ve işlem kaydı birlikte geri alınır.
 const before=(await db.query('SELECT count(*) n FROM talepler')).rows[0].n;
 await db.query("UPDATE agora_siparisleri SET paket=jsonb_set(paket,'{bilgiler,soru_taslaklari}','[]') WHERE siparis_id=$1",[pod.siparis_id]);
 await assert.rejects(prep(pm,pod.siparis_id,'bm',uid(311)));passed++;
 eq((await db.query('SELECT count(*) n FROM talepler')).rows[0].n,before);
 // Sipariş INSERT başarısızsa token kesintisi/borç da geri alınır.
 await db.exec(`CREATE FUNCTION siparis_test_engeli() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test geri alma'; END $$;
 CREATE TRIGGER siparis_test_engeli BEFORE INSERT ON agora_siparisleri FOR EACH ROW EXECUTE FUNCTION siparis_test_engeli();`);
 const debt=(await db.query('SELECT asim_borcu FROM cogniti_token_hesaplari WHERE firma_id=$1',[p1])).rows[0].asim_borcu;
 await assert.rejects(buy(arzu,ep,99));passed++;
 eq((await db.query('SELECT asim_borcu FROM cogniti_token_hesaplari WHERE firma_id=$1',[p1])).rows[0].asim_borcu,debt);
 await db.exec('DROP TRIGGER siparis_test_engeli ON agora_siparisleri');
 await db.exec('SET ROLE authenticated');await assert.rejects(pool(pm));passed++;await assert.rejects(buy(pm));passed++;await assert.rejects(db.query('SELECT * FROM agora_siparisleri'));passed++;await db.exec('RESET ROLE');
 console.log(JSON.stringify({passed,scope:'Yerel PGlite, sahte temel tablolar, gerçek sipariş/token SQL ve talep/hazır soru zinciri. Dönem yenileme etkisiz test bağımlılığıdır. Canlı DB veya tarayıcı testi değildir.'}));
}finally{await db.close();}
