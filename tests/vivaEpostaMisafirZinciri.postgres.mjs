// Gerçek Viva SQL + uygulama katılım kodu; yalnız geçici yerel PostgreSQL ve sahte Daily.
import { execFileSync } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import { vivaKatilimHazirla } from '../lib/viva/katilim.ts';

const bin = process.env.VIVA_PG_BIN;
if (!bin) throw Error('VIVA_PG_BIN gerekli.');
const root = mkdtempSync('/tmp/cogniti-viva-misafir-zinciri-');
const dir = join(root, 'data'), socket = join(root, 'socket'), port = 55452;
mkdirSync(socket);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const key = 'yalniz-yerel-test-anahtari';
const token = createHmac('sha256', key).update(`viva-eposta-davet-v1:${id(2000)}`).digest('base64url');
const sha = value => createHash('sha256').update(value).digest('hex');
const tokenHash = sha(token);
const session = 'X'.repeat(43), sessionHash = sha(session);
const otp = '123456', otpHash = createHmac('sha256', key).update(`viva-otp:${token}:${otp}`).digest('hex');
const event = id(1000), invite = id(2000), owner = id(1);
const roomName = `viva-${event.replaceAll('-', '')}-n1`, domain = 'cogniti-viva.daily.co';
let db, started = false, checks = 0;
const equal = (a,b) => { checks++; assert.deepEqual(a,b); };
const guest = async (hash, op, data = {}) => (await db.query('SELECT viva_misafir_islem($1,$2,$3::jsonb) v',
 [hash,op,JSON.stringify(data)])).rows[0].v;
const viewer = async (hash = tokenHash, sessionId = sessionHash) => (await db.query(
 'SELECT viva_daily_katilim_baglam(NULL,NULL,$1,$2) v',[hash,sessionId])).rows[0].v;

try {
 execFileSync(join(bin,'initdb'),['-D',dir,'-U','viva_test','-A','trust','--no-locale','--encoding=UTF8']);
 execFileSync(join(bin,'pg_ctl'),['-D',dir,'-l',join(root,'postgres.log'),'-o',`-k ${socket} -h '' -p ${port}`,'-w','start']);
 started = true;
 db = new pg.Client({host:socket,port,user:'viva_test',database:'postgres'}); await db.connect();
 for (const file of ['tests/fixtures/viva-asama1-postgres.sql','scripts/sql/viva_asama1.sql',
  'scripts/sql/viva_anlik_planlama.sql','scripts/sql/viva_davet_kapsami.sql',
  'scripts/sql/viva_asama2_1.sql','scripts/sql/viva_asama2_2.sql',
  'scripts/sql/viva_asama2_4.sql','scripts/sql/viva_eposta_davetleri.sql']) {
  await db.query(readFileSync(file,'utf8'));
 }
 await db.query('INSERT INTO firmalar VALUES($1,$2,true,true)',[id(100),'Firma']);
 await db.query('INSERT INTO takimlar VALUES($1,$2,$3)',[id(110),id(100),'Takım']);
 await db.query('INSERT INTO bolgeler VALUES($1,$2,$3)',[id(120),id(110),'Bölge']);
 await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,$6,$7,$8,true)',
  [owner,'Yerel','Yayıncı','yerel@example.invalid','utt',id(100),id(110),id(120)]);

 const plan = {etkinlik_id:event,baslik:'Ekip yayını',aciklama:'Yerel doğrulama',yayin_turu:'planli',
  baslangic:new Date(Date.now()+3600000).toISOString(),bitis:new Date(Date.now()+7200000).toISOString(),
  durum:'taslak',katilimcilar:[],davet_epostalari:['izleyici@example.invalid']};
 const aday = [{davet_id:invite,eposta:'izleyici@example.invalid',token_hash:tokenHash}];
 const save = async (op, data, candidates=[]) => (await db.query('SELECT viva_eposta_kaydet($1,$2,$3::jsonb,$4::jsonb) v',
  [owner,op,JSON.stringify(data),JSON.stringify(candidates)])).rows[0].v;
 const draft = await save('olustur',plan,aday);
 equal(draft.eposta_davetleri[0].durum,'taslak');
 equal((await guest(tokenHash,'bilgi')).status,403);
 equal((await db.query('SELECT token_hash FROM viva_davetler WHERE davet_id=$1',[invite])).rows[0].token_hash,sha(token));

 const published = await save('kaydet',{...plan,durum:'planlandi',surum:1});
 equal(published.eposta_davetleri[0].davet_id,invite);
 equal(published.eposta_davetleri[0].durum,'bekliyor');
 const info = await guest(tokenHash,'bilgi');
 equal(info.dogrulandi,false);equal(info.eposta_maskeli,'i***@example.invalid');
 equal(JSON.stringify(info).includes('izleyici@example.invalid'),false);
 equal((await guest(sha('yanlis-token'),'bilgi')).status,403);
 await assert.rejects(viewer(),{code:'42501'});checks++;

 const codeTarget = await guest(tokenHash,'kod_ayir',{kod_hash:otpHash});
 equal(codeTarget.eposta,'izleyici@example.invalid');equal(codeTarget.davet_id,invite);
 equal((await guest(tokenHash,'dogrula',{kod_hash:sha('yanlis-kod'),oturum_hash:sessionHash})).status,403);
 const verified = await guest(tokenHash,'dogrula',{kod_hash:otpHash,oturum_hash:sessionHash});
 equal(verified.dogrulandi,true);
 equal((await guest(tokenHash,'bilgi',{oturum_hash:sessionHash})).dogrulandi,true);
 await assert.rejects(viewer(tokenHash,sha('yanlis-oturum')),{code:'42501'});checks++;
 const context = await viewer();
 equal(context.rol,'izleyici');equal(context.kimlik,`davet:${invite}`);
 equal(JSON.stringify(context).includes('izleyici@example.invalid'),false);
 const wait = await vivaKatilimHazirla({oku:viewer},{domain,sunucuOdada:async()=>true,
  odaHazirla:async()=>{throw Error('beklenmeyen oda isteği');},tokenOlustur:async()=>{throw Error('başlamadan token');}});
 equal(wait.durum,'bekliyor');equal(wait.neden,'zaman');

 await db.query("UPDATE viva_etkinlikler SET baslangic=now()-interval '1 minute',bitis=now()+interval '1 hour' WHERE etkinlik_id=$1",[event]);
 await db.query(`INSERT INTO viva_daily_odalar(etkinlik_id,domain,oda_adi,oda_id,durum,
  hedef_surumu,hedef_baslangic,hedef_bitis,eslesen_surumu)
  SELECT etkinlik_id,$2,$3,'yerel-oda','hazir',surum,baslangic,bitis,surum FROM viva_etkinlikler WHERE etkinlik_id=$1`,
  [event,domain,roomName]);
 let tokenCalls = 0, accessSaved = 0;
 const api = {domain,odaHazirla:async()=>{throw Error('beklenmeyen oda isteği');},sunucuOdada:async()=>true,
  tokenOlustur:async(settings)=>{tokenCalls++;equal(settings.is_owner,false);
   equal(settings.permissions.canSend,false);equal(settings.permissions.canAdmin,false);
   equal(settings.enable_screenshare,false);return 'yerel.daily.token';}};
 const result = await vivaKatilimHazirla({oku:viewer,erisimKaydet:async(d,dailyId)=>{
  accessSaved++;
  await db.query('SELECT viva_daily_yasam_islem(NULL,$1,$2,$3::jsonb)',[event,'erisim_kaydet',
   JSON.stringify({surum:d.surum,nesil:d.oda.nesil,daily_user_id:dailyId,davet_hash:tokenHash,oturum_hash:sessionHash})]);
 }},api);
 equal(result.durum,'hazir');equal(result.rol,'izleyici');equal(result.token,'yerel.daily.token');
 equal(tokenCalls,1);equal(accessSaved,1);
 equal((await db.query('SELECT count(*)::int n FROM viva_daily_erisimler WHERE etkinlik_id=$1',[event])).rows[0].n,1);

 const before = published.etkinlik.surum;
 await db.query('SELECT viva_islem($1,$2,$3::jsonb)',[owner,'davet_iptal',JSON.stringify({etkinlik_id:event,surum:before,davet_id:invite})]);
 equal((await guest(tokenHash,'bilgi',{oturum_hash:sessionHash})).status,403);
 await assert.rejects(viewer(),{code:'42501'});checks++;
 await db.query('SELECT viva_daily_yasam_islem(NULL,$1,$2,$3::jsonb)',[event,'ayir','{}']);
 equal((await db.query('SELECT engellendi FROM viva_daily_erisimler WHERE etkinlik_id=$1',[event])).rows[0].engellendi,true);
 equal((await db.query('SELECT durum FROM viva_eposta_gonderimleri WHERE davet_id=$1',[invite])).rows[0].durum,'iptal');

 console.log(JSON.stringify({passed:true,checks,scope:'yerel PostgreSQL ve sahte Daily; ağ/e-posta/canlı DB yok'}));
} finally {
 if (db) await db.end();
 if (started) execFileSync(join(bin,'pg_ctl'),['-D',dir,'-m','immediate','-w','stop']);
}
