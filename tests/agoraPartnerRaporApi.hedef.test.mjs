import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const repo = fileURLToPath(process.env.COGNITI_RAPOR_TEST_ROOT ?? new URL('../', import.meta.url)).replace(/\/$/, '');
const stage = process.env.COGNITI_RAPOR_TEST_STAGE ? fileURLToPath(process.env.COGNITI_RAPOR_TEST_STAGE) : null;
const require = createRequire(repo + '/package.json'), ts = require('typescript');
const id = n => '10000000-0000-4000-8000-' + String(n).padStart(12, '0');
const partner = id(11), admin = id(1);
let partnerAuth = true, adminRole = 'admin', adminActive = true, calls = [], rpcError = null, override;
const row={egitim_id:id(21),partner_egitim_id:'PE-10001',egitim_adi:'Eğitim',satis_fiyati:3000,satilan_adet:5,toplam_satis:12000,begeni_sayisi:5,favori_sayisi:2};
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
const partnerRoute = load('app/partner/api/raporlar/route.ts');
const adminRoute = load('app/admin/api/partnerler/[partnerId]/raporlar/route.ts');
const helper = load('lib/agora/rapor.ts');
const get = (query = '') => partnerRoute.GET(new Request('http://localhost/partner/api/raporlar' + query));
const getAdmin = (partnerId = partner, query = '') => adminRoute.GET(new Request('http://localhost/admin/api/partnerler/' + partnerId + '/raporlar' + query), { params: Promise.resolve({ partnerId }) });
let passed = 0;
const eq = (a, b) => { assert.deepEqual(a, b); passed++; };

eq(Object.keys(partnerRoute),['GET']);eq(Object.keys(adminRoute),['GET']);
let res=await get('?partner_id='+id(99));eq(res.status,200);eq(res.headers.get('cache-control'),'private, no-store');
eq(calls.at(-1),{name:'agora_partner_raporlari_oku',args:{p_token_ozeti:'a'.repeat(64),p_sayfa:1}});eq((await res.json()).kayitlar[0].toplam_satis,12000);
eq((await get('?sayfa=2')).status,200);eq(calls.at(-1).args.p_sayfa,2);
res=await getAdmin('ABCDEF00-0000-4000-8000-000000000011');eq(res.status,200);eq(calls.at(-1).args.p_partner_id,'abcdef00-0000-4000-8000-000000000011');eq(calls.at(-1).args.p_admin_id,admin);
for(const value of ['',0,-1,'1.5','1e2',100001,'x']){const before=calls.length;eq((await get('?sayfa='+value)).status,400);eq((await getAdmin(partner,'?sayfa='+value)).status,400);eq(calls.length,before);}
eq((await getAdmin('bad')).status,400);
partnerAuth=false;let before=calls.length;eq((await get()).status,401);eq(calls.length,before);partnerAuth=true;
for(adminRole of ['pm','jr_pm','kd_pm','med_md','egt_md','egt_yrd_md','egt_yon','egt_uz','ik_drk','ik_md','ik_yrd_md','ik_uz','ik_per','gm','gm_yrd','drk','paz_md','blm_md','grp_pm','sm','tm','bm','utt','kd_utt','iu','firma_admin']){before=calls.length;eq((await getAdmin()).status,403);eq(calls.length,before);}adminRole='admin';
override=null;eq((await get()).status,401);eq((await getAdmin()).status,404);override=undefined;
for(const [code,status] of [['42501',403],['22023',400],['PGRST202',503],['42703',503],['XX000',503]]){rpcError={code,message:'gizli veritabanı ayrıntısı'};for(const fn of [get,getAdmin]){res=await fn();eq(res.status,status);eq((await res.text()).includes('gizli veritabanı'),false);}}rpcError=null;
for(const bad of [list(id(99)),{...list(),sayfa:2},{...list(),sayfa_boyutu:21},{...list(),toplam:-1},
 {...list(),kayitlar:[{...row,toplam_satis:-1}]},{...list(),kayitlar:[{...row,satilan_adet:1.5}]},
 {...list(),kayitlar:[{...row,begeni_sayisi:-1}]},{...list(),kayitlar:[{...row,satis_fiyati:'3000'}]},
 {...list(),toplam:2,kayitlar:[row,row]}]){override=bad;eq((await get()).status,503);eq((await getAdmin()).status,503);}
override={...list(),toplam:0,kayitlar:[]};eq((await get()).status,200);eq((await getAdmin()).status,200);
override={...list(),kayitlar:[{...row,satis_fiyati:null}]};eq((await get()).status,200);
console.log(JSON.stringify({passed,scope:'Yalnız partner rapor APIleri; gerçek route ve doğrulayıcı, sahte oturum/DB.'}));
