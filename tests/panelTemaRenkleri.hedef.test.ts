import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { Window } from "happy-dom";
import postcss from "postcss";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as nav from "@/components/panel/panelNav.config";
import * as roller from "@/lib/utils/roller";

const temaCss = readFileSync("app/tema.css", "utf8");
const tailwindRenkleri: string[] = [];
postcss.parse(readFileSync("node_modules/tailwindcss/theme.css", "utf8")).walkDecls(decl => {
  if (["--color-slate-200", "--color-gray-200", "--color-gray-700"].includes(decl.prop)) tailwindRenkleri.push(`${decl.prop}:${decl.value};`);
});
const css = `:root{${tailwindRenkleri.join("")}}\n${temaCss}`;
const temaAgaci = postcss.parse(css);

function temaDegeri(tema: "mavi" | "yesil", degisken: string): string {
  const degerler: Record<string, string> = {};
  temaAgaci.walkRules(rule => {
    if (!rule.selectors.includes(`[data-tema="${tema}"]`) && !(tema === "mavi" && rule.selectors.includes(":root")) && rule.selector !== ":root") return;
    rule.walkDecls(decl => { degerler[decl.prop] = decl.value; });
  });
  const coz = (ad: string, zincir: string[] = []): string => {
    assert.ok(ad in degerler, ad);
    assert.ok(!zincir.includes(ad), ad);
    return degerler[ad].replace(/var\((--[\w-]+)\)/g, (_, ref: string) => coz(ref, [...zincir, ad]));
  };
  return coz(degisken);
}

function bilesen(dosya: string, pathname = "/ana-sayfa") {
  const noop = () => undefined;
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { usePathname: () => pathname, useRouter: () => ({ push: noop, prefetch: noop }) },
    "next/image": { default: (props: { src: string; alt: string }) => React.createElement("img", { src: props.src, alt: props.alt }) },
    "./panelNav.config": nav,
    "@/lib/utils/roller": roller,
    "@/app/providers/AuthProvider": { useAuth: () => ({ kullanici: null }) },
    "@/app/providers/TemaProvider": { useTema: () => ({ tema: "mavi", temaDegistir: noop }) },
    "@/components/tema/TemaSecici": { default: () => null },
    "@/app/(panel)/talepler/_hooks/talepOnbellek": { prefetchTalepMerkezi: noop },
    "@/app/(panel)/yayin-yonetimi/_hooks/ozetOnbellek": { prefetchYayinOzet: noop },
    "@/lib/video/katalogOnbellek": { prefetchYayinKatalog: noop },
    "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek": { prefetchUretimRaporu: noop },
  };
  const source = readFileSync(dosya, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: { default?: React.ComponentType<Record<string, unknown>> } = {};
  vm.runInNewContext(compiled, { exports, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
  assert.ok(exports.default);
  return exports.default;
}

const Navbar = bilesen("components/panel/PanelNavbar.tsx");
const Sidebar = bilesen("components/panel/SolListe.tsx");
const Drawer = bilesen("components/panel/MobilDrawer.tsx");
const rolListesi = [...new Set([...roller.TUM_ROLLER, ...Object.keys(roller.ROL_ADLARI)])];
const temelBaglam: nav.NavContext = { rolKucu: "utt", storeAcik: true, ccAcik: true, eclubAcik: true, eclubStoreAcik: true, eczanemAcik: true };

function ortam(markup: string) {
  const window = new Window();
  window.document.head.innerHTML = `<style>${css}</style>`;
  window.document.body.innerHTML = markup;
  return window;
}

function renk(window: Window, degisken: string, ozellik = "color") {
  const probe = window.document.createElement("span");
  probe.style.setProperty(ozellik, `var(${degisken})`);
  window.document.body.appendChild(probe);
  const value = window.getComputedStyle(probe).getPropertyValue(ozellik);
  probe.remove();
  assert.notEqual(value, "", degisken);
  return value;
}

test("bütün tanımlı rollerde üst/sol/mobil menü yüzeyleri iki temanın ortak kaynağını kullanır", async () => {
  for (const rolKucu of rolListesi) {
    const eclubKisi = roller.ECLUB_TUKETICI_ROLLERI.includes(rolKucu);
    const baglam = { ...temelBaglam, rolKucu, gruplar: eclubKisi ? nav.ECLUB_KISI_NAV : nav.PANEL_NAV };
    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
      React.createElement(Navbar, { adSoyad: "Örnek Kullanıcı", ozet: { takimSirasi: 2, siparisPuani: 123 }, siparisPuaniGoster: true, hbStoreGoster: roller.STORE_ALABILEN_ROLLER.includes(rolKucu), onCikis: () => undefined }),
      React.createElement(Sidebar, { ...baglam, badge: { oneri: 7 } }),
      React.createElement(Drawer, { ...baglam, acik: true, badge: { oneri: 7 }, onKapat: () => undefined, onCikis: () => undefined }),
    ));
    const window = ortam(markup);
    try {
      for (const tema of ["mavi", "yesil"]) {
        window.document.documentElement.setAttribute("data-tema", tema);
        const navbar = window.document.querySelector("nav")!;
        const sidebar = window.document.querySelector("[data-panel-sidebar]")!;
        const drawer = window.document.querySelector('div[style*="max-width:85vw"]')!;
        assert.ok(drawer, rolKucu);
        assert.equal(navbar.style.background, "var(--tema-ust-menu-zemin)");
        // Happy DOM color-mix/OKLCH hesaplamaz; bu ifadeler kaynak çözümlemesi ve gerçek CSS derlemesinde ayrıca denetlenir.
        if (tema === "mavi") assert.equal(window.getComputedStyle(navbar).backgroundColor, renk(window, "--tema-ust-menu-zemin"), `${rolKucu}/${tema}/navbar`);
        for (const element of [sidebar, drawer]) assert.equal(window.getComputedStyle(element).backgroundColor, renk(window, "--tema-yan-zemin"), `${rolKucu}/${tema}/menu`);
        const bilgiPilleri = Array.from(navbar.querySelectorAll("button"));
        const aktifPill = bilgiPilleri.find(button => button.textContent === "Ana Sayfa")!;
        const pasifPill = bilgiPilleri.find(button => button.textContent === "HapBilgi Nedir")!;
        assert.equal(window.getComputedStyle(aktifPill).color, renk(window, "--tema-vurgu"));
        assert.equal(window.getComputedStyle(aktifPill).backgroundColor, renk(window, "--tema-ust-menu-pill-secili-zemin"));
        assert.equal(window.getComputedStyle(pasifPill).color, renk(window, "--tema-gezinme-metin"));
        const mobilAktif = Array.from(drawer.querySelectorAll("button")).find(button => button.textContent === "Ana Sayfa")!;
        assert.equal(window.getComputedStyle(mobilAktif).color, renk(window, "--tema-menu-secili-metin"));
        for (const rozet of window.document.querySelectorAll('span[style*="min-width:18px"]')) assert.equal(window.getComputedStyle(rozet).backgroundColor, renk(window, "--tema-vurgu"));
        const store = window.document.querySelector('[aria-label="HBStore\'u aç"]');
        assert.equal(Boolean(store), roller.STORE_ALABILEN_ROLLER.includes(rolKucu));
        if (store) assert.match(window.getComputedStyle(store).backgroundImage, /#ff9a1f/);
      }
    } finally { await window.happyDOM.close(); }
  }
});

test("aktif öğe ve rozet doğru temayı alır; iç içe mavi kapsam geri döner", async () => {
  const SidebarAktif = bilesen("components/panel/SolListe.tsx", "/ornek");
  const grup: nav.NavGrup[] = [{ baslik: "Örnek", oglar: [{ etiket: "Seçili öğe", path: "/ornek", badgeKey: "oneri", gate: () => true }] }];
  const markup = renderToStaticMarkup(React.createElement(SidebarAktif, { ...temelBaglam, badge: { oneri: 120 }, gruplar: grup }));
  const window = ortam(`<section id="alan" data-tema="yesil">${markup}<div data-tema="mavi">${markup}</div></section>${markup}`);
  try {
    const buttons = Array.from(window.document.querySelectorAll("button")).filter(button => button.textContent?.startsWith("Seçili öğe"));
    assert.equal(buttons.length, 3);
    assert.equal(window.getComputedStyle(buttons[0]).color, "#4f7254");
    for (const button of buttons.slice(1)) assert.equal(window.getComputedStyle(button).color, "#185fa5");
    assert.match(buttons[0].textContent!, /99\+/);
    window.document.getElementById("alan")!.setAttribute("data-tema", "mavi");
    assert.equal(window.getComputedStyle(buttons[0]).color, "#185fa5");
    window.document.getElementById("alan")!.setAttribute("data-tema", "yesil");
    assert.equal(window.getComputedStyle(buttons[0]).color, "#4f7254");
  } finally { await window.happyDOM.close(); }
});

test("HBStore kimliği ve mobil örtü/gölge iki temada aynıdır; Tailwind mavi tonları kaybolmaz", async () => {
  const window = ortam("");
  try {
    const fixed = ["--tema-hbstore-vurgu", "--tema-mobil-menu-ortu", "--tema-mobil-menu-golge"];
    window.document.documentElement.setAttribute("data-tema", "mavi");
    const before = fixed.map(name => renk(window, name));
    assert.equal(before[0], "#ff6200");
    for (const [own, legacy] of [["--tema-ust-menu-logo-ayirici", "--color-slate-200"], ["--tema-ust-menu-ayirici", "--color-gray-200"], ["--tema-ust-menu-simge", "--color-gray-700"]]) assert.equal(temaDegeri("mavi", own), temaDegeri("mavi", legacy));
    window.document.documentElement.setAttribute("data-tema", "yesil");
    assert.deepEqual(fixed.map(name => renk(window, name)), before);
    assert.equal(renk(window, "--tema-gezinme-metin"), "#2c4137");
    for (const [name, value] of [
      ["--tema-ust-menu-zemin", "#ffffff"],
      ["--tema-menu-secili-zemin", "color-mix(in srgb, #355545 12%, transparent)"],
      ["--tema-menu-secili-halka", "color-mix(in srgb, #355545 35%, transparent)"],
      ["--tema-menu-hover", "color-mix(in srgb, #355545 5%, transparent)"],
    ]) assert.equal(temaDegeri("yesil", name), value);
  } finally { await window.happyDOM.close(); }
});
