import {PGlite} from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const db=new PGlite();let passed=0;const eq=(a,b)=>{assert.deepEqual(a,b);passed++},fail=async p=>{await assert.rejects(p);passed++};
const admin='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,rol text,aktif_mi boolean);`);
 await db.query("INSERT INTO kullanicilar VALUES($1,'admin',true),($2,'firma_admin',true)",[admin,other]);
 const sql=await readFile(new URL('../scripts/sql/cogniti_merkezi_fiyat_tarifesi.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);passed+=2;
 const read=async(actor=admin)=>(await db.query('SELECT cogniti_fiyat_tarifesi_yonet($1) AS d',[actor])).rows[0].d;
 const save=async(d,v,actor=admin)=>(await db.query('SELECT cogniti_fiyat_tarifesi_yonet($1,$2::jsonb,$3) AS d',[actor,JSON.stringify(d),v])).rows[0].d;
 const calc=async(t,n)=>(await db.query('SELECT cogniti_hizmet_bedeli_hesapla($1,$2::numeric) AS d',[t,n])).rows[0].d;
 let t=await read();eq(t.surum,1);eq(Object.keys(t.degerler).length,20);eq(t.hesaplar.viva_kisi_dakika_tl,.33);eq(t.hesaplar.paket_10k_aylik_tl,59000);eq(t.degerler.uretim_literatur_tl,null);eq(t.degerler.kko_token_miktari,1500);eq(t.degerler.kko_asim_tl,0);
 eq((await calc('viva',360000)).token,200);eq((await calc('viva',0)).token,0);eq((await calc('banner',1)).token,200);eq((await calc('banner',2)).token,400);
 const d={...t.degerler,banner_haftalik_token:250,viva_usd_tl:60};t=await save(d,1);eq(t.surum,2);eq((await read()).degerler.banner_haftalik_token,250);eq((await calc('banner',2)).token,500);eq((await calc('viva',360000)).token,218);
 eq((await save(d,2)).surum,2);await fail(save(d,1));eq((await db.query('SELECT count(*)::int AS n FROM cogniti_fiyat_tarifesi_gecmisi')).rows[0].n,2);
 for(const bad of [{...d,kko_token_miktari:1.5},{...d,kko_token_miktari:0},{...d,kko_asim_tl:-1},{...d,banner_haftalik_token:1.5},{...d,kko_token_tl:0},{...d,kko_token_tl:-1},{...d,viva_usd_tl:null},{...d,extra:2},{...d,viva_usd_tl:1000000001},{...d,viva_usd_tl:.0000001},{...d,uretim_literatur_tl:'abc'}])await fail(save(bad,2));
 const missing={...d};delete missing.kko_token_tl;await fail(save(missing,2));await fail(read(other));await fail(save(d,2,other));
 for(const rol of ['pm','bm','utt','gm','partner']){await db.query('UPDATE kullanicilar SET rol=$1 WHERE kullanici_id=$2',[rol,other]);await fail(read(other));}
 await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[admin]);await fail(read());await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[admin]);
 for(const [type,n] of [['banner',0],['banner',3],['banner',1.5],['viva',-1],['viva','NaN'],['viva','Infinity'],['agora',10]])await fail(calc(type,n));
 for(const role of ['anon','authenticated','service_role']){await db.exec('SET ROLE '+role);await fail(db.exec('SELECT * FROM cogniti_fiyat_tarifesi'));await fail(db.exec('SELECT * FROM cogniti_fiyat_tarifesi_gecmisi'));if(role==='service_role'){eq((await read()).surum,2);eq((await calc('banner',1)).token,250);}else{await fail(read());await fail(calc('viva',60));}await db.exec('RESET ROLE');}
 await db.exec(sql);eq((await read()).surum,2);eq((await read()).degerler.banner_haftalik_token,250);const miktarli={...(await read()).degerler,paket_10k_token_miktari:12000,paket_30k_token_miktari:40000,paket_75k_token_miktari:80000};
 const son=await save(miktarli,2);eq(son.hesaplar.paket_10k_aylik_tl,70800);eq(son.hesaplar.paket_30k_aylik_tl,196000);eq(son.hesaplar.paket_75k_aylik_tl,312000);
 await fail(save({...miktarli,paket_10k_token_miktari:1.5},3));await fail(save({...miktarli,paket_30k_token_miktari:0},3));
 await db.exec(sql);eq((await read()).degerler.paket_10k_token_miktari,12000);
 console.log(JSON.stringify({passed,scope:'Yalnız merkezi fiyat yönetimi; yerel PGlite, gerçek SQL, sahte kullanıcı tablosu. Canlı bağlantı yok.'}));
}finally{await db.close()}
