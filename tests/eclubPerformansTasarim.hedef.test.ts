import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { eclubPerformansGrafikSecenegi } from "@/lib/eclub/performansGrafik";
import { eclubPerformansDonemi, ECLUB_PERFORMANS_TURLERI } from "@/lib/eclub/performans";

// Kullanıcının onayladığı HTML'den alınmış bağımsız tasarım referansı.
const reference = JSON.parse(readFileSync("tests/fixtures/eclub-performans-onayli-tasarim.json","utf8"));
const css = readFileSync("components/eclub/eclub-performans.module.css","utf8");
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
test("kart, stat, üye satırı ve mobil ölçüler onaylı HTML ile aynıdır", () => {
  const referenceParts = reference.css.split("@media(max-width:700px)");
  const actualParts = css.split("@media(max-width:700px)");
  for (const index of [0,1]) {
    const expected = rules(referenceParts[index]), actual = rules(actualParts[index]);
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
    let expected: Record<string,any> = {};
    vm.runInNewContext(reference.draw+"draw();",{innerWidth:mobile?390:1100,types,selected:{type:1,week:2},currentWeek:donem.aktifHafta,number:(v:number)=>v.toLocaleString("tr-TR"),chart:{setOption:(option:Record<string,any>)=>{expected=option;}}});
    const actual = eclubPerformansGrafikSecenegi(veri,"podcast",2,mobile) as Record<string,any>;
    // JSON karşılaştırması fonksiyonları ve yalnız bağlama yönelik seri kimliklerini dışarıda bırakır.
    const plain=(v:unknown)=>JSON.parse(JSON.stringify(v));
    assert.deepEqual(plain(actual.grid),plain(expected.grid));
    assert.deepEqual(plain(actual.xAxis),plain(expected.xAxis));
    assert.deepEqual(plain(actual.yAxis),plain(expected.yAxis));
    assert.equal(actual.animationDuration,expected.animationDuration);
    for(let i=0;i<8;i++) { const {id:_id,...series}=actual.series[i]; assert.deepEqual(plain(series),plain(expected.series[i])); }
  }
});
