import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { Window } from "happy-dom";
import ts from "typescript";
import * as nav from "@/components/panel/panelNav.config";
import * as roller from "@/lib/utils/roller";
import { eczanemUyeMenusuOlustur } from "@/app/eczanem/_components/eczanemUyeMenusu";

async function ortam(uye = true, silmeAktif = true) {
  const dom = new Window({ url: `http://localhost${uye ? "/eczanem" : "/ana-sayfa"}` });
  for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLButtonElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent"] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const yollar: string[] = [], renkler: string[] = [], istekler: string[] = [];
  let silmeler = 0, cikislar = 0, tema = "mavi";
  const noop = () => undefined;
  const router = { push: (yol: string) => yollar.push(yol), replace: (yol: string) => yollar.push(yol), prefetch: noop };
  const cikisYap = async () => { cikislar++; };
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime,
    "next/navigation": { usePathname: () => uye ? "/eczanem" : "/ana-sayfa", useRouter: () => router },
    "./panelNav.config": nav, "@/lib/utils/roller": roller,
    "./tema-secici.module.css": { default: new Proxy({}, { get: (_, key) => String(key) }) },
    "@/app/providers/TemaProvider": { useTema: () => ({ tema, temaDegistir: (secim: string) => { tema = secim; renkler.push(secim); } }) },
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici: { id: "uye", ad: "Örnek", adSoyad: "Örnek Üye", email: "uye@example.invalid", rol: "musteri", kimlik_turu: "musteri", telefon: "00000001234" }, yukleniyor: false, cikisYap }) },
    "@/components/marka/CognitiLogo": { default: () => React.createElement("span", null, "Cogniti") },
    "@/app/(panel)/talepler/_hooks/talepOnbellek": { prefetchTalepMerkezi: noop },
    "@/app/(panel)/yayin-yonetimi/_hooks/ozetOnbellek": { prefetchYayinOzet: noop },
    "@/lib/video/katalogOnbellek": { prefetchYayinKatalog: noop },
    "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek": { prefetchUretimRaporu: noop },
  };
  function yukle(dosya: string) {
    const exports: { default?: React.ComponentType<Record<string, unknown>> } = {};
    const compiled = ts.transpileModule(readFileSync(dosya, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(compiled, { exports, document: dom.document, window: dom, fetch: (adres: string) => {
      istekler.push(adres); throw new Error("Beklenmeyen servis isteği");
    }, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
    assert.ok(exports.default);
    return exports.default;
  }
  modules["./eczanemGezinme"] = { default: () => [] };
  modules["./eczanemUyeMenusu"] = { eczanemUyeMenusuOlustur };
  modules["@/components/tema/TemaSecici"] = { default: yukle("components/tema/TemaSecici.tsx") };
  modules["./PanelNavbar"] = { default: yukle("components/panel/PanelNavbar.tsx") };
  modules["./SolListe"] = { default: yukle("components/panel/SolListe.tsx") };
  modules["./MobilDrawer"] = { default: yukle("components/panel/MobilDrawer.tsx") };
  const Kabuk = yukle("components/panel/PanelKabugu.tsx");
  modules["@/components/panel/PanelKabugu"] = { default: Kabuk };
  modules["./EczanemProfilMenusu"] = { default: yukle("app/eczanem/_components/EczanemProfilMenusu.tsx") };
  const Baglanti = yukle("app/eczanem/_components/EczanemPanelBaglantisi.tsx");
  const container = dom.document.createElement("div");
  dom.document.body.append(container);
  const root = createRoot(container);
  const render = () => act(async () => root.render(uye
    ? React.createElement(Baglanti, { gruplar: eczanemUyeMenusuOlustur(), onHesapSil: silmeAktif ? () => { silmeler++; } : undefined }, React.createElement("h1", null, "Üye içeriği"))
    : React.createElement(Kabuk, { navbar: { adSoyad: "İç Kullanıcı", onCikis: cikisYap }, gruplar: [], badge: {}, baglam: { rolKucu: "utt", kimlikTuru: "kullanici", storeAcik: false, ccAcik: false, eclubAcik: false, eclubStoreAcik: false, eczanemAcik: false } }, "İçerik")));
  return {
    dom, container, yollar, renkler, istekler, render,
    silmeler: () => silmeler, cikislar: () => cikislar,
    click: (element: Element | null | undefined) => { assert.ok(element); return act(async () => { (element as HTMLElement).click(); }); },
    tus: (key: string) => act(async () => dom.document.dispatchEvent(new dom.KeyboardEvent("keydown", { key, bubbles: true }))),
    navbar: () => container.querySelector("#kity-navbar")!,
    drawer: () => [...container.querySelectorAll<HTMLDivElement>("div[style]")].find(el => el.style.width === "270px"),
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("ortak kabukta üyenin üç navbar bağlantısı ve gerçek renk anahtarı çalışır", async () => {
  const o = await ortam();
  try {
    await o.render();
    assert.equal(o.container.querySelectorAll("#kity-navbar").length, 1);
    assert.equal(o.container.querySelectorAll("[data-panel-sidebar]").length, 1);
    for (const [etiket, yol] of [["Ana Sayfa", "/eczanem"], ["Nedir", "/nedir"], ["Nasıl Çalışır", "/eczanem/nasil-calisir"]]) {
      await o.click([...o.navbar().querySelectorAll("button")].find(el => el.textContent === etiket));
      assert.equal(o.yollar.at(-1), yol);
    }
    assert.equal([...o.navbar().querySelectorAll("button")].some(el => el.textContent === "Puanlarım"), false);
    assert.match(o.container.querySelector("[data-panel-sidebar]")!.textContent!, /Puanlarım/);
    await o.click(o.navbar().querySelector('[role="switch"]'));
    await o.render();
    assert.equal(o.navbar().querySelector('[role="switch"]')!.getAttribute("aria-checked"), "false");
    await o.click(o.navbar().querySelector('[role="switch"]'));
    assert.deepEqual(o.renkler, ["yesil", "mavi"]);
    assert.equal(o.istekler.length, 0);
  } finally { await o.kapat(); }
});

test("ortak mobil menü üyenin Nasıl Çalışır adresine gider; çıkışta menü kapanır", async () => {
  const o = await ortam();
  try {
    await o.render();
    await o.click(o.navbar().querySelector('[aria-label="Menü"]'));
    assert.ok(o.drawer());
    await o.click([...o.drawer()!.querySelectorAll("button")].find(el => el.textContent === "Nasıl Çalışır"));
    assert.equal(o.yollar.at(-1), "/eczanem/nasil-calisir");
    assert.equal(o.drawer(), undefined);
    await o.click(o.navbar().querySelector('[aria-label="Menü"]'));
    await o.click([...o.drawer()!.querySelectorAll("button")].find(el => el.textContent?.trim() === "Çıkış"));
    assert.equal(o.cikislar(), 1);
    assert.equal(o.drawer(), undefined);
  } finally { await o.kapat(); }
});

test("üye profili masaüstü ve mobilde maskeli açılır; silme yalnız mevcut onay callback'ini çağırır", async () => {
  const o = await ortam();
  try {
    await o.render();
    const avatarlar = o.navbar().querySelectorAll<HTMLButtonElement>('[aria-label="Profil ve hesap menüsü"]');
    for (const avatar of avatarlar) {
      await o.click(avatar);
      const menu = o.navbar().querySelector('[role="menu"]')!;
      assert.match(menu.textContent!, /Örnek Üye/);
      assert.match(menu.textContent!, /••• ••• 1234/);
      assert.doesNotMatch(menu.textContent!, /00000001234/);
      const silme = menu.querySelector<HTMLButtonElement>('[role="menuitem"]')!;
      assert.equal(o.dom.document.activeElement, silme);
      await o.click(silme);
      assert.equal(o.navbar().querySelector('[role="menu"]'), null);
    }
    assert.equal(o.silmeler(), 2);
    assert.equal(o.yollar.includes("/profil"), false);
    assert.equal(o.istekler.length, 0);
  } finally { await o.kapat(); }
});

test("profil Escape ile kapanıp odağı geri verir; dışarı tıklama da menüyü kapatır", async () => {
  const o = await ortam();
  try {
    await o.render();
    const avatar = o.navbar().querySelector<HTMLButtonElement>('[aria-label="Profil ve hesap menüsü"]')!;
    await o.click(avatar);
    await o.tus("ArrowDown");
    assert.equal(o.dom.document.activeElement?.getAttribute("role"), "menuitem");
    await o.tus("Escape");
    assert.equal(o.dom.document.activeElement, avatar);
    assert.equal(o.navbar().querySelector('[role="menu"]'), null);
    await o.click(avatar);
    await act(async () => o.dom.document.body.dispatchEvent(new o.dom.MouseEvent("mousedown", { bubbles: true })));
    assert.equal(o.navbar().querySelector('[role="menu"]'), null);
  } finally { await o.kapat(); }
});

test("silme callback'i verilmemiş üye sayfasında silme seçeneği gösterilmez", async () => {
  const o = await ortam(true, false);
  try {
    await o.render();
    await o.click(o.navbar().querySelector('[aria-label="Profil ve hesap menüsü"]'));
    const menu = o.navbar().querySelector('[role="menu"]')!;
    assert.ok(menu);
    assert.equal(menu.querySelector('[role="menuitem"]'), null);
    assert.doesNotMatch(menu.textContent!, /kalıcı olarak sil/);
    assert.equal(o.dom.document.activeElement, menu);
  } finally { await o.kapat(); }
});

test("iç kullanıcının ortak navbarında varsayılan bilgi ve profil adresleri korunur", async () => {
  const o = await ortam(false);
  try {
    await o.render();
    for (const [etiket, yol] of [["Ana Sayfa", "/ana-sayfa"], ["Nasıl Çalışır", "/nasil-calisir"]]) {
      await o.click([...o.navbar().querySelectorAll("button")].find(el => el.textContent === etiket));
      assert.equal(o.yollar.at(-1), yol);
    }
    await o.click(o.navbar().querySelector('[aria-label="Profil ve hesap menüsü"]'));
    assert.equal(o.yollar.at(-1), "/profil");
    assert.equal(o.navbar().querySelector('[role="menu"]'), null);
    await o.click(o.navbar().querySelector('[aria-label="Menü"]'));
    await o.click([...o.drawer()!.querySelectorAll("button")].find(el => el.textContent === "Nasıl Çalışır"));
    assert.equal(o.yollar.at(-1), "/nasil-calisir");
  } finally { await o.kapat(); }
});
