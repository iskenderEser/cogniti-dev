// Geçici yerel PostgreSQL ve sentetik davetler; ağ veya canlı veri kullanılmaz.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const bin=process.env.VIVA_PG_BIN;
if(!bin)throw Error('VIVA_PG_BIN gerekli.');
const root=mkdtempSync('/tmp/cogniti-viva-eposta-yeniden-dene-');
const dir=join(root,'data'),socket=join(root,'socket'),port=55455;
mkdirSync(socket);
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let db,started=false,checks=0;
const eq=(a,b)=>{checks++;assert.deepEqual(a,b);};
const query=(sql,args=[])=>db.query(sql,args);
const retry=(owner,event,invite,version=1)=>query('SELECT viva_eposta_yeniden_dene($1,$2,$3,$4) AS v',[id(owner),id(event),id(invite),version]).then(x=>x.rows[0].v);
const fail=async(fn,code)=>{checks++;await assert.rejects(fn,e=>e.code===code);};
const state=async invite=>(await query('SELECT durum,deneme_sayisi,sonraki_deneme,gonderim_zamani FROM viva_eposta_gonderimleri WHERE davet_id=$1',[id(invite)])).rows[0];
try{
 execFileSync(join(bin,'initdb'),['-D',dir,'-U','viva_test','-A','trust','--no-locale','--encoding=UTF8']);
 execFileSync(join(bin,'pg_ctl'),['-D',dir,'-l',join(root,'postgres.log'),'-o',`-k ${socket} -h '' -p ${port}`,'-w','start']);
 started=true;db=new pg.Client({host:socket,port,user:'viva_test',database:'postgres'});await db.connect();
 for(const file of ['tests/fixtures/viva-asama1-postgres.sql','scripts/sql/viva_asama1.sql',
  'scripts/sql/viva_anlik_planlama.sql','scripts/sql/viva_davet_kapsami.sql','scripts/sql/viva_eposta_davetleri.sql',
  'scripts/sql/viva_eposta_gonderim_isleyici.sql','scripts/sql/viva_eposta_yeniden_dene.sql'])await query(readFileSync(file,'utf8'));
 await query('INSERT INTO firmalar VALUES($1,$2,true,true)',[id(100),'Firma']);
 await query('INSERT INTO takimlar VALUES($1,$2,$3)',[id(110),id(100),'Takım']);
 await query('INSERT INTO bolgeler VALUES($1,$2,$3)',[id(120),id(110),'Bölge']);
 for(const n of [1,2])await query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)',[id(n),'Yerel',`Kişi ${n}`,`yerel${n}@example.invalid`,'utt',id(100),id(110),id(120)]);
 const make=async(event,invite)=>{
  const data={etkinlik_id:id(event),baslik:'Yayın',aciklama:'',yayin_turu:'planli',durum:'planlandi',
   baslangic:new Date(Date.now()+3600000).toISOString(),bitis:new Date(Date.now()+7200000).toISOString(),
   katilimcilar:[],davet_epostalari:[`kisi${invite}@example.invalid`]};
  await query('SELECT viva_eposta_kaydet($1,$2,$3::jsonb,$4::jsonb)',[id(1),'olustur',JSON.stringify(data),JSON.stringify([{davet_id:id(invite),eposta:data.davet_epostalari[0],token_hash:'a'.repeat(64)}])]);
 };
 await make(1000,2000);
 const first=await state(2000);eq(first.durum,'bekliyor');
 await fail(()=>retry(2,1000,2000),'42501');
 await fail(()=>retry(1,1000,2000,9),'40001');
 await fail(()=>retry(1,1000,2999),'22023');
 await retry(1,1000,2000);eq((await state(2000)).deneme_sayisi,0);
 await query("UPDATE viva_eposta_gonderimleri SET durum='hata',deneme_sayisi=1,sonraki_deneme=now()+interval '1 hour',hata_kodu='SENTETIK_HATA' WHERE davet_id=$1",[id(2000)]);
 const result=await retry(1,1000,2000);
 eq(result.eposta_davetleri[0].durum,'bekliyor');eq((await state(2000)).sonraki_deneme,null);
 eq((await state(2000)).deneme_sayisi,1);
 for(const status of ['gonderiliyor','gonderildi','kontrol','iptal','taslak']){
  await query(`UPDATE viva_eposta_gonderimleri SET durum=$2,
   deneme_sayisi=CASE WHEN $2='taslak' THEN 0 ELSE 1 END,
   kilit_id=CASE WHEN $2='gonderiliyor' THEN $3::uuid ELSE NULL END,
   kilit_bitis=CASE WHEN $2='gonderiliyor' THEN now()+interval '2 minutes' ELSE NULL END,
   gonderim_zamani=CASE WHEN $2='gonderildi' THEN now() ELSE NULL END
   WHERE davet_id=$1`,[id(2000),status,id(999)]);
  await fail(()=>retry(1,1000,2000),'22023');eq((await state(2000)).durum,status);
 }
 await query("UPDATE viva_eposta_gonderimleri SET durum='hata',deneme_sayisi=5 WHERE davet_id=$1",[id(2000)]);
 await fail(()=>retry(1,1000,2000),'22023');
 await query("UPDATE viva_eposta_gonderimleri SET deneme_sayisi=1,ilk_deneme=now()-interval '24 hours' WHERE davet_id=$1",[id(2000)]);
 await fail(()=>retry(1,1000,2000),'22023');
 for(const role of ['anon','authenticated','service_role'])eq((await query("SELECT has_function_privilege($1,'public.viva_eposta_yeniden_dene(uuid,uuid,uuid,integer)','EXECUTE') v",[role])).rows[0].v,role==='service_role');
 console.log(JSON.stringify({passed:true,checks,scope:'yerel PostgreSQL; e-posta gönderilmedi'}));
}finally{
 if(db)await db.end();
 if(started)execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop']);
}
