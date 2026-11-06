import {PGlite} from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const db=new PGlite();let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};const u=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
try{
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
CREATE TABLE agora_is_partnerleri(partner_id uuid PRIMARY KEY,giris_surum integer,ilk_giris_durumu text,uyelik_durumu text);
CREATE TABLE agora_partner_oturumlari(partner_id uuid,token_ozeti text,bitis_at timestamptz,giris_surum integer);
CREATE TABLE agora_partner_egitimleri(egitim_id uuid PRIMARY KEY,partner_id uuid,silindi_at timestamptz,durum text);
CREATE TABLE agora_partner_podcastleri(yukleme_id uuid PRIMARY KEY,egitim_id uuid,durum text);
CREATE FUNCTION agora_partner_medya_egitimi(text,uuid,text,uuid) RETURNS jsonb LANGUAGE sql AS $$ SELECT to_jsonb(e) FROM public.agora_partner_egitimleri e JOIN public.agora_partner_oturumlari s USING(partner_id) JOIN public.agora_is_partnerleri p USING(partner_id) WHERE e.egitim_id=$2 AND e.durum='taslak' AND e.silindi_at IS NULL AND s.token_ozeti=$1 AND s.bitis_at>now() AND s.giris_surum=p.giris_surum AND p.uyelik_durumu='onaylandi' $$;`);
const sql=await readFile(new URL('../scripts/sql/agora_partner_podcast_sure.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);passed++;
await db.query("INSERT INTO agora_is_partnerleri VALUES($1,1,'onaylandi','onaylandi'),($2,1,'onaylandi','onaylandi')",[u(1),u(2)]);
await db.query("INSERT INTO agora_partner_oturumlari VALUES($1,'bir',now()+interval '1 hour',1),($2,'iki',now()+interval '1 hour',1)",[u(1),u(2)]);
await db.query("INSERT INTO agora_partner_egitimleri VALUES($1,$2,NULL,'taslak'),($3,$4,NULL,'yayinda')",[u(11),u(1),u(12),u(2)]);
await db.query("INSERT INTO agora_partner_podcastleri(yukleme_id,egitim_id,durum) VALUES($1,$2,'yukleniyor'),($3,$4,'hazir')",[u(21),u(11),u(22),u(12)]);
const finish=async(token,e,media,n)=>(await db.query('SELECT agora_partner_podcast_tamamla($1,$2,$3,$4) d',[token,e,media,n])).rows[0].d;
const backfill=async(token,e,media,n)=>(await db.query('SELECT agora_partner_podcast_sure_kaydet($1,$2,$3,$4) d',[token,e,media,n])).rows[0].d;
for(const n of [null,0,-1]){await assert.rejects(finish('bir',u(11),u(21),n));passed++;}
eq(await finish('iki',u(11),u(21),15),false);
eq(await finish('bir',u(11),u(22),15),false);
eq(await finish('bir',u(11),u(21),15),true);
eq((await db.query('SELECT sure_saniye,durum FROM agora_partner_podcastleri WHERE yukleme_id=$1',[u(21)])).rows[0],{sure_saniye:15,durum:'hazir'});
eq(await finish('bir',u(11),u(21),15),true);
eq(await finish('bir',u(11),u(21),90),false);
eq(await backfill('bir',u(12),u(22),120),false);
eq(await backfill('iki',u(12),u(22),120),true);
eq(await backfill('iki',u(12),u(22),120),true);
eq(await backfill('iki',u(12),u(22),121),false);
await db.exec("UPDATE agora_partner_oturumlari SET bitis_at=now()-interval '1 second'");eq(await backfill('iki',u(12),u(22),120),false);
await db.exec('SET ROLE authenticated');await assert.rejects(finish('bir',u(11),u(21),15));passed++;await assert.rejects(backfill('iki',u(12),u(22),120));passed++;
console.log(JSON.stringify({passed,scope:'Yerel PGlite, gerçek yeni süre SQL; sahte partner tabloları ve mevcut eğitim yetki helper bağımlılığı. Canlı DB değil.'}));
}finally{await db.close();}
