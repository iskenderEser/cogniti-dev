// Yalnız geçici yerel PostgreSQL + sahte veriler; canlı DB/ağ/e-posta çağrısı yok.
import { execFileSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import pg from 'pg';
import vm from 'node:vm';
import ts from 'typescript';
import * as sozlesme from '../lib/viva/sozlesme.ts';
import * as eposta from '../lib/viva/eposta.ts';
import * as roller from '../lib/utils/roller.ts';

const bin = process.env.VIVA_PG_BIN;
if (!bin) throw Error('VIVA_PG_BIN gerekli.');
const root = mkdtempSync('/tmp/cogniti-viva-eposta-');
const dir = join(root, 'data'), socket = join(root, 'socket'), port = 55450;
mkdirSync(socket);
const config = { host: socket, port, user: 'viva_test', database: 'postgres' };
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const candidate = (n, eposta) => ({ davet_id: id(n), eposta, token_hash: hash(`yalniz-test-${n}`) });
const form = (n, adresler = [], ek = {}) => ({ etkinlik_id: id(n), baslik: 'E-posta kaydı', aciklama: '',
 yayin_turu: 'planli', durum: 'taslak', baslangic: new Date(Date.now() + 3600000).toISOString(),
 bitis: new Date(Date.now() + 7200000).toISOString(), katilimcilar: [], davet_epostalari: adresler, ...ek });
let db, started = false, assertions = 0;
const passed = [];
const eq = (actual, expected) => { assertions++; assert.deepEqual(actual, expected); };
const count = async (table, event) => (await db.query(`SELECT count(*)::int n FROM ${table} WHERE etkinlik_id=$1`, [id(event)])).rows[0].n;
const save = async (n, op, data, adaylar = [], client = db) => (await client.query(
 'SELECT public.viva_eposta_kaydet($1,$2,$3::jsonb,$4::jsonb) AS v', [id(n), op, JSON.stringify(data), JSON.stringify(adaylar)])).rows[0].v;
const old = async (n, op, data) => (await db.query('SELECT public.viva_islem($1,$2,$3::jsonb) AS v', [id(n), op, JSON.stringify(data)])).rows[0].v;
const detail = async (n, event) => (await db.query('SELECT public.viva_eposta_detay($1,$2) AS v', [id(n), id(event)])).rows[0].v;
async function check(name, fn) { await fn(); passed.push(name); console.log(`OK ${passed.length}: ${name}`); }

try {
 execFileSync(join(bin, 'initdb'), ['-D', dir, '-U', 'viva_test', '-A', 'trust', '--no-locale', '--encoding=UTF8']);
 execFileSync(join(bin, 'pg_ctl'), ['-D', dir, '-l', join(root, 'postgres.log'), '-o', `-k ${socket} -h '' -p ${port}`, '-w', 'start']);
 started = true; db = new pg.Client(config); await db.connect();
 for (const file of ['tests/fixtures/viva-asama1-postgres.sql', 'scripts/sql/viva_asama1.sql',
  'scripts/sql/viva_anlik_planlama.sql', 'scripts/sql/viva_davet_kapsami.sql']) await db.query(readFileSync(file, 'utf8'));
 const migration = readFileSync('scripts/sql/viva_eposta_davetleri.sql', 'utf8');
 await check('Adım 2 SQL iki kez kurulabilir; mevcut RPC tanımları korunur', async () => {
  const previous = (await db.query("SELECT pg_get_functiondef('viva_islem(uuid,text,jsonb)'::regprocedure) AS v")).rows[0].v;
  await db.query(migration); await db.query(migration);
  eq((await db.query("SELECT pg_get_functiondef('viva_islem(uuid,text,jsonb)'::regprocedure) AS v")).rows[0].v, previous);
 });
 await db.query("INSERT INTO firmalar VALUES($1,'Firma A',true,true),($2,'Firma B',true,true)", [id(100), id(101)]);
 await db.query("INSERT INTO takimlar VALUES($1,$2,'Takım A'),($3,$4,'Takım B')", [id(110), id(100), id(111), id(101)]);
 await db.query("INSERT INTO bolgeler VALUES($1,$2,'Bölge A'),($3,$4,'Bölge B')", [id(120), id(110), id(121), id(111)]);
 const source = readFileSync('lib/utils/roller.ts', 'utf8');
 const named = key => [...source.split(`export const ${key} = [`)[1].split('];')[0].matchAll(/"([a-z_]+)"/g)].map(x => x[1]);
 const roles = [...named('URETICI_ROLLER'), ...named('YONETICI_ROLLER'), 'admin', 'tm', 'bm', 'utt', 'kd_utt', 'iu'];
 async function user(n, role, firm = 100, active = true) {
  await db.query('INSERT INTO kullanicilar VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
   [id(n), `Kişi ${n}`, 'Test', `k${n}@example.invalid`, role, id(firm), id(firm === 100 ? 110 : 111), id(firm === 100 ? 120 : 121), active]);
 }
 await user(1, 'utt'); await user(2, 'kd_utt'); await user(3, 'utt', 101); await user(4, 'utt', 100, false);
 for (let i = 0; i < roles.length; i++) await user(200 + i, roles[i]);
 await check('Tüm iç roller e-posta davetli taslak kaydını oluşturabilir', async () => {
  for (let i = 0; i < roles.length; i++) {
   const d = await save(200 + i, 'olustur', form(5000 + i, ['rol@example.invalid']), [candidate(6000 + i, 'rol@example.invalid')]);
   eq(d.eposta_davetleri.length, 1); eq(d.eposta_davetleri[0].durum, 'taslak'); eq(d.etkinlik.sahip_id, id(200 + i));
  }
 });
 const draft = form(1000, ['bir@example.invalid', 'iki@example.invalid']);
 await check('Taslakta adresler, sıraları ve sıfır gönderim bilgisi saklanır', async () => {
  const d = await save(1, 'olustur', draft, [candidate(2000, draft.davet_epostalari[0]), candidate(2001, draft.davet_epostalari[1])]);
  eq(d.eposta_davetleri.map(x => x.eposta), draft.davet_epostalari);
  eq(d.eposta_davetleri.map(x => [x.durum, x.deneme_sayisi, x.son_deneme, x.gonderim_zamani]), [['taslak', 0, null, null], ['taslak', 0, null, null]]);
  eq((await detail(1, 1000)).eposta_davetleri, d.eposta_davetleri);
  eq((await db.query('SELECT token_hash FROM viva_davetler WHERE davet_id=$1', [id(2000)])).rows[0].token_hash, candidate(2000, '').token_hash);
 });
 await check('Oluşturmayı tekrar denemek yeni davet veya yeni bağlantı oluşturmaz', async () => {
  const d = await save(1, 'olustur', draft, [candidate(2002, draft.davet_epostalari[0])]);
  eq(d.etkinlik.surum, 1); eq(await count('viva_davetler', 1000), 2);
  eq(d.eposta_davetleri.map(x => x.davet_id), [id(2000), id(2001)]);
  await assert.rejects(save(1, 'olustur', { ...draft, davet_epostalari: ['baska@example.invalid'] }), { code: '40001' });
 });
 await check('Boşluk, harf boyutu ve tekrarlar aynı adresin ikinci kaydını üretmez', async () => {
  const f = form(1001, [' ILK@EXAMPLE.INVALID ', 'ilk@example.invalid', 'ikinci@example.invalid']);
  const d = await save(1, 'olustur', f, [candidate(2010, 'ilk@example.invalid'), candidate(2011, 'ikinci@example.invalid')]);
  eq(d.eposta_davetleri.map(x => x.eposta), ['ilk@example.invalid', 'ikinci@example.invalid']); eq(await count('viva_davetler', 1001), 2);
 });
 await check('Yeni yayında ikinci davet hatalıysa yayın ve ilk davet de geri alınır', async () => {
  const f = form(1002, ['bir@example.invalid', 'iki@example.invalid']);
  await assert.rejects(save(1, 'olustur', f, [candidate(2020, f.davet_epostalari[0]), { ...candidate(2021, f.davet_epostalari[1]), token_hash: 'bozuk' }]), { code: '22023' });
  eq(await count('viva_etkinlikler', 1002), 0); eq(await count('viva_davetler', 1002), 0);
  eq((await db.query('SELECT count(*)::int n FROM viva_eposta_gonderimleri WHERE davet_id=$1', [id(2020)])).rows[0].n, 0);
 });
 await check('Düzenlemede eksik bağlantı özeti başlığı, sürümü ve eski daveti değiştirmez', async () => {
  await assert.rejects(save(1, 'kaydet', { ...draft, surum: 1, baslik: 'Değişmemeli', davet_epostalari: ['yeni@example.invalid'] }), { code: '22023' });
  const d = await detail(1, 1000); eq(d.etkinlik.baslik, draft.baslik); eq(d.etkinlik.surum, 1);
  eq(d.eposta_davetleri.map(x => x.iptal), [false, false]); eq(d.eposta_davetleri.map(x => x.durum), ['taslak', 'taslak']);
 });
 await check('Taslak yayımlanınca aynı davetler bekliyor olur; yeni kopya oluşmaz', async () => {
  const d = await save(1, 'kaydet', { ...draft, surum: 1, durum: 'planlandi' });
  eq(d.etkinlik.surum, 2); eq(d.eposta_davetleri.map(x => x.durum), ['bekliyor', 'bekliyor']);
  eq(d.eposta_davetleri.map(x => x.davet_id), [id(2000), id(2001)]); eq(await count('viva_davetler', 1000), 2);
 });
 await check('Planlı ve anlık yayınlar davetleri bekliyor olarak saklar, göndermez', async () => {
  for (const [n, anlik] of [[1003, false], [1004, true]]) {
   const f = form(n, ['yayin@example.invalid'], { durum: 'planlandi' });
   if (anlik) { f.yayin_turu = 'anlik'; f.sure_dakika = 60; delete f.baslangic; delete f.bitis; }
   const d = await save(1, 'olustur', f, [candidate(n + 1100, 'yayin@example.invalid')]);
   eq(d.eposta_davetleri[0].durum, 'bekliyor'); eq(d.eposta_davetleri[0].deneme_sayisi, 0); eq(d.eposta_davetleri[0].gonderim_zamani, null);
  }
 });
 await check('Gönderilmiş durum, bağlantı ve geçmiş zaman düzenlemede korunur', async () => {
  await db.query("UPDATE viva_eposta_gonderimleri SET durum='gonderildi',deneme_sayisi=1,gonderim_zamani=now() WHERE davet_id=$1", [id(2000)]);
  const before = (await detail(1, 1000)).eposta_davetleri[0];
  const d = await save(1, 'kaydet', { ...draft, surum: 2, durum: 'planlandi', davet_epostalari: [...draft.davet_epostalari].reverse() });
  eq(d.eposta_davetleri[1].davet_id, before.davet_id); eq(d.eposta_davetleri[1].durum, 'gonderildi');
  eq(d.eposta_davetleri[1].gonderim_zamani, before.gonderim_zamani); eq(d.eposta_davetleri[1].deneme_sayisi, 1);
 });
 await check('Kaldırılan adresin bağlantısı ve oturumu kapanır, diğer adres korunur', async () => {
  await db.query('UPDATE viva_davetler SET kod_hash=$2,oturum_hash=$3 WHERE davet_id=$1', [id(2001), hash('kod'), hash('oturum')]);
  const d = await save(1, 'kaydet', { ...draft, surum: 3, durum: 'planlandi', davet_epostalari: ['bir@example.invalid'] });
  const removed = d.eposta_davetleri.find(x => x.davet_id === id(2001)); eq(removed.iptal, true); eq(removed.durum, 'iptal');
  eq((await db.query('SELECT kod_hash,oturum_hash FROM viva_davetler WHERE davet_id=$1', [id(2001)])).rows[0], { kod_hash: null, oturum_hash: null });
  eq(d.eposta_davetleri.find(x => x.davet_id === id(2000)).durum, 'gonderildi');
 });
 await check('Kaldırılan adres yeniden eklendiğinde yeni davet açılır, eski bağlantı kapalı kalır', async () => {
  const d = await save(1, 'kaydet', { ...draft, surum: 4, durum: 'planlandi' }, [candidate(2200, 'iki@example.invalid')]);
  eq(d.eposta_davetleri.filter(x => !x.iptal).map(x => x.davet_id), [id(2000), id(2200)]);
  eq(d.eposta_davetleri.find(x => x.davet_id === id(2001)).iptal, true);
 });
 await check('Eski oluşturma isteği sonraki düzenlemeleri geri almaz', async () => {
  const d = await save(1, 'olustur', draft);
  eq(d.etkinlik.surum, 5); eq(d.eposta_davetleri.filter(x => !x.iptal).map(x => x.davet_id), [id(2000), id(2200)]);
 });
 await check('Sürümü eskimiş düzenleme hiçbir daveti değiştirmez', async () => {
  await assert.rejects(save(1, 'kaydet', { ...draft, surum: 1, durum: 'planlandi', davet_epostalari: [] }), { code: '40001' });
  eq((await detail(1, 1000)).eposta_davetleri.filter(x => !x.iptal).length, 2);
 });
 await check('Yayıncı dışındaki aynı firma ve başka firma kullanıcısı adresleri okuyamaz/değiştiremez', async () => {
  for (const userId of [2, 3, 4, 999]) {
   await assert.rejects(detail(userId, 1000), { code: '42501' });
   await assert.rejects(save(userId, 'kaydet', { ...draft, surum: 5 }), { code: '42501' });
  }
 });
 await check('Yayına davetli iç kullanıcı e-posta adreslerini ve durumlarını göremez', async () => {
  await save(1, 'olustur', form(1005, ['gizli@example.invalid'], { durum: 'planlandi', katilimcilar: [{ tur: 'ic', id: id(2) }] }), [candidate(2300, 'gizli@example.invalid')]);
  const d = await detail(2, 1005); eq(d.eposta_davetleri, []); eq(d.davetler, []);
 });
 await check('Ayrıntı token özetini, sağlayıcı kimliğini ve iş kilidini döndürmez', async () => {
  const serialized = JSON.stringify(await detail(1, 1000));
  for (const field of ['token_hash', 'kilit_id', 'kilit_bitis', 'saglayici_id', 'olusturma_ozeti']) eq(serialized.includes(field), false);
  const summary = (await db.query('SELECT olusturma_ozeti FROM viva_etkinlikler WHERE etkinlik_id=$1', [id(1000)])).rows[0].olusturma_ozeti;
  eq('p_davetler' in summary, false); eq(JSON.stringify(summary).includes('token_hash'), false);
 });
 await check('Mevcut manuel bağlantı daveti korunur; aynı adresin otomatik eklenmesi atomik reddedilir', async () => {
  const f = form(1006, [], { durum: 'planlandi' }); await save(1, 'olustur', f);
  await old(1, 'davet_ekle', { etkinlik_id: id(1006), surum: 1, ad: 'Misafir', eposta: 'manuel@example.invalid', hash: hash('manuel') });
  await assert.rejects(save(1, 'kaydet', { ...f, surum: 2, baslik: 'Değişmemeli', davet_epostalari: ['manuel@example.invalid'] }, [candidate(2310, 'manuel@example.invalid')]), { code: '22023' });
  eq((await detail(1, 1006)).etkinlik.surum, 2); eq((await detail(1, 1006)).etkinlik.baslik, f.baslik);
  await save(1, 'kaydet', { ...f, surum: 2 });
  eq((await detail(1, 1006)).davetler[0].iptal, false);
 });
 await check('Mevcut davet_iptal RPCsi yeni gönderim kaydını da kapatır', async () => {
  await old(1, 'davet_iptal', { etkinlik_id: id(1000), surum: 5, davet_id: id(2200) });
  const g = (await detail(1, 1000)).eposta_davetleri.find(x => x.davet_id === id(2200)); eq(g.iptal, true); eq(g.durum, 'iptal');
 });
 await check('Gönderiliyor durumundaki davet iptal edilince kilit ve yeniden deneme de kapanır', async () => {
  await db.query("UPDATE viva_eposta_gonderimleri SET durum='gonderiliyor',kilit_id=$2,kilit_bitis=now()+interval '2 minutes',deneme_sayisi=1,sonraki_deneme=now() WHERE davet_id=$1", [id(2300), id(9999)]);
  await old(1, 'iptal', { etkinlik_id: id(1005), surum: 1 });
  eq((await db.query('SELECT durum,kilit_id,kilit_bitis,sonraki_deneme FROM viva_eposta_gonderimleri WHERE davet_id=$1', [id(2300)])).rows[0],
   { durum: 'iptal', kilit_id: null, kilit_bitis: null, sonraki_deneme: null });
 });
 await check('Boş adres listesi eski RPC idempotansını değiştirmez', async () => {
  const f = form(1007); const legacy = { ...f }; delete legacy.davet_epostalari;
  await old(1, 'olustur', legacy); const d = await save(1, 'olustur', f); eq(d.etkinlik.surum, 1); eq(d.eposta_davetleri, []);
 });
 await check('Bozuk liste, eksik özet ve çakışan davet kimliği yarım kayıt bırakmaz', async () => {
  for (const [index, addresses, candidates] of [[0, 'a@example.invalid', []], [1, [null], []], [2, ['eksik@'], []],
   [3, ['a@example.invalid'], []], [4, ['a@example.invalid'], [candidate(2000, 'a@example.invalid')]],
   [5, ['a@example.invalid'], [candidate(2500, 'a@example.invalid'), candidate(2501, 'a@example.invalid')]]]) {
   await assert.rejects(save(1, 'olustur', form(1010 + index, addresses), candidates)); eq(await count('viva_etkinlikler', 1010 + index), 0);
  }
 });
 await check('Durum, deneme sayısı, gönderim zamanı ve kilit tutarlılığı DB kısıtlarıyla korunur', async () => {
  for (const set of ["durum='bilinmeyen'", 'deneme_sayisi=-1', "durum='gonderildi',gonderim_zamani=NULL",
   "durum='gonderiliyor'", 'kilit_id=gen_random_uuid()', "durum='taslak',deneme_sayisi=1"]) {
   await assert.rejects(db.query(`UPDATE viva_eposta_gonderimleri SET ${set} WHERE davet_id=$1`, [id(2010)]), { code: '23514' });
  }
 });
 await check('İki eşzamanlı oluşturma tek yayın ve tek davet üretir', async () => {
  const a = new pg.Client(config), b = new pg.Client(config); await a.connect(); await b.connect();
  try {
   const f = form(1020, ['yaris@example.invalid']); await a.query('BEGIN');
   await save(1, 'olustur', f, [candidate(2600, 'yaris@example.invalid')], a);
   const pid = (await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
   const second = save(1, 'olustur', f, [candidate(2601, 'yaris@example.invalid')], b);
   let waiting = false;
   for (let i = 0; i < 200; i++) {
    const row = (await db.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1', [pid])).rows[0];
    if (row.wait_event_type === 'Lock') { waiting = true; break; }
    await new Promise(resolve => setTimeout(resolve, 5));
   }
   eq(waiting, true); await a.query('COMMIT'); const d = await second;
   eq(await count('viva_etkinlikler', 1020), 1); eq(await count('viva_davetler', 1020), 1); eq(d.eposta_davetleri[0].davet_id, id(2600));
  } finally { await a.query('ROLLBACK'); await a.end(); await b.end(); }
 });
 await check('Yeni tablo/RPC anon ve istemciye kapalı, yalnız sunucuya açıktır', async () => {
  for (const fn of ['viva_eposta_kaydet(uuid,text,jsonb,jsonb)', 'viva_eposta_detay(uuid,uuid)', 'viva_eposta_iptal_esitle()']) {
   const row = (await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') a,has_function_privilege('authenticated',$1,'EXECUTE') b,has_function_privilege('service_role',$1,'EXECUTE') c", [fn])).rows[0];
   eq(row, { a: false, b: false, c: true });
  }
  for (const role of ['anon', 'authenticated']) for (const action of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
   eq((await db.query("SELECT has_table_privilege($1,'viva_eposta_gonderimleri',$2) AS v", [role, action])).rows[0].v, false);
  }
  eq((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='viva_eposta_gonderimleri'::regclass")).rows[0].relrowsecurity, true);
 });
 // Gerçek sunucu kodu aynı yerel DB'ye bağlanır; Supabase istemcisi ve e-posta ağı sahtedir.
 let emailCalls = 0;
 function server(authId) {
  const adapter = {
   rpc: async (name, p) => {
    try {
     let q;
     if (name === 'viva_davet_baglami') q = await db.query('SELECT viva_davet_baglami($1) AS v', [p.p_auth]);
     else if (name === 'viva_islem') q = await db.query('SELECT viva_islem($1,$2,$3::jsonb) AS v', [p.p_auth, p.p_islem, JSON.stringify(p.p_veri)]);
     else if (name === 'viva_eposta_kaydet') q = await db.query('SELECT viva_eposta_kaydet($1,$2,$3::jsonb,$4::jsonb) AS v', [p.p_auth, p.p_islem, JSON.stringify(p.p_veri), JSON.stringify(p.p_davetler)]);
     else if (name === 'viva_eposta_detay') q = await db.query('SELECT viva_eposta_detay($1,$2) AS v', [p.p_auth, p.p_id]);
     else throw Error(`Beklenmeyen RPC: ${name}`);
     return { data: q.rows[0].v, error: null };
    } catch (error) { return { data: null, error }; }
   },
   from: table => {
    assert.equal(table, 'viva_etkinlikler');
    return { select: field => {
     assert.equal(field, 'sahip_id');
     return { eq: (column, value) => {
      assert.equal(column, 'etkinlik_id');
      return { maybeSingle: async () => ({ data: (await db.query('SELECT sahip_id FROM viva_etkinlikler WHERE etkinlik_id=$1', [value])).rows[0] ?? null, error: null }) };
     } };
    } };
   },
  };
  const modules = {
   'node:crypto': crypto, 'next/server': { NextResponse: {} }, './sozlesme': sozlesme, './eposta': eposta,
   '@/lib/utils/roller': roller,
   '@/lib/utils/rolCozucu': { rolCozucu: async (_client, uid) => (await db.query('SELECT rol FROM kullanicilar WHERE kullanici_id=$1', [uid])).rows[0]?.rol ?? '' },
   '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: authId } }, error: null }) } }), createAdminClient: () => adapter },
  };
  const exports = {};
  const code = ts.transpileModule(readFileSync('lib/viva/sunucu.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { assert(name in modules, name); return modules[name]; },
   process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'yalniz-yerel-postgres-test-anahtari' } },
   fetch: () => { emailCalls++; throw Error('Bu adım e-posta göndermemeli.'); },
  });
  return exports;
 }
 const api = server(id(1));
 const apiForm = form(1040, [' BIR@EXAMPLE.INVALID ', 'bir@example.invalid', 'iki@example.invalid']);
 let apiDraft;
 await check('Sunucu → PostgreSQL: normalize adresli taslak kaydedilir ve yeniden okunur', async () => {
  apiDraft = await api.vivaYaz('olustur', apiForm);
  eq(apiDraft.eposta_davetleri.map(x => x.eposta), ['bir@example.invalid', 'iki@example.invalid']);
  eq(apiDraft.eposta_davetleri.map(x => [x.durum, x.deneme_sayisi, x.gonderim_zamani]), [['taslak', 0, null], ['taslak', 0, null]]);
  const reloaded = await api.vivaOku('detay', { etkinlik_id: id(1040) }); eq(reloaded, JSON.parse(JSON.stringify(apiDraft)));
  for (const d of apiDraft.eposta_davetleri) {
   const raw = api.vivaEpostaDavetToken(d.davet_id);
   eq((await db.query('SELECT token_hash FROM viva_davetler WHERE davet_id=$1', [d.davet_id])).rows[0].token_hash, hash(raw));
   eq(JSON.stringify(reloaded).includes(raw), false);
  }
  eq(emailCalls, 0);
 });
 await check('Sunucu → PostgreSQL: taslağa adres ekleme/kaldırma atomik kaydedilir', async () => {
  const d = await api.vivaYaz('kaydet', { ...apiForm, surum: 1, davet_epostalari: ['iki@example.invalid', 'uc@example.invalid'] });
  eq(d.etkinlik.surum, 2); eq(d.eposta_davetleri.filter(x => !x.iptal).map(x => x.eposta), ['iki@example.invalid', 'uc@example.invalid']);
  eq(d.eposta_davetleri.find(x => x.eposta === 'bir@example.invalid').durum, 'iptal');
  eq(d.eposta_davetleri.find(x => x.eposta === 'iki@example.invalid').davet_id, apiDraft.eposta_davetleri[1].davet_id);
  eq(emailCalls, 0);
 });
 await check('Sunucu → PostgreSQL: taslak yayımlanınca kimlikler korunur, e-posta hâlâ gönderilmez', async () => {
  const before = await api.vivaOku('detay', { etkinlik_id: id(1040) });
  const d = await api.vivaYaz('kaydet', { ...apiForm, durum: 'planlandi', surum: 2, davet_epostalari: ['iki@example.invalid', 'uc@example.invalid'] });
  eq(d.etkinlik.surum, 3); eq(d.eposta_davetleri.filter(x => !x.iptal).map(x => x.davet_id), before.eposta_davetleri.filter(x => !x.iptal).map(x => x.davet_id));
  eq(d.eposta_davetleri.filter(x => !x.iptal).map(x => x.durum), ['bekliyor', 'bekliyor']); eq(emailCalls, 0);
 });
 await check('Sunucu → PostgreSQL: yanıt kaybındaki oluşturma tekrarı düzenlemeleri geri almaz', async () => {
  const d = await api.vivaYaz('olustur', apiForm); eq(d.etkinlik.surum, 3); eq(await count('viva_davetler', 1040), 3);
  eq(d.eposta_davetleri.filter(x => !x.iptal).map(x => x.eposta), ['iki@example.invalid', 'uc@example.invalid']);
 });
 await check('Sunucu → PostgreSQL: tüm adresleri kaldırma boş listeyle kayda yansır', async () => {
  const d = await api.vivaYaz('kaydet', { ...apiForm, durum: 'planlandi', surum: 3, davet_epostalari: [] });
  eq(d.etkinlik.surum, 4); eq(d.eposta_davetleri.filter(x => !x.iptal), []); eq(emailCalls, 0);
 });
 await check('Sunucu → PostgreSQL: başka yayıncı adresleri okuyamaz veya düzenleyemez', async () => {
  const other = server(id(2));
  await assert.rejects(other.vivaOku('detay', { etkinlik_id: id(1040) }), { code: '42501' });
  await assert.rejects(other.vivaYaz('kaydet', { ...apiForm, durum: 'planlandi', surum: 4, davet_epostalari: [] }), { code: '42501' });
  eq((await api.vivaOku('detay', { etkinlik_id: id(1040) })).etkinlik.surum, 4);
 });
 const result = { passed: passed.length, assertions, roles, tests: passed,
  scope: 'Yalnız ayrı yerel PostgreSQL / Unix socket / sahte veriler; canlı DB uygulanmadı, e-posta gönderilmedi.' };
 if (process.env.VIVA_TEST_RESULT) writeFileSync(process.env.VIVA_TEST_RESULT, JSON.stringify(result, null, 2));
 console.log(`Toplam: ${passed.length} senaryo, ${assertions} doğrulama, ${roles.length} rol.`);
} finally {
 await db?.end().catch(() => {});
 if (started) execFileSync(join(bin, 'pg_ctl'), ['-D', dir, '-m', 'immediate', '-w', 'stop']);
}
