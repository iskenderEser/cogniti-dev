import {PGlite} from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const root=new URL('..',import.meta.url).pathname.replace(/\/$/,''), db=new PGlite();let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++};
try {
 await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,rol text,aktif_mi boolean); INSERT INTO kullanicilar VALUES('10000000-0000-4000-8000-000000000001','admin',true)");
 const base=await readFile(root+'/scripts/sql/cogniti_merkezi_fiyat_tarifesi.sql','utf8');
 const migration=await readFile(root+'/scripts/sql/cogniti_sm2_kko_oranlari.sql','utf8');
 // Önce eski kurulumla gerçek migration geçişini dene.
 const oldFunction=migration.slice(migration.indexOf('CREATE OR REPLACE FUNCTION public.cogniti_fiyat_tarifesi_yonet('),migration.indexOf("NOTIFY pgrst"))
 .replace(",'sm2',public.cogniti_sm2_fiyat_matrisi((d->>'kko_token_tl')::numeric)","");
 await db.exec(base.slice(0,base.indexOf('-- Mevcut yuvarlanmış fiyat'))+oldFunction+"COMMIT;");
 await db.exec(migration);
 const read=async()=>(await db.query("SELECT cogniti_fiyat_tarifesi_yonet('10000000-0000-4000-8000-000000000001') d")).rows[0].d;
 const save=async(t)=>(await db.query("SELECT cogniti_fiyat_tarifesi_yonet('10000000-0000-4000-8000-000000000001',$1::jsonb,$2) d",[JSON.stringify(t.degerler),t.surum])).rows[0].d;
 let t=await read();eq(t.sm2.length,65);eq(t.sm2.find(h=>h.token_adedi===5000&&h.ay===3).birim_fiyat,8.28);eq(t.sm2.at(-1).birim_fiyat,6.66);
 const original=t.sm2;
 for(const h of original){const expected=Math.round((9.9-4*(.4*(h.token_adedi-1500)/8500+.6*(h.ay-1)/5))*100)/100;eq(h.birim_fiyat,expected);}
 t.degerler.kko_token_tl=19.8;t.degerler.paket_10k_token_tl=2;t=await save(t);
 for(let i=0;i<65;i++){eq(t.sm2[i].katsayi,original[i].katsayi);eq(t.sm2[i].birim_fiyat,Math.round(original[i].birim_fiyat*200)/100);}
 const updated=t.sm2;await db.exec(migration);eq((await read()).sm2,updated);
 await db.exec(base);eq((await read()).sm2,updated);
 t=await read();t.degerler.paket_10k_token_tl=15;t=await save(t);eq(t.sm2,updated);
 for(const role of ['anon','authenticated','service_role']){
  await db.exec('SET ROLE '+role);
  await assert.rejects(db.exec('SELECT * FROM cogniti_sm2_fiyat_oranlari'));passed++;
  await assert.rejects(db.exec('SELECT cogniti_sm2_fiyat_matrisi(9.9)'));passed++;
  if(role==='service_role')eq((await read()).sm2,updated);
  else {await assert.rejects(read());passed++;}
  await db.exec('RESET ROLE');
 }
 console.log(JSON.stringify({passed,scope:'SM2 migration, tüm 65 hücre, KKÖ değişimi, Paket 3 bağımsızlığı, tekrar kurulum ve yetkiler; yerel PGlite.'}));
}finally{await db.close()}
