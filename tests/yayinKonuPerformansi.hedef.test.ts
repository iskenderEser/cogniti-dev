import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { Window } from "happy-dom";
import ts from "typescript";
import type { EgitimTuruEtkisiSatiri } from "@/app/(panel)/raporlar/yayin-raporlari/_hooks/uretimRaporuOnbellek";

const bos = () => null;
const modules: Record<string, unknown> = {
  react: React, "react/jsx-runtime": jsxRuntime, "lucide-react": { X: bos },
  "@/lib/utils/raporUtils": { formatPuan: (n: number) => n.toLocaleString("tr-TR") },
  "./YayinKonuPerformansi.module.css": { default: new Proxy({}, { get: (_target, key) => String(key) }) },
};
const exports: { default?: React.ComponentType<{ detay: EgitimTuruEtkisiSatiri; onKapat?: () => void }> } = {};
vm.runInNewContext(ts.transpileModule(readFileSync("components/raporlar/YayinKonuPerformansi.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports, require: (id: string) => { assert.ok(id in modules, id); return modules[id]; } });
const Card = exports.default!;

const veri = (): EgitimTuruEtkisiSatiri => ({
  egitim_turu: "urun_egitimi", egitim_adi: "Ürün Eğitimi", donemde_yayina_alinan: 36,
  tamamlanan_izleme: 69, kazanilan_toplam: 4159, kaybedilen_toplam: 100, net_puan: 4059,
  begeni_sayisi: 0, favori_sayisi: 0, extra_izleme_sayisi: 0,
  urun_dagilimi: [
    { urun_id: "p1", urun_adi: "Normavas", kazanilan_toplam: 1135, kaybedilen_toplam: 30, net_puan: 1105 },
    { urun_id: "p2", urun_adi: "Laropen", kazanilan_toplam: 839, kaybedilen_toplam: 13, net_puan: 826 },
    { urun_id: "p3", urun_adi: "Semeril", kazanilan_toplam: 819, kaybedilen_toplam: 21, net_puan: 798 },
    { urun_id: "p4", urun_adi: "Abilon", kazanilan_toplam: 697, kaybedilen_toplam: 21, net_puan: 676 },
    { urun_id: "p5", urun_adi: "Forma XL", kazanilan_toplam: 669, kaybedilen_toplam: 15, net_puan: 654 },
  ],
});
async function ortam() {
  const dom = new Window();
  for (const key of ["window","document","navigator","HTMLElement","Element","Node","Event","KeyboardEvent"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  return {
    dom, container,
    render: (detay: EgitimTuruEtkisiSatiri, key = "tumu-ay", onKapat?: () => void) => act(async () => root.render(React.createElement(Card, { key, detay, onKapat }))),
    tab: (name: string) => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((b) => b.textContent === name)!,
    click: (el: HTMLElement) => act(async () => el.click()),
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("dört özet SQL değerleriyle kalır; ürün kulakçığı yalnız seçili ürünün değerlerini değiştirir", async () => {
  const o = await ortam(), data = veri(), once = JSON.stringify(data);
  try {
    await o.render(data);
    const summary = () => [...o.container.querySelectorAll("[data-ozet]")].map((el) => el.textContent);
    assert.deepEqual(summary(), ["36","69","+4.159","4.059p"]);
    assert.equal(o.container.querySelectorAll('[role="tab"]').length, 5);
    assert.equal(o.tab("Normavas").getAttribute("aria-selected"), "true");
    assert.equal(o.tab("Normavas").tabIndex, 0);
    assert.equal(o.tab("Laropen").tabIndex, -1);
    assert.equal(o.container.querySelector('[role="tabpanel"]')!.getAttribute("aria-labelledby"), o.tab("Normavas").id);
    const numbers = () => [...o.container.querySelectorAll("[data-urun-puani]")].map((el) => el.textContent);
    assert.deepEqual(numbers(), ["1.105p","+1.135","−30"]);
    await o.click(o.tab("Laropen"));
    assert.deepEqual(numbers(), ["826p","+839","−13"]);
    assert.deepEqual(summary(), ["36","69","+4.159","4.059p"]);
    const track = o.container.querySelector('[role="img"]')!;
    assert.match(track.getAttribute("aria-label")!, /Laropen: 826 net puan/);
    assert.ok(Math.abs(parseFloat((track.firstElementChild as HTMLElement).style.width) - 826 / 1105 * 100) < .001);
    assert.equal(JSON.stringify(data), once);
  } finally { await o.kapat(); }
});

test("ürün kulakçıkları ok/Home/End tuşlarıyla seçilir ve odak/ARIA bilgileri eşleşir", async () => {
  const o = await ortam();
  try {
    await o.render(veri());
    const key = async (name: string, key: string) => act(async () => { o.tab(name).dispatchEvent(new o.dom.KeyboardEvent("keydown", { key, bubbles: true })); });
    await key("Normavas", "ArrowLeft");
    assert.equal(o.tab("Forma XL").getAttribute("aria-selected"), "true");
    assert.equal(o.dom.document.activeElement?.id, o.tab("Forma XL").id);
    await key("Forma XL", "ArrowRight");
    assert.equal(o.tab("Normavas").getAttribute("aria-selected"), "true");
    await key("Normavas", "End");
    assert.equal(o.tab("Forma XL").getAttribute("aria-selected"), "true");
    await key("Forma XL", "Home");
    assert.equal(o.tab("Normavas").getAttribute("aria-selected"), "true");
    assert.equal(o.tab("Normavas").getAttribute("aria-controls"), o.container.querySelector('[role="tabpanel"]')!.id);
  } finally { await o.kapat(); }
});

test("rol/dönem anahtarı değişince ilk ürün açılır; eksilen ürün, sıfır ve negatif puanlar güvenle gösterilir", async () => {
  const o = await ortam();
  try {
    await o.render(veri()); await o.click(o.tab("Laropen"));
    await o.render(veri(), "bm-yil");
    assert.equal(o.tab("Normavas").getAttribute("aria-selected"), "true");
    const yeni = veri(); yeni.urun_dagilimi = [
      { urun_id: "zero", urun_adi: "Sıfır", kazanilan_toplam: 0, kaybedilen_toplam: 0, net_puan: 0 },
      { urun_id: "minus", urun_adi: "Eksi", kazanilan_toplam: 0, kaybedilen_toplam: 10, net_puan: -10 },
    ];
    await o.render(yeni, "bm-yil");
    assert.equal(o.tab("Sıfır").getAttribute("aria-selected"), "true");
    await o.click(o.tab("Eksi"));
    assert.equal(o.container.querySelector('[data-urun-puani="net"]')!.textContent, "-10p");
    assert.equal((o.container.querySelector('[role="img"]')!.firstElementChild as HTMLElement).style.width, "0%");
  } finally { await o.kapat(); }
});

test("ürün kaydı olmayan konuda özet korunur ve boş kulakçık açılmaz; yönetici kapatabilir", async () => {
  const o = await ortam(); let kapandi = 0;
  try {
    const data = veri(); data.urun_dagilimi = [{ urun_id: null, urun_adi: "Ürün dışı", kazanilan_toplam: 1, kaybedilen_toplam: 0, net_puan: 1 }];
    await o.render(data, "tumu-ay", () => kapandi++);
    assert.equal(o.container.querySelector('[role="tablist"]'), null);
    assert.equal(o.container.querySelectorAll("[data-ozet]").length, 4);
    await o.click(o.container.querySelector<HTMLButtonElement>('button[aria-label="Detayı kapat"]')!);
    assert.equal(kapandi, 1);
  } finally { await o.kapat(); }
});
