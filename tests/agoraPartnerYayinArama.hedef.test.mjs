import {PGlite} from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const db=new PGlite();let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
CREATE TABLE agora_partner_profilleri(partner_id uuid PRIMARY KEY);
CREATE TABLE agora_partner_egitimleri(egitim_id uuid PRIMARY KEY,partner_id uuid,partner_egitim_id text,egitim_adi text,kategori text,yayin_araci text,fiyat_tl numeric,durum text,surum integer,olusturuldu_at timestamptz,guncellendi_at timestamptz,yayinlandi_at timestamptz,silindi_at timestamptz);
CREATE FUNCTION agora_partner_admin_dogrula(uuid) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF $1<>'10000000-0000-4000-8000-000000000001' THEN RAISE EXCEPTION 'yetkisiz';END IF;END $$;
CREATE FUNCTION agora_partner_kart_video_guid(uuid) RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;`);
const sql=await readFile(new URL('../scripts/sql/agora_partner_admin_yayin_arama.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
const admin='10000000-0000-4000-8000-000000000001',partner='20000000-0000-4000-8000-000000000001';
await db.query('INSERT INTO agora_partner_profilleri VALUES($1)',[partner]);
for(let i=1;i<=26;i++)await db.query(`INSERT INTO agora_partner_egitimleri VALUES(gen_random_uuid(),$1,$2,$3,'egitim','video',5000,$4,1,now(),now(),now(),NULL)`,[partner,'PE-10'+String(i).padStart(3,'0'),i===1?'İHTİYACI Bulmak':'SPIN '+i,['yayinda','pasif','taslak'][i%3]]);
const q=async(term,durum='tumu',page=1,price=null)=>(await db.query('SELECT agora_partner_admin_yayin_ara($1,$2,$3,$4,$5,$6) d',[admin,partner,durum,page,term,price])).rows[0].d;
eq((await q('spin')).toplam,25);eq((await q('spin')).kayitlar.length,20);eq((await q('spin','tumu',2)).kayitlar.length,5);
eq((await q('ihtiyacı')).toplam,1);eq((await q('pe-10001')).toplam,1);
eq((await q('5000','tumu',1,5000)).toplam,26);
for(const durum of ['yayinda','pasif','taslak']){const d=await q('5000',durum,1,5000);eq(d.kayitlar.every(r=>r.durum===durum),true);eq(d.toplam>0,true);}
eq((await q('%')).toplam,0);eq((await q('_')).toplam,0);eq((await q('yok')).toplam,0);
await db.query("UPDATE agora_partner_egitimleri SET silindi_at=now() WHERE partner_egitim_id='PE-10001'");eq((await q('PE-10001')).toplam,0);
await db.query("UPDATE agora_partner_egitimleri SET partner_id=gen_random_uuid() WHERE partner_egitim_id='PE-10002'");eq((await q('PE-10002')).toplam,0);
console.log(JSON.stringify({passed:n,scope:'Yerel PGlite; gerçek arama SQL; ad/kod/fiyat, dört durum, 20 üstü sayfalama, literal arama, silinen/farklı partner izolasyonu.'}));
}finally{await db.close();}
