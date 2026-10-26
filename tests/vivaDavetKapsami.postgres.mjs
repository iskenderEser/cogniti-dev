// Yalnız geçici yerel PostgreSQL + sentetik veriler. Supabase/Daily/e-posta bağlantısı yok.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';

const bin = process.env.VIVA_PG_BIN;
if (!bin) throw Error('VIVA_PG_BIN gerekli.');
const root = mkdtempSync('/tmp/cogniti-viva-davet-');
const dir = join(root, 'data'), socket = join(root, 'socket');
mkdirSync(socket);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let db, started = false;
const passed = [];
let assertions = 0;
const eq = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
async function check(name, fn) { await fn(); passed.push(name); console.log(`OK ${passed.length}: ${name}`); }
try {
 execFileSync(join(bin, 'initdb'), ['-D', dir, '-U', 'viva_test', '-A', 'trust', '--no-locale', '--encoding=UTF8']);
 execFileSync(join(bin, 'pg_ctl'), ['-D', dir, '-l', join(root, 'postgres.log'), '-o', `-k ${socket} -h '' -p 55449`, '-w', 'start']);
 started = true;
 db = new pg.Client({ host: socket, port: 55449, user: 'viva_test', database: 'postgres' });
 await db.connect();
 for (const file of ['tests/fixtures/viva-asama1-postgres.sql', 'scripts/sql/viva_asama1.sql',
  'scripts/sql/viva_anlik_planlama.sql', 'scripts/sql/viva_asama2_1.sql', 'scripts/sql/viva_asama2_2.sql']) {
  await db.query(readFileSync(file, 'utf8'));
 }
 const migration = readFileSync('scripts/sql/viva_davet_kapsami.sql', 'utf8');
 await check('Yeni SQL iki kez kurulabilir', async () => { await db.query(migration); await db.query(migration); });
 await db.query(`INSERT INTO firmalar VALUES($1,'Firma A',true,true),($2,'Firma B',true,true);
 `.trim(), [id(100), id(101)]);
 await db.query('INSERT INTO takimlar VALUES($1,$2,$3),($4,$2,$5),($6,$7,$8)',
  [id(110), id(100), 'Takım A', id(111), 'Takım B', id(112), id(101), 'Dış takım']);
 await db.query('INSERT INTO bolgeler VALUES($1,$2,$3),($4,$2,$5),($6,$7,$8),($9,$10,$11)',
  [id(120), id(110), 'Bölge A', id(121), 'Bölge B', id(122), id(111), 'Bölge C', id(123), id(112), 'Dış bölge']);
 const source = readFileSync('lib/utils/roller.ts', 'utf8');
 const named = key => [...source.split(`export const ${key} = [`)[1].split('];')[0].matchAll(/"([a-z_]+)"/g)].map(x => x[1]);
 const roles = [...named('URETICI_ROLLER'), ...named('YONETICI_ROLLER'), 'admin', 'tm', 'bm', 'utt', 'kd_utt', 'iu'];
 const roleIds = new Map();
 async function user(n, role, firm = 100, team = 110, region = 120, active = true) {
  await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
   [id(n), `Kişi ${n}`, 'Test', `k${n}@example.invalid`, role, firm ? id(firm) : null, team ? id(team) : null, region ? id(region) : null, active]);
 }
 for (let i = 0; i < roles.length; i++) { roleIds.set(roles[i], 200 + i); await user(200 + i, roles[i]); }
 for (const args of [[1,'utt'],[2,'kd_utt'],[3,'bm'],[4,'pm'],[5,'utt',100,110,121],
  [6,'bm',100,110,121],[7,'utt',100,111,122],[8,'utt',101,112,123],
  [9,'utt',100,110,120,false],[10,'iu',null,null,null],[11,'admin',null,null,null],
  [12,'utt',100,null,null],[13,'pm',100,null,null]]) await user(...args);
 // 6 eczane: kendi portföyü, aynı bölgedeki başka UTT, başka bölge/takım/firma, UTT'siz firma eczanesi.
 const pharmacies = [[30,1,100],[31,2,100],[32,5,100],[33,7,100],[34,8,101],[35,null,100]];
 for (const [n, owner, firm] of pharmacies) {
  await db.query('INSERT INTO eclub_eczane_firma VALUES($1,$2,$3,true)', [id(n), id(500+n), id(firm)]);
  if (owner) await db.query('INSERT INTO eclub_utt_eczane VALUES($1,$2,$3,true)', [id(600+n), id(n), id(owner)]);
  const memberRoles = ['eczaci','ikinci_eczaci','yardimci_eczaci','eczane_teknisyeni'];
  for (let j = 0; j < memberRoles.length; j++) {
   const member = n*10+j;
   await db.query('INSERT INTO eclub_kisiler VALUES($1,$2,$3,$4,$5)', [id(member), id(10000+member), `Üye ${member}`, 'Test', memberRoles[j]]);
   await db.query('INSERT INTO eclub_kisi_eczane VALUES($1,$2,$3,true)', [id(20000+member), id(member), id(500+n)]);
  }
 }
 const scope = async (a,b,kind='ic') => (await db.query(`SELECT public.${kind==='ic'?'viva_ic_kapsam':'viva_eclub_kapsam'}($1,$2) AS v`, [id(a),id(b)])).rows[0].v;
 const context = async n => (await db.query('SELECT public.viva_davet_baglami($1) AS v',[id(n)])).rows[0].v;
 const rpc = async (n,op,v) => (await db.query('SELECT public.viva_islem($1,$2,$3::jsonb) AS v',[id(n),op,JSON.stringify(v)])).rows[0].v;
 const form = (n,participants) => ({etkinlik_id:id(n),baslik:'Davet testi',aciklama:'',yayin_turu:'anlik',sure_dakika:60,durum:'planlandi',katilimcilar:participants});
 const joinRoom = async (user,event) => (await db.query('SELECT public.viva_daily_katilim_baglam($1,$2,NULL,NULL) AS v',[id(user),id(event)])).rows[0].v;
 for (const role of roles) await check(`${role}: firma içi ve E-Club matrisi`,async()=>{
  const owner=roleIds.get(role), localOnly=['utt','kd_utt'].includes(role);
  const c=await context(owner);
  eq(c.olusturabilir,true);eq(c.davet_kurali_surumu,1);
  for (const target of roles) {
   const n=roleIds.get(target);
   const expected=!localOnly || ['utt','kd_utt','bm'].includes(target) || n===owner;
   eq(await scope(owner,n),expected);
   eq(c.kisiler.some(k=>k.tur==='ic'&&k.id===id(n)),expected&&owner!==n);
  }
  eq(await scope(owner,7),!localOnly); eq(await scope(owner,8),false); eq(await scope(owner,9),false);
  let allowed;
  if(localOnly) allowed=[]; // Test yayıncılarının portföy ataması yok.
  else if(role==='bm') allowed=[30,31];
  else if(['tm','pm','jr_pm','kd_pm'].includes(role)) allowed=[30,31,32];
  else if(role.startsWith('ik_')) allowed=[];
  else if(['admin','iu'].includes(role)) allowed=[30,31,32,33]; // Mevcut kapsam.
  else allowed=[30,31,32,33,35];
  eq(c.eclub_davet_edebilir,!role.startsWith('ik_'));
  for(const [pharmacy] of pharmacies) for(let j=0;j<4;j++) {
   eq(await scope(owner,pharmacy*10+j,'eclub'),allowed.includes(pharmacy));
   eq(c.kisiler.some(k=>k.tur==='eclub'&&k.id===id(pharmacy*10+j)),allowed.includes(pharmacy));
  }
 });
 await check('UTT/KD_UTT kendi portföyünü ve yalnız bölgesindeki temsilci/BM’yi seçer',async()=>{
  for(const a of [1,2]) {
   for(const b of [1,2,3]) eq(await scope(a,b),true);
   for(const b of [4,5,6,7,8,9]) eq(await scope(a,b),false);
   eq(await scope(a,(a===1?30:31)*10,'eclub'),true);
   eq(await scope(a,(a===1?31:30)*10,'eclub'),false);
  }
  eq(await scope(12,1),false); eq(await scope(12,12),true);
  eq(await scope(13,7),true); eq(await scope(13,300,'eclub'),false);
 });
 await check('Admin/İÜ platform kapsamı korunur; firma ve platform birbirine açılmaz',async()=>{
  eq(await scope(10,11),true);eq(await scope(11,10),true);
  eq(await scope(10,1),false);eq(await scope(roleIds.get('med_md'),10),false);
  eq((await context(10)).eclub_davet_edebilir,false);
 });
 await check('Liste dışından sahte davet oluşturma/kaydetme reddedilir; işlem atomiktir',async()=>{
  await assert.rejects(rpc(1,'olustur',form(3000,[{tur:'ic',id:id(4)}])),{code:'42501'});
  await assert.rejects(rpc(roleIds.get('ik_md'),'olustur',form(3001,[{tur:'eclub',id:id(300)}])),{code:'42501'});
  await assert.rejects(rpc(roleIds.get('bm'),'olustur',form(3002,[{tur:'eclub',id:id(320)}])),{code:'42501'});
  eq((await db.query('SELECT count(*)::int n FROM viva_etkinlikler WHERE etkinlik_id=ANY($1::uuid[])',[[id(3000),id(3001),id(3002)]])).rows[0].n,0);
  const planned={...form(3003,[{tur:'ic',id:id(2)}]),yayin_turu:'planli',baslangic:new Date(Date.now()+3600000).toISOString(),bitis:new Date(Date.now()+7200000).toISOString()};
  delete planned.sure_dakika;
  await rpc(1,'olustur',planned);
  await assert.rejects(rpc(1,'kaydet',{...planned,surum:1,katilimcilar:[{tur:'ic',id:id(4)}]}),{code:'42501'});
  const d=await rpc(1,'detay',{etkinlik_id:id(3003)});
  eq(d.etkinlik.surum,1);eq(d.katilimcilar.map(k=>k.id),[id(2)]);
 });
 await check('Firma içi ve E-Club davetlileri odaya girer; kapsam/üyelik kalkınca erişim kapanır',async()=>{
  await rpc(1,'olustur',form(3100,[{tur:'ic',id:id(2)},{tur:'ic',id:id(3)},{tur:'eclub',id:id(300)}]));
  eq((await joinRoom(2,3100)).rol,'katilimci');eq((await joinRoom(3,3100)).rol,'katilimci');
  eq((await joinRoom(10300,3100)).rol,'katilimci');
  await assert.rejects(joinRoom(4,3100),{code:'42501'});
  await db.query('UPDATE kullanicilar SET rol=$2 WHERE kullanici_id=$1',[id(3),'pm']);
  await assert.rejects(joinRoom(3,3100),{code:'42501'});
  await db.query('UPDATE kullanicilar SET rol=$2 WHERE kullanici_id=$1',[id(3),'bm']);
  await db.query('UPDATE eclub_kisi_eczane SET aktif_mi=false WHERE kisi_id=$1',[id(300)]);
  await assert.rejects(joinRoom(10300,3100),{code:'42501'});
  await db.query('UPDATE eclub_kisi_eczane SET aktif_mi=true WHERE kisi_id=$1',[id(300)]);
  const bm=roleIds.get('bm'); await rpc(bm,'olustur',form(3101,[{tur:'ic',id:id(7)}]));
  eq((await joinRoom(7,3101)).rol,'katilimci'); // Başka takım artık firma içi davete açık.
 });
 await check('E-Club aç/kapa, pasiflik ve aktif ilişki zinciri korunur',async()=>{
  await db.query('UPDATE firmalar SET eclub_aktif=false WHERE firma_id=$1',[id(100)]);
  eq((await context(1)).eclub_davet_edebilir,false);eq(await scope(1,300,'eclub'),false);
  eq(await scope(1,2),true);
  await db.query('UPDATE firmalar SET eclub_aktif=true WHERE firma_id=$1',[id(100)]);
  await db.query('UPDATE eclub_utt_eczane SET aktif_mi=false WHERE utt_id=$1',[id(1)]);
  eq(await scope(1,300,'eclub'),false);eq(await scope(roleIds.get('med_md'),300,'eclub'),true);
  await db.query('UPDATE eclub_utt_eczane SET aktif_mi=true WHERE utt_id=$1',[id(1)]);
  await db.query('UPDATE firmalar SET aktif=false WHERE firma_id=$1',[id(100)]);
  eq(await scope(1,2),false);eq(await scope(1,300,'eclub'),false);
  await assert.rejects(context(1),{code:'42501'});
  await db.query('UPDATE firmalar SET aktif=true WHERE firma_id=$1',[id(100)]);
 });
 await check('E-Club davetli olarak kalır; yeni RPC anon/istemciye kapalıdır',async()=>{
  const c=await context(10300);eq(c.olusturabilir,false);eq(c.eclub_davet_edebilir,false);eq(c.kisiler,[]);
  await assert.rejects(context(99999),{code:'42501'});
  for(const functionName of ['viva_ic_kapsam(uuid,uuid)','viva_eclub_kapsam(uuid,uuid)','viva_davet_baglami(uuid)']) {
   const row=(await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') a,has_function_privilege('authenticated',$1,'EXECUTE') b,has_function_privilege('service_role',$1,'EXECUTE') c",[functionName])).rows[0];
   eq(row,{a:false,b:false,c:true});
  }
 });
 const result={passed:passed.length,assertions,roles,tests:passed,scope:'Yalnız yerel PostgreSQL, Unix socket ve sentetik veriler; canlı DB uygulanmadı.'};
 if(process.env.VIVA_TEST_RESULT) writeFileSync(process.env.VIVA_TEST_RESULT,JSON.stringify(result,null,2));
 console.log(`Toplam: ${passed.length} senaryo, ${assertions} doğrulama, ${roles.length} rol.`);
} finally {
 await db?.end().catch(()=>{});
 if(started)execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop']);
}
