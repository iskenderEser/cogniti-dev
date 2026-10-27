import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../app/(panel)/oneriler/api/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const requests = [
  { yayin_id: 'pub-1', kullanici_id: 'utt-1', oneri_baslangic: '2030-01-02', oneri_bitis: '2030-01-04' },
  { yayin_id: 'pub-1', kullanici_id: 'utt-2', oneri_baslangic: '2030-01-02', oneri_bitis: '2030-01-04' },
];
function setup({ dbError = null, dateExpires = false } = {}) {
  const inserts = [], notifications = [];
  let dateCalls = 0;
  const db = { from(table) {
    const filters = new Map(); let insert;
    const query = {
      select() { return query; },
      eq(k, v) { filters.set(k,v); return query; },
      in(k, v) { filters.set(k,v); return query; },
      insert(rows) { insert = rows; inserts.push(rows); return query; },
      single() { return query; },
      then(resolve, reject) {
        let value;
        if (table === 'kullanicilar' && filters.get('kullanici_id') === 'bm-1') {
          value = { data: { firma_id: 'firm-1', bolge_id: 'region-1', takim_id: 'team-1' }, error: null };
        } else if (table === 'kullanicilar') {
          value = { data: requests.map(r => ({ kullanici_id: r.kullanici_id })), error: null };
        } else if (table === 'v_yayin_detay') {
          value = { data: [{ yayin_id: 'pub-1', durum: 'yayinda', urun_adi: 'Ürün', hedef_roller: ['utt'], firma_id: 'firm-1', takim_id: 'team-1' }], error: null };
        } else if (table === 'oneri_kayitlari') {
          value = { data: dbError ? null : insert.map((r,i) => ({ ...r, oneri_id: `oneri-${i}` })), error: dbError };
        } else throw new Error(`Beklenmeyen tablo: ${table}`);
        return Promise.resolve(value).then(resolve, reject);
      },
    };
    return query;
  } };
  const errors = {
    yetkiHatasi: () => Response.json({ hata: 'Yetkisiz' }, { status: 401 }),
    rolHatasi: () => Response.json({ hata: 'Rol hatası' }, { status: 403 }),
    validasyonHatasi: msg => Response.json({ hata: msg }, { status: 422 }),
    isKuraluHatasi: msg => Response.json({ hata: msg }, { status: 422 }),
    hataYaniti: msg => Response.json({ hata: msg }, { status: 500 }),
    sunucuHatasi: e => { throw e; },
  };
  const modules = {
    'next/server': { NextResponse: { json: Response.json.bind(Response) } },
    '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'bm-1' } }, error: null }) } }),
      createAdminClient: () => db,
    },
    '@/lib/utils/roller': { TUKETICI_ROLLER: ['utt','kd_utt'], YONLENDIRICI_ROLLER: ['bm','tm'], hedefRolleriOku: y => y.hedef_roller },
    '@/lib/utils/hataIsle': errors,
    '@/lib/utils/bildirimOlustur': { bildirimOlustur: async p => notifications.push(p) },
    '@/lib/tclub/oneri/tarihKurali': { oneriTarihKurali: (a,b) => {
      dateCalls++;
      return dateExpires && dateCalls > requests.length ? { gecerli: false, sebep: 'gecmis_tarih' } : {
        gecerli: true, baslangic_timestamp: `${a}T04:00:00Z`, bitis_timestamp: `${b}T17:30:00Z`,
      };
    } },
    '@/lib/tclub/oneri/limitKontrol': {
      haftalikLimitKontrol: async () => ({ hepsi_geciyor: true }),
      aylikKotaKontrol: async () => ({ geciyor: true }), MAKS_ALICI_HAFTA: 3,
    },
    '@/lib/utils/rolCozucu': { rolCozucu: async () => 'bm' },
    '@/lib/utils/raporUtils': { PERIYOTLAR: [] },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => {
    if (name in modules) return modules[name];
    // Bu bağımlılıklar yalnız GET yolunda kullanılıyor.
    if (name.startsWith('@/lib/')) return {};
    throw new Error(`Beklenmeyen modül: ${name}`);
  }, console, Response });
  return { inserts, notifications, post: () => exports.POST({ json: async () => ({ oneriler: requests }) }) };
}

test('İki BM önerisi tek toplu INSERT ile kaydedilir; bildirimler başarıdan sonra oluşturulur', async () => {
  const s = setup(); const response = await s.post(); const data = await response.json();
  assert.equal(response.status, 201); assert.equal(s.inserts.length, 1);
  assert.equal(s.inserts[0].length, 2); assert.equal(data.oneriler.length, 2);
  assert.equal(s.notifications.length, 2);
  assert.ok(s.inserts[0].every(r => r.oneren_id === 'bm-1'));
});
for (const [code,message] of [
  ['bakiye_yetersiz', /token bakiyesi.*yetersiz/],
  ['hesap_yok', /token hesabı.*açılmamış/],
]) test(`Token hatası ${code}: tek toplu istek başarısız olur, bildirim oluşturulmaz`, async () => {
  const s = setup({ dbError: { code: 'P0001', message: `COGNITI_TOKEN:${code}` } });
  const response = await s.post(); const data = await response.json();
  assert.equal(response.status, 422); assert.match(data.hata, message);
  assert.equal(s.inserts.length, 1); assert.equal(s.notifications.length, 0);
});
test('Veritabanı hatasında başarı dönülmez ve bildirim oluşturulmaz', async () => {
  const s = setup({ dbError: { code: '23514', message: 'fixture error' } });
  const response = await s.post(); assert.equal(response.status, 500);
  assert.equal(s.notifications.length, 0);
});
test('Gönderim öncesi tarih geçersizleşirse hiç INSERT yapılmaz', async () => {
  const s = setup({ dateExpires: true }); const response = await s.post();
  assert.equal(response.status, 422); assert.equal(s.inserts.length, 0);
  assert.equal(s.notifications.length, 0);
});
