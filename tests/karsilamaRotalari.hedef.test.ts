import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import type { NextRequest, NextResponse } from "next/server";
import { createRequire } from "node:module";
const nextServer = createRequire(import.meta.url)("next/server");
import * as roller from "@/lib/utils/roller";
import * as baslangic from "@/lib/panel/baslangic";

function ortam(user: { id: string; app_metadata: Record<string, unknown> } | null = null, cookieYenile = false) {
  let sorgular = 0;
  const yasak = () => { sorgular++; throw new Error("Bu yol rol/modül sorgusu açmamalı"); };
  const modules: Record<string, unknown> = {
    "@/lib/panel/baslangic": baslangic,
    "@supabase/ssr": { createServerClient: (_url: string, _key: string, opts: { cookies: { setAll: (cookies: unknown[]) => void } }) => ({
      auth: { getUser: async () => {
        if (cookieYenile) opts.cookies.setAll([{ name: "test-session", value: "", options: { path: "/", maxAge: 0, httpOnly: true } }]);
        return { data: { user } };
      } },
    }) },
    "@supabase/supabase-js": { createClient: yasak },
    "next/server": { NextResponse: nextServer.NextResponse },
    "@/lib/utils/roller": roller,
    "@/lib/utils/rolCozucu": { rolCozucu: yasak },
    "@/lib/eclub/firmaGezinme": { eclubFirmaRotasiKapsami: yasak },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: yasak },
    "@/lib/eczanem/erisim": { ECZANEM_KAPALI_MESAJI: "Kapalı", eczanemRolErisimi: yasak },
  };
  const exports: { proxy?: (req: NextRequest) => Promise<NextResponse> } = {};
  const code = ts.transpileModule(readFileSync("proxy.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, process: { env: {} }, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  assert.ok(exports.proxy);
  return { iste: (path: string) => exports.proxy!(new nextServer.NextRequest("http://localhost:3000" + path)), sorgular: () => sorgular };
}

test("oturumsuz /ana-sayfa adresi korunarak kök karşılama içeriği sunulur", async () => {
  const o = ortam();
  const res = await o.iste("/ana-sayfa?kaynak=test");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("location"), null);
  assert.equal(res.headers.get("x-middleware-rewrite"), "http://localhost:3000/?kaynak=test");
  assert.equal(o.sorgular(), 0);
});

test("oturum çerezi yenileme/silme karşılama rewrite yanıtında korunur", async () => {
  const o = ortam(null, true);
  const res = await o.iste("/ana-sayfa");
  assert.equal(res.cookies.get("test-session")?.maxAge, 0);
  assert.equal(res.cookies.get("test-session")?.httpOnly, true);
});

test("oturumlu /ana-sayfa mevcut panel yolunda kalır", async () => {
  const o = ortam({ id: "sahte", app_metadata: {} });
  const res = await o.iste("/ana-sayfa");
  assert.equal(res.headers.get("x-middleware-rewrite"), null);
  assert.equal(res.headers.get("location"), null);
  assert.equal(res.headers.get("x-middleware-next"), "1");
  assert.equal(o.sorgular(), 0);
});

test("/login ve diğer yollar karşılama içeriğine çevrilmez; korumalar devam eder", async () => {
  const o = ortam();
  for (const path of ["/", "/login", "/sifre-yenile", "/ana-sayfa/api"]) {
    const res = await o.iste(path);
    assert.equal(res.headers.get("x-middleware-rewrite"), null, path);
    assert.equal(res.headers.get("location"), null, path);
  }
  assert.equal((await o.iste("/eczanem")).headers.get("location"), "http://localhost:3000/login");
  assert.equal((await o.iste("/eczanem/api/videolar")).status, 401);
});

test("bekleyen davetli oturum /ana-sayfa üzerinden paneli açamaz", async () => {
  const o = ortam({ id: "sahte", app_metadata: { eclub_davet_bekliyor: true } });
  const res = await o.iste("/ana-sayfa");
  assert.equal(res.headers.get("location"), "http://localhost:3000/davet-bekliyor");
  assert.equal(res.headers.get("x-middleware-rewrite"), null);
});

test("kök adres /login yönlendirmesi yerine karşılama sayfasını döndürür", () => {
  const Welcome = () => null;
  const modules: Record<string, unknown> = { "react/jsx-runtime": jsxRuntime, "./_components/KarsilamaSayfasi": { default: Welcome } };
  const exports: { default?: () => { type: unknown } } = {};
  const code = ts.transpileModule(readFileSync("app/page.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  assert.equal(exports.default!().type, Welcome);
});
