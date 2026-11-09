import {PGlite} from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();let passed=0;
const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const source=JSON.parse(await readFile(new URL('./fixtures/esnekPaket20261108.json',import.meta.url),'utf8'));
const sql=await readFile(new URL('../scripts/sql/cogniti_esnek_paket_yeni_liste.sql',import.meta.url),'utf8');
const execFile=async name=>db.exec(await readFile(new URL('../scripts/sql/'+name,import.meta.url),'utf8'));
const admin='10000000-0000-4000-8000-000000000001';
try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,rol text,aktif_mi boolean);INSERT INTO kullanicilar VALUES('${admin}','admin',true);`);
 await execFile('cogniti_merkezi_fiyat_tarifesi.sql');
 await execFile('cogniti_sm2_kko_oranlari.sql');
 await execFile('cogniti_sm2_yeni_fiyatlar.sql');
 await execFile('cogniti_sm2_hesap_makinesi.sql');
 const read=async()=>(await db.query(`SELECT cogniti_fiyat_tarifesi_yonet('${admin}') d`)).rows[0].d;
 const publicRead=async()=>(await db.query('SELECT cogniti_sm2_fiyatlari_oku() d')).rows[0].d;
 const before=await read(),oldPackages=(await publicRead()).paketler;
 await db.exec(sql);
 let after=await read();eq(after.degerler,before.degerler);eq(after.surum,before.surum+1);eq((await publicRead()).paketler,oldPackages);
 eq(after.sm2.length,148);
 for(let i=0;i<source.length;i++)eq({token_adedi:after.sm2[i].token_adedi,ay:after.sm2[i].ay,birim_fiyat:after.sm2[i].birim_fiyat},source[i]);
 eq(after.sm2[0].birim_fiyat,9);eq(after.sm2.at(-1).birim_fiyat,5.31);
 await db.exec(sql);eq(await read(),after);
 const history=(await db.query('SELECT count(*)::int n FROM cogniti_fiyat_tarifesi_gecmisi')).rows[0].n;
 await db.exec(sql);eq((await db.query('SELECT count(*)::int n FROM cogniti_fiyat_tarifesi_gecmisi')).rows[0].n,history);
 const original=after.sm2;
 const changed={...after.degerler,kko_token_tl:19.8};
 after=(await db.query(`SELECT cogniti_fiyat_tarifesi_yonet('${admin}',$1,$2) d`,[JSON.stringify(changed),after.surum])).rows[0].d;
 for(let i=0;i<148;i++)eq(after.sm2[i].birim_fiyat,Math.round(original[i].birim_fiyat*200)/100);
 await db.exec(sql);eq((await read()).sm2,after.sm2);
 await assert.rejects(db.exec('INSERT INTO cogniti_sm2_fiyat_oranlari VALUES(2600,0,9.9,9,1,now())'));passed++;
 await assert.rejects(db.exec('INSERT INTO cogniti_sm2_fiyat_oranlari VALUES(2500,5,9.9,9,1,now())'));passed++;
 for(const role of ['anon','authenticated','service_role']){
  await db.exec('SET ROLE '+role);
  await assert.rejects(db.exec('SELECT * FROM cogniti_sm2_fiyat_oranlari'));passed++;
  await assert.rejects(db.exec('SELECT cogniti_sm2_fiyat_matrisi(9.9)'));passed++;
  if(role==='service_role')eq((await publicRead()).sm2.length,148);
  else {await assert.rejects(publicRead());passed++;}
  await db.exec('RESET ROLE');
 }
 console.log(JSON.stringify({passed,scope:'Yerel PGlite; 148 Excel fiyatı, eski listeden geçiş, tekrar çalışma, KKÖ/paket kapsamı, fiyat güncelleme ve yetkiler. Canlı DB bağlantısı yok.'}));
}finally{await db.close();}
