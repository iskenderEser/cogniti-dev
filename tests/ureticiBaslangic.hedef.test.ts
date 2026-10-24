import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { Window } from "happy-dom";
import ts from "typescript";
import * as baslangic from "@/lib/panel/baslangic";
import * as roller from "@/lib/utils/roller";
import { icerikUret } from "@/lib/push/icerik";
import { VARSAYILAN_FLAGS } from "@/lib/panel/panelCache";

function yukle<T>(dosya: string, modules: Record<string, unknown>, globals: Record<string, unknown> = {}): T {
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(dosya, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, URL, process: { env: {} }, ...globals,
    require: (id: string) => { assert.ok(id in modules, `${dosya}: ${id}`); return modules[id]; },
  });
  return exports as T;
}

for (const rol of roller.TUM_ROLLER) {
  test(`${rol}: başlangıç ve üretim push hedefi doğru; diğer roller korunur`, () => {
    const uretici = roller.URETICI_ROLLER.includes(rol);
    assert.equal(baslangic.panelBaslangici(rol).yol, uretici ? "/yayin-yonetimi" : "/ana-sayfa");
    assert.equal(baslangic.panelBaslangici(rol).etiket, uretici ? "Yayın Yönetimi" : "Ana Sayfa");
    assert.equal(baslangic.panelBaslangici(` ${rol.toUpperCase()} `).yol, baslangic.panelBaslangici(rol).yol);
    assert.equal(icerikUret("uretim_durum_gecisi", rol)?.url, uretici ? "/yayin-takip" : "/ana-sayfa");
  });
}

test("UTT yayın bağlantıları ve dış kimlik push hedefleri korunur", () => {
  for (const rol of roller.TUKETICI_ROLLER) {
    assert.equal(icerikUret("video_onerisi", rol, { yayinId: "y", bagId: "o" })?.url, "/ana-sayfa?yayin_id=y&oneri_id=o");
    assert.equal(icerikUret("video_yayini", rol, { yayinId: "y" })?.url, "/ana-sayfa?yayin_id=y");
  }
  for (const rol of roller.ECLUB_TUKETICI_ROLLERI) {
    assert.equal(icerikUret("eclub_oneri", rol, { firmaId: "firma", bagId: "o" })?.url, "/eclub/firma/firma/yayinlar?oneri_id=o");
    assert.equal(icerikUret("eclub_cek_teslim", rol, { firmaId: "firma", bagId: "t" })?.url, "/eclub/firma/firma/hediye-ceki-takibi?talep_id=t");
  }
  assert.equal(icerikUret("eczanem_gonderim", "musteri", { bagId: "g" })?.url, "/eczanem?gonderim_id=g");
});

test("eski sayfa üreticiyi ekran veya veri kurmadan Yayın Yönetimi'ne yollar", () => {
  let rol = "pm";
  const modules = {
    "react/jsx-runtime": jsxRuntime,
    "next/dynamic": { default: () => () => null },
    "next/navigation": { redirect: (yol: string) => { throw new Error(`REDIRECT:${yol}`); } },
    "@/lib/panel/baslangic": baslangic,
    "@/lib/utils/roller": roller,
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici: { rol } }) },
    "@/components/HataMesaji": { useHataMesaji: () => ({ mesajlar: [] }), HataMesajiContainer: () => null },
  };
  const sayfa = yukle<{ default: () => unknown }>("app/(panel)/ana-sayfa/page.tsx", modules);
  for (rol of roller.URETICI_ROLLER) assert.throws(() => sayfa.default(), /REDIRECT:\/yayin-yonetimi/);
  for (rol of [...roller.TUKETICI_ROLLER, ...roller.YONETICI_ROLLER, "iu", "bm", "tm"]) {
    assert.doesNotThrow(() => sayfa.default(), rol);
  }
});

test("Ana Sayfa API'si üreticilerde sorgusuz 403; mevcut rol dalları doğru veri hazırlayıcısını kullanır", async () => {
  let rol = "pm", oturumVar = true;
  const cagrilar: string[] = [];
  const veri = (ad: string) => async () => { cagrilar.push(ad); return { kaynak: ad }; };
  const modules: Record<string, unknown> = {
    "next/server": { NextResponse: { json: Response.json } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: oturumVar ? { id: "sahte" } : null } }) } }), createAdminClient: () => ({}) },
    "@/lib/utils/rolCozucu": { rolCozucu: async () => rol },
    "@/lib/utils/roller": roller,
    "@/lib/utils/hataIsle": {
      rolHatasi: (hata: string) => Response.json({ hata }, { status: 403 }),
      yetkiHatasi: () => Response.json({}, { status: 401 }),
      validasyonHatasi: () => Response.json({}, { status: 400 }),
      sunucuHatasi: (hata: unknown) => { throw hata; },
    },
    "@/lib/utils/anaSayfa/bm": { getBmAnaSayfaIstatistikleri: veri("bm") },
    "@/lib/utils/anaSayfa/tm": { getTmAnaSayfaIstatistikleri: veri("tm") },
    "@/lib/utils/anaSayfa/utt": { getUttAnaSayfaVeri: veri("utt") },
    "@/lib/utils/anaSayfa/iu": { getIuAnaSayfaVeri: veri("iu") },
    "@/lib/utils/anaSayfa/yonetici": { getYoneticiAnaSayfaVeri: veri("yonetici") },
    "@/lib/ogrenmeAraci/tipler": { OGRENME_ARACI_TURLERI: ["video"] },
    "@/lib/utils/raporUtils": { PERIYOTLAR: [{ key: "bu_hafta" }] },
    "@/lib/video/anaSayfaVideolari": { getAnaSayfaVideolari: veri("videolar"), getSahaAnaSayfaVideolari: veri("saha"), getTmAnaSayfaYayinlari: veri("tm-yayin") },
  };
  const api = yukle<{ GET: (req: Request) => Promise<Response> }>("app/(panel)/ana-sayfa/api/route.ts", modules);
  for (rol of roller.URETICI_ROLLER) {
    assert.equal((await api.GET(new Request("http://localhost/ana-sayfa/api"))).status, 403, rol);
    assert.equal(cagrilar.length, 0, `${rol}: kaldırılan ekran için veri çekilmemeli`);
  }
  for (rol of [...roller.TUKETICI_ROLLER, ...roller.YONETICI_ROLLER, "iu", "bm", "tm"]) {
    cagrilar.length = 0;
    const yanit = await api.GET(new Request("http://localhost/ana-sayfa/api"));
    assert.equal(yanit.status, 200, rol);
    assert.equal((await yanit.json()).kaynak, roller.YONETICI_ROLLER.includes(rol) ? "yonetici" : roller.TUKETICI_ROLLER.includes(rol) ? "utt" : rol);
    assert.equal(cagrilar.includes("videolar"), roller.YONETICI_ROLLER.includes(rol) || rol === "iu");
  }
  oturumVar = false;
  cagrilar.length = 0;
  assert.equal((await api.GET(new Request("http://localhost/ana-sayfa/api"))).status, 401);
  assert.equal(cagrilar.length, 0);
});

test("kapalı modül ve yanlış rol sayfaları üreticiyi yeni hedefe, API'leri 403'e yollar", async () => {
  let rol = "pm";
  const q = { select: () => q, eq: () => q,
    single: async () => ({ data: { firma_id: "sahte", cc_aktif: false, hbstore_aktif: false, eclub_store_aktif: false, eclub_aktif: false } }),
    maybeSingle: async () => ({ data: { firma_id: "sahte" }, error: null }),
  };
  const modules = {
    "@/lib/panel/baslangic": baslangic,
    "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "sahte", app_metadata: {} } } }) } }) },
    "@supabase/supabase-js": { createClient: () => ({ from: () => q }) },
    "next/server": { NextResponse: { next: () => new Response(null), redirect: (url: URL) => Response.redirect(url, 307), json: Response.json } },
    "@/lib/utils/roller": roller,
    "@/lib/utils/rolCozucu": { rolCozucu: async () => rol },
    "@/lib/eclub/firmaGezinme": { eclubFirmaRotasiKapsami: () => [] },
    "@/lib/eclub/kisiErisim": { eclubKisiErisimi: () => { throw new Error("İç kullanıcıda dış kimlik sorgusu yok"); } },
    "@/lib/eczanem/erisim": { ECZANEM_KAPALI_MESAJI: "Kapalı", eczanemRolErisimi: () => { throw new Error("Yanlış rolde modül sorgusu yok"); } },
  };
  const { proxy } = yukle<{ proxy: (req: unknown) => Promise<Response> }>("proxy.ts", modules);
  const istek = (path: string) => proxy({ url: `http://localhost${path}`, nextUrl: new URL(`http://localhost${path}`), cookies: { getAll: () => [] } });
  for (rol of roller.URETICI_ROLLER) {
    for (const path of ["/kullanicilar", "/challenge-club", "/store", "/eclub/store", "/eclub/yayinlar", "/eczanem/utt", "/eczanem/bm", "/eczanem/tm", "/eczanem/eczane", "/eczanem"]) {
      assert.equal((await istek(path)).headers.get("location"), "http://localhost/yayin-yonetimi", `${rol}: ${path}`);
    }
    for (const path of ["/kullanicilar/api/liste", "/challenge-club/api/liste", "/store/api/urunler", "/eclub/api/liste", "/eczanem/utt/api/liste"]) {
      assert.equal((await istek(path)).status, 403, `${rol}: ${path}`);
    }
  }
  for (rol of roller.TUM_ROLLER.filter(r => !roller.URETICI_ROLLER.includes(r))) {
    assert.equal((await istek("/store")).headers.get("location"), "http://localhost/ana-sayfa", rol);
  }
});

test("gerçek panel layout'u 13 üreticide boş bilgi pilleri ve yeni logo hedefi verir", async () => {
  const dom = new Window();
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  let kullanici = { id: "sahte", rol: "pm", kimlik_turu: "kullanici", adSoyad: "Test", email: "test@example.invalid" };
  let navbar: { bilgiPilleri?: unknown[]; anaSayfaYolu: string } | undefined;
  const noop = () => undefined;
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime,
    "next/navigation": { useRouter: () => ({ replace: noop }) },
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici, yukleniyor: false, cikisYap: noop }) },
    "@/components/panel/PanelKabugu": { default: (props: { navbar: typeof navbar }) => { navbar = props.navbar; return null; } },
    "@/components/panel/panelNav.config": { PANEL_NAV: [], eclubKisiNavOlustur: () => [] },
    "@/lib/utils/roller": roller, "@/lib/panel/baslangic": baslangic,
    "@/lib/panel/panelCache": { VARSAYILAN_FLAGS, getPanelCache: () => null, setPanelCache: noop },
    "@/lib/tclub/store/olay": { HBSTORE_BAKIYE_DEGISTI: "bakiye" },
    "@/lib/bildirimler/rozet": { BILDIRIM_ROZETLERI_DEGISTI: "rozet", bildirimRozetleriniYenile: noop },
    "@/lib/tclub/oneri/gorunurluk": { ONERI_ZAMANI_DEGISTI: "oneri" },
    "@/components/ogrenme-araci/YarimYuklemeBildirimi": { default: () => null },
    "@/components/panel/YayinSonucBildirimi": { default: () => null },
    "@/app/(panel)/talepler/_hooks/talepOnbellek": { prefetchTalepMerkezi: noop },
    "@/app/(panel)/yayin-yonetimi/_hooks/ozetOnbellek": { prefetchYayinOzet: noop },
    "@/lib/video/katalogOnbellek": { prefetchYayinKatalog: noop },
    "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek": { prefetchUretimRaporu: noop },
  };
  const { default: Layout } = yukle<{ default: React.ComponentType }>("app/(panel)/layout.tsx", modules, { window: dom, document: dom.document, fetch: async () => Response.json({ sayilar: {} }) });
  const container = dom.document.createElement("div");
  const root = createRoot(container);
  try {
    for (const rol of roller.TUM_ROLLER) {
      kullanici = { ...kullanici, rol };
      await act(async () => root.render(React.createElement(Layout)));
      assert.ok(navbar);
      assert.equal(navbar.anaSayfaYolu, baslangic.panelBaslangici(rol).yol, rol);
      assert.equal(navbar.bilgiPilleri?.length, roller.URETICI_ROLLER.includes(rol) ? 0 : undefined, rol);
    }
    kullanici = { ...kullanici, rol: "eczaci", kimlik_turu: "eclub_kisi" };
    await act(async () => root.render(React.createElement(Layout)));
    assert.equal(navbar?.anaSayfaYolu, "/eclub/ana-sayfa");
    assert.equal(navbar?.bilgiPilleri, undefined);
  } finally { await act(async () => root.unmount()); await dom.happyDOM.close(); }
});

test("kaldırılan üretici ekranı, veri dosyaları artık mevcut değil", () => {
  for (const dosya of ["components/ana-sayfa/UreticiAnaSayfa.tsx", "lib/utils/anaSayfa/uretici.ts"]) {
    assert.equal(existsSync(dosya), false, dosya);
  }
});
