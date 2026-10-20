import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import { Window } from "happy-dom";
import ts from "typescript";
import type { EczanemSidebarAgaci } from "@/app/eczanem/_types";

const agac = (ad: string): EczanemSidebarAgaci => [{ eczane_id: ad, eczane_adi: ad, firmalar: [] }];
async function ortam() {
  const dom = new Window();
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const istekler: Array<{ signal: AbortSignal; yanitla: (yanit: { ok: boolean; json: () => Promise<unknown> }) => void }> = [];
  const exports: {
    default?: (id?: string, sayfaAgaci?: EczanemSidebarAgaci) => EczanemSidebarAgaci;
    eczanemGezinmeAgaciniYaz?: (id: string, agac: EczanemSidebarAgaci | null) => void;
  } = {};
  const compiled = ts.transpileModule(readFileSync("app/eczanem/_components/eczanemGezinme.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, AbortController, require: (id: string) => { assert.equal(id, "react"); return React; }, fetch: (url: string, options: { signal: AbortSignal; cache: string }) => {
    assert.equal(url, "/eczanem/api/videolar"); assert.equal(options.cache, "no-store");
    return new Promise(yanitla => istekler.push({ signal: options.signal, yanitla }));
  } });
  const props: { id?: string; sayfaAgaci?: EczanemSidebarAgaci; anahtar: number } = { id: "a", anahtar: 0 };
  function Menu() { return React.createElement("div", null, exports.default!(props.id, props.sayfaAgaci).map(e => e.eczane_adi).join(",")); }
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  return {
    props, container, istekler,
    yaz: exports.eczanemGezinmeAgaciniYaz!,
    render: () => act(async () => root.render(React.createElement(Menu, { key: props.anahtar }))),
    yanitla: (index: number, veri: unknown, ok = true) => act(async () => istekler[index].yanitla({ ok, json: async () => veri })),
    kapat: async () => { await act(async () => root.unmount()); await dom.happyDOM.close(); },
  };
}

test("doğrudan Puanlarım açılışında menü yüklenir; sayfa değişiminde mevcut eczaneler kaybolmaz", async () => {
  const o = await ortam();
  try {
    await o.render(); assert.equal(o.istekler.length, 1);
    await o.yanitla(0, { agac: agac("Merkez") });
    assert.equal(o.container.textContent, "Merkez");
    o.props.anahtar++;
    await o.render();
    assert.equal(o.container.textContent, "Merkez", "Yeni sayfanın yanıtı beklenirken liste korunur");
    assert.equal(o.istekler.length, 2);
    await o.yanitla(1, { agac: agac("Yaşam") });
    assert.equal(o.container.textContent, "Yaşam");
  } finally { await o.kapat(); }
});

test("ana sayfa kendi ağacını kullanır; kabuk ikinci içerik isteği başlatmaz", async () => {
  const o = await ortam();
  try {
    o.props.sayfaAgaci = agac("Merkez"); o.yaz("a", o.props.sayfaAgaci);
    await o.render(); assert.equal(o.container.textContent, "Merkez"); assert.equal(o.istekler.length, 0);
    o.props.sayfaAgaci = undefined; await o.render();
    assert.equal(o.container.textContent, "Merkez"); assert.equal(o.istekler.length, 1);
  } finally { await o.kapat(); }
});

test("hesap değişiminde eczaneler karışmaz; iptal edilen eski yanıt menüyü değiştirmez", async () => {
  const o = await ortam();
  try {
    o.yaz("a", agac("Birinci")); await o.render();
    o.props.id = "b"; await o.render();
    assert.equal(o.container.textContent, ""); assert.equal(o.istekler[0].signal.aborted, true);
    await o.yanitla(1, { agac: agac("İkinci") });
    await o.yanitla(0, { agac: agac("Eski yanıt") });
    assert.equal(o.container.textContent, "İkinci");
    o.props.id = undefined; await o.render(); assert.equal(o.container.textContent, "");
  } finally { await o.kapat(); }
});

test("yetki hatasında eski menü kaldırılır; oturum çözülmeden istek yapılmaz", async () => {
  const o = await ortam();
  try {
    o.props.id = undefined; await o.render(); assert.equal(o.istekler.length, 0);
    o.yaz("a", agac("Merkez")); o.props.id = "a"; await o.render();
    await o.yanitla(0, {}, false); assert.equal(o.container.textContent, "");
    o.props.anahtar++; await o.render();
    await o.yanitla(1, { agac: [] }); assert.equal(o.container.textContent, "");
  } finally { await o.kapat(); }
});
