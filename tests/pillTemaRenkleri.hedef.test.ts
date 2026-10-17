import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { Window } from "happy-dom";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import config from "../postcss.config.mjs";
import { Pill, PillButon, NOTR_RENK } from "@/components/pill/Pill";
import { TeknikPill } from "@/components/pill/TeknikPill";
import { VaryantPill } from "@/components/pill/VaryantPill";
import { HedefRolPill } from "@/components/pill/HedefRolPill";
import { DurumPill } from "@/components/pill/DurumPill";
import { YayinTuruPill } from "@/components/ogrenme-araci/YayinTuruPill";
import { TarihPill } from "@/components/ui/tarih-pill";
import { Badge } from "@/components/ui/badge";
import { durumMesaji, type DurumKodu } from "@/lib/utils/durum/mesaj";
import { HEDEF_ROL_TASARIM, type HedefRol } from "@/app/(panel)/talepler/_types";
import { YAYIN_TURU_SUNUMU, YAYIN_TURLERI } from "@/lib/ogrenmeAraci/turSunumu";
import { CEK_TALEP_DURUM_META } from "@/lib/eclub/store/eclubStoreTipler";
import { ROL_ADLARI, TUM_ROLLER } from "@/lib/utils/roller";

const referans = JSON.parse(readFileSync("docs/renk-envanteri/ozel-bilesenler.json", "utf8")) as {
  uretimDurumlari: Array<{ kod: DurumKodu; uretici: ReturnType<typeof durumMesaji>; iu: ReturnType<typeof durumMesaji> }>;
  hedefRoller: typeof HEDEF_ROL_TASARIM;
  cekDurumlari: typeof CEK_TALEP_DURUM_META;
  ogrenmeAraciPilleri: Array<{ tur: keyof typeof YAYIN_TURU_SUNUMU; etiket: string; cogulEtiket: string; renk: string; uygulananZemin: string }>;
};
const temaCss = readFileSync("app/tema.css", "utf8");
const haritalar = new Map<string, Record<string, string>>();
for (const tema of ["mavi", "yesil"]) {
  const map: Record<string, string> = {};
  postcss.parse(readFileSync("node_modules/tailwindcss/theme.css", "utf8")).walkDecls(d => { map[d.prop] = d.value; });
  postcss.parse(temaCss).walkRules(rule => {
    if (rule.selectors.includes(`[data-tema="${tema}"]`)) rule.walkDecls(d => { map[d.prop] = d.value; });
  });
  haritalar.set(tema, map);
}
function coz(value: string, tema: string): string {
  return value.replace(/var\((--[\w-]+)\)/g, (_, key: string) => { assert.ok(key in haritalar.get(tema)!, key); return coz(haritalar.get(tema)![key], tema); });
}
function renkleriCoz<T>(value: T, tema: string): T {
  if (typeof value === "string") return coz(value, tema) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, renkleriCoz(child, tema)])) as T;
  return value;
}

test("31 rolün 20 üretim durumu, hedef roller ve çek durumları iki temada mevcut anlam/rengi korur", () => {
  const roller = [...new Set([...TUM_ROLLER, ...Object.keys(ROL_ADLARI)])];
  for (const tema of ["mavi", "yesil"]) {
    for (const rol of roller) for (const ref of referans.uretimDurumlari) {
      assert.deepEqual(renkleriCoz(durumMesaji(ref.kod, rol), tema), rol === "iu" ? ref.iu : ref.uretici, `${tema}/${rol}/${ref.kod}`);
    }
    assert.deepEqual(renkleriCoz(HEDEF_ROL_TASARIM, tema), referans.hedefRoller);
    assert.deepEqual(renkleriCoz(CEK_TALEP_DURUM_META, tema), referans.cekDurumlari);
    for (const [hedef, meta] of Object.entries(referans.hedefRoller)) assert.equal(coz(`var(--tema-hedef-${hedef}-halka)`, tema), `${meta.renk}33`);
    for (const hedef of ["eczaci", "eczane_teknisyeni"] as const) assert.equal(coz(`var(--tema-hedef-${hedef}-secili)`, tema), `${referans.hedefRoller[hedef].renk}22`);
    for (const ref of referans.ogrenmeAraciPilleri) {
      assert.deepEqual(renkleriCoz(YAYIN_TURU_SUNUMU[ref.tur], tema), { etiket: ref.etiket, cogulEtiket: ref.cogulEtiket, renk: ref.renk, zemin: ref.uygulananZemin });
    }
  }
});

const compiled = await postcss([tailwind(config.plugins["@tailwindcss/postcss"])]).process(readFileSync("app/globals.css", "utf8"), { from: "app/globals.css" });
assert.equal(compiled.warnings().length, 0);
function utility(name: string) {
  let found: postcss.Rule | undefined;
  compiled.root.walkRules(`.${name.replace(/[^\w-]/g, "\\$&")}`, rule => { found = rule; });
  assert.ok(found, name);
  return found.toString();
}
// Gerçek derleyicinin hedef kuralları Happy DOM için katmansız yüklenir.
const css = `${temaCss}\n${readFileSync("components/ui/tarih-pill.module.css", "utf8")}\n${["border-[var(--tema-arac-pill-cizgi)]", "bg-destructive", "text-destructive-foreground"].map(utility).join("\n")}`;

test("gerçek pill, araç, rozet ve tarih stilleri tema kapsamını alır; e8 ve %60 alpha korunur", async () => {
  const window = new Window();
  const ornekler: React.ReactNode[] = [];
  const ekle = (id: string, node: React.ReactNode) => ornekler.push(React.createElement("div", { id, key: id }, node));
  ekle("notr", React.createElement(Pill, { renk: NOTR_RENK }, "Nötr"));
  ekle("teknik", React.createElement(TeknikPill, { teknikAdi: "Örnek teknik" }));
  ekle("pasif", React.createElement(PillButon, { onClick: () => undefined }, "Pasif"));
  ekle("varyant", React.createElement(VaryantPill, { hazirVideo: true, hazirSoruSeti: true }));
  ekle("badge", React.createElement(Badge, { variant: "destructive" }, "Hata"));
  ekle("tarih", React.createElement(TarihPill));
  for (const tur of YAYIN_TURLERI) ekle(tur, React.createElement(YayinTuruPill, { tur }));
  for (const hedef of Object.keys(HEDEF_ROL_TASARIM) as HedefRol[]) ekle(`hedef-${hedef}`, React.createElement(HedefRolPill, { hedefRol: hedef }));
  for (const rol of ["pm", "iu"]) for (const { kod } of referans.uretimDurumlari) ekle(`${rol}-${kod}`, React.createElement(DurumPill, { kod, rol }));
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null, ...ornekler));
  window.document.head.innerHTML = `<style>${css}</style>`;
  window.document.body.innerHTML = `<section id="alan">${markup}</section><div data-tema="mavi"><span id="ic-mavi" style="color:var(--tema-pill-notr-metin)"></span></div>`;
  const bekle = (id: string, prop: string, expected: string) => {
    const el = window.document.getElementById(id)!.firstElementChild!;
    const probe = window.document.createElement("span");
    probe.style.setProperty(prop, expected);
    window.document.body.append(probe);
    const value = window.getComputedStyle(probe).getPropertyValue(prop);
    assert.notEqual(value, "", expected);
    assert.equal(window.getComputedStyle(el).getPropertyValue(prop), value, `${id}/${prop}`);
    probe.remove();
  };
  try {
    for (const tema of ["mavi", "yesil", "mavi"]) {
      window.document.documentElement.setAttribute("data-tema", tema);
      bekle("notr", "background-color", tema === "mavi" ? "#f3f4f6" : "#eef1e6");
      bekle("notr", "color", tema === "mavi" ? "#4b5563" : "#68766e");
      bekle("teknik", "background-color", tema === "mavi" ? "#f9fafb" : "#f6f5ef");
      bekle("pasif", "color", tema === "mavi" ? "#6b7280" : "#68766e");
      bekle("tarih", "background-color", tema === "mavi" ? "#ffffff" : "#fcfdf8");
      bekle("tarih", "border-top-color", tema === "mavi" ? "#e5e7eb" : "#dfe3d7");
      bekle("badge", "color", "#ffffff");
      bekle("badge", "background-color", "#e24b4a");
      assert.equal(window.getComputedStyle(window.document.getElementById("ic-mavi")!).color, "#4b5563");
      for (const ref of referans.ogrenmeAraciPilleri) {
        bekle(ref.tur, "color", ref.renk);
        bekle(ref.tur, "background-color", ref.uygulananZemin);
        bekle(ref.tur, "border-top-color", "#ffffff99");
      }
      for (const [hedef, ref] of Object.entries(referans.hedefRoller)) {
        bekle(`hedef-${hedef}`, "color", ref.renk);
        bekle(`hedef-${hedef}`, "background-color", ref.bg);
        bekle(`hedef-${hedef}`, "border-top-color", ref.border);
      }
      for (const rol of ["pm", "iu"]) for (const ref of referans.uretimDurumlari) {
        const old = rol === "iu" ? ref.iu : ref.uretici;
        bekle(`${rol}-${ref.kod}`, "color", old.renk.text);
        bekle(`${rol}-${ref.kod}`, "background-color", old.renk.bg);
        bekle(`${rol}-${ref.kod}`, "border-top-color", old.renk.border);
      }
    }
  } finally { await window.happyDOM.close(); }
});

const dom = new Window({ url: "http://localhost" });
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "HTMLButtonElement", "Event", "MouseEvent"]) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
after(async () => { await dom.happyDOM.close(); });

test("PillButon tema geçişinde seçimi ve callback'i korur; form göndermez", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let click = 0;
  let submit = 0;
  function Ornek() {
    const [secili, setSecili] = React.useState(false);
    return React.createElement("form", { onSubmit: e => { e.preventDefault(); submit++; } }, React.createElement(PillButon, { secili, onClick: () => { setSecili(v => !v); click++; } }, secili ? "Seçili" : "Pasif"));
  }
  try {
    await act(async () => root.render(React.createElement(Ornek)));
    const button = container.querySelector("button")!;
    for (const tema of ["mavi", "yesil"]) {
      dom.document.documentElement.setAttribute("data-tema", tema);
      assert.equal(button.type, "button");
      await act(async () => button.click());
      assert.equal(button.textContent, tema === "mavi" ? "Seçili" : "Pasif");
    }
    assert.equal(click, 2);
    assert.equal(submit, 0);
  } finally { await act(async () => root.unmount()); container.remove(); }
});
