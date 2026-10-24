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
import type { EczanemSidebarAgaci, EczanemSidebarSecim } from "@/app/eczanem/_types";

const baglam: nav.NavContext = { rolKucu: "musteri", kimlikTuru: "musteri", storeAcik: false, ccAcik: false, eclubAcik: false, eclubStoreAcik: false, eczanemAcik: true };
const agac: EczanemSidebarAgaci = ["a", "b"].map(eczane_id => ({
  eczane_id, eczane_adi: "Aynı Eczane", firmalar: [{ firma_id: "f", firma_adi: "Firma", urunler: [{
    urun_id: "u", urun_adi: "Ürün", yayinlar: [{ yayin_id: "y", yayin_basligi: "Yayın", araclar: [{ arac_id: "v", arac_turu: "video" }, { arac_id: "p", arac_turu: "flip_pdf" }] }],
  }] }],
}));
const aracSecimi = (arac_id: string): EczanemSidebarSecim => ({ tip: "arac", eczane_id: "a", firma_id: "f", urun_id: "u", yayin_id: "y", arac_id });

async function ortam(mobil: boolean, ilkSecim: EczanemSidebarSecim = { tip: "tum" }) {
  const dom = new Window({ url: "http://localhost/eczanem" });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent"] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const yollar: string[] = [], onYuklemeler: string[] = [];
  const secimler: EczanemSidebarSecim[] = [];
  let kapanmalar = 0;
  let secim = ilkSecim;
  let pathname = "/eczanem";
  let baskaGruplar: nav.NavGrup[] | null = null;
  const noop = () => undefined;
  const router = { push: (yol: string) => yollar.push(yol), prefetch: (yol: string) => onYuklemeler.push(yol) };
  const modules: Record<string, unknown> = {
    react: React, "react/jsx-runtime": jsxRuntime,
    "next/navigation": { usePathname: () => pathname, useRouter: () => router },
    "./panelNav.config": nav, "@/lib/utils/roller": roller,
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici: { id: "uye" } }) },
    "@/app/(panel)/talepler/_hooks/talepOnbellek": { prefetchTalepMerkezi: noop },
    "@/app/(panel)/yayin-yonetimi/_hooks/ozetOnbellek": { prefetchYayinOzet: noop },
    "@/lib/video/katalogOnbellek": { prefetchYayinKatalog: noop },
    "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek": { prefetchUretimRaporu: noop },
  };
  const exports: { default?: React.ComponentType<Record<string, unknown>> } = {};
  const compiled = ts.transpileModule(readFileSync(`components/panel/${mobil ? "MobilDrawer" : "SolListe"}.tsx`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, { exports, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  assert.ok(exports.default);
  const Menu = exports.default;
  const container = dom.document.createElement("div");
  dom.document.body.append(container);
  const root = createRoot(container);
  const render = () => act(async () => {
    const gruplar = baskaGruplar ?? eczanemUyeMenusuOlustur({ agac, secim, onSecim: yeni => { secim = yeni; secimler.push(yeni); } });
    root.render(React.createElement(Menu, { ...baglam, gruplar, badge: { ornek: 120 }, acik: true, onKapat: () => { kapanmalar++; }, onCikis: noop, anaSayfaYolu: "/eczanem" }));
  });
  return {
    dom, container, secimler, yollar, onYuklemeler, render, kapanmalar: () => kapanmalar,
    click: (el: Element | undefined | null) => { assert.ok(el); return act(async () => { (el as HTMLElement).click(); }); },
    bul: (alan: string, parcalar: string[]) => [...container.querySelectorAll<HTMLButtonElement>(`button[${alan}]`)].find(el => el.getAttribute(alan) === JSON.stringify(parcalar)),
    disaridanSec: async (yeni: EczanemSidebarSecim) => { secim = yeni; await render(); },
    normalMenu: async () => {
      pathname = "/ornek";
      baskaGruplar = [{ baslik: "Örnek", oglar: [{ etiket: "Üst Menü", gate: () => true, altOglar: [
        { etiket: "Hedef", path: "/ornek", badgeKey: "ornek", gate: () => true },
        { etiket: "Gizli Hedef", path: "/gizli", gate: () => false },
      ] }] }];
      await render();
    },
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

for (const mobil of [false, true]) {
  const ortamAdi = mobil ? "mobil" : "masaüstü";
  test(`${ortamAdi}: ürün/araç seçimi firmada görünür; eczane oku seçimi değiştirmez ve odak korunur`, async () => {
    const o = await ortam(mobil, aracSecimi("v"));
    try {
      await o.render();
      const eczaneOku = o.bul("data-nav-dal", ["eczane", "a"])!;
      assert.equal(eczaneOku.getAttribute("aria-expanded"), "true");
      assert.equal(o.bul("data-nav-secim", ["firma", "a", "f"])!.getAttribute("aria-pressed"), "true");
      assert.equal(o.bul("data-nav-secim", ["urun", "a", "f", "u"]), undefined, "Ürün filtresi sidebar içinde çizilmemeli");
      assert.equal(o.container.querySelectorAll('[aria-pressed="true"]').length, 1);
      assert.equal(o.bul("data-nav-secim", ["tum"])!.getAttribute("aria-pressed"), "false", "Adres aynı olsa da Tüm İçerikler seçili sayılmamalı");
      eczaneOku.focus();
      await o.click(eczaneOku);
      assert.equal(o.bul("data-nav-secim", ["firma", "a", "f"]), undefined);
      assert.equal(o.dom.document.activeElement, eczaneOku);
      assert.equal(o.secimler.length, 0);
      assert.equal(o.kapanmalar(), 0);
      await o.disaridanSec({ tip: "firma", eczane_id: "b", firma_id: "f" });
      assert.equal(o.bul("data-nav-dal", ["eczane", "b"])!.getAttribute("aria-expanded"), "true");
      assert.equal(o.bul("data-nav-secim", ["firma", "b", "f"])!.getAttribute("aria-pressed"), "true");
      assert.equal(o.yollar.length, 0);
    } finally { await o.kapat(); }
  });

  test(`${ortamAdi}: aynı adlı dallar bağımsızdır; metin kapsam seçer ve mobilde kapanışı bildirir`, async () => {
    const o = await ortam(mobil);
    try {
      await o.render();
      await o.click([...o.container.querySelectorAll("button")].find(el => el.textContent?.trim() === "Eczanelerim"));
      await o.click(o.bul("data-nav-dal", ["eczane", "a"]));
      assert.equal(o.bul("data-nav-dal", ["eczane", "b"])!.getAttribute("aria-expanded"), "false");
      assert.equal(o.secimler.length, 0);
      assert.ok(o.bul("data-nav-secim", ["firma", "a", "f"]));
      assert.equal(o.bul("data-nav-dal", ["firma", "a", "f"]), undefined, "Firma altına ürün dalı eklenmemeli");
      assert.equal(o.bul("data-nav-secim", ["firma", "b", "f"]), undefined);
      await o.click(o.bul("data-nav-secim", ["eczane", "a"]));
      await o.render();
      assert.equal(o.secimler.length, 1);
      assert.equal(o.secimler[0].tip, "eczane");
      assert.equal((o.secimler[0] as { eczane_id: string }).eczane_id, "a");
      assert.equal(o.kapanmalar(), mobil ? 1 : 0);
      assert.equal(o.yollar.length, 0);
      assert.equal(o.onYuklemeler.length, 0);
    } finally { await o.kapat(); }
  });

  test(`${ortamAdi}: mevcut adresli menüde açma, rozet, yetki filtresi ve yönlendirme korunur`, async () => {
    const o = await ortam(mobil);
    try {
      await o.normalMenu();
      assert.doesNotMatch(o.container.textContent!, /Gizli Hedef/);
      assert.match(o.container.textContent!, /99\+/);
      const baslik = [...o.container.querySelectorAll<HTMLButtonElement>("button[aria-expanded]")].find(el => el.textContent?.trim() === "Üst Menü")!;
      baslik.focus();
      await o.click(baslik);
      assert.equal(o.dom.document.activeElement, baslik);
      assert.equal([...o.container.querySelectorAll("button")].some(el => el.textContent?.startsWith("Hedef")), false);
      await o.click(baslik);
      await o.click([...o.container.querySelectorAll("button")].find(el => el.textContent?.startsWith("Hedef")));
      assert.deepEqual(o.yollar, ["/ornek"]);
      assert.equal(o.kapanmalar(), mobil ? 1 : 0);
    } finally { await o.kapat(); }
  });
}
