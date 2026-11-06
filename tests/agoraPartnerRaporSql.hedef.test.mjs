import { PGlite } from '/Users/iskendereser/Documents/Codex/2026-10-24/git/work/viva-pg-tools/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const repo = process.env.COGNITI_RAPOR_TEST_ROOT ?? new URL('../', import.meta.url);
const file = name => readFile(new URL('scripts/sql/'+name, repo),'utf8');
const db = new PGlite(); let passed=0;
const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const fail=async promise=>{await assert.rejects(promise);passed++;};
const id=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
const admin=id(1), p1=id(11),p2=id(12),p3=id(13),firma=id(21),token='a'.repeat(64);
try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE TABLE firmalar(firma_id uuid PRIMARY KEY,aktif boolean DEFAULT true);
 CREATE TABLE kullanicilar(kullanici_id uuid PRIMARY KEY,rol text,aktif_mi boolean DEFAULT true,firma_id uuid REFERENCES firmalar);
 CREATE TABLE agora_is_partnerleri(partner_id uuid PRIMARY KEY,giris_surum integer DEFAULT 1,erisim_acik boolean DEFAULT true,ilk_giris_durumu text DEFAULT 'onaylandi',uyelik_durumu text DEFAULT 'onaylandi');
 CREATE TABLE agora_partner_profilleri(partner_id uuid PRIMARY KEY);
 CREATE TABLE agora_partner_oturumlari(token_ozeti text PRIMARY KEY,partner_id uuid,giris_surum integer,bitis_at timestamptz);
 CREATE TABLE cogniti_token_tuketimleri(tuketim_id uuid PRIMARY KEY);`);
 const education=await file('agora_partner_egitim_yonetimi.sql');
 await db.exec(education.slice(education.indexOf('CREATE TABLE IF NOT EXISTS public.agora_partner_egitimleri'),education.indexOf('CREATE OR REPLACE FUNCTION')));
 await db.exec('ALTER TABLE agora_partner_egitimleri ADD COLUMN partner_egitim_id text');
 const purchase=await file('agora_satin_alma.sql');
 await db.exec(purchase.slice(purchase.indexOf('CREATE TABLE IF NOT EXISTS public.agora_siparisleri'),purchase.indexOf('CREATE OR REPLACE FUNCTION public.agora_satin_alma_yetki')));
 const vitrin=await file('agora_vitrin_kurulum.sql');
 await db.exec(vitrin.slice(vitrin.indexOf('CREATE TABLE IF NOT EXISTS public.agora_vitrin_etkilesimleri'),vitrin.indexOf('CREATE OR REPLACE FUNCTION public.agora_vitrin_yetki')));
 const auth=await file('agora_partner_ilk_giris_onayi.sql');
 await db.exec(auth.slice(auth.indexOf('CREATE OR REPLACE FUNCTION public.agora_partner_admin_dogrula'),auth.indexOf('CREATE OR REPLACE FUNCTION public.agora_partner_basvurulari')));
 await db.exec('REVOKE ALL ON FUNCTION agora_partner_admin_dogrula(uuid) FROM PUBLIC,anon,authenticated,service_role');
 const sql=await file('agora_partner_raporlari.sql'); await db.exec(sql);await db.exec(sql);passed+=2;
 for(const p of [p1,p2,p3]){await db.query('INSERT INTO agora_is_partnerleri(partner_id) VALUES($1)',[p]);await db.query('INSERT INTO agora_partner_profilleri VALUES($1)',[p]);}
 await db.query("INSERT INTO agora_partner_oturumlari VALUES($1,$2,1,now()+interval '1 hour')",[token,p1]);
 await db.query('INSERT INTO firmalar VALUES($1,true),($2,false)',[firma,id(22)]);
 await db.query("INSERT INTO kullanicilar VALUES($1,'admin',true,$2)",[admin,firma]);
 for(let n=0;n<8;n++)await db.query("INSERT INTO kullanicilar VALUES($1,'pm',$2,$3)",[id(100+n),n!==6,n===7?id(22):firma]);
 for(let n=1;n<=26;n++)await db.query(`INSERT INTO agora_partner_egitimleri(egitim_id,partner_id,partner_egitim_id,egitim_adi,fiyat_tl,olusturma_istegi)
 VALUES($1,$2,$3,$4,$5,$1)`,[id(200+n),n===26?p2:p1,'PE-'+String(10000+n),'Eğitim '+n,n===3?null:3000]);
 for(let n=0;n<5;n++)await db.query(`INSERT INTO agora_siparisleri(siparis_id,firma_id,alici_id,egitim_id,partner_id,partner_egitim_id,egitim_adi,egitim_surumu,satin_alma_bedeli,kko_birim_fiyati,token_tutari,borca_yazilan_token,hizmet_bedeli,odenecek_tutar,paket)
 VALUES($1,$2,$3,$4,$5,'PE-10001','Satış anındaki ad',1,$6,5.49,1,0,round($6::numeric*.15,2),$6::numeric-round($6::numeric*.15,2),'{}')`,[id(300+n),firma,id(100+n),id(201),p1,n<3?2000:3000]);
 for(let n=0;n<8;n++)await db.query('INSERT INTO agora_vitrin_etkilesimleri(auth_id,egitim_id,begeni,favori) VALUES($1,$2,$3,$4)',[id(100+n),id(201),n!==2,n!==1]);
 const partnerRead=async(hash=token,page=1)=>(await db.query('SELECT agora_partner_raporlari_oku($1,$2) AS data',[hash,page])).rows[0].data;
 const adminRead=async(p=p1,page=1,actor=admin)=>(await db.query('SELECT agora_partner_admin_raporlari_oku($1,$2,$3) AS data',[actor,p,page])).rows[0].data;
 let data=await partnerRead();eq(data.toplam,25);eq(data.kayitlar.length,20);eq(data.kayitlar[0],{egitim_id:id(201),partner_egitim_id:'PE-10001',egitim_adi:'Eğitim 1',satis_fiyati:3000,satilan_adet:5,toplam_satis:12000,begeni_sayisi:5,favori_sayisi:5});
 eq(data,await adminRead());eq(data.kayitlar[1].satilan_adet,0);eq(data.kayitlar[1].toplam_satis,0);eq(data.kayitlar[2].satis_fiyati,null);
 eq((await partnerRead(token,2)).kayitlar.length,5);eq((await partnerRead(token,2)).kayitlar[0].partner_egitim_id,'PE-10021');eq((await partnerRead(token,3)).kayitlar,[]);
 eq((await adminRead(p2)).toplam,1);eq((await adminRead(p3)).kayitlar,[]);eq(await adminRead(id(99)),null);
 for(const page of [null,0,-1,100001])await fail(partnerRead(token,page));eq(await partnerRead('bad'),null);
 await db.query('UPDATE agora_partner_egitimleri SET fiyat_tl=9999 WHERE egitim_id=$1',[id(201)]);
 data=await partnerRead();eq(data.kayitlar[0].satis_fiyati,9999);eq(data.kayitlar[0].toplam_satis,12000);eq(data.kayitlar[0].satilan_adet,5);
 await db.query('UPDATE agora_partner_egitimleri SET silindi_at=now() WHERE egitim_id IN ($1,$2)',[id(201),id(202)]);
 data=await partnerRead();eq(data.toplam,24);eq(data.kayitlar[0].egitim_id,id(201));eq(data.kayitlar[0].toplam_satis,12000);
 await db.query('UPDATE agora_vitrin_etkilesimleri SET begeni=false WHERE auth_id=$1',[id(100)]);eq((await partnerRead()).kayitlar[0].begeni_sayisi,4);
 await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(101)]);eq((await partnerRead()).kayitlar[0].satilan_adet,5);eq((await partnerRead()).kayitlar[0].toplam_satis,12000);
 await db.query("UPDATE agora_partner_oturumlari SET bitis_at=now()-interval '1 second'");eq(await partnerRead(),null);
 await db.query("UPDATE agora_partner_oturumlari SET bitis_at=now()+interval '1 hour',giris_surum=2");eq(await partnerRead(),null);
 await db.exec('UPDATE agora_partner_oturumlari SET giris_surum=1');
 for(const field of ['erisim_acik','uyelik_durumu','ilk_giris_durumu']){
  const bad=field==='erisim_acik'?false:'bekliyor',good=field==='erisim_acik'?true:'onaylandi';
  await db.query('UPDATE agora_is_partnerleri SET '+field+'=$1 WHERE partner_id=$2',[bad,p1]);eq(await partnerRead(),null);
  await db.query('UPDATE agora_is_partnerleri SET '+field+'=$1 WHERE partner_id=$2',[good,p1]);
 }
 const roles=['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per','gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','tm','bm','utt','kd_utt','iu','firma_admin'];
 for(let n=0;n<roles.length;n++){await db.query('INSERT INTO kullanicilar VALUES($1,$2,true,$3)',[id(500+n),roles[n],firma]);await fail(adminRead(p1,1,id(500+n)));}
 await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[admin]);await fail(adminRead());await db.query('UPDATE kullanicilar SET aktif_mi=true WHERE kullanici_id=$1',[admin]);
 for(const role of ['anon','authenticated','service_role']){
  await db.exec('SET ROLE '+role);await fail(db.query('SELECT * FROM agora_siparisleri'));await fail(db.query('SELECT agora_partner_rapor_kayitlari($1,1)',[p1]));
  if(role==='service_role'){eq((await partnerRead()).toplam,24);eq((await adminRead()).toplam,24);}else{await fail(partnerRead());await fail(adminRead());}
  await db.exec('RESET ROLE');
 }
 console.log(JSON.stringify({passed,scope:'Yalnız partner raporları; gerçek SQL, sahte yerel veriler. Supabase bağlantısı yok.'}));
} finally {await db.close();}
