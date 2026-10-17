import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import postcss from "postcss";
import { eclubPerformansGrafikSecenegi } from "@/lib/eclub/performansGrafik";
import { eclubPerformansDonemi, ECLUB_PERFORMANS_TURLERI } from "@/lib/eclub/performans";
import { grafikRenkleriniCoz } from "@/lib/tema/cizimRenkleri";

type GrafikTasarimSecenegi = {
  grid: Record<string,unknown>;
  xAxis: Record<string,unknown>;
  yAxis: Record<string,unknown>;
  animationDuration: number;
  series: Record<string,unknown>[];
};
function nesneMi(value: unknown): value is Record<string,unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function grafikTasariminiDogrula(value: unknown): asserts value is GrafikTasarimSecenegi {
  assert.ok(nesneMi(value), "grafik seçeneği nesne olmalıdır");
  assert.ok(nesneMi(value.grid), "grid nesne olmalıdır");
  assert.ok(nesneMi(value.xAxis), "xAxis nesne olmalıdır");
  assert.ok(nesneMi(value.yAxis), "yAxis nesne olmalıdır");
  assert.equal(typeof value.animationDuration, "number", "animationDuration sayı olmalıdır");
  assert.ok(Array.isArray(value.series) && value.series.every(nesneMi), "series nesnelerden oluşan bir dizi olmalıdır");
}

// Kullanıcının onayladığı HTML'den alınmış bağımsız tasarım referansı.
const reference = JSON.parse(readFileSync("tests/fixtures/eclub-performans-onayli-tasarim.json","utf8"));
const maviRenkler = new Map<string, string>();
postcss.parse(readFileSync("node_modules/tailwindcss/theme.css", "utf8")).walkDecls(d => { maviRenkler.set(d.prop, d.value); });
postcss.parse(readFileSync("app/tema.css", "utf8")).walkRules(r => {
  if (r.selectors.includes('[data-tema="mavi"]')) r.walkDecls(d => { maviRenkler.set(d.prop, d.value); });
});
const maviDeger = (value: string): string => value.replace(/var\((--[\w-]+)\)/g, (match, key: string) => maviRenkler.has(key) ? maviDeger(maviRenkler.get(key)!) : match);
const css = maviDeger(readFileSync("components/eclub/eclub-performans.module.css","utf8"));
const classes = new Set(["heading","muted","period","stats","stat","card","chart-head","legend","chart-wrap","help","detail","detail-head","detail-title","type-icon","detail-meta","detail-total","table-head","person","identity","avatar","name","count","score","bar","right","empty","week-access"]);
function rules(source: string) {
  const result = new Map<string,Map<string,string>>();
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) for (const selector of match[1].trim().split(",")) {
    const normalized = selector.trim().replace(/\.([\w-]+)/g, (_all,key: string) => "."+key.replace(/-([a-z])/g, (_m,c: string) => c.toUpperCase()));
    const props = result.get(normalized) ?? new Map<string,string>();
    for (const declaration of match[2].split(";")) { const index = declaration.indexOf(":"); if(index>0) props.set(declaration.slice(0,index).trim(),declaration.slice(index+1).trim()); }
    result.set(normalized,props);
  }
  return result;
}
test("onaylı görünüm korunur; üye tablosu altı puan sütununa genişler", () => {
  const referenceParts = reference.css.split("@media(max-width:700px)");
  const actualParts = css.split("@media(max-width:700px)");
  for (const index of [0,1]) {
    const expected = rules(referenceParts[index]), actual = rules(actualParts[index]);
    // Kullanıcının onayladığı altı sütunlu tablo, ilk demonun üç sütunlu düzenini genişletir.
    for (const selector of [".tableHead", ".person"]) {
      const props = expected.get(selector);
      props?.set("gap", index ? "12px" : "14px");
      if (index) props?.delete("grid-template-columns");
      else props?.set("grid-template-columns", "minmax(160px,1.5fr) repeat(4,minmax(95px,1fr)) minmax(100px,1fr)");
    }
    for (const [selector,props] of expected) {
      const first = selector.match(/^\.([\w-]+)/)?.[1];
      if(!first || ![...classes].some(c => c.replace(/-([a-z])/g, (_m,x: string) => x.toUpperCase()) === first)) continue;
      for (const [key,value] of props) assert.equal(actual.get(selector)?.get(key),value, `${index ? "mobil" : "masaüstü"} ${selector} ${key}`);
    }
  }
});
test("gerçek ECharts seçenekleri onaylanan HTML çizim fonksiyonuyla eşleşir", () => {
  const donem = eclubPerformansDonemi(new Date("2026-10-01T12:00:00Z"));
  const types = ECLUB_PERFORMANS_TURLERI.map((t,i) => ({ name:t.ad,color:t.renk,scores:[0,80 + i,0,40,0,0,0,0] }));
  const veri = { donem, ozet:{puan:0,tamamlanan:0,uye:0},satirlar:ECLUB_PERFORMANS_TURLERI.map((t,i)=>({tur:t.tur,haftalar:donem.haftalar.map((h,w)=>({hafta:h.hafta,puan:types[i].scores[w],tamamlanan:0,uyeler:[]}))})) };
  for(const mobile of [false,true]) {
    let expected: unknown;
    vm.runInNewContext(reference.draw+"draw();",{innerWidth:mobile?390:1100,types,selected:{type:1,week:2},currentWeek:donem.aktifHafta,number:(v:number)=>v.toLocaleString("tr-TR"),chart:{setOption:(option:unknown)=>{expected=option;}}});
    const actual: unknown = grafikRenkleriniCoz(eclubPerformansGrafikSecenegi(veri,"podcast",2,mobile));
    grafikTasariminiDogrula(expected);
    grafikTasariminiDogrula(actual);
    // JSON karşılaştırması fonksiyonları ve yalnız bağlama yönelik seri kimliklerini dışarıda bırakır.
    const plain=(v:unknown)=>JSON.parse(JSON.stringify(v));
    assert.deepEqual(plain(actual.grid),plain(expected.grid));
    assert.deepEqual(plain(actual.xAxis),plain(expected.xAxis));
    assert.deepEqual(plain(actual.yAxis),plain(expected.yAxis));
    assert.equal(actual.animationDuration,expected.animationDuration);
    for(let i=0;i<8;i++) { const series: Record<string,unknown>={...actual.series[i]}; delete series.id; assert.deepEqual(plain(series),plain(expected.series[i])); }
  }
});
