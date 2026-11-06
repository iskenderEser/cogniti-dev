import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const repo = fileURLToPath(process.env.COGNITI_HAKEDIS_TEST_ROOT ?? new URL('../', import.meta.url)).replace(/\/$/, '');
const stage = process.env.COGNITI_HAKEDIS_TEST_STAGE ? fileURLToPath(process.env.COGNITI_HAKEDIS_TEST_STAGE) : null;
const require = createRequire(repo + '/package.json'), ts = require('typescript');
const id = n => '10000000-0000-4000-8000-' + String(n).padStart(12, '0');
const partner = id(11), admin = id(1);
let partnerAuth = true, adminRole = 'admin', adminActive = true, calls = [], rpcError = null, override;
const row = { siparis_id: id(21), partner_egitim_id: 'PE-10001', egitim_adi: 'Eğitim', siparis_tarihi: '2026-11-06T08:00:00+00:00',
  satin_alma_bedeli: 10000, hizmet_bedeli: 1500, hak_edis: 8500, kdv_tutari: 1700, kdvli_odenecek_tutar: 10200, planlanan_odeme_gunu: null, odenen_gun: null };
const list = (partnerId = partner, sayfa = 1) => ({ partner_id: partnerId, toplam: 1, sayfa, sayfa_boyutu: 20, kayitlar: [structuredClone(row)] });
const db = { rpc: async (name, args) => {
  calls.push({ name, args });
  return { data: override === undefined ? list(args.p_partner_id ?? partner, args.p_sayfa) : override, error: rpcError };
} };
const mocks = {
  '@/lib/agora/partnerProfilSunucu': { onayliPartnerBaglami: async () => partnerAuth ? { db, partnerId: partner, tokenOzeti: 'a'.repeat(64) } : null },
  '@/lib/utils/adminGirisKontrol': { adminGirisKontrol: async () => adminRole === 'admin' && adminActive
    ? { gecerli: true, kullaniciId: admin }
    : { gecerli: false, yanit: Response.json({ hata: 'Yetkisiz' }, { status: 403 }) } },
  '@/lib/supabase/server': { createAdminClient: () => db },
};
const cache = new Map();
function locate(relative) {
  const bases = [stage, repo].filter(Boolean);
  for (const base of bases) for (const ext of ['', '.ts', '.tsx']) {
    const p = path.join(base, relative + ext); if (existsSync(p)) return p;
  }
  throw new Error('Modül bulunamadı: ' + relative);
}
function load(relative) {
  const file = locate(relative); if (cache.has(file)) return cache.get(file).exports;
  const m = { exports: {} }; cache.set(file, m);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + code + '})')(name => mocks[name] ?? (name.startsWith('@/') ? load(name.slice(2)) : require(name)), m, m.exports);
  return m.exports;
}
const partnerRoute = load('app/partner/api/hak-edisleri/route.ts');
const adminRoute = load('app/admin/api/partnerler/[partnerId]/hak-edisleri/route.ts');
const helper = load('lib/agora/hakedis.ts');
const get = (query = '') => partnerRoute.GET(new Request('http://localhost/partner/api/hak-edisleri' + query));
const getAdmin = (partnerId = partner, query = '') => adminRoute.GET(new Request('http://localhost/admin/api/partnerler/' + partnerId + '/hak-edisleri' + query), { params: Promise.resolve({ partnerId }) });
let passed = 0;
const eq = (a, b) => { assert.deepEqual(a, b); passed++; };

eq(Object.keys(partnerRoute), ['GET']); eq(Object.keys(adminRoute), ['GET', 'PATCH']);
let res = await get('?partner_id=' + id(99));
eq(res.status, 200); eq(res.headers.get('cache-control'), 'private, no-store');
eq(calls.at(-1), { name: 'agora_partner_hakedisleri_oku', args: { p_token_ozeti: 'a'.repeat(64), p_sayfa: 1 } });
eq((await res.json()).partner_id, partner);
eq((await get('?sayfa=2')).status, 200); eq(calls.at(-1).args.p_sayfa, 2);
for (const value of ['', '0', '-1', '1.5', '1e2', '100001', 'x']) {
  const before = calls.length;
  eq((await get('?sayfa=' + value)).status, 400); eq((await getAdmin(partner, '?sayfa=' + value)).status, 400); eq(calls.length, before);
}
partnerAuth = false; const before = calls.length;
eq((await get()).status, 401); eq(calls.length, before); partnerAuth = true;
override = null; eq((await get()).status, 401); eq((await getAdmin()).status, 404); override = undefined;
const uppercasePartner = 'ABCDEF00-0000-4000-8000-000000000011';
res = await getAdmin(uppercasePartner); eq(res.status, 200);
eq(calls.at(-1), { name: 'agora_partner_admin_hakedisleri_oku', args: { p_admin_id: admin, p_partner_id: uppercasePartner.toLowerCase(), p_sayfa: 1 } });
eq((await getAdmin('yanlis')).status, 400);
for (adminRole of ['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per',
  'gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','tm','bm','utt','kd_utt','iu','firma_admin']) {
  const before = calls.length; eq((await getAdmin()).status, 403); eq(calls.length, before);
}
adminRole = 'admin'; adminActive = false; eq((await getAdmin()).status, 403); adminActive = true;
for (const [code, expected] of [['42501', 403], ['22023', 400], ['42883', 503], ['42703', 503], ['PGRST202', 503], ['XX000', 503]]) {
  rpcError = { code, message: 'gizli veritabanı ayrıntısı' };
  for (const invoke of [get, getAdmin]) { const r = await invoke(); eq(r.status, expected); eq((await r.text()).includes('gizli veritabanı'), false); }
}
rpcError = null;
for (const invalid of [list(id(99)), { ...list(), sayfa: 2 }, { ...list(), toplam: -1 }, { ...list(), sayfa_boyutu: 21 },
  { ...list(), kayitlar: [{ ...row, kdv_tutari: -1 }] }, { ...list(), kayitlar: [{ ...row, odenen_gun: 'yanlis' }] },
  { ...list(), toplam: 2, kayitlar: [row, row] }, { ...list(), kayitlar: [{ ...row, satin_alma_bedeli: '10000' }] }]) {
  override = invalid; eq((await get()).status, 503); eq((await getAdmin()).status, 503);
}
override = { ...list(), toplam: 0, kayitlar: [] }; eq((await get()).status, 200); eq((await getAdmin()).status, 200);
const samePE = { ...list(), toplam: 2, kayitlar: [row, { ...row, siparis_id: id(22) }] };
eq(helper.partnerHakEdisListesiGecerli(samePE, partner, 1), true);
override=undefined; rpcError=null; adminRole='admin'; adminActive=true;
const patch = (body, origin='http://localhost', partnerId=partner) => adminRoute.PATCH(new Request(
  'http://localhost/admin/api/partnerler/'+partnerId+'/hak-edisleri', {
    method:'PATCH', headers:{origin,'content-type':'application/json'}, body:JSON.stringify(body)
  }), {params:Promise.resolve({partnerId})});
const update={siparis_id:row.siparis_id,planlanan_odeme_gunu:'2027-01-20',onceki_odeme_gunu:null};
override={siparis_id:row.siparis_id,planlanan_odeme_gunu:'2027-01-20'};
eq((await patch(update)).status,200);
eq(calls.at(-1),{name:'agora_partner_admin_odeme_gunu_kaydet',args:{p_admin_id:admin,p_partner_id:partner,p_siparis_id:row.siparis_id,p_planlanan_odeme_gunu:'2027-01-20',p_onceki_odeme_gunu:null}});
let count=calls.length;
eq((await patch(update,'http://evil.example')).status,403);eq(calls.length,count);
for(const bad of ['2026-02-30','2027-13-01','0000-01-01','x',25,undefined]) {
  eq((await patch({...update,planlanan_odeme_gunu:bad})).status,400);
}
eq((await patch({...update,siparis_id:'bad'})).status,400);
eq((await patch({...update,onceki_odeme_gunu:undefined})).status,400);
for (adminRole of ['pm','partner','utt','firma_admin']) {
  count=calls.length;eq((await patch(update)).status,403);eq(calls.length,count);
}
adminRole='admin';
for(const [code,status] of [['40001',409],['42501',403],['P0002',404],['22023',400],['PGRST202',503]]) {
  rpcError={code};eq((await patch(update)).status,status);
}
rpcError=null;override={siparis_id:row.siparis_id,planlanan_odeme_gunu:null};
eq((await patch({...update,planlanan_odeme_gunu:null})).status,200);
override={siparis_id:id(99),planlanan_odeme_gunu:'2027-01-20'};
eq((await patch(update)).status,503);
console.log(JSON.stringify({ passed, scope: 'Gerçek iki GET route ve yanıt doğrulayıcı; sahte oturum/DB bağımlılıkları. Partner kapsamı, admin rolü, sayfalama ve hata ayrımı.' }));
