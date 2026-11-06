
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
 const read=async(id=pm)=>(await db.query('SELECT agora_vitrin_oku($1) d',[id])).rows[0].d;
 const react=async(id,e,t,v)=>(await db.query('SELECT agora_vitrin_etkilesim_kaydet($1,$2,$3,$4) d',[id,e,t,v])).rows[0].d;
 let d=await read();
 eq(d.stat.partner_sayisi,2);eq(d.stat.yayin_sayisi,2);eq(d.stat.siparis_sayisi,null);
 eq(d.partnerler.map(p=>p.yayin_sayisi),[2,0]);eq(d.yayinlar.length,2);
 eq(d.yayinlar[0].partner_egitim_id.startsWith('PE-'),true);
 eq(JSON.stringify(d).includes('video_guid'),true); // Yalnız kapak GUID'i; eğitim dosya yolu yok.
 eq(JSON.stringify(d).includes('dosya_yolu'),false);
 eq((await read(tm)).yayinlar.length,2);eq((await read(gm)).yayinlar.length,2);
 await assert.rejects(read(bm));passed++;
 await assert.rejects(read(uid(987)));passed++;
 eq(await react(pm,e1,'begeni',true),true);
 eq(await react(pm,e1,'begeni',true),true);
 eq(await react(pm,e1,'favori',true),true);
 eq(await react(gm,e1,'begeni',true),true);
 d=await read();
 let y=d.yayinlar.find(y=>y.egitim_id===e1);
 eq(y.begeni_sayisi,2);eq(y.favori_sayisi,1);eq(y.begeni_mi,true);eq(y.favori_mi,true);
 eq((await read(tm)).yayinlar.find(y=>y.egitim_id===e1).begeni_mi,false);
 eq(await react(pm,e1,'begeni',false),true);
 d=await read();y=d.yayinlar.find(y=>y.egitim_id===e1);eq(y.begeni_sayisi,1);eq(y.favori_mi,true);
 await assert.rejects(react(pm,e1,'hata',true));passed++;
 await db.query("UPDATE agora_partner_egitimleri SET durum='pasif' WHERE egitim_id=$1",[e1]);
 eq(await react(pm,e1,'favori',false),false);
 eq((await read()).yayinlar.length,1);
 eq((await db.query('SELECT agora_vitrin_medya($1,$2) d',[pm,e1])).rows[0].d,null);
 eq((await read()).stat.yayin_sayisi,2);
 await add(uid(23),partner2,'PE-20001');await add(uid(24),partner2,'PE-20002');
 d=await read();eq(d.partnerler[0].partner_id,partner2);eq(d.partnerler[0].yayin_sayisi,2);
 eq(d.stat.yayin_sayisi,2);
 await db.exec("UPDATE agora_vitrin_haftalik_ozet SET hafta=hafta-7");
 eq((await read()).stat.yayin_sayisi,3);
 await db.query('UPDATE firmalar SET aktif=false WHERE firma_id=$1',[p2]);
 await assert.rejects(read(gm));passed++;
 await db.exec("SET ROLE authenticated");
 await assert.rejects(db.query('SELECT agora_vitrin_oku($1)',[pm]));passed++;
 await assert.rejects(db.query('SELECT * FROM agora_vitrin_etkilesimleri'));passed++;
 await db.exec("RESET ROLE");
 console.log(JSON.stringify({passed,scope:'Yerel PGlite; gerçek vitrin SQL, rol ve aktif firma yetkisi, haftalık stat, canlı rozet/sıra, idempotent beğeni/favori ve pasif yayın izolasyonu.'}));
}finally{await db.close();}
