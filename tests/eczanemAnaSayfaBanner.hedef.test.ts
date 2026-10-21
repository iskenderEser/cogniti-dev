import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { PLATFORM_FIRMA_ID } from "@/lib/eclub/banner";

const firmaId = "11111111-1111-4111-8111-111111111111";
const eczaneId = "22222222-2222-4222-8222-222222222222";
function ortam() {
  const durum = { user: { id: "uye" } as { id: string } | null, kimlik: true, firma: true, eclub: true, bag: true, eczaneIdler: [eczaneId], firmaIdler: [firmaId], hata: null as { code: string } | null };
  const sorgular: Array<[string, unknown]> = [], okumalar: Array<[string, string]> = [];
  const json = (veri: unknown, options?: ResponseInit) => Response.json(veri, options);
  const admin = { from: (tablo: string) => {
    sorgular.push(["from", tablo]);
    const filtreler: Record<string, unknown> = {};
    const chain = { select: (alan: string) => { sorgular.push(["select", alan]); return chain; }, eq: (alan: string, deger: unknown) => { sorgular.push([alan, deger]); filtreler[alan] = deger; return chain; }, maybeSingle: async () => ({ data: (tablo === "firmalar" ? durum.firma && (filtreler.eclub_aktif !== true || durum.eclub) : durum.bag) ? { firma_id: filtreler.firma_id } : null, error: null }) };
    return chain;
  } };
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: { json } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: durum.user }, error: null }) } }), createAdminClient: () => admin },
    "@/lib/eczanem/oturum": { musteriKimligi: async (_: unknown, id: string) => { assert.equal(id, "uye"); return { ok: durum.kimlik, eczaneIdler: durum.eczaneIdler, firmaIdler: durum.firmaIdler }; } },
    "@/lib/eclub/banner": { PLATFORM_FIRMA_ID },
    "@/lib/uretim/rpc": { uuidGecerliMi: (id: string) => /^[a-f0-9-]{36}$/i.test(id) },
    "@/lib/eclub/bannerSunucu": { firmaBannerlariniOku: async (_: unknown, id: string, alan: string) => { okumalar.push([id, alan]); return { bannerlar: durum.hata ? [] : [{ sira: 1, url: `https://example.invalid/${id}.png` }], error: durum.hata }; } },
    "@/lib/utils/hataIsle": { yetkiHatasi: () => json({}, { status: 401 }), rolHatasi: () => json({}, { status: 403 }), validasyonHatasi: () => json({}, { status: 400 }), hataYaniti: () => json({}, { status: 500 }), sunucuHatasi: (e: unknown) => { throw e; } },
  };
  const exports: { GET?: (request: Request) => Promise<Response> } = {};
  const code = ts.transpileModule(readFileSync("app/eczanem/api/bannerlar/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  assert.ok(exports.GET);
  return { durum, sorgular, okumalar, GET: (sorgu = "") => exports.GET!(new Request(`http://localhost/eczanem/api/bannerlar${sorgu}`)) };
}

test("ana sayfa yalnız admin Eczanem üye alanından platform bannerlarını okur", async () => {
  const o = ortam(); const yanit = await o.GET();
  assert.equal(yanit.status, 200); assert.equal(yanit.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(o.sorgular, [["from", "firmalar"], ["select", "firma_id"], ["firma_id", PLATFORM_FIRMA_ID], ["aktif", true]]);
  assert.deepEqual(o.okumalar, [[PLATFORM_FIRMA_ID, "uye-ana-sayfa"]]);
});

test("firma bannerı yalnız seçili aktif eczane–firma kapsamında okunur", async () => {
  const o = ortam(); assert.equal((await o.GET(`?firma_id=${firmaId}&eczane_id=${eczaneId}`)).status, 200);
  assert.deepEqual(o.okumalar, [[firmaId, "uye-ana-sayfa"]]);
  assert.ok(o.sorgular.some(([alan, deger]) => alan === "eczanem_aktif" && deger === true));
  assert.deepEqual(o.sorgular.slice(0, 5), [["from", "eclub_eczane_firma"], ["select", "firma_id"], ["eczane_id", eczaneId], ["firma_id", firmaId], ["aktif_mi", true]]);
});

test("E-Club kapalı firmanın üye bannerı okunmaz; genel platform bannerı korunur", async () => {
  const o = ortam(); o.durum.eclub = false;
  assert.deepEqual(await (await o.GET(`?firma_id=${firmaId}&eczane_id=${eczaneId}`)).json(), { bannerlar: [] });
  assert.equal(o.okumalar.length, 0);
  assert.equal((await o.GET()).status, 200);
  assert.deepEqual(o.okumalar, [[PLATFORM_FIRMA_ID, "uye-ana-sayfa"]]);
});

test("oturumsuz ve yetkisiz eczane/firma istekleri banner okuyamaz; başka eczanedeki firma bağı yetmez", async () => {
  const o = ortam(); o.durum.user = null; assert.equal((await o.GET()).status, 401);
  o.durum.user = { id: "uye" }; o.durum.kimlik = false; assert.equal((await o.GET()).status, 403);
  o.durum.kimlik = true; o.durum.eczaneIdler = [];
  const query = `?firma_id=${firmaId}&eczane_id=${eczaneId}`;
  assert.equal((await o.GET(query)).status, 403);
  o.durum.eczaneIdler = [eczaneId]; o.durum.firmaIdler = []; assert.equal((await o.GET(query)).status, 403);
  o.durum.firmaIdler = [firmaId]; o.durum.bag = false; assert.equal((await o.GET(query)).status, 403);
  assert.equal(o.okumalar.length, 0);
});

test("eksik/bozuk kapsam parametreleri genel bannerlara düşmez", async () => {
  const o = ortam();
  for (const query of [`?firma_id=${firmaId}`, `?eczane_id=${eczaneId}`, "?firma_id=&eczane_id=", "?firma_id=bozuk&eczane_id=bozuk"]) assert.equal((await o.GET(query)).status, 400);
  assert.equal(o.okumalar.length, 0);
});

test("pasif firma boş banner döner; kurulum ve okuma hataları gizlenmez", async () => {
  const o = ortam(); o.durum.firma = false;
  assert.deepEqual(await (await o.GET()).json(), { bannerlar: [] }); assert.equal(o.okumalar.length, 0);
  o.durum.firma = true;
  for (const code of ["42P01", "XX000"]) { o.durum.hata = { code }; assert.equal((await o.GET()).status, 500); }
});
