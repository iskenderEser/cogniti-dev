import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const code = ts.transpileModule(readFileSync(new URL("../app/(panel)/token/api/urunler/route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function setup({ user = { id: "utt-a" }, profile = {}, active = true, teamFirm = "firma-a", fail = "" } = {}) {
  const calls = [];
  const tables = {
    kullanicilar: [{ kullanici_id: "utt-a", firma_id: "firma-a", takim_id: "takim-a", rol: "utt", aktif_mi: true, ...profile }],
    firmalar: [{ firma_id: "firma-a", aktif: active }],
    takimlar: [{ takim_id: "takim-a", firma_id: teamFirm }],
    urunler: [
      { urun_id: "urun-b", urun_adi: "Z Ürünü", firma_id: "firma-a", takim_id: "takim-a" },
      { urun_id: "urun-a", urun_adi: "A Ürünü", firma_id: "firma-a", takim_id: "takim-a" },
      { urun_id: "diger-takim", urun_adi: "Başka takım", firma_id: "firma-a", takim_id: "takim-b" },
      { urun_id: "takimsiz", urun_adi: "Firma geneli", firma_id: "firma-a", takim_id: null },
      { urun_id: "diger-firma", urun_adi: "Başka firma", firma_id: "firma-b", takim_id: "takim-a" },
    ],
  };
  const admin = { from(table) {
    const filters = []; let columns;
    calls.push({ table, filters });
    function result(single = false) {
      const data = (tables[table] ?? []).filter(row => filters.every(([key, value]) => row[key] === value))
        .map(row => Object.fromEntries(columns.split(",").map(key => [key.trim(), row[key.trim()]])));
      return { data: single ? data[0] ?? null : data, error: table === fail ? { code: "XX000" } : null };
    }
    const query = { select(value) { columns = value; return query; }, eq(key, value) { filters.push([key, value]); return query; }, order() { return query; }, maybeSingle: async () => result(true), then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); } };
    return query;
  } };
  const modules = {
    "next/server": { NextResponse: { json: Response.json.bind(Response) } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }), createAdminClient: () => admin },
    "@/lib/utils/roller": { TUKETICI_ROLLER: ["utt", "kd_utt"] },
    "@/lib/utils/hataIsle": { yetkiHatasi: () => Response.json({ hata: "Yetkisiz" }, { status: 401 }), sunucuHatasi: () => Response.json({ hata: "Sunucu hatası" }, { status: 500 }) },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => modules[name] });
  return { calls, get: () => exports.GET({ nextUrl: { searchParams: new URLSearchParams("firma_id=firma-b&takim_id=takim-b&kullanici_id=baska") } }) };
}
test("Oturumsuz istek veritabanını okumaz", async () => {
  const s = setup({ user: null }); assert.equal((await s.get()).status, 401); assert.equal(s.calls.length, 0);
});
test("UTT ve kıdemli UTT yalnız oturumdaki takımın ürünlerini alır", async () => {
  for (const rol of ["utt", "kd_utt"]) {
    const s = setup({ profile: { rol } }); const res = await s.get();
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { urunler: [{ urun_id: "urun-a", urun_adi: "A Ürünü" }, { urun_id: "urun-b", urun_adi: "Z Ürünü" }] });
    assert.equal(res.headers.get("Cache-Control"), "private, no-store");
  }
});
test("Takımsız kullanıcı için kapsam firma geneline açılmaz", async () => {
  const s = setup({ profile: { takim_id: null } }); const res = await s.get();
  assert.equal(res.status, 200); assert.deepEqual(await res.json(), { urunler: [] }); assert.ok(!s.calls.some(call => call.table === "urunler"));
});
test("Pasif kullanıcı, pasif firma ve diğer roller ürünlere erişemez", async () => {
  for (const options of [{ profile: { aktif_mi: false } }, { active: false }, { profile: { rol: "eczaci" } }, { profile: { rol: "tm" } }]) {
    const s = setup(options); assert.equal((await s.get()).status, 401); assert.ok(!s.calls.some(call => call.table === "urunler"));
  }
});
test("Takımın başka firmaya bağlı olması erişimi reddeder", async () => {
  const s = setup({ teamFirm: "firma-b" }); assert.equal((await s.get()).status, 401); assert.ok(!s.calls.some(call => call.table === "urunler"));
});
test("Sorgu hatası boş ürün listesi gibi gösterilmez", async () => {
  for (const fail of ["kullanicilar", "firmalar", "takimlar", "urunler"]) assert.equal((await setup({ fail }).get()).status, 500);
});
