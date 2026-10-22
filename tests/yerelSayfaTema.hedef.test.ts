import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { Window } from "happy-dom";
import React, { act } from "react";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import config from "../postcss.config.mjs";
import { siraRenk } from "@/components/hbligi/league/util";
import { DEPARTMAN_RENK } from "@/lib/video/departman";
import { DURUM_RENKLERI } from "@/lib/tclub/store/sabitler";
import { puanRengi } from "@/lib/utils/raporUtils";
import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { ANA_SEKMELER, type AltSekme } from "@/app/(panel)/yayin-yonetimi/_types";

// Yalnız bellekte sahte sayılar ve callbacks kullanılır; oturum/API/DB işlemi yoktur.
const dom = new Window({ url: "http://localhost" });
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "HTMLInputElement", "HTMLButtonElement", "MutationObserver", "Event", "MouseEvent", "FocusEvent", "KeyboardEvent", "CustomEvent", "PointerEvent", "ResizeObserver", "NodeFilter", "DocumentFragment"]) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
for (const key of ["getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key].bind(dom) });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
const { default: GirisAltBilgileri } = await import("@/app/login/_components/GirisAltBilgileri");
const { default: ModulDurumKarti } = await import("@/app/admin/_components/ModulDurumKarti");
const { YayinKumandaPaneli } = await import("@/app/(panel)/yayin-yonetimi/_components/YayinKumandaPaneli");
const { default: TakipStatKartlari } = await import("@/app/(panel)/eclub/hediye-takip/_components/TakipStatKartlari");
const { TemaProvider } = await import("@/app/providers/TemaProvider");
const { default: PanelNavbar } = await import("@/components/panel/PanelNavbar");
const { default: EczanemProfilMenusu } = await import("@/app/eczanem/_components/EczanemProfilMenusu");
const h = React.createElement;
after(async () => { await dom.happyDOM.close(); });

const themeCss = readFileSync("app/tema.css", "utf8");
const tailwindDefaults: string[] = [];
postcss.parse(readFileSync("node_modules/tailwindcss/theme.css", "utf8")).walkDecls(d => { tailwindDefaults.push(`${d.prop}:${d.value};`); });
const maps: Record<string, Record<string, string>> = {};
for (const theme of ["mavi", "yesil"]) {
  const values: Record<string, string> = {};
  postcss.parse(readFileSync("node_modules/tailwindcss/theme.css", "utf8")).walkDecls(d => { values[d.prop] = d.value; });
  postcss.parse(themeCss).walkRules(r => { if (r.selectors.includes(`[data-tema="${theme}"]`)) r.walkDecls(d => { values[d.prop] = d.value; }); });
  maps[theme] = values;
}
function resolve(value: string, theme: string, seen: string[] = []): string {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    assert.ok(name in maps[theme], name);
    assert.ok(!seen.includes(name), name);
    return resolve(maps[theme][name], theme, [...seen, name]);
  });
}
const compiled = await postcss([tailwind(config.plugins["@tailwindcss/postcss"])]).process(readFileSync("app/globals.css", "utf8"), { from: "app/globals.css" });
assert.equal(compiled.warnings().length, 0);
const utility = new Map<string, postcss.Rule>();
compiled.root.walkRules(r => { utility.set(r.selector, r); });
const style = document.createElement("style"); document.head.append(style);
function styles() {
  const names = new Set([...document.querySelectorAll("[class]")].flatMap(el => [...el.classList]));
  const rules: string[] = [];
  for (const name of names) {
    // Happy DOM ne @layer'ı ne de iç içe medya/hover kurallarını tarayıcı gibi işler.
    // Gerçek derlenmiş temel kurallar burada açılır; varyantlar CSS kanıtında sınanır.
    const rule = utility.get(`.${name.replace(/[^\w-]/g, "\\$&")}`);
    if (!name.includes(":")) {
      if (name.includes("var(--tema-")) assert.ok(rule, name);
      if (rule) rules.push(rule.toString());
    }
  }
  style.textContent = `:root{${tailwindDefaults.join("")}}\n${themeCss}\n${rules.join("\n")}`;
}
function color(el: Element, property: string, expected: string) {
  const normalize = (v: string) => v.toLowerCase().replace(/#([\da-f])([\da-f])([\da-f])\b/g, "#$1$1$2$2$3$3");
  assert.equal(normalize(dom.getComputedStyle(el).getPropertyValue(property)), normalize(expected), `${el.tagName}/${property}`);
}
async function mount(node: React.ReactNode) {
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(node)); styles();
  return { container, render: async (next: React.ReactNode) => { await act(async () => root.render(next)); styles(); }, close: async () => { await act(async () => root.unmount()); container.remove(); } };
}
const switchTheme = (theme: string) => document.documentElement.setAttribute("data-tema", theme);
const click = async (button: HTMLElement) => { await act(async () => button.click()); styles(); };

test("girişte gerçek sözleşme portalı açıkken tema değişir; içerik, kapatma ve odak korunur", async () => {
  const view = await mount(h(GirisAltBilgileri));
  try {
    const trigger = view.container.querySelector("button")!;
    await click(trigger);
    const dialog = document.querySelector('[role="dialog"]')!;
    assert.ok(dialog); assert.equal(view.container.contains(dialog), false);
    const original = dialog.innerHTML;
    for (const theme of ["mavi", "yesil", "mavi"]) {
      switchTheme(theme);
      color(dialog, "background-color", "#fff");
      // Happy DOM OKLCH metin rengini hesaplamaz; mavi gerçek Tailwind
      // bildirimi üzerinden, yeşil ayrıca gerçek DOM üzerinden doğrulanır.
      const textClass = [...dialog.classList].find(c => c.startsWith("text-[var("))!;
      const textRule = utility.get(`.${textClass.replace(/[^\w-]/g, "\\$&")}`)!;
      let text = ""; textRule.walkDecls("color", d => { text = resolve(d.value, theme); });
      assert.equal(text, theme === "mavi" ? "oklch(44.6% 0.03 256.802)" : "#2c4137");
      if (theme === "yesil") color(dialog, "color", "#2c4137");
      assert.equal(dialog.innerHTML, original);
    }
    await click(dialog.querySelector('[aria-label="Kapat"]')!);
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(document.activeElement, trigger);
  } finally { await view.close(); }
});

test("yönetim kartında kapalı durumun kırmızısı korunur, açma eylemi yeşile geçer ve loading tıklamayı kapatır", async () => {
  let toggles = 0;
  const props = { baslik: "Örnek modül", aciklama: "Açıklama", acik: false, onToggle: () => { toggles++; }, m4NotuGoster: false };
  const view = await mount(h(ModulDurumKarti, props));
  try {
    for (const theme of ["mavi", "yesil"]) {
      switchTheme(theme);
      const badge = [...view.container.querySelectorAll("span")].find(el => el.textContent === "Kapalı")!;
      color(badge, "color", "#bc2d0d"); color(badge, "background-color", "#fef2f2");
      color(view.container.querySelector("button")!, "background-color", theme === "mavi" ? "#bc2d0d" : "#355545");
      await click(view.container.querySelector("button")!);
    }
    assert.equal(toggles, 2);
    await view.render(h(ModulDurumKarti, { ...props, toggleLoading: true }));
    await click(view.container.querySelector("button")!); assert.equal(toggles, 2);
    await view.render(h(ModulDurumKarti, { ...props, acik: true }));
    for (const theme of ["mavi", "yesil"]) {
      switchTheme(theme);
      color([...view.container.querySelectorAll("span")].find(el => el.textContent === "Açık")!, "color", "#166534");
      assert.equal(view.container.querySelector("button")!.textContent, "Modülü Kapat");
    }
    await view.render(h(ModulDurumKarti, { ...props, acik: null }));
    assert.equal(view.container.querySelector("button"), null);
  } finally { await view.close(); }
});

test("yayın yönetiminde hedef ve durum seçimleri, canlı+planlı sayısı ve yüklenme hali korunur", async () => {
  const targets: string[] = [], states: string[] = [];
  const props = {
    aktifHedef: ANA_SEKMELER[0], aktifDurum: "bekleyen" as AltSekme,
    bekleyen: 2, bekleyenHedefSayilari: Object.fromEntries(ANA_SEKMELER.map(k => [k, 2])), canli: 3, planli: 4, durdurulan: 1,
    onHedefDegistir: (v: string) => { targets.push(v); }, onDurumDegistir: (v: string) => { states.push(v); },
  };
  const view = await mount(h(YayinKumandaPaneli, props));
  try {
    const statusButtons = [...view.container.querySelector('[aria-label="Yayın durumu"]')!.querySelectorAll("button")];
    const values = statusButtons.map(b => b.querySelector("span span")!.textContent);
    assert.deepEqual(values, ["2", "7", "1"]);
    const fixedColors = statusButtons.map(b => resolve(b.querySelector("span span")!.getAttribute("style")!, "mavi"));
    for (const theme of ["mavi", "yesil", "mavi"]) {
      switchTheme(theme);
      color(view.container.querySelector("h1")!, "color", theme === "mavi" ? "#172b4d" : "#2c4137");
      assert.deepEqual(statusButtons.map(b => resolve(b.querySelector("span span")!.getAttribute("style")!, theme)), fixedColors);
      assert.equal(statusButtons[0].getAttribute("aria-pressed"), "true");
      assert.match(resolve(statusButtons[0].getAttribute("style")!, theme), /color-mix\(in srgb, .* 9\.411764705882353%, transparent\)/);
    }
    for (const b of statusButtons) await click(b);
    assert.deepEqual(states, ["bekleyen", "yayinda", "durdurulan"]);
    const targetButtons = [...view.container.querySelector('[aria-label="Yayın kitlesi"]')!.querySelectorAll("button")];
    for (const b of targetButtons) await click(b);
    assert.deepEqual(targets, ANA_SEKMELER);
    const capsule = view.container.querySelector('[aria-label="Yayın durumu seçimi"]')!;
    const capsuleButtons = [...capsule.querySelectorAll("button")];
    assert.deepEqual(capsuleButtons.map(b => b.textContent), ["Tüm", "Yayına Hazır", "Yayında", "Durdurulan"]);
    assert.equal(capsule.parentElement, view.container.querySelector('[aria-label="Yayın kitlesi"]')!.parentElement);
    assert.equal(capsuleButtons[1].getAttribute("aria-pressed"), "true");
    for (const b of capsuleButtons) await click(b);
    assert.equal(capsuleButtons[3].getAttribute("aria-pressed"), "true");
    assert.deepEqual(states, ["bekleyen", "yayinda", "durdurulan"], "Yeni kapsül liste durumunu değiştirmemeli");
    await view.render(h(YayinKumandaPaneli, { ...props, yukleniyor: true }));
    assert.equal(view.container.querySelectorAll('[aria-label="Yayın durumu"] .animate-pulse').length, 3);
  } finally { await view.close(); }
});

test("çek ve sipariş takip özetlerinde sayılar, boş durum ve dört işlevsel palet iki temada aynı kalır", async () => {
  for (const takipTuru of ["cek", "siparis"] as const) {
    const props = { takipTuru, cekStatlari: { toplam: 10, onay_surecinde: 4, teslimat_surecinde: 3, tamamlanan: 3 }, siparisStatlari: { toplam: 10, inceleme_bekliyor: 4, utt_onayladi: 3, bm_onayladi: 3 } };
    const view = await mount(h(TakipStatKartlari, props));
    try {
      const articles = [...view.container.querySelectorAll("article")];
      switchTheme("mavi");
      const colors = articles.map(a => [dom.getComputedStyle(a).borderLeftColor, dom.getComputedStyle(a.querySelector("svg")!.parentElement!).color]);
      switchTheme("yesil");
      assert.deepEqual(articles.map(a => [dom.getComputedStyle(a).borderLeftColor, dom.getComputedStyle(a.querySelector("svg")!.parentElement!).color]), colors);
      assert.deepEqual([...view.container.querySelectorAll("strong")].map(s => s.textContent), ["10", "4", "3", "3"]);
      await view.render(h(TakipStatKartlari, { takipTuru }));
      assert.deepEqual([...view.container.querySelectorAll("strong")].map(s => s.textContent), ["—", "—", "—", "—"]);
    } finally { await view.close(); }
  }
});

test("Eczanem üye profili ortak navbar içinde iki temada açılır; masaüstü/mobil Escape, silme ve çıkış korunur", async () => {
  let exits = 0, deletes = 0;
  const profilMenusu = h(EczanemProfilMenusu, { ad: "Örnek Üye", telefon: "00000001234", onHesapSil: () => { deletes++; } });
  const view = await mount(h(TemaProvider, null, h(PanelNavbar, { adSoyad: "Örnek Üye", profilMenusu, onCikis: () => { exits++; } })));
  try {
    const avatars = view.container.querySelectorAll<HTMLButtonElement>('[aria-label="Profil ve hesap menüsü"]');
    assert.equal(avatars.length, 2);
    for (const avatar of avatars) {
      await click(avatar);
      const menu = view.container.querySelector('[role="menu"]')!;
      assert.ok(menu);
      assert.match(menu.textContent!, /••• ••• 1234/);
      assert.doesNotMatch(menu.textContent!, /00000001234/);
      for (const theme of ["mavi", "yesil"]) {
        switchTheme(theme);
        color(menu, "background-color", theme === "mavi" ? "#ffffff" : "#fcfdf8");
        color(menu.querySelector('[role="menuitem"]')!, "color", "#e24b4a");
        const badge = [...menu.querySelectorAll("span")].find(s => s.textContent === "Eczanem Üyesi")!;
        color(badge, "color", theme === "mavi" ? "#185fa5" : "#4f7254");
        assert.equal(view.container.querySelector('[role="menu"]'), menu);
      }
      await act(async () => document.dispatchEvent(new dom.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      assert.equal(view.container.querySelector('[role="menu"]'), null);
      assert.equal(document.activeElement, avatar);
    }
    await click(avatars[0]);
    await click(view.container.querySelector('[role="menuitem"]')!);
    assert.equal(deletes, 1);
    assert.equal(view.container.querySelector('[role="menu"]'), null);
    await click([...view.container.querySelectorAll("button")].find(b => b.textContent?.trim() === "Çıkış")!);
    assert.equal(exits, 1);
  } finally { await view.close(); }
});

test("madalya, departman, hedef rol ve HBStore durum paletleri aynı ayrımları korur", () => {
  const medals = [1, 2, 3, 4].map(siraRenk);
  assert.deepEqual(medals.map(v => resolve(v, "mavi")), ["#f59e0b", "#9ca3af", "#b45309", "#e5e7eb"]);
  const values = [...medals, ...Object.values(DEPARTMAN_RENK), ...Object.values(DURUM_RENKLERI).flatMap(v => Object.values(v)), ...Object.values(HEDEF_ROL_TASARIM).flatMap(v => [v.renk, v.bg])];
  for (const value of values) assert.equal(resolve(value, "yesil"), resolve(value, "mavi"), value);
});

test("yerel renklerin iki tema zinciri eksiksizdir ve işlevsel renkler temayla değişmez", () => {
  const names = Object.keys(maps.mavi).filter(n => n.startsWith("--tema-yerel-"));
  assert.ok(names.length > 2000);
  for (const name of names) {
    const blue = resolve(`var(${name})`, "mavi"), green = resolve(`var(${name})`, "yesil");
    assert.doesNotMatch(blue + green, /var\(/, name);
    if (name.includes("-islevsel-") || name.endsWith("-hata-vurgu") || name.endsWith("-hata-metni")) assert.equal(green, blue, name);
  }
});

test("rapor puanında sıfır, ortalama altı ve ortalama üstü üç ayrı anlam rengini korur", () => {
  for (const theme of ["mavi", "yesil"]) {
    for (const [score, expected] of [[0, "#e24b4a"], [99, "#bc2d0d"], [100, "#56aeff"], [101, "#56aeff"]] as const) {
      assert.equal(resolve(puanRengi(score, 100), theme).toLowerCase(), expected);
    }
  }
});
