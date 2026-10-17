import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test, { after } from "node:test";
import { Window } from "happy-dom";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cizimRenkCozucu, grafikRenkleriniCoz } from "@/lib/tema/cizimRenkleri";
import { HESAPLANAN_RENKLER } from "@/lib/tema/hesaplananRenkler.generated";
import { eclubPerformansDonemi, eclubPerformansiHesapla } from "@/lib/eclub/performans";
import { eclubPerformansGrafikSecenegi } from "@/lib/eclub/performansGrafik";
import { eclubHoykUcRengi, eclubHoykRengi } from "@/lib/eclub/hoykSureCercevesi";

const dom = new Window({ url: "http://localhost" });
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLCanvasElement", "SVGElement", "Element", "Node", "Event", "MouseEvent", "MutationObserver", "ResizeObserver"]) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
for (const key of ["getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key].bind(dom) });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(dom.HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 390 });
Object.defineProperty(dom.HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 300 });
const contexts = new WeakMap<object, ReturnType<typeof context>>();
function context() {
  const strokes: { renk: string; ilk: number[]; son: number[] }[] = [];
  let ilk: number[] = [], son: number[] = [];
  return {
    strokes, strokeStyle: "", lineWidth: 0, lineCap: "", lineJoin: "",
    measureText: (text: string) => ({ width: String(text).length * 7 }),
    clearRect: () => { strokes.length = 0; }, setTransform: () => {}, beginPath: () => {},
    moveTo: (...v: number[]) => { ilk = v; }, lineTo: (...v: number[]) => { son = v; },
    stroke() { strokes.push({ renk: this.strokeStyle, ilk, son }); },
  };
}
Object.defineProperty(dom.HTMLCanvasElement.prototype, "getContext", { configurable: true, value: function () {
  if (!contexts.has(this)) contexts.set(this, new Proxy(Object.assign(context(), { canvas: this }), { get: (target, key) => key in target ? Reflect.get(target, key) : () => {} }));
  return contexts.get(this);
} });
const style = document.createElement("style");
style.textContent = readFileSync("app/tema.css", "utf8");
document.head.append(style);
const { createRoot } = await import("react-dom/client");
const echarts = await import("echarts/core");
const { default: EChart } = await import("@/components/grafik/EChart");
const { default: DagilimGrafik } = await import("@/components/raporlar/DagilimGrafik");
const { EclubHoykSureCercevesi } = await import("@/components/eclub/EclubHoykSureCercevesi");
const { Progress } = await import("@/components/ui/progress");
const { default: LeadershipScore } = await import("@/components/hbligi/league/LeadershipScore");
const { default: CcLigiBanner } = await import("@/components/cc-ligi/CcLigiBanner");
after(async () => { await dom.happyDOM.close(); });
const h = React.createElement;
async function theme(tema: string) {
  await act(async () => {
    document.documentElement.setAttribute("data-tema", tema);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}
function mount() {
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  return { container, root, async close() { await act(async () => root.unmount()); container.remove(); } };
}
function chartIn(container: HTMLElement) {
  const el = container.querySelector("[_echarts_instance_]"); assert.ok(el);
  const chart = echarts.getInstanceByDom(el as HTMLDivElement); assert.ok(chart);
  return chart;
}
const donem = eclubPerformansDonemi(new Date("2026-10-11T12:00:00Z"));
const veri = eclubPerformansiHesapla({ donem, izlemeler: [], puanlar: [], kayiplar: [], uyeler: [], baglar: [], eczaneIdler: [], yayinIdler: [] });
const options = (chart: ReturnType<typeof chartIn>) => chart.getOption() as {
  series: { id: string; data: { value: number[]; itemStyle: { color: string; shadowColor: string }; symbolSize: number }[] }[];
  xAxis: { axisLabel: { color: string }; max: number }[];
  tooltip: { backgroundColor: string; textStyle: { color: string } }[];
};

test("CSS tek kaynak kalır; üretilen çıktı günceldir ve yalnız renk callback'leri çözülür", () => {
  execFileSync(process.execPath, ["scripts/denetim/hesaplanan-renkleri-uret.mjs", "--check"]);
  const formatter = () => "var(--tema-cizim-dagilim-1)";
  const color = (p: { dataIndex: number }) => p.dataIndex ? "#dc2626" : "var(--tema-cizim-dagilim-1)";
  const option = { dataset: { source: [["renk", "puan"], ["var(--tema-cizim-dagilim-1)", 45]] }, series: [{ itemStyle: { color }, label: { formatter } }] };
  const solved = grafikRenkleriniCoz(option);
  assert.deepEqual(solved.dataset, option.dataset);
  assert.equal(solved.series[0].label.formatter, formatter);
  assert.equal(solved.series[0].itemStyle.color({ dataIndex: 0 }), "#378ADD");
  assert.equal(solved.series[0].itemStyle.color({ dataIndex: 1 }), "#dc2626");
  assert.equal(option.series[0].itemStyle.color({ dataIndex: 0 }), "var(--tema-cizim-dagilim-1)");
  const fixed = ["arac-", "sure-", "kazanc-", "kayip-", "lig-", "madalya-gumus-", "madalya-altin-", "lider-altin-", "begeni", "favori"];
  for (const [ad, mavi] of Object.entries(HESAPLANAN_RENKLER.mavi)) {
    if (fixed.some(prefix => ad.startsWith(`--tema-cizim-${prefix}`))) assert.equal(HESAPLANAN_RENKLER.yesil[ad as keyof typeof HESAPLANAN_RENKLER.mavi], mavi, ad);
  }
});

test("gerçek açık ECharts örneği mavi–yeşil–mavi geçişinde eksen ve tooltip'i günceller, veriyi ve seçimi korur", async () => {
  const view = mount(); let secim = "";
  const option = eclubPerformansGrafikSecenegi(veri, "podcast", 2, true);
  try {
    await theme("mavi");
    await act(async () => view.root.render(h(EChart, { option, renderer: "svg", onClick: p => { secim = p.seriesId ?? ""; } })));
    const chart = chartIn(view.container);
    const initial = options(chart);
    for (const tema of ["mavi", "yesil", "mavi"]) {
      await theme(tema);
      assert.equal(chartIn(view.container), chart);
      const actual = options(chart);
      assert.equal(actual.xAxis[0].axisLabel.color, tema === "mavi" ? "#8a99af" : "#68766e");
      assert.equal(actual.tooltip[0].backgroundColor, tema === "mavi" ? "#fff" : "#ffffff");
      assert.equal(actual.tooltip[0].textStyle.color, tema === "mavi" ? "#203653" : "#2c4137");
      assert.equal(actual.xAxis[0].max, 8);
      assert.equal(actual.series.length, 8);
      const points = (s: typeof actual.series) => s.map(({ id, data }) => ({ id, data: data.map(d => d.value ?? d) }));
      assert.deepEqual(points(actual.series), points(initial.series));
      assert.equal(actual.series[5].data[1].itemStyle.shadowColor, "#8c65c940");
      assert.equal(actual.series[5].data[1].symbolSize, 17);
      chart.trigger("click", { seriesId: "podcast", value: [2, 1, 0] });
      assert.equal(secim, "podcast");
      assert.ok(view.container.querySelector("svg"));
      assert.doesNotMatch(view.container.querySelector("svg")!.outerHTML, /var\(--tema-/);
    }
  } finally { await view.close(); }
});

test("dağılımın dört modu ve pozitif/negatif değerleri tema geçişlerinde korunur", async () => {
  const view = mount(); let secili: string | null = null;
  const data = [{ ad: "Kazanım", puan: 120 }, { ad: "Kayıp", puan: -25 }];
  try {
    await theme("mavi");
    await act(async () => view.root.render(h(DagilimGrafik, { veri: data, secili, onSecim: ad => { secili = ad; } })));
    for (const mode of ["Pasta", "Sütun", "Çizgi"]) {
      await act(async () => [...view.container.querySelectorAll("button")].find(b => b.textContent === mode)!.click());
      const chart = chartIn(view.container);
      const before = chart.getOption();
      for (const tema of ["yesil", "mavi"]) {
        await theme(tema);
        assert.equal(chartIn(view.container), chart);
        const option = chart.getOption();
        assert.deepEqual(option.dataset, before.dataset);
        assert.equal(option.animationDuration, 700);
        assert.equal(option.animationDurationUpdate, 700);
        assert.equal(view.container.querySelector('[aria-pressed="true"]')!.textContent, mode);
        assert.equal((option.color as string[])[0], tema === "mavi" ? "#378ADD" : "#355545");
        assert.equal(new Set(option.color as string[]).size, 7);
        assert.ok(view.container.querySelector("canvas"));
      }
    }
    await act(async () => [...view.container.querySelectorAll("button")].find(b => b.textContent === "Tablo")!.click());
    const table = view.container.querySelector("table")!;
    await act(async () => table.querySelectorAll("tbody tr")[1].dispatchEvent(new dom.MouseEvent("click", { bubbles: true })));
    assert.equal(secili, "Kayıp");
    await theme("yesil");
    assert.equal(view.container.querySelector("table"), table);
    assert.deepEqual([...table.querySelectorAll("tbody td")].map(el => el.textContent), ["Kazanım", "120", "Kayıp", "-25"]);
    assert.equal(dom.getComputedStyle(table.querySelector("td")!).color, "#2c4137");
  } finally { await view.close(); }
});

test("HOYK 0–15 gün ve sınırlar kayıtlı renklerle eşleşir; açık Canvas tema değişiminde aynı çerçeveyi yeniden çizer", async () => {
  const oracle = JSON.parse(readFileSync("docs/renk-envanteri/ozel-bilesenler.json", "utf8")).hoykIlerlemeGunleri as { gun: number; uc: string }[];
  for (const { gun, uc } of oracle) assert.equal(eclubHoykUcRengi(gun), uc);
  assert.equal(eclubHoykRengi(-1), oracle[0].uc);
  assert.equal(eclubHoykRengi(2), oracle[15].uc);
  assert.equal(eclubHoykRengi(0.37, 2), oracle[15].uc);
  const view = mount();
  try {
    await theme("mavi");
    await act(async () => view.root.render(h(EclubHoykSureCercevesi, { gecenGun: 7.5 })));
    const canvas = view.container.querySelector("canvas")!;
    const ctx = contexts.get(canvas)!; const before = structuredClone(ctx.strokes);
    assert.ok(before.length > 0);
    for (const tema of ["yesil", "mavi"]) {
      ctx.strokes.length = 0;
      await theme(tema);
      assert.equal(view.container.querySelector("canvas"), canvas);
      assert.deepEqual(ctx.strokes, before);
    }
    // Gerçek Canvas tüketicisinin computed CSS okuduğunu bağımsız bir kapsamla sına.
    canvas.style.setProperty("--tema-cizim-sure-baslangic", "rgb(11,22,33)");
    canvas.style.setProperty("--tema-cizim-sure-orta", "rgb(11,22,33)");
    await act(async () => { canvas.setAttribute("data-tema", "yesil"); await new Promise(resolve => setTimeout(resolve, 0)); });
    assert.deepEqual(ctx.strokes.map(s => [s.ilk, s.son]), before.map(s => [s.ilk, s.son]));
    assert.ok(ctx.strokes.every(s => s.renk === "rgb(11,22,33)"));
  } finally { await view.close(); }
});

test("yerel SVG renkleri temaya uyar; liderlik geometrisi ve madalya anlamları korunur", async () => {
  const view = mount();
  try {
    await act(async () => view.root.render(h(LeadershipScore, { lidereKalanPuan: 70, mevcutSira: 4, mevcutNetPuan: 30, liderNetPuan: 100 })));
    const svg = view.container.querySelector("svg[role=img]")!;
    const geometry = [...svg.querySelectorAll("path,rect,circle,text")].map(el => [...el.attributes].filter(a => !["fill", "stroke"].includes(a.name)).map(a => [a.name, a.value]));
    for (const tema of ["mavi", "yesil", "mavi"]) {
      await theme(tema);
      assert.equal(cizimRenkCozucu(svg)(svg.querySelectorAll("path")[1].getAttribute("stroke")!), tema === "mavi" ? "#3287ef" : "#355545");
      assert.deepEqual([...svg.querySelectorAll("path,rect,circle,text")].map(el => [...el.attributes].filter(a => !["fill", "stroke"].includes(a.name)).map(a => [a.name, a.value])), geometry);
      assert.equal(cizimRenkCozucu(svg)(svg.querySelector("g")!.getAttribute("stroke")!), "#e99a14");
    }
    const moduleCss = readFileSync("components/eclub/eclub-performans.module.css", "utf8");
    assert.ok(moduleCss.includes("var(--tema-svg-performans-secim-oku)"));
    const arrows: string[] = [];
    for (const tema of ["mavi", "yesil"]) {
      await theme(tema);
      const arrow = cizimRenkCozucu(document.documentElement)("var(--tema-svg-performans-secim-oku)");
      assert.ok(arrow.includes(`stroke='%23${tema === "mavi" ? "7c8da4" : "68766e"}'`));
      arrows.push(arrow.replace(/stroke='%23[0-9a-f]+'/g, "stroke='RENK'"));
    }
    assert.equal(arrows[0], arrows[1]);
    const markup = renderToStaticMarkup(h(CcLigiBanner));
    const holder = document.createElement("div"); holder.innerHTML = markup; view.container.append(holder);
    for (const tema of ["mavi", "yesil"]) {
      await theme(tema);
      for (const el of holder.querySelectorAll("stop,feDropShadow,text[stroke]")) {
        const attr = el.getAttribute("stop-color") ?? el.getAttribute("flood-color") ?? el.getAttribute("stroke")!;
        assert.equal(cizimRenkCozucu(el)(attr), grafikRenkleriniCoz({ color: attr }).color);
      }
    }
  } finally { await view.close(); }
});


test("Progress mevcut ortak renk bağlantısını kullanır; tema değişiminde yüzde ve aynı DOM korunur", async () => {
  const view = mount();
  try {
    for (const value of [0, 37, 100]) {
      await act(async () => view.root.render(h(Progress, { value })));
      const indicator = view.container.querySelector('[data-slot="progress-indicator"]')!;
      for (const tema of ["mavi", "yesil", "mavi"]) {
        await theme(tema);
        assert.equal(view.container.querySelector('[data-slot="progress-indicator"]'), indicator);
        assert.equal(indicator.getAttribute("style"), `transform: translateX(-${100-value}%);`);
        assert.ok(indicator.classList.contains("bg-primary"));
        assert.ok(view.container.querySelector('[data-slot="progress"]')!.classList.contains("bg-primary/20"));
        assert.equal(cizimRenkCozucu(document.documentElement)("var(--primary)"), tema === "mavi" ? "#56aeff" : "#355545");
      }
    }
  } finally { await view.close(); }
});
