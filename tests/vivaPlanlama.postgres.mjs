// Yalnız izole yerel PostgreSQL + sentetik şema. Ağ/Supabase/Daily bağlantısı kurmaz.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const bin = process.env.VIVA_PG_BIN;
if (!bin) throw Error('Yerel PostgreSQL bin dizini VIVA_PG_BIN ile belirtilmeli.');
const base = '/tmp/cogniti-viva-planlama';mkdirSync(base,{recursive:true});
const root = mkdtempSync(join(base,'pg-')), dir=join(root,'data'), sock=join(root,'socket');mkdirSync(sock);
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const opts={host:sock,port:55448,user:'viva_test',database:'postgres'};
let started=false,db,other;let passed=0;
async function check(name,fn){await fn();console.log(`OK ${++passed}: ${name}`);}
try {
 execFileSync(join(bin,'initdb'),['-D',dir,'-U','viva_test','-A','trust','--no-locale','--encoding=UTF8'],{stdio:'pipe'});
 execFileSync(join(bin,'pg_ctl'),['-D',dir,'-l',join(root,'postgres.log'),'-o',`-k ${sock} -h '' -p 55448`,'-w','start'],{stdio:'pipe'});started=true;
 db=new pg.Client(opts);other=new pg.Client(opts);await db.connect();await other.connect();
 await db.query(readFileSync('tests/fixtures/viva-asama1-postgres.sql','utf8'));
 await db.query(readFileSync('scripts/sql/viva_asama1.sql','utf8'));
 const sql=readFileSync('scripts/sql/viva_anlik_planlama.sql','utf8');
 await check('SQL güncellemesi iki kez uygulanabilir',async()=>{await db.query(sql);await db.query(sql);});
 const sureSql=readFileSync('scripts/sql/viva_sure_adimlari.sql','utf8');
 await check('30 dakika kuralı iki kez kurulabilir',async()=>{await db.query(sureSql);await db.query(sureSql);});
 const roleSource=readFileSync('lib/utils/roller.ts','utf8');
 const named=key=>[...roleSource.split(`export const ${key} = [`)[1].split('];')[0].matchAll(/"([a-z_]+)"/g)].map(x=>x[1]);
 const roles=[...named('URETICI_ROLLER'),...named('YONETICI_ROLLER'),'admin','tm','bm','utt','kd_utt','iu'];
 await db.query('INSERT INTO firmalar VALUES($1,$2,true,true),($3,$4,true,true)',[id(100),'Firma A',id(101),'Firma B']);
 for(let i=0;i<roles.length;i++)await db.query('INSERT INTO kullanicilar(kullanici_id,ad,soyad,rol,firma_id,aktif_mi) VALUES($1,$2,$3,$4,$5,true)',[id(200+i),'Test','Kişi',roles[i],id(100)]);
 await db.query('INSERT INTO kullanicilar(kullanici_id,ad,soyad,rol,firma_id,aktif_mi) VALUES($1,$2,$3,$4,$5,true)',[id(900),'Dış','Kişi','utt',id(101)]);
 const rpc=async(a,islem,veri,client=db)=>(await client.query('SELECT viva_islem($1,$2,$3::jsonb) AS v',[id(a),islem,JSON.stringify(veri)])).rows[0].v;
 const form=n=>({etkinlik_id:id(n),baslik:'Anlık yayın',aciklama:'Test',yayin_turu:'anlik',sure_dakika:60,durum:'planlandi',katilimcilar:[]});
 await check('Tüm iç roller anlık yayın oluşturabilir; saat DB tarafından belirlenir',async()=>{
  for(let i=0;i<roles.length;i++){
   const e=(await rpc(200+i,'olustur',form(1000+i))).etkinlik;
   assert.equal(e.yayin_turu,'anlik');assert.equal(e.durum,'planlandi');assert.ok(Math.abs(Date.now()-Date.parse(e.baslangic))<5000);assert.equal(Date.parse(e.bitis)-Date.parse(e.baslangic),3600000);
  }
 });
 await check('Aynı anahtarın eşzamanlı tekrarı tek yayın ve aynı başlangıç döndürür',async()=>{
  const f=form(2000);const [a,b]=await Promise.all([rpc(200,'olustur',f),rpc(200,'olustur',f,other)]);
  assert.equal(a.etkinlik.baslangic,b.etkinlik.baslangic);assert.equal((await db.query('SELECT count(*)::int AS n FROM viva_etkinlikler WHERE etkinlik_id=$1',[id(2000)])).rows[0].n,1);
  await assert.rejects(rpc(200,'olustur',{...f,sure_dakika:30}),{code:'40001'});
 });
 await check('İstemci başlangıcı, yanlış süre, taslak anlık ve sahte canlı durum reddedilir',async()=>{
  for(const ek of [{baslangic:new Date().toISOString()},{bitis:new Date().toISOString()},{sure_dakika:0},{sure_dakika:1441},{sure_dakika:1.5},{sure_dakika:'60'},{durum:'taslak'},{durum:'canli'},{yayin_turu:'sahte'}])await assert.rejects(rpc(200,'olustur',{...form(2100),...ek}),{code:'22023'});
 });
 await check('Bugün bir saat sonrası planlanır; geçmişe planlama hâlâ reddedilir',async()=>{
  const {sure_dakika,...f}=form(2200);void sure_dakika;
  const p={...f,yayin_turu:'planli',baslangic:new Date(Date.now()+3600000).toISOString(),bitis:new Date(Date.now()+7200000).toISOString()};
  const e=(await rpc(200,'olustur',p)).etkinlik;assert.equal(e.yayin_turu,'planli');assert.equal(Date.parse(e.baslangic),Date.parse(p.baslangic));
  await assert.rejects(rpc(200,'olustur',{...p,etkinlik_id:id(2201),baslangic:new Date(Date.now()-1000).toISOString()}),{code:'22023'});
 });
 await check('Eski türsüz kayıtlar planlı kalır; düzenleme sürüm kontrolünü korur',async()=>{
  const p={etkinlik_id:id(2300),baslik:'Eski plan',aciklama:'',baslangic:new Date(Date.now()+3600000).toISOString(),bitis:new Date(Date.now()+7200000).toISOString(),durum:'taslak',katilimcilar:[]};
  assert.equal((await rpc(200,'olustur',p)).etkinlik.yayin_turu,'planli');await rpc(200,'kaydet',{...p,surum:1,baslik:'Yeni'});
  await assert.rejects(rpc(200,'kaydet',{...p,surum:1}),{code:'40001'});
  await assert.rejects(rpc(200,'kaydet',{...form(2000),surum:1}),{code:'22023'});
 });
 await check('Kapsam dışı katılımcı, başka sahip ve kimliksiz oluşturma reddedilir',async()=>{
  await assert.rejects(rpc(200,'olustur',{...form(2400),katilimcilar:[{tur:'ic',id:id(900)}]}),{code:'42501'});
  await assert.rejects(rpc(900,'detay',{etkinlik_id:id(2000)}),{code:'42501'});
  await assert.rejects(db.query('SELECT viva_islem(NULL,$1,$2::jsonb)',['olustur',JSON.stringify(form(2401))]),{code:'42501'});
 });
 await check('EClub üyesi anlık yayın oluşturamaz',async()=>{
  await db.query('INSERT INTO eclub_kisiler VALUES($1,$2,$3,$4,$5)',[id(800),id(801),'Üye','Test','eczaci']);
  await assert.rejects(rpc(801,'olustur',form(2500)),{code:'42501'});
 });
 await check('Anon ve authenticated doğrudan RPC çağramaz',async()=>{
  const r=await db.query("SELECT has_function_privilege('anon','viva_islem(uuid,text,jsonb)','EXECUTE') AS a,has_function_privilege('authenticated','viva_islem(uuid,text,jsonb)','EXECUTE') AS b");assert.equal(r.rows[0].a,false);assert.equal(r.rows[0].b,false);
 });
 await check('Doğrudan ve RPC yazımında 30 dakikanın katları zorunludur',async()=>{
  let n=3000;
  for(const sure of [5,29,31,45,60.5,91,120,1440,1441]){
   await assert.rejects(rpc(200,'olustur',{...form(n++),sure_dakika:sure}),{code:'22023'});
   await assert.rejects(db.query("INSERT INTO viva_etkinlikler(etkinlik_id,sahip_id,firma_id,baslik,baslangic,bitis) VALUES($1,$2,$3,'Kısa',now(),now()+make_interval(secs=>$4))",[id(n++),id(200),id(100),sure*60]),{code:'22023'});
  }
  for(const sure of [30,60,90])assert.equal((await rpc(200,'olustur',{...form(n++),sure_dakika:sure})).etkinlik.durum,'planlandi');
 });
 await check('Eski kısa kayıtta durum güncellemesi engellenmez; süre değişikliği doğrulanır',async()=>{
  await db.query('ALTER TABLE viva_etkinlikler DISABLE TRIGGER trg_viva_sure_adimi');
  await db.query("INSERT INTO viva_etkinlikler(etkinlik_id,sahip_id,firma_id,baslik,baslangic,bitis,olusturma_ozeti) VALUES($1,$2,$3,'Eski kısa',now(),now()+interval '5 minutes','{}')",[id(4000),id(200),id(100)]);
  await db.query('ALTER TABLE viva_etkinlikler ENABLE TRIGGER trg_viva_sure_adimi');
  await db.query("UPDATE viva_etkinlikler SET durum='sona_erdi' WHERE etkinlik_id=$1",[id(4000)]);
  await assert.rejects(db.query("UPDATE viva_etkinlikler SET bitis=baslangic+interval '45 minutes' WHERE etkinlik_id=$1",[id(4000)]),{code:'22023'});
 });
 console.log(`Toplam: ${passed}/${passed}. Yalnız yerel sentetik PostgreSQL; canlı kabul değildir.`);
} finally {
 await other?.end().catch(()=>{});await db?.end().catch(()=>{});
 if(started)execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop'],{stdio:'pipe'});
}
