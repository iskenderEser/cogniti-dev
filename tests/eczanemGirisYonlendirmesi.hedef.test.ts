import * as baslangic from "@/lib/panel/baslangic";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as roller from "@/lib/utils/roller";

function testProxy(rol?: "bm" | "tm" | "gm" | "pm") {
  const exports: { proxy?: (request: unknown) => Promise<Response> } = {};
  const beklenmeyenSorgu = () => { throw new Error("Oturumsuz istekte rol/modül verisi okunamaz"); };
  const modules: Record<string, unknown> = {
    "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: rol ? { id: rol, app_metadata: {} } : null } }) } }) },
    "@supabase/supabase-js": { createClient: rol ? () => ({ from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: { rol }, error: null }),
    }) }) }) }) : beklenmeyenSorgu },
    "next/server": { NextResponse: { next: () => new Response(null), redirect: (url: URL) => Response.redirect(url, 307), json: Response.json } },
    "@/lib/utils/roller": roller,
    "@/lib/panel/baslangic": baslangic,
    "@/lib/utils/rolCozucu": { rolCozucu: rol ? async () => rol : beklenmeyenSorgu },
    "@/lib/admin/firmaAdminErisimi": {},
    "@/lib/eclub/firmaGezinme": { eclubFirmaRotasiKapsami: beklenmeyenSorgu },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: beklenmeyenSorgu },
    "@/lib/eczanem/erisim": { ECZANEM_KAPALI_MESAJI: "Kapalı", eczanemRolErisimi: rol ? async () => ({ ok: true, acik: true }) : beklenmeyenSorgu },
  };
  const compiled = ts.transpileModule(readFileSync("proxy.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, URL, process: { env: {} }, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  assert.ok(exports.proxy);
  return (pathname: string) => exports.proxy!({ url: `http://localhost${pathname}`, nextUrl: new URL(`http://localhost${pathname}`), cookies: { getAll: () => [] } });
}

test("oturumsuz Eczanem sayfaları ortak girişe yönlenir; silinmiş giriş adresine gitmez", async () => {
  const proxy = testProxy();
  for (const path of ["/eczanem", "/eczanem/puanlarim", "/eczanem/eczane", "/eczanem/utt", "/eczanem/bm", "/eczanem/tm"]) {
    const response = await proxy(path);
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get("location"), "http://localhost/login", path);
  }
});

test("Üretici yayın yolları üretici oturumunda açılır", async () => {
  const pm = testProxy("pm");
  for (const yol of ["/eczanem/uretici/yayinlar", "/eczanem/uretici/uyelere-gonderilen-yayinlar", "/eczanem/uretici/api/yayinlar"]) {
    assert.equal((await pm(yol)).status, 200);
  }
  assert.equal((await testProxy("tm")("/eczanem/uretici/api/yayinlar")).status, 403);
});

test("oturumsuz Eczanem API çağrıları yönlenmez; 401 JSON döner", async () => {
  const proxy = testProxy();
  for (const path of ["/eczanem/api/videolar", "/eczanem/api/puanlar", "/eczanem/api/bannerlar", "/eczanem/eczane/api/uyeler"]) {
    const response = await proxy(path);
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get("location"), null);
    assert.match((await response.json()).error, /Oturum/);
  }
});

test("TM yayın isteği TM yolundan geçer ve BM yolunda engellenir", async () => {
  const tm = testProxy("tm");
  assert.equal((await tm("/eczanem/tm/api/yayinlar?gorunum=eczane")).status, 200);
  assert.equal((await tm("/eczanem/bm/api/yayinlar?gorunum=eczane")).status, 403);
  assert.equal((await testProxy("bm")("/eczanem/tm/api/yayinlar?gorunum=eczane")).status, 403);
});

test("Yönetici mutabakat ekranı ve API'si yönetici rolünden açılır", async () => {
  const yol = "/eczanem/yonetici/api/mutabakat";
  assert.equal((await testProxy("gm")("/eczanem/yonetici/mutabakat-takip")).status, 200);
  assert.equal((await testProxy("gm")(yol)).status, 200);
  assert.equal((await testProxy("tm")(yol)).status, 403);
  assert.equal((await testProxy("gm")("/eczanem/tm/api/mutabakat")).status, 403);
});
