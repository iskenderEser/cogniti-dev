import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { eclubFirmaKapsami } from "@/lib/eclub/firmaGezinme";
const firmaId = "10000000-0000-4000-8000-000000000001";
function api({ auth = true, allowed = true, kisi = true, fail = false } = {}) {
  const reads: string[] = [];
  let erisimSayisi = 0;
  const rows = [
    { talep_id: "t", eczane_id: "e", firma_id: firmaId, v_yayin_kunye: { urun_id: "u" }, firmalar: { firma_adi: "Firma" }, durum: "beklemede", toplanan_puan: 100 },
    { talep_id: "foreign", eczane_id: "baska-eczane", firma_id: firmaId },
    { talep_id: "foreign-firma", eczane_id: "e", firma_id: "baska-firma" },
  ];
  const admin = { from(table: string) {
    reads.push(table);
    assert.ok(["eclub_store_cek_talepleri", "urunler"].includes(table), "kişi ve üyelik tekrar okunmamalı");
    let data: Record<string, unknown>[] = table === "urunler" ? [{ urun_id: "u", urun_adi: "Ürün" }] : [...rows];
    const query = {
      select() { return query; }, order() { return query; },
      in(key: string, ids: unknown[]) { data = data.filter(r => ids.includes(r[key])); return query; },
      eq(key: string, value: unknown) { data = data.filter(r => r[key] === value); return query; },
      then(resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) {
        return Promise.resolve({ data: fail ? null : data, error: fail ? { message: "Okuma hatası" } : null }).then(resolve, reject);
      },
    };
    return query;
  } };
  const json = (hata: string, status: number) => Response.json({ hata }, { status });
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: Response },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: auth ? { id: "auth" } : null } }) } }), createAdminClient: () => admin },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: async () => { erisimSayisi++; return { kisi: kisi ? { kisi_id: "k", rol: "eczaci" } : null, eczane_idler: ["e"], firmalar: allowed ? [{ firma_id: firmaId, firma_adi: "Firma", aktif: true, eclub_aktif: true, eclub_store_aktif: true }] : [] }; } },
    "@/lib/eclub/firmaGezinme": { eclubFirmaKapsami },
    "@/lib/uretim/rpc": { uuidGecerliMi: (s: string) => /^[a-f0-9-]{36}$/i.test(s) },
    "@/lib/utils/roller": { ECLUB_TUKETICI_ROLLERI: ["eczaci"] },
    "@/lib/utils/hataIsle": { yetkiHatasi: () => json("Yetkisiz", 401), rolHatasi: (s: string) => json(s, 403), validasyonHatasi: (s: string) => json(s, 400), hataYaniti: () => json("Hata", 500), sunucuHatasi: () => json("Hata", 500) },
    "@/lib/eclub/store/takvim": {}, "@/lib/eclub/store/cekTalebiYetkisi": {},
    "@/lib/eclub/store/gorunumTesti": { eclubCekTalebiGorunumTestiMi: () => false },
  };
  const compiled = ts.transpileModule(readFileSync("app/(panel)/eclub/api/cek-talepleri/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: { GET?: (r: Request) => Promise<Response> } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => { if (!(id in modules)) throw new Error(id); return modules[id]; }, URL });
  return { get: (query = `firma_id=${firmaId}`) => exports.GET!(new Request(`http://localhost/eclub/api/cek-talepleri?${query}`)), reads, erisimSayisi: () => erisimSayisi };
}
test("çek takibi erişimi bir kez çözülür; ürün ve eczane/firma kapsamı korunur", async () => {
  const page = api();
  const response = await page.get();
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.talepler.length, 1);
  assert.equal(data.talepler[0].talep_id, "t");
  assert.equal(data.talepler[0].urun_adi, "Ürün");
  assert.equal(page.erisimSayisi(), 1);
  assert.deepEqual(page.reads, ["eclub_store_cek_talepleri", "urunler"]);
});
test("oturum, firma ve geçersiz parametreler reddedilir; okuma hatası boş başarı değildir", async () => {
  for (const [options, status] of [[{ auth: false }, 401], [{ allowed: false }, 403], [{ kisi: false }, 403]] as const) {
    const page = api(options); assert.equal((await page.get()).status, status); assert.deepEqual(page.reads, []);
  }
  const bad = api(); assert.equal((await bad.get("firma_id=bad")).status, 400); assert.deepEqual(bad.reads, []);
  assert.equal((await api({ fail: true }).get()).status, 500);
});
