import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { Window } from "happy-dom";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import config from "../postcss.config.mjs";

const dom = new Window({ url: "http://localhost" });
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "HTMLInputElement", "HTMLButtonElement", "MutationObserver", "Event", "MouseEvent", "FocusEvent", "KeyboardEvent", "CustomEvent", "PointerEvent", "ResizeObserver", "NodeFilter", "DocumentFragment"]) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
for (const key of ["getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key].bind(dom) });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
const card = await import("@/components/ui/card");
const table = await import("@/components/ui/table");
const dialog = await import("@/components/ui/alert-dialog");
const tip = await import("@/components/ui/tooltip");
const { default: HataMesaji } = await import("@/components/HataMesaji");
const { default: CcTakimLigAkordeonu } = await import("@/components/cc-ligi/CcTakimLigAkordeonu");
const { default: TakimLigAkordeonu } = await import("@/components/hbligi/field/TakimLigAkordeonu");
const { default: YayinDetayModal } = await import("@/components/raporlar/YayinDetayModal");
const { UttYayinBosDurum, UttYayinKartIskeletleri } = await import("@/components/yayin/UttYayinListeOrtaklari");
const h = React.createElement;
after(async () => { await dom.happyDOM.close(); });

const themeCss = readFileSync("app/tema.css", "utf8");
const moduleRules: string[] = [];
for (const file of ["app/(panel)/raporlar/utt/utt-report.module.css", "app/(panel)/raporlar/bm/bm-report.module.css"]) {
  postcss.parse(readFileSync(file, "utf8")).walkRules(rule => {
    if ([".panel", ".sectionIcon", ".table th", ".table td", ".table tbody tr:hover"].includes(rule.selector)) moduleRules.push(rule.toString());
  });
}
const moduleCss = moduleRules.join("\n");
const compiled = await postcss([tailwind(config.plugins["@tailwindcss/postcss"])]).process(readFileSync("app/globals.css", "utf8"), { from: "app/globals.css" });
assert.equal(compiled.warnings().length, 0);
function utility(name: string) {
  let rule: postcss.Rule | undefined;
  compiled.root.walkRules(`.${name.replace(/[^\w-]/g, "\\$&")}`, r => { rule = r; });
  return rule;
}
const maps = new Map<string, Record<string, string>>();
for (const theme of ["mavi", "yesil"]) {
  const values: Record<string, string> = {};
  postcss.parse(readFileSync("node_modules/tailwindcss/theme.css", "utf8")).walkDecls(d => { values[d.prop] = d.value; });
  postcss.parse(themeCss).walkRules(r => { if (r.selectors.includes(`[data-tema="${theme}"]`)) r.walkDecls(d => { values[d.prop] = d.value; }); });
  maps.set(theme, values);
}
const resolve = (value: string, theme: string): string => value.replace(/var\((--[\w-]+)\)/g, (_, key: string) => {
  assert.ok(key in maps.get(theme)!, key);
  return resolve(maps.get(theme)![key], theme);
});
const style = document.createElement("style"); document.head.append(style);
function styles() {
  const names = new Set([...document.querySelectorAll("[class]")].flatMap(el => [...el.classList]));
  const rules: string[] = [];
  compiled.root.walkRules(r => { if (r.selector === "body" || r.selector === "*, ::after, ::before, ::backdrop, ::file-selector-button") rules.push(r.toString()); });
  for (const name of names) {
    const rule = utility(name);
    if (name.includes("var(--tema-") && !name.includes(":")) assert.ok(rule, name);
    if (rule && !name.includes(":")) rules.push(rule.toString());
  }
  // Happy DOM does not evaluate Tailwind @layer/nesting. These are the actual
  // target rules without layer wrappers; hover/selected mixes are checked below.
  style.textContent = `${themeCss}\n${moduleCss}\n${rules.join("\n")}`;
}
function color(el: Element, property: string, expected: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/#([\da-f])([\da-f])([\da-f])\b/g, "#$1$1$2$2$3$3");
  assert.equal(normalize(dom.getComputedStyle(el).getPropertyValue(property)), normalize(expected), `${el.tagName}/${property}`);
}
async function mount(node: React.ReactNode) {
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(node)); styles();
  return { container, root, close: async () => { await act(async () => root.unmount()); container.remove(); } };
}

test("kart ve tablo yüzey/metin/çizgileri iki temayı alır; satır seçimi, kolonlar ve renk override'ı korunur", async () => {
  function Sample() {
    const [selected, select] = React.useState(false);
    return h(card.Card, null, h(card.CardHeader, null, h(card.CardTitle, null, "Liste"), h(card.CardDescription, null, "Açıklama")), h(card.CardContent, null,
      h(table.Table, null, h(table.TableHeader, null, h(table.TableRow, null, h(table.TableHead, null, "Ürün"), h(table.TableHead, null, "Puan"))),
        h(table.TableBody, null, h(table.TableRow, { onClick: () => select(v => !v), "data-state": selected ? "selected" : undefined }, h(table.TableCell, null, "Örnek"), h(table.TableCell, null, "50"))),
        h(table.TableFooter, null, h(table.TableRow, null, h(table.TableCell, { colSpan: 2 }, "Toplam 50"))), h(table.TableCaption, null, "Kayıtlar"))));
  }
  const view = await mount(h(Sample));
  try {
    const surface = view.container.querySelector('[data-slot="card"]')!;
    const row = view.container.querySelector('tbody tr')!;
    for (const theme of ["mavi", "yesil", "mavi"]) {
      document.documentElement.setAttribute("data-tema", theme);
      color(surface, "background-color", "#fff");
      color(surface, "color", theme === "mavi" ? "#171717" : "#2c4137");
      color(view.container.querySelector('[data-slot="card-description"]')!, "color", theme === "mavi" ? "#71717a" : "#68766e");
      const border = dom.getComputedStyle(surface).borderTopColor;
      assert.ok(theme === "mavi" ? ["currentcolor", "#171717"].includes(border.toLowerCase()) : border === "#dfe3d7");
      assert.equal(view.container.querySelectorAll("th").length, 2);
      assert.equal(view.container.querySelector("tfoot")!.textContent, "Toplam 50");
      for (const name of ["hover:bg-muted/50", "has-aria-expanded:bg-muted/50", "data-[state=selected]:bg-muted"]) {
        let actual = ""; utility(name)!.walkDecls("background-color", d => { actual = resolve(d.value, theme); });
        assert.ok(actual.includes(theme === "mavi" ? "#f4f4f5" : "#eef1e6"));
        if (name.includes("/50")) assert.match(actual, /50%/);
      }
      await act(async () => row.dispatchEvent(new dom.MouseEvent("click", { bubbles: true })));
    }
    assert.equal(row.getAttribute("data-state"), "selected");
    const override = renderToStaticMarkup(h(card.Card, { className: "border-[#123456]" }));
    assert.match(override, /border-\[#123456\]/); assert.doesNotMatch(override, /border-\[var\(--tema-kart-cizgi\)/);
  } finally { await view.close(); }
});

test("gerçek AlertDialog portalı açıkken tema değişir; iptal/eylem, kapanma ve odak geri dönüşü korunur", async () => {
  let confirmed = 0;
  const view = await mount(h(dialog.AlertDialog, null,
    h(dialog.AlertDialogTrigger, null, "Pencere aç"),
    h(dialog.AlertDialogContent, null, h(dialog.AlertDialogHeader, null, h(dialog.AlertDialogTitle, null, "Onay"), h(dialog.AlertDialogDescription, null, "İşlemi onaylayın.")),
      h(dialog.AlertDialogFooter, null, h(dialog.AlertDialogCancel, null, "İptal"), h(dialog.AlertDialogAction, { onClick: () => { confirmed++; } }, "Onayla")))));
  try {
    const trigger = view.container.querySelector("button")!;
    await act(async () => trigger.click()); styles();
    const content = document.querySelector('[role="alertdialog"]')!;
    assert.ok(content); assert.equal(view.container.contains(content), false);
    for (const theme of ["mavi", "yesil", "mavi"]) {
      document.documentElement.setAttribute("data-tema", theme);
      assert.equal(document.querySelector('[role="alertdialog"]'), content);
      color(content, "background-color", theme === "mavi" ? "#fff" : "#fffefb");
    }
    const cancel = [...content.querySelectorAll("button")].find(b => b.textContent === "İptal")!;
    assert.equal(document.activeElement, cancel);
    await act(async () => cancel.click());
    assert.equal(document.querySelector('[role="alertdialog"]'), null); assert.equal(confirmed, 0);
    assert.equal(document.activeElement, trigger);
    await act(async () => trigger.click());
    const confirm = [...document.querySelector('[role="alertdialog"]')!.querySelectorAll("button")].find(b => b.textContent === "Onayla")!;
    await act(async () => confirm.click());
    assert.equal(confirmed, 1); assert.equal(document.querySelector('[role="alertdialog"]'), null);
  } finally { await view.close(); }
});

test("gerçek Tooltip portalı ve oku açıkken iki tema arasında güncellenir; Escape kapatır", async () => {
  const view = await mount(h(tip.TooltipProvider, null, h(tip.Tooltip, null, h(tip.TooltipTrigger, null, "İpucu"), h(tip.TooltipContent, null, "Açıklama"))));
  try {
    const trigger = view.container.querySelector("button")!;
    await act(async () => { trigger.focus(); }); styles();
    const content = document.querySelector('[data-slot="tooltip-content"]')!;
    assert.ok(content); assert.equal(view.container.contains(content), false);
    for (const theme of ["mavi", "yesil", "mavi"]) {
      document.documentElement.setAttribute("data-tema", theme);
      color(content, "background-color", theme === "mavi" ? "#171717" : "#2c4137");
      color(content, "color", theme === "mavi" ? "#fff" : "#fffdf7");
      color(content.querySelector("svg")!, "fill", theme === "mavi" ? "#171717" : "#2c4137");
    }
    await act(async () => document.dispatchEvent(new dom.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(document.querySelector('[data-slot="tooltip-content"]'), null);
  } finally { await view.close(); }
});

test("dört bildirim türü paletini, ayrıntı alpha'sını ve elle/otomatik kapanmayı korur", async () => {
  const palettes = { hata: ["#fef2f2", "#fecaca", "#bc2d0d"], basari: ["#f0fdf4", "#bbf7d0", "#16a34a"], uyari: ["#fefce8", "#fde68a", "#854d0e"], bilgi: ["#eff6ff", "#bfdbfe", "#1d4ed8"] };
  for (const [kind, palette] of Object.entries(palettes)) {
    let closes = 0;
    const view = await mount(h(HataMesaji, { tur: kind as "hata", mesaj: "Örnek", adim: "Kontrol", detay: "Ayrıntı", otomatikKapat: false, onKapat: () => { closes++; } }));
    try {
      const notification = view.container.firstElementChild!;
      for (const theme of ["mavi", "yesil"]) {
        document.documentElement.setAttribute("data-tema", theme);
        color(notification, "background-color", palette[0]); color(notification, "border-top-color", palette[1]); color(notification.querySelector("p")!, "color", palette[2]);
        assert.deepEqual([...notification.querySelectorAll("p")].slice(1).map(p => p.style.opacity), ["0.8", "0.7"]);
      }
      await act(async () => view.container.querySelector("button")!.click()); assert.equal(closes, 1); assert.equal(view.container.childElementCount, 0);
    } finally { await view.close(); }
  }
  let automatic = 0;
  const timed = await mount(h(HataMesaji, { mesaj: "Geçici", sure: 10, onKapat: () => { automatic++; } }));
  try { await act(async () => new Promise(resolve => setTimeout(resolve, 30))); assert.equal(automatic, 1); assert.equal(timed.container.childElementCount, 0); }
  finally { await timed.close(); }
});

test("dokuz skeleton ailesi ve ortak yayın boş/iskelet halleri temayı alır; pulse ve erişilebilir metinler korunur", async () => {
  const files = ["cc-ligi/CcLigiSkeleton", "eclub/EclubAnaSayfaSkeleton", "eclub/EclubFirmaCekTakibiSkeleton", "eclub/EclubFirmaCekTalebiSkeleton", "eclub/EclubFirmaPerformansSkeleton", "eclub/EclubFirmaYayinlarSkeleton", "eclub/EclubFirmalarSkeleton", "eclub/EclubLigiSkeleton", "tclub/TClubPageSkeleton"];
  for (const file of files) {
    const { default: Component } = await import(`../components/${file}.tsx`);
    for (const page of file.includes("TClub") ? ["lig", "rapor"] : [undefined]) {
      const view = await mount(h(Component, { aktifSayfa: page }));
      try {
        assert.ok(view.container.querySelector('[class*="animate-pulse"]'));
        assert.ok(view.container.querySelector('.sr-only, [role="status"][aria-label], [aria-busy="true"][aria-label]'));
        const placeholder = [...view.container.querySelectorAll("[class]")].find(el => [...el.classList].some(name => /^bg-\[var\(--tema-iskelet-(?:baslik|satir|cc-baslik|lig-satir)/.test(name)))!;
        assert.ok(placeholder, file);
        for (const theme of ["mavi", "yesil"]) {
          document.documentElement.setAttribute("data-tema", theme);
          const cls = [...placeholder.classList].find(name => name.startsWith("bg-[var("))!;
          let expected = ""; utility(cls)!.walkDecls("background-color", d => { expected = resolve(d.value, theme); });
          if (expected.startsWith("oklch(")) assert.equal(expected, resolve("var(--color-slate-200)", theme));
          else color(placeholder, "background-color", expected);
        }
      } finally { await view.close(); }
    }
  }
  const view = await mount(h(React.Fragment, null, h(UttYayinBosDurum, { mesaj: "Kayıt yok" }), h(UttYayinKartIskeletleri, { izgaraClassName: "grid", kartSayisi: 2 })));
  try { document.documentElement.setAttribute("data-tema", "yesil"); color(view.container.firstElementChild!, "background-color", "#fcfdf8"); assert.match(view.container.textContent!, /Kayıt yok/); assert.equal(view.container.querySelectorAll('[class*="aspect-video"]').length, 2); }
  finally { await view.close(); }
});

test("iki ve üç kademeli lig akordiyonlarında açılma, net puan ve ilk üç sıra ayrımı korunur", async () => {
  const common = { izleme_puani: 10, cevaplama_puani: 3, extra_puani: 0, ileri_sarma_kaybi: 1, yanlis_cevap_kaybi: 0, oneri_puani: 0, oneri_kaybi: 0, cc_gonderme_puani: 0, cc_referral_puani: 0, challenge_kaybi: 0, eclub_puani: 0, rol: "utt" };
  for (const Component of [CcTakimLigAkordeonu, TakimLigAkordeonu]) {
    const rows = [3, 2, 1].map((n, i) => ({ ...common, id: `k${i}`, kullanici_id: `k${i}`, bm_id: `k${i}`, ad: `Kişi ${i}`, ad_soyad: `Kişi ${i}`, takim_id: `t${i}`, takim_adi: `Takım ${i}`, takim: `Takım ${i}`, bolge_id: `b${i}`, bolge_adi: `Bölge ${i}`, bolge: `Bölge ${i}`, izleme_puani: n * 10, toplam_puan: n * 10 + 2, toplam_net_puan: n * 10 + 2 }));
    const view = await mount(h(Component, { satirlar: rows, yukleniyor: false } as unknown as Parameters<typeof Component>[0]));
    try {
      const first = [...view.container.querySelectorAll<HTMLElement>("button, tr")].find(b => b.textContent?.includes("Takım 0"));
      assert.ok(first);
      for (const theme of ["mavi", "yesil"]) {
        document.documentElement.setAttribute("data-tema", theme);
        if (Component === TakimLigAkordeonu) {
          color(view.container.querySelector("th")!, "background-color", theme === "mavi" ? "#f7f9fc" : "#eef1e6");
          color(view.container.querySelector("th")!, "color", theme === "mavi" ? "#7d8ea2" : "#68766e");
          color(view.container.querySelector("td")!, "border-top-color", theme === "mavi" ? "#edf1f5" : "#dfe3d7");
        }
        await act(async () => first.click()); styles();
        assert.match(view.container.textContent!, /32/);
        assert.match(view.container.textContent!, /Kişi 0|Bölge 0/);
        const second = [...view.container.querySelectorAll<HTMLElement>("button, tr")].find(el => el !== first && el.textContent?.includes(Component === CcTakimLigAkordeonu ? "Kişi 0" : "Bölge 0"));
        assert.ok(second);
        await act(async () => second.click()); styles();
        if (Component === TakimLigAkordeonu) {
          const third = [...view.container.querySelectorAll<HTMLElement>("tr")].find(el => el.textContent?.includes("Kişi 0"));
          assert.ok(third);
          await act(async () => third.click()); styles();
        }
        assert.match(view.container.textContent!, /Video İzleme/);
        await act(async () => first.click());
      }
      assert.match(view.container.innerHTML, /tema-lig-sira-(?:altin|gumus|bronz)/);
    } finally { await view.close(); }
  }
});

test("yayın detay penceresinde yüklenme, soru/boş/hata halleri ve kapatma davranışı korunur", async () => {
  const originalFetch = globalThis.fetch;
  let fulfill: (value: Response) => void = () => undefined;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string) => { calls.push(url); return new Promise<Response>(resolve => { fulfill = resolve; }); }) as typeof fetch;
  let closes = 0;
  const view = await mount(h(YayinDetayModal, { yayinId: "ornek", onKapat: () => { closes++; } }));
  const detail = { yayin_id: "ornek", talep_no: 120, durum: "Yayında", urun_adi: "Örnek Ürün", hedef_roller: [], arac_turu: "video", video_url: null, sorular: [{ soru_metni: "Örnek soru?", secenekler: [{ harf: "A", metin: "Doğru seçenek", dogru: true }, { harf: "B", metin: "Diğer seçenek", dogru: false }] }] };
  try {
    assert.match(view.container.textContent!, /getiriliyor/);
    await act(async () => fulfill(new Response(JSON.stringify({ yayin: detail })))); styles();
    const questions = [...view.container.querySelectorAll("button")].find(b => b.textContent?.includes("Atanmış Sorular"))!;
    await act(async () => questions.click()); styles();
    for (const theme of ["mavi", "yesil"]) {
      document.documentElement.setAttribute("data-tema", theme);
      assert.match(view.container.textContent!, /Örnek soru/);
      const correct = [...view.container.querySelectorAll("div")].find(el => [...el.classList].includes("bg-[var(--tema-yayin-detay-dogru-zemin)]"))!;
      color(correct, "background-color", "#f0fdf4"); color(correct, "color", "#166534");
    }
    await act(async () => view.root.render(h(YayinDetayModal, { yayinId: "bos", onKapat: () => { closes++; } })));
    await act(async () => fulfill(new Response(JSON.stringify({ yayin: { ...detail, sorular: [] } }))));
    assert.match(view.container.textContent!, /kayıtlı soru seti bulunamadı/);
    await act(async () => view.root.render(h(YayinDetayModal, { yayinId: "yetkisiz", onKapat: () => { closes++; } })));
    await act(async () => fulfill(new Response(JSON.stringify({ hata: "Erişim yok" }), { status: 403 })));
    assert.match(view.container.textContent!, /Erişim yok/);
    await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-label="Kapat"]')!.click()); assert.equal(closes, 1);
    assert.deepEqual(calls, ["/api/raporlar/yayin-detay/ornek", "/api/raporlar/yayin-detay/bos", "/api/raporlar/yayin-detay/yetkisiz"]);
  } finally { globalThis.fetch = originalFetch; await view.close(); }
});
