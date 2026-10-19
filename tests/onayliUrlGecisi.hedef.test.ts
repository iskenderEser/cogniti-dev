import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import * as roller from "@/lib/utils/roller";
import { PANEL_NAV, mobilPanelNavOlustur, eclubKisiNavOlustur, type NavOge } from "@/components/panel/panelNav.config";
import * as kategoriler from "@/lib/video/uttVideoKategorileri";

function yukle(path: string, modules: Record<string, unknown>) {
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {} as {
    default: () => { type: unknown; props: { kategoriBilgisi: { icerikTuru: string }; temelYol?: string } };
    proxy: (request: unknown) => Promise<{ status: number }>;
  };
  vm.runInNewContext(compiled, { exports, URL, process: { env: {} }, require: (id: string) => {
    if (!(id in modules)) throw new Error(`Beklenmeyen bağımlılık: ${id}`);
    return modules[id];
  } });
  return exports;
}

test("tüm rollerin masaüstü ve mobil sidebar hedefleri mevcut sayfalara karşılık gelir", () => {
  const routes: string[] = [];
  function tara(path: string) {
    for (const f of readdirSync(path, { withFileTypes: true })) {
      const next = `${path}/${f.name}`;
      if (f.isDirectory()) tara(next);
      else if (f.name === "page.tsx") routes.push(next.replace(/^app/, "").replace(/\/page.tsx$/, "").replace(/\/\([^/]+\)/g, ""));
    }
  }
  tara("app");
  for (const rolKucu of [...roller.TUM_ROLLER, ...roller.ECLUB_TUKETICI_ROLLERI]) {
    const ctx = { rolKucu, storeAcik: true, ccAcik: true, eclubAcik: true, eclubStoreAcik: true, eczanemAcik: true };
    function kontrol(oge: NavOge) {
      if (!oge.gate(ctx)) return;
      const path = typeof oge.path === "function" ? oge.path(ctx) : oge.path;
      if (path) assert.ok(routes.some(route => new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`).test(path)), `${rolKucu}: ${path}`);
      oge.altOglar?.forEach(kontrol);
    }
    const gruplar = roller.ECLUB_TUKETICI_ROLLERI.includes(rolKucu) ? eclubKisiNavOlustur([]) : mobilPanelNavOlustur(PANEL_NAV, ctx);
    gruplar.forEach(g => g.oglar.forEach(kontrol));
  }
  for (const old of ["/cc-ligi", "/eclub/ligi", "/eclub/eczanelerim", "/videolar", "/store/siparisler", "/videolarim/[kategori]", "/yayindaki-videolar/[kategori]"]) {
    assert.ok(!routes.includes(old), old);
  }
});

test("altı tam eğitim adresi aynı içerik türünü korur ve rolün mevcut ekranını açar", () => {
  const notFound = () => { throw new Error("404"); };
  for (const kategori of kategoriler.UTT_VIDEO_KATEGORILERI) {
    assert.equal(kategoriler.uttVideoKategorisiBul(kategori.urlSlug), kategori);
    assert.equal(kategoriler.uttVideoKategorisiBul(kategori.slug), undefined);
    for (const rol of ["utt", "kd_utt", "bm", "tm", ...roller.YONETICI_ROLLER]) {
      const exports = yukle("app/(panel)/egitim-yayinlari/[kategori]/page.tsx", {
        "react/jsx-runtime": jsxRuntime,
        "next/navigation": { notFound, useParams: () => ({ kategori: kategori.urlSlug }) },
        "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici: { rol, adSoyad: "Test" }, yukleniyor: false }) },
        "@/components/ana-sayfa/UttAnaSayfa": { default: "utt-ekrani", UttKategoriIskeleti: "iskelet" },
        "@/components/yayin/BmEgitimYayinlari": { default: "katalog-ekrani" },
        "@/lib/video/uttVideoKategorileri": kategoriler,
        "@/lib/utils/roller": roller,
      });
      const element = exports.default();
      assert.equal(element.type, roller.TUKETICI_ROLLER.includes(rol) ? "utt-ekrani" : "katalog-ekrani");
      assert.equal(element.props.kategoriBilgisi.icerikTuru, kategori.icerikTuru);
      if (roller.TUKETICI_ROLLER.includes(rol)) assert.equal(element.props.temelYol, `/egitim-yayinlari/${kategori.urlSlug}`);
    }
  }
});

test("yeni lig adreslerinde kapalı firma modülleri API erişimini engeller", async () => {
  for (const path of ["/c-club-ligi/api", "/e-club-ligi/api"]) {
    const query = { select: () => query, eq: () => query,
      single: async () => ({ data: { firma_id: "firma", cc_aktif: false, eclub_aktif: false } }),
      maybeSingle: async () => ({ data: { firma_id: "firma" }, error: null }),
    };
    const exports = yukle("proxy.ts", {
      "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "u", app_metadata: {} } } }) } }) },
      "@supabase/supabase-js": { createClient: () => ({ from: () => query }) },
      "next/server": { NextResponse: { next: () => ({ status: 200 }), json: (_data: unknown, init: { status: number }) => ({ status: init.status }) } },
      "@/lib/utils/roller": roller,
      "@/lib/utils/rolCozucu": {},
      "@/lib/eclub/firmaGezinme": {},
      "@/lib/eclub/kisiErisim": {},
      "@/lib/eczanem/erisim": {},
    });
    assert.equal((await exports.proxy({ nextUrl: new URL(`http://localhost${path}`) })).status, 403, path);
  }
});

test("ortak /nedir adresi firma rollerine açılır ve Eczanem üyesinin modül kapısını korur", async () => {
  for (const [rol, acik, expected] of [["musteri", true, 200], ["musteri", false, 307], ["utt", false, 200], ["eczaci", false, 200]] as const) {
    const exports = yukle("proxy.ts", {
      "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "u", app_metadata: {} } } }) } }) },
      "@supabase/supabase-js": { createClient: () => ({}) },
      "next/server": { NextResponse: { next: () => ({ status: 200 }), redirect: () => ({ status: 307 }) } },
      "@/lib/utils/roller": roller,
      "@/lib/utils/rolCozucu": { rolCozucu: async () => rol },
      "@/lib/eclub/firmaGezinme": {},
      "@/lib/eclub/kisiErisim": {},
      "@/lib/eczanem/erisim": { eczanemRolErisimi: async () => ({ ok: true, acik }) },
    });
    const url = "http://localhost/nedir";
    assert.equal((await exports.proxy({ nextUrl: new URL(url), url })).status, expected);
  }
});

test("ortak Nedir sayfası Eczanem üyesiyle diğer rollerin mevcut kabuklarını ayırır", () => {
  for (const kimlik of ["musteri", "kullanici", "eclub_kisi"]) {
    const exports = yukle("app/nedir/page.tsx", {
      "react/jsx-runtime": jsxRuntime,
      "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici: { kimlik_turu: kimlik } }) },
      "@/app/(panel)/layout": { default: "panel-kabugu" },
      "@/components/panel/bilgi/BilgiSayfaCercevesi": { default: "bilgi-cercevesi" },
      "@/components/panel/bilgi/OgrenmeZinciri": { default: "ogrenme-zinciri" },
      "@/lib/utils/roller": roller,
      "./_components/EczanemNedir": { default: "eczanem-kabugu" },
    });
    assert.equal(exports.default().type, kimlik === "musteri" ? "eczanem-kabugu" : "panel-kabugu");
  }
});
