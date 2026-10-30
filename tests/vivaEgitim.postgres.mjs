// Yalnız yerel PostgreSQL ve sentetik kayıtlar. Supabase/Daily/e-posta bağlantısı yok.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
const bin=process.env.VIVA_PG_BIN;
if(!bin)throw Error('VIVA_PG_BIN gerekli.');
const root=mkdtempSync('/tmp/viva-egitim-'),dir=join(root,'data'),socket=join(root,'socket');mkdirSync(socket);
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let db,started=false,passed=0;
async function check(name,fn){await fn();console.log(`OK ${++passed}: ${name}`);}
try{
 execFileSync(join(bin,'initdb'),['-D',dir,'-U','viva_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',dir,'-l',join(root,'log'),'-o',`-k ${socket} -h '' -p 55447`,'-w','start'],{stdio:'pipe'});started=true;
 db=new pg.Client({host:socket,port:55447,user:'viva_test',database:'postgres'});await db.connect();
 await db.query(readFileSync('tests/fixtures/viva-asama1-postgres.sql','utf8'));
 await db.query('CREATE TABLE urunler(urun_id uuid PRIMARY KEY,firma_id uuid REFERENCES firmalar,urun_adi text NOT NULL)');
 for(const file of ['viva_asama1.sql','viva_anlik_planlama.sql','viva_sure_adimlari.sql','viva_davet_kapsami.sql','viva_eposta_davetleri.sql'])await db.query(readFileSync(`scripts/sql/${file}`,'utf8'));
 await db.query('INSERT INTO firmalar VALUES($1,$2,true,true),($3,$4,true,true)',[id(100),'Firma A',id(101),'Firma B']);
 const roleSource=readFileSync('lib/utils/roller.ts','utf8');
 const named=key=>[...roleSource.split(`export const ${key} = [`)[1].split('];')[0].matchAll(/"([a-z_]+)"/g)].map(x=>x[1]);
 const roles=[...new Set([...named('URETICI_ROLLER'),...named('YONETICI_ROLLER'),'admin','tm','bm','utt','kd_utt','iu'])];
 for(let n=0;n<roles.length;n++)await db.query('INSERT INTO kullanicilar(kullanici_id,ad,soyad,rol,firma_id,aktif_mi) VALUES($1,$2,$3,$4,$5,true)',[id(200+n),'Test','Kişi',roles[n],id(100)]);
 const owner=200+roles.indexOf('utt');
 await db.query("INSERT INTO kullanicilar(kullanici_id,ad,soyad,rol,firma_id,aktif_mi) VALUES($1,'Dış','Kişi','utt',$2,true)",[id(900),id(101)]);
 await db.query('INSERT INTO urunler VALUES($1,$2,$3),($4,$2,$5),($6,$7,$8)',[id(500),id(100),'Normavas',id(501),'Laropen',id(502),id(101),'Gizli ürün']);
 const rpc=async(user,op,value)=>(await db.query('SELECT viva_islem($1,$2,$3::jsonb) r',[id(user),op,JSON.stringify(value)])).rows[0].r;
 const form=n=>{const start=Date.now()+3600000;return{etkinlik_id:id(n),baslik:'Eğitim',aciklama:'',yayin_turu:'planli',baslangic:new Date(start).toISOString(),bitis:new Date(start+3600000).toISOString(),durum:'planlandi',katilimcilar:[]};};
 const old=form(1000);await rpc(owner,'olustur',old);
 const oldBefore=(await db.query('SELECT baslik,baslangic,bitis,surum,olusturma_ozeti FROM viva_etkinlikler WHERE etkinlik_id=$1',[id(1000)])).rows[0];
 const migration=readFileSync('scripts/sql/viva_egitim_urun_bagi.sql','utf8');
 await check('Kurulum tekrar uygulanabilir; eski etkinliğe sınıflama atamaz',async()=>{
  await db.query(migration);await db.query(migration);
  const after=(await db.query('SELECT baslik,baslangic,bitis,surum,olusturma_ozeti FROM viva_etkinlikler WHERE etkinlik_id=$1',[id(1000)])).rows[0];assert.deepEqual(after,oldBefore);
  const e=(await rpc(owner,'detay',{etkinlik_id:id(1000)})).etkinlik;assert.equal(e.egitim_turu,null);assert.equal(e.urun_id,null);assert.equal(e.urun_adi,null);
  assert.equal((await rpc(owner,'olustur',old)).etkinlik.egitim_turu,null);
 });
 await check('Tüm iç roller yalnız kendi firmasının ürünlerini okuyup eğitim kaydedebilir',async()=>{
  for(let n=0;n<roles.length;n++){
   const list=(await db.query('SELECT viva_egitim_urunleri($1) r',[id(200+n)])).rows[0].r;
   assert.deepEqual(list.map(x=>x.urun_adi),['Laropen','Normavas']);
   const e=(await rpc(200+n,'olustur',{...form(1100+n),egitim_turu:'urun_egitimi',urun_id:id(500)})).etkinlik;
   assert.equal(e.egitim_turu,'urun_egitimi');assert.equal(e.urun_id,id(500));assert.equal(e.urun_adi,'Normavas');
  }
 });
 await check('Altı eğitim türünde ürün zorunluluğu ve isteğe bağlı ürün korunur',async()=>{
  let n=2000;
  for(const type of ['urun_egitimi','urun_medikal_egitim','medikal_egitim','satis_teknikleri','yonetim_egitimi','ik_egitimi']){
   if(type.startsWith('urun_'))await assert.rejects(rpc(owner,'olustur',{...form(n++),egitim_turu:type,urun_id:null}),{code:'22023'});
   else assert.equal((await rpc(owner,'olustur',{...form(n++),egitim_turu:type,urun_id:null})).etkinlik.urun_id,null);
   assert.equal((await rpc(owner,'olustur',{...form(n++),egitim_turu:type,urun_id:id(501)})).etkinlik.urun_adi,'Laropen');
  }
  for(const type of [null,'','sahte'])await assert.rejects(rpc(owner,'olustur',{...form(n++),egitim_turu:type}),{code:'22023'});
  await assert.rejects(rpc(owner,'olustur',form(n++)),{code:'22023'});
 });
 await check('Firma dışı ve var olmayan ürün işlem yaratmadan reddedilir',async()=>{
  const before=(await db.query('SELECT count(*)::int n FROM viva_etkinlikler')).rows[0].n;
  for(const product of [502,999])await assert.rejects(rpc(owner,'olustur',{...form(3000+product),egitim_turu:'urun_egitimi',urun_id:id(product),firma_id:id(101)}),{code:'22023'});
  assert.equal((await db.query('SELECT count(*)::int n FROM viva_etkinlikler')).rows[0].n,before);
 });
 await check('Düzenleme ve yanıt kaybında ürün/tür korunur; eski oluşturma isteği yeni seçimi geri almaz',async()=>{
  const f={...form(4000),egitim_turu:'urun_egitimi',urun_id:id(500)};
  const created=await rpc(owner,'olustur',f);assert.deepEqual(await rpc(owner,'olustur',f),created);
  await assert.rejects(rpc(owner,'olustur',{...f,urun_id:id(501)}),{code:'40001'});
  const edited=(await rpc(owner,'kaydet',{...f,surum:1,egitim_turu:'medikal_egitim',urun_id:null})).etkinlik;
  assert.equal(edited.surum,2);assert.equal(edited.egitim_turu,'medikal_egitim');assert.equal(edited.urun_id,null);assert.equal(edited.urun_adi,null);
  assert.equal((await rpc(owner,'olustur',f)).etkinlik.urun_id,null);
  await assert.rejects(rpc(owner,'kaydet',{...f,surum:1}),{code:'40001'});
  await assert.rejects(rpc(900,'kaydet',{...f,surum:2}),{code:'42501'});
 });
 await check('Eski etkinlik düzenlenirken seçim istenir; durum işlemleri engellenmez',async()=>{
  await assert.rejects(rpc(owner,'kaydet',{...old,surum:1}),{code:'22023'});
  const e=(await rpc(owner,'kaydet',{...old,surum:1,egitim_turu:'satis_teknikleri',urun_id:null})).etkinlik;assert.equal(e.egitim_turu,'satis_teknikleri');
  await rpc(owner,'iptal',{etkinlik_id:old.etkinlik_id,surum:2});
 });
 await check('Anlık yayının zamanı sunucuda kalır; eğitim ve ürün aynı işlemde kaydedilir',async()=>{
  const f={etkinlik_id:id(5000),baslik:'Anlık ürün eğitimi',aciklama:'',yayin_turu:'anlik',sure_dakika:60,durum:'planlandi',katilimcilar:[],egitim_turu:'urun_medikal_egitim',urun_id:id(500)};
  const e=(await rpc(owner,'olustur',f)).etkinlik;assert.equal(e.urun_adi,'Normavas');assert.equal(e.yayin_turu,'anlik');assert(Math.abs(Date.now()-Date.parse(e.baslangic))<5000);assert.equal(Date.parse(e.bitis)-Date.parse(e.baslangic),3600000);
 });
 await check('E-posta kayıt zinciri yeni alanları taşır; mükerrer kayıt oluşturmaz',async()=>{
  const f={...form(6000),durum:'taslak',egitim_turu:'urun_egitimi',urun_id:id(500),davet_epostalari:[]};
  const call=async(op,data)=>(await db.query('SELECT viva_eposta_kaydet($1,$2,$3::jsonb) r',[id(owner),op,JSON.stringify(data)])).rows[0].r;
  const first=await call('olustur',f);assert.equal(first.etkinlik.urun_adi,'Normavas');assert.deepEqual(await call('olustur',f),first);
  const edited=await call('kaydet',{...f,surum:1,urun_id:id(501)});assert.equal(edited.etkinlik.urun_adi,'Laropen');
 });
 await check('Doğrudan yazımda başka firma ürünü ve geçersiz ürün-eğitim eşleşmesi reddedilir',async()=>{
  await assert.rejects(db.query('UPDATE viva_etkinlikler SET urun_id=$1 WHERE etkinlik_id=$2',[id(502),id(4000)]),{code:'22023'});
  await assert.rejects(db.query("UPDATE viva_etkinlikler SET egitim_turu='urun_egitimi',urun_id=NULL WHERE etkinlik_id=$1",[id(4000)]),{code:'23514'});
 });
 await check('E-Club, pasif kullanıcı ve tarayıcı rolleri ürün listesine erişemez',async()=>{
  await db.query('INSERT INTO eclub_kisiler VALUES($1,$2,$3,$4,$5)',[id(800),id(801),'Üye','Test','eczaci']);
  await assert.rejects(db.query('SELECT viva_egitim_urunleri($1)',[id(801)]),{code:'42501'});
  await db.query('UPDATE kullanicilar SET aktif_mi=false WHERE kullanici_id=$1',[id(900)]);
  await assert.rejects(db.query('SELECT viva_egitim_urunleri($1)',[id(900)]),{code:'42501'});
  for(const role of ['anon','authenticated']){await db.query(`SET ROLE ${role}`);await assert.rejects(db.query('SELECT viva_egitim_urunleri($1)',[id(owner)]),{code:'42501'});await db.query('RESET ROLE');}
  await db.query('SET ROLE service_role');assert.equal((await db.query('SELECT jsonb_array_length(viva_egitim_urunleri($1)) n',[id(owner)])).rows[0].n,2);await db.query('RESET ROLE');
 });
 await check('Genel türü kurulur, kaydedilir; eski İK kayıtları korunur ve yeni İK seçilemez',async()=>{
  const legacy=(await rpc(owner,'olustur',{...form(7000),egitim_turu:'ik_egitimi',urun_id:null})).etkinlik;
  const sql=readFileSync('scripts/sql/viva_genel_etkinlik_turu.sql','utf8');await db.query(sql);await db.query(sql);
  assert.equal((await rpc(owner,'detay',{etkinlik_id:legacy.etkinlik_id})).etkinlik.egitim_turu,'ik_egitimi');
  await assert.rejects(rpc(owner,'olustur',{...form(7001),egitim_turu:'ik_egitimi',urun_id:null}),{code:'22023'});
  for(const product of [null,id(500)]){
   const e=(await rpc(owner,'olustur',{...form(product?7003:7002),egitim_turu:'genel',urun_id:product})).etkinlik;
   assert.equal(e.egitim_turu,'genel');assert.equal(e.urun_id,product);
  }
  const e=(await rpc(owner,'kaydet',{...form(7000),surum:1,egitim_turu:'genel',urun_id:null})).etkinlik;assert.equal(e.egitim_turu,'genel');
 });
 console.log(`${passed} Viva eğitim/ürün PostgreSQL kontrolü başarılı.`);
}finally{
 await db?.end().catch(()=>{});
 if(started)execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop'],{stdio:'pipe'});
 rmSync(root,{recursive:true,force:true});
}
