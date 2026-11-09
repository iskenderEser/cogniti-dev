import {PGlite} from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const admin='10000000-0000-4000-8000-000000000001';
const file=async name=>readFile(new URL('../scripts/sql/'+name,import.meta.url),'utf8');
try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,rol text,aktif_mi boolean);INSERT INTO kullanicilar VALUES('${admin}','admin',true);`);
 for(const name of ['cogniti_merkezi_fiyat_tarifesi.sql','cogniti_sm2_kko_oranlari.sql','cogniti_sm2_hesap_makinesi.sql','cogniti_esnek_paket_son_liste.sql'])await db.exec(await file(name));
 const read=async()=>(await db.query(`SELECT cogniti_fiyat_tarifesi_yonet('${admin}') d`)).rows[0].d;
 const publicRead=async()=>(await db.query('SELECT cogniti_sm2_fiyatlari_oku() d')).rows[0].d;
 const before=await read(),sql=await file('cogniti_aylik_abonelik_fiyatlari.sql');
 await db.exec(sql);let t=await read();
 eq(t.surum,before.surum+1);eq(t.sm2,before.sm2);eq(Object.keys(t.degerler).length,22);
 const changed=new Set(['paket_10k_token_miktari','paket_10k_token_tl','paket_30k_token_miktari','paket_30k_token_tl','paket_75k_token_miktari','paket_75k_token_tl']);
 for(const [k,v] of Object.entries(before.degerler))if(!changed.has(k))eq(t.degerler[k],v);
 eq((await publicRead()).paketler,[
 {ad:'Paket 1',token:5000,birim:5.9,aylik:29500},
 {ad:'Paket 2',token:10000,birim:4.85,aylik:48500},
 {ad:'Paket 3',token:15000,birim:3.9,aylik:58500},
 {ad:'Paket 4',token:25000,birim:2.9,aylik:72500}]);
 eq(t.hesaplar.paket_25k_aylik_tl,72500);
 const pricingBefore=await publicRead();
 const readSql=await file('cogniti_planlama_tarife_okuma.sql');
 await db.exec(readSql);await db.exec(readSql);
 eq((await publicRead()).kko,{limit:1500,birim:9.9});
 eq((await publicRead()).paketler,pricingBefore.paketler);eq((await publicRead()).sm2,pricingBefore.sm2);
 eq(await read(),t);
 await db.exec(sql);eq(await read(),t);
 const history=(await db.query('SELECT count(*)::int n FROM cogniti_fiyat_tarifesi_gecmisi')).rows[0].n;
 await db.exec(sql);eq((await db.query('SELECT count(*)::int n FROM cogniti_fiyat_tarifesi_gecmisi')).rows[0].n,history);
 const save=async(d,surum)=>(await db.query(`SELECT cogniti_fiyat_tarifesi_yonet('${admin}',$1,$2) d`,[JSON.stringify(d),surum])).rows[0].d;
 for(const patch of [{paket_25k_token_miktari:1.5},{paket_25k_token_miktari:0},{paket_25k_token_tl:0},{paket_25k_token_tl:-1}]){await assert.rejects(save({...t.degerler,...patch},t.surum));passed++;}
 t=await save({...t.degerler,paket_25k_token_miktari:30000,paket_25k_token_tl:3},t.surum);
 eq(t.hesaplar.paket_25k_aylik_tl,90000);eq((await publicRead()).paketler[3],{ad:'Paket 4',token:30000,birim:3,aylik:90000});
 await assert.rejects(save(t.degerler,t.surum-1));passed++;
 for(const role of ['anon','authenticated','service_role']){
  await db.exec('SET ROLE '+role);
  await assert.rejects(db.exec('SELECT * FROM cogniti_fiyat_tarifesi'));passed++;
  if(role==='service_role'){eq((await publicRead()).paketler.length,4);eq((await publicRead()).kko,{limit:1500,birim:9.9});eq((await read()).sm2.length,71);}
  else{await assert.rejects(read());passed++;await assert.rejects(publicRead());passed++;}
  await db.exec('RESET ROLE');
 }
 console.log(JSON.stringify({passed,scope:'Yerel PGlite; dört aylık fiyat, 4,85 düzeltmesi, 6 çarpanının kalkması, KKÖ/Esnek korunması, tekrar çalışma, düzenleme ve yetkiler; canlı DB yok.'}));
}finally{await db.close();}
