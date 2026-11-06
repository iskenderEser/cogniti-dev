
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

 await db.exec(`CREATE TABLE agora_partner_podcast_ekleri(yukleme_id uuid PRIMARY KEY,kapak_yolu text,transkript jsonb);`);
 const migration=await readFile(new URL('../scripts/sql/agora_podcast_bilgilendirme.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);passed++;
 const ep=uid(40),media=uid(140);
 await db.query("INSERT INTO agora_partner_podcastleri VALUES($1,$2,'hazir','agora/test.mp3','audio/mpeg')",[media,ep]);
 await db.query("INSERT INTO agora_partner_egitimleri(egitim_id,partner_id,partner_egitim_id,egitim_adi,kategori,yayin_araci,fiyat_tl,bilgiler,yayinlandi_at,durum,koruma_surumu,koruma_kaynak_id,yayin_podcast_id) VALUES($1,$2,'PE-10040','Podcast','egitim','podcast',99,'{}',now(),'yayinda',1,$3,$3)",[ep,partner1,media]);
 const info=async(user=pm)=>(await db.query('SELECT agora_vitrin_podcast_bilgileri($1) d',[user])).rows[0].d;
 const preview=async()=>(await db.query('SELECT agora_vitrin_medya($1,$2) d',[pm,ep])).rows[0].d;
 eq((await info())[0].transkript_var,false);eq((await info())[0].kapak_var,false);
 await db.query('INSERT INTO agora_partner_podcast_ekleri VALUES($1,$2,$3)',[media,'agora/cover.png',{durum:'manuel_taslak',taslak_metin:'Gizli taslak metni'}]);
 eq((await info())[0].kapak_var,true);eq((await preview()).transkript_metni,null);eq(JSON.stringify(await info()).includes('Gizli taslak'),false);
 await db.query('UPDATE agora_partner_podcast_ekleri SET transkript=$1',[{durum:'onaylandi',onaylanan_metin:'Onaylı podcast transkripti.'}]);
 eq((await info())[0].transkript_var,true);eq((await preview()).transkript_metni,'Onaylı podcast transkripti.');
 eq((await info(tm))[0].transkript_var,true);eq((await info(gm))[0].transkript_var,true);
 await assert.rejects(info(bm));passed++;
 await db.query("UPDATE agora_partner_egitimleri SET durum='pasif' WHERE egitim_id=$1",[ep]);eq((await info()).length,0);eq(await preview(),null);
 await db.exec('SET ROLE authenticated');await assert.rejects(info());passed++;
 console.log(JSON.stringify({passed,scope:'Yerel PGlite; gerçek katalog ve bilgilendirme SQLleri. Hazır/taslak metin ayrımı, yok/var kapak, TM/yönetici bilgisi, pasif yayın izolasyonu.'}));
}finally{await db.close();}
