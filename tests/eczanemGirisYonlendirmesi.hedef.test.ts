import * as baslangic from "@/lib/panel/baslangic";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as roller from "@/lib/utils/roller";

function oturumsuzProxy() {
  const exports: { proxy?: (request: unknown) => Promise<Response> } = {};
  const beklenmeyenSorgu = () => { throw new Error("Oturumsuz istekte rol/modül verisi okunamaz"); };
  const modules: Record<string, unknown> = {
    "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) },
    "@supabase/supabase-js": { createClient: beklenmeyenSorgu },
    "next/server": { NextResponse: { next: () => new Response(null), redirect: (url: URL) => Response.redirect(url, 307), json: Response.json } },
    "@/lib/utils/roller": roller,
    "@/lib/panel/baslangic": baslangic,
    "@/lib/utils/rolCozucu": { rolCozucu: beklenmeyenSorgu },
    "@/lib/eclub/firmaGezinme": { eclubFirmaRotasiKapsami: beklenmeyenSorgu },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: beklenmeyenSorgu },
    "@/lib/eczanem/erisim": { ECZANEM_KAPALI_MESAJI: "Kapalı", eczanemRolErisimi: beklenmeyenSorgu },
  };
  const compiled = ts.transpileModule(readFileSync("proxy.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, URL, process: { env: {} }, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  assert.ok(exports.proxy);
  return (pathname: string) => exports.proxy!({ url: `http://localhost${pathname}`, nextUrl: new URL(`http://localhost${pathname}`), cookies: { getAll: () => [] } });
}

test("oturumsuz Eczanem sayfaları ortak girişe yönlenir; silinmiş giriş adresine gitmez", async () => {
  const proxy = oturumsuzProxy();
  for (const path of ["/eczanem", "/eczanem/puanlarim", "/eczanem/eczane", "/eczanem/utt", "/eczanem/bm", "/eczanem/tm"]) {
    const response = await proxy(path);
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get("location"), "http://localhost/login", path);
  }
});

test("oturumsuz Eczanem API çağrıları yönlenmez; 401 JSON döner", async () => {
  const proxy = oturumsuzProxy();
  for (const path of ["/eczanem/api/videolar", "/eczanem/api/puanlar", "/eczanem/api/bannerlar", "/eczanem/eczane/api/uyeler"]) {
    const response = await proxy(path);
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get("location"), null);
    assert.match((await response.json()).error, /Oturum/);
  }
});
