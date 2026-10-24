import * as baslangic from "@/lib/panel/baslangic";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as icons from "lucide-react";
import { Window } from "happy-dom";
import ts from "typescript";
import * as nav from "@/components/panel/panelNav.config";
import * as roller from "@/lib/utils/roller";
import * as turSunumu from "@/lib/ogrenmeAraci/turSunumu";
import { eczanemKapsamYolu, eczanemUyeMenusuOlustur } from "@/app/eczanem/_components/eczanemUyeMenusu";

// Gerçek sayfalar, bağlayıcı ve ortak kabuk çalışır. Ağ ve içerik alt bileşenleri sahtedir.
async function ortam(pathname: string, yukleniyor = false, beklet = false) {
  const dom = new Window({ url: `http://localhost${pathname}` });
  for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLButtonElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent"] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const uye = { id: "uye", ad: "Örnek", adSoyad: "Örnek Üye", rol: "musteri", kimlik_turu: "musteri", telefon: "00000001234" };
  const auth: { kullanici: typeof uye | null; yukleniyor: boolean; cikisYap: () => Promise<void> } = { kullanici: yukleniyor ? null : uye, yukleniyor, cikisYap: async () => undefined };
  const yollar: string[] = [], istekler: string[] = [];
  const bekleyenler: Array<(yanit: { ok: boolean; json: () => Promise<unknown> }) => void> = [];
  const noop = () => undefined;
  const router = { push: (yol: string) => yollar.push(yol), replace: (yol: string) => yollar.push(yol), prefetch: noop };
  const searchParams = new URLSearchParams();
  const css = { default: new Proxy({}, { get: (_, key) => String(key) }) };
  const childrenOnly = ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children);
  const button = ({ variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => {
    void variant; void size;
    return React.createElement("button", props);
  };
  const hataMesaji = { mesajlar: [], hata: noop, basari: noop };
  const data = {
    agac: ["a", "b"].map(id => ({ eczane_id: id, eczane_adi: `Eczane ${id}`, firmalar: [] })),
    videolar: ["a", "b"].map(id => ({ gonderim_id: id, yayin_id: id, eczane_id: id, urun_adi: `Ürün ${id}`, arac_turu: "video", gelis_tarihi: "2026-10-20", izleme_basladi: false, izlendi: false, begeni_sayisi: 0, favori_sayisi: 0, izlenme_sayisi: 0 })),
  };
  const modules: Record<string, unknown> = {
    "@/components/rehber/EczaneKullanimKilavuzu": { default: () => null },
    "@/components/rehber/UreticiKullanimKilavuzu": { default: () => null },
    "@/lib/rehber/uttKilavuzu": { uttKilavuzunuSec: () => ({ giris: [], bolumler: [] }) },
    "@/lib/rehber/bmKilavuzu": { bmKilavuzunuSec: () => ({ giris: [], bolumler: [] }) },
    "@/lib/rehber/tmKilavuzu": { tmKilavuzunuSec: () => ({ giris: [], bolumler: [] }) },
    "@/lib/rehber/yoneticiKilavuzu": { yoneticiKilavuzunuSec: () => ({ giris: [], bolumler: [] }) },
    react: React, "react/jsx-runtime": jsxRuntime, "lucide-react": icons,
    "next/navigation": { usePathname: () => pathname, useRouter: () => router, useSearchParams: () => searchParams },
    "next/link": { default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => React.createElement("a", { href, ...props }, children) },
    "./panelNav.config": nav, "@/lib/utils/roller": roller,
    "@/lib/panel/baslangic": baslangic, "@/lib/ogrenmeAraci/turSunumu": turSunumu,
    "@/lib/utils": { cn: (...values: unknown[]) => values.filter(Boolean).join(" ") },
    "@/lib/utils/adSoyadBicimle": { adSoyadBicimle: (ad: string) => ad },
    "./cogniti-hakkinda.module.css": css, "./tema-secici.module.css": css, "./sayfa-yenile.module.css": css,
    "@/app/providers/TemaProvider": { useTema: () => ({ tema: "mavi", temaDegistir: noop }) },
    "@/app/providers/AuthProvider": { useAuth: () => auth },
    "@/components/marka/CognitiLogo": { default: () => React.createElement("span", null, "Cogniti") },
    "@/app/(panel)/talepler/_hooks/talepOnbellek": { prefetchTalepMerkezi: noop },
    "@/app/(panel)/yayin-yonetimi/_hooks/ozetOnbellek": { prefetchYayinOzet: noop },
    "@/lib/video/katalogOnbellek": { prefetchYayinKatalog: noop },
    "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek": { prefetchUretimRaporu: noop },
    "@/components/HataMesaji": { useHataMesaji: () => hataMesaji, HataMesajiContainer: () => null },
    "@/components/ui/button": { Button: button }, "@/components/ui/input": { Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => React.createElement("input", props) },
    "@/components/ui/tarih-pill": { TarihPill: () => React.createElement("time", null, "20.10.2026") },
    "@/components/ui/alert-dialog": {
      AlertDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? React.createElement("div", { role: "alertdialog" }, children) : null,
      AlertDialogCancel: button, ...Object.fromEntries(["AlertDialogContent", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogHeader", "AlertDialogTitle"].map(key => [key, childrenOnly])),
    },
    "@/components/ui/tooltip": Object.fromEntries(["Tooltip", "TooltipContent", "TooltipProvider", "TooltipTrigger"].map(key => [key, childrenOnly])),
    "@/app/(panel)/layout": { default: ({ children }: { children: React.ReactNode }) => React.createElement("div", { "data-ic-kullanici": true }, children) },
    "./_components/EclubGecisKarti": { default: () => null },
    "./_components/EczanemAnaSayfaUstBolum": { default: ({ ad, firmaAdi, onYenile }: { ad: string; firmaAdi?: string; onYenile: () => void }) => React.createElement("header", null, React.createElement("h1", null, firmaAdi || `Merhaba ${ad}, 👋`), React.createElement("button", { "aria-label": "Yenile", onClick: onYenile }, "Yenile")) },
    "@/components/kontrol/SadeKontroller": {
      SadeKontrolGrubu: ({ tur, ...props }: React.HTMLAttributes<HTMLDivElement> & { tur: string }) => React.createElement("div", { ...props, "data-sade-grup": tur }),
      SadeKontrolButonu: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => React.createElement("button", { ...props, type: "button" }),
    },
    "./_components/EczanemVideoRafi": { default: ({ baslik, videolar, onVideoSec }: { baslik: string; videolar: typeof data.videolar; onVideoSec: (video: object) => void }) => React.createElement("section", { "data-raf": baslik }, ...videolar.map(video => React.createElement("button", { key: video.yayin_id, onClick: () => onVideoSec(video) }, video.urun_adi))) },
    "./_components/EczanemVideoOynatici": { default: ({ onKapat }: { onKapat: () => void }) => React.createElement("button", { "data-oynatici": true, onClick: onKapat }, "Oynatıcıyı kapat") },
    "@/components/ogrenme-araci/YayinTuruFiltresi": { YayinTuruFiltresi: () => null },
    "../_components/EczanemPuanlarim": { default: ({ yenilemeAnahtari }: { yenilemeAnahtari: number }) => React.createElement("div", { "data-puan-yenileme": yenilemeAnahtari }) },
  };
  function yukle(dosya: string) {
    const exports: { default?: React.ComponentType } = {};
    const compiled = ts.transpileModule(readFileSync(dosya, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(compiled, { exports, document: dom.document, window: dom, AbortController, DOMException, fetch: async (adres: string) => {
      istekler.push(adres);
      assert.equal(adres, "/eczanem/api/videolar", "Üye dışı veya yazan API çağrısı yapılamaz");
      if (beklet) return new Promise(resolve => bekleyenler.push(resolve));
      return { ok: true, json: async () => data };
    }, require: (id: string) => { assert.ok(id in modules, `Sahte bağımlılık tanımlı değil: ${id}`); return modules[id]; } });
    assert.ok(exports.default);
    return exports.default;
  }
  const gezinme = { default: () => data.agac, eczanemGezinmeAgaciniOku: () => null, eczanemGezinmeAgaciniYaz: noop };
  modules["./eczanemGezinme"] = gezinme;
  modules["./_components/eczanemGezinme"] = gezinme;
  modules["./eczanemUyeMenusu"] = { eczanemKapsamYolu, eczanemUyeMenusuOlustur };
  modules["@/components/tema/TemaSecici"] = { default: yukle("components/tema/TemaSecici.tsx") };
  for (const name of ["PanelNavbar", "SolListe", "MobilDrawer"]) modules[`./${name}`] = { default: yukle(`components/panel/${name}.tsx`) };
  modules["@/components/panel/PanelKabugu"] = { default: yukle("components/panel/PanelKabugu.tsx") };
  modules["./EczanemProfilMenusu"] = { default: yukle("app/eczanem/_components/EczanemProfilMenusu.tsx") };
  const baglanti = { default: yukle("app/eczanem/_components/EczanemPanelBaglantisi.tsx") };
  for (const prefix of ["./_components/", "../_components/", "@/app/eczanem/_components/"]) {
    modules[`${prefix}EczanemPanelBaglantisi`] = baglanti;
    modules[`${prefix}eczanemUyeMenusu`] = { eczanemUyeMenusuOlustur };
  }
  modules["@/components/ui/sayfa-yenile-basligi"] = { SayfaYenileBasligi: yukleNamed("components/ui/sayfa-yenile-basligi.tsx", "SayfaYenileBasligi") };
  modules["@/components/ui/yenile-butonu"] = { YenileButonu: yukleNamed("components/ui/yenile-butonu.tsx", "YenileButonu") };
  function yukleNamed(dosya: string, ad: string) {
    const exports: Record<string, unknown> = {};
    const compiled = ts.transpileModule(readFileSync(dosya, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(compiled, { exports, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
    return exports[ad];
  }
  modules["@/components/panel/bilgi/CognitiHakkinda"] = { default: yukle("components/panel/bilgi/CognitiHakkinda.tsx") };
  modules["./_components/EczanemAnaSayfaSkeleton"] = { default: yukle("app/eczanem/_components/EczanemAnaSayfaSkeleton.tsx"), EczanemRaflarSkeleton: yukleNamed("app/eczanem/_components/EczanemAnaSayfaSkeleton.tsx", "EczanemRaflarSkeleton") };
  modules["./_components/EczanemUrunFiltresi"] = { default: yukle("app/eczanem/_components/EczanemUrunFiltresi.tsx") };
  const dosya = `app${pathname}/page.tsx`;
  const Sayfa = yukle(dosya);
  const container = dom.document.createElement("div");
  dom.document.body.append(container);
  const root = createRoot(container);
  return {
    dom, container, auth, uye, yollar, istekler, data, searchParams,
    beklet: () => { beklet = true; },
    yanitla: (index: number, veri: unknown = data, ok = true) => act(async () => { bekleyenler[index]({ ok, json: async () => veri }); }),
    render: () => act(async () => root.render(React.createElement(Sayfa))),
    click: (el: Element | null | undefined) => { assert.ok(el); return act(async () => { (el as HTMLElement).click(); }); },
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("ana sayfa gerçek ortak kabukta kapsamı ve yenilemede seçimi korur; profil mevcut silme onayını açar", async () => {
  const o = await ortam("/eczanem");
  try {
    await o.render();
    assert.equal(o.container.querySelectorAll("#panel-navbar").length, 1);
    assert.equal(o.container.querySelectorAll("main").length, 1);
    assert.ok(o.container.querySelector('[role="switch"]'));
    const sidebar = o.container.querySelector("[data-panel-sidebar]")!;
    assert.equal((sidebar as HTMLElement).style.width, "240px");
    const raf = () => o.container.querySelector('[data-raf="Yeni Yayınlar"]')!;
    assert.equal(raf().querySelectorAll("button").length, 2);
    const eczaneler = [...sidebar.querySelectorAll("button")].find(el => el.textContent === "Eczanelerim")!;
    if (eczaneler.getAttribute("aria-expanded") === "false") await o.click(eczaneler);
    await o.click([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Eczane a"));
    assert.equal(raf().textContent, "Ürün a");
    await o.click(o.container.querySelector('[aria-label="Yenile"]'));
    assert.equal(raf().textContent, "Ürün a");
    assert.equal(o.istekler.length, 2);
    await o.click(raf().querySelector("button"));
    assert.ok(o.container.querySelector("[data-oynatici]"));
    await o.click(o.container.querySelector("[data-oynatici]"));
    assert.equal(raf().textContent, "Ürün a");
    await o.click(o.container.querySelector('[aria-label="Profil ve hesap menüsü"]'));
    await o.click(o.container.querySelector('[role="menuitem"]'));
    assert.match(o.container.querySelector('[role="alertdialog"]')!.textContent!, /Mevcut şifreniz/);
    assert.equal(o.container.querySelector('button[type="submit"]')?.hasAttribute("disabled"), true);
    assert.ok(o.istekler.every(adres => adres === "/eczanem/api/videolar"));
  } finally { await o.kapat(); }
});

test("Puanlarım ortak kabuğu kullanır ve yenileme mevcut puan bileşenine aktarılır", async () => {
  const o = await ortam("/eczanem/puanlarim");
  try {
    await o.render();
    assert.equal(o.container.querySelectorAll("#panel-navbar").length, 1);
    const puan = o.container.querySelector("[data-puan-yenileme]")!;
    assert.equal(puan.getAttribute("data-puan-yenileme"), "0");
    await o.click(o.container.querySelector('[aria-label="Yenile"]'));
    assert.equal(o.container.querySelector("[data-puan-yenileme]"), puan);
    assert.equal(puan.getAttribute("data-puan-yenileme"), "1");
    assert.equal(o.istekler.length, 0);
  } finally { await o.kapat(); }
});

for (const path of ["/eczanem/puanlarim"]) {
  test(`${path} oturumsuz ziyaretçiyi yönlendirir; üye olmayanı içerik bileşenlerine sokmaz`, async () => {
    const o = await ortam(path, true);
    try {
      await o.render();
      assert.equal(o.yollar.length, 0);
      o.auth.yukleniyor = false;
      await o.render();
      assert.equal(o.yollar.at(-1), "/login");
      assert.equal(o.container.querySelector("#panel-navbar"), null);
      o.auth.kullanici = { ...o.uye, kimlik_turu: "kullanici", rol: "utt" };
      await o.render();
      assert.equal(o.yollar.at(-1), "/ana-sayfa");
      assert.equal(o.container.querySelector("#panel-navbar"), null);
      assert.equal(o.istekler.length, 0);
    } finally { await o.kapat(); }
  });
}

test("ilk yükleme iskelet gösterir; hata boş raf sayılmaz ve yeniden denenebilir", async () => {
  const o = await ortam("/eczanem", false, true);
  try {
    await o.render();
    assert.ok(o.container.querySelector('[role="status"][aria-busy="true"]'));
    assert.equal(o.container.querySelector("[data-raf]"), null);
    await o.yanitla(0, { hata: "İçerikler alınamadı" }, false);
    assert.equal(o.container.querySelector('[role="status"]'), null);
    assert.equal(o.container.querySelector("[data-raf]"), null);
    assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /İçerikler alınamadı/);
    await o.click([...o.container.querySelectorAll("button")].find(el => el.textContent === "Tekrar dene"));
    await o.yanitla(1, { videolar: [], agac: [] });
    assert.equal(o.container.querySelector('[role="alert"]'), null);
    assert.equal(o.container.querySelectorAll("[data-raf]").length, 5);
  } finally { await o.kapat(); }
});

test("yenileme yüklenmiş rafı ve kapsam menüsünü korur; geciken iptal edilmiş yanıt güncel sonucu ezmez", async () => {
  const o = await ortam("/eczanem");
  try {
    await o.render();
    const raf = o.container.querySelector("[data-raf]");
    o.beklet();
    await o.click(o.container.querySelector('[aria-label="Yenile"]'));
    assert.equal(o.container.querySelector("[data-raf]"), raf);
    assert.equal(o.container.querySelector('[role="status"]'), null);
    await o.yanitla(0, { hata: "Yenileme başarısız" }, false);
    assert.equal(o.container.querySelector("[data-raf]"), raf);
    assert.match(o.container.querySelector('[role="alert"]')!.textContent!, /Son başarılı içerik akışı/);
    assert.match(o.container.querySelector("[data-panel-sidebar]")!.textContent!, /Eczanelerim/);
    await o.click(o.container.querySelector('[aria-label="Yenile"]'));
    await o.click(o.container.querySelector('[aria-label="Yenile"]'));
    await o.yanitla(2, { videolar: [], agac: [] });
    await o.yanitla(1);
    assert.equal(o.container.querySelector("[data-raf]")!.querySelectorAll("button").length, 0);
    assert.equal(o.container.querySelector('[role="alert"]'), null);
  } finally { await o.kapat(); }
});

test("firma seçimi markayı açar; ürün filtresi eczane kapsamını ve yenilemede seçimi korur", async () => {
  const o = await ortam("/eczanem");
  try {
    Object.assign(o.data, {
      agac: ["a", "b"].map(id => ({ eczane_id: id, eczane_adi: `Eczane ${id}`, firmalar: [{ firma_id: "firma", firma_adi: "Hepifarma", urunler: [null, "genel"].map(urun_id => ({ urun_id, urun_adi: "Ürün", yayinlar: [] })) }] })),
      videolar: ["a", "b"].flatMap(id => [null, "genel"].map((urun_id, i) => ({ ...o.data.videolar[0], gonderim_id: `${id}-${i}`, yayin_id: `${id}-${i}`, eczane_id: id, firma_id: "firma", urun_id, urun_adi: `${id}-${i}` }))),
    });
    await o.render();
    const sidebar = o.container.querySelector("[data-panel-sidebar]")!;
    const raf = () => o.container.querySelector('[data-raf="Yeni Yayınlar"]')!;
    const sec = async (ad: string) => o.click([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === ad));
    const ac = async (ad: string) => { const b = sidebar.querySelector(`[aria-label="${ad} alt menüsünü aç"]`); if (b) await o.click(b); };
    await ac("Eczane a");
    await o.click([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Hepifarma"));
    assert.equal(o.container.querySelector("h1")!.textContent, "Hepifarma");
    assert.equal([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Hepifarma")!.getAttribute("aria-pressed"), "true");
    assert.equal([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Tüm İçerikler")!.getAttribute("aria-pressed"), "false");
    assert.equal(raf().textContent, "a-0a-1");
    const filtre = () => o.container.querySelector('[aria-label="Ürün filtresi"]')!;
    assert.equal(filtre().getAttribute("data-sade-grup"), "sekme");
    await o.click([...filtre().querySelectorAll("button")].find(el => el.textContent === "Genel İçerikler"));
    assert.equal(raf().textContent, "a-0");
    await o.click(o.container.querySelector('[aria-label="Yenile"]'));
    assert.equal(raf().textContent, "a-0");
    await o.click([...filtre().querySelectorAll("button")].find(el => el.textContent === "Ürün"));
    assert.equal(raf().textContent, "a-1", "null ürün ile genel kimliği ayrı kalır");
    await sec("Eczane b");
    assert.equal(o.container.querySelector('[aria-label="Ürün filtresi"]'), null);
    assert.equal(raf().textContent, "b-0b-1");
    assert.equal(sidebar.textContent!.includes("Genel İçerikler"), false);
    assert.equal(o.container.querySelector('[aria-label="Kapsam Gezintisi"]'), null);
  } finally { await o.kapat(); }
});

test("Puanlarım eczaneleri korur; eczane seçimi ana sayfanın ilgili kapsamına gider", async () => {
  const o = await ortam("/eczanem/puanlarim");
  try {
    await o.render();
    const sidebar = o.container.querySelector("[data-panel-sidebar]")!;
    assert.match(sidebar.textContent!, /Eczanelerim/);
    const baslik = [...sidebar.querySelectorAll("button")].find(el => el.textContent === "Eczanelerim")!;
    if (baslik.getAttribute("aria-expanded") === "false") await o.click(baslik);
    await o.click([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Eczane b"));
    assert.equal(o.yollar.at(-1), "/eczanem?eczane_id=b");
    assert.equal([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Tüm İçerikler")!.getAttribute("aria-pressed"), null);
  } finally { await o.kapat(); }
});

test("diğer sayfadan gelen eczane kapsamı açılır; yenileme ürün seçimini ezmez", async () => {
  const o = await ortam("/eczanem");
  try {
    o.searchParams.set("eczane_id", "b");
    await o.render();
    const raf = () => o.container.querySelector('[data-raf="Yeni Yayınlar"]')!;
    assert.equal(raf().textContent, "Ürün b");
    await o.click(o.container.querySelector('[aria-label="Yenile"]'));
    assert.equal(raf().textContent, "Ürün b");
  } finally { await o.kapat(); }
});

test("Ana Sayfa, logo ve mobil bağlantı seçili kapsamı ve oynatıcıyı temizler; Tüm İçerikler aynı başlangıcı açar", async () => {
  const o = await ortam("/eczanem");
  try {
    await o.render();
    const sidebar = o.container.querySelector("[data-panel-sidebar]")!;
    const grup = [...sidebar.querySelectorAll("button")].find(el => el.textContent === "Eczanelerim")!;
    if (grup.getAttribute("aria-expanded") === "false") await o.click(grup);
    const anaButonu = () => [...o.container.querySelectorAll("#panel-navbar button")].find(el => el.textContent === "Ana Sayfa")!;
    assert.equal(anaButonu().getAttribute("aria-pressed"), "true");
    const tumButonu = () => [...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Tüm İçerikler")!;
    assert.equal(tumButonu().getAttribute("aria-pressed"), "false");
    const raf = () => o.container.querySelector('[data-raf="Yeni Yayınlar"]')!;
    const kapsamSec = async () => { const baslik = [...sidebar.querySelectorAll("button")].find(el => el.textContent === "Eczanelerim")!; if (baslik.getAttribute("aria-expanded") === "false") await o.click(baslik); await o.click([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Eczane a")); assert.equal(raf().textContent, "Ürün a"); assert.equal(anaButonu().getAttribute("aria-pressed"), "false"); };
    await kapsamSec();
    await o.click([...o.container.querySelectorAll("#panel-navbar button")].find(el => el.textContent === "Ana Sayfa"));
    assert.equal(raf().querySelectorAll("button").length, 2);
    assert.equal(tumButonu().getAttribute("aria-pressed"), "false");
    await kapsamSec(); await o.click(raf().querySelector("button"));
    assert.ok(o.container.querySelector("[data-oynatici]"));
    await o.click(o.container.querySelector("#panel-ana-sayfa"));
    assert.equal(o.container.querySelector("[data-oynatici]"), null);
    assert.equal(raf().querySelectorAll("button").length, 2);
    assert.equal(tumButonu().getAttribute("aria-pressed"), "false");
    await kapsamSec(); await o.click(o.container.querySelector('[aria-label="Menü"]'));
    const mobilAnaSayfa = [...o.container.querySelectorAll("button")].find(el => el.textContent === "Ana Sayfa" && !el.closest("#panel-navbar"));
    await o.click(mobilAnaSayfa); assert.equal(raf().querySelectorAll("button").length, 2);
    assert.equal(tumButonu().getAttribute("aria-pressed"), "false");
    await kapsamSec();
    await o.click([...sidebar.querySelectorAll("[data-nav-secim]")].find(el => el.textContent === "Tüm İçerikler"));
    assert.equal(raf().querySelectorAll("button").length, 2);
    assert.equal(tumButonu().getAttribute("aria-pressed"), "true");
    assert.equal(anaButonu().getAttribute("aria-pressed"), "false");
    await o.click([...o.container.querySelectorAll("#panel-navbar button")].find(el => el.textContent === "Ana Sayfa"));
    assert.equal(tumButonu().getAttribute("aria-pressed"), "false");
    assert.equal(anaButonu().getAttribute("aria-pressed"), "true");
    assert.equal(o.yollar.at(-1), "/eczanem");
  } finally { await o.kapat(); }
});
