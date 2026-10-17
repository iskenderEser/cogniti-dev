import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { Window } from "happy-dom";
import ts from "typescript";
import * as temalar from "@/lib/tema/temalar";

test("içeride seçilen tema çıkışta ve login yenilemesinde korunur; diğer hesabın kaydı önceliklidir", async () => {
  const dom = new Window({ url: "http://localhost" });
  for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent"] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
  }
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const auth: { kullanici: { id: string } | null; yukleniyor: boolean } = { kullanici: { id: "hesap-a" }, yukleniyor: false };
  const kayitlar = new Map<string, temalar.Tema>([["hesap-a", "mavi"], ["hesap-b", "mavi"]]);
  const yazmalar: string[] = [];
  const modules: Record<string, unknown> = {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "@/lib/tema/temalar": temalar,
    "@/app/providers/AuthProvider": { useAuth: () => auth },
  };
  const exports: Record<string, unknown> = {};
  const source = ts.transpileModule(readFileSync("app/providers/TemaProvider.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, window: dom, document: dom.document,
    require: (id: string) => { assert.ok(id in modules, id); return modules[id]; },
    fetch: async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body));
        assert.equal(body.kullanici_id, auth.kullanici?.id);
        kayitlar.set(body.kullanici_id, body.tema);
        yazmalar.push(body.kullanici_id);
        return Response.json(body);
      }
      return Response.json({ kullanici_id: auth.kullanici?.id, tema: kayitlar.get(auth.kullanici!.id) ?? null });
    },
  });
  const mod = exports as unknown as {
    TemaProvider: React.ComponentType<{ children: React.ReactNode }>;
    useTema: () => { tema: temalar.Tema; temaDegistir: (tema: temalar.Tema) => void };
  };
  function Probe() {
    const { tema, temaDegistir } = mod.useTema();
    return React.createElement("button", { onClick: () => temaDegistir("yesil") }, tema);
  }
  const container = dom.document.createElement("div");
  dom.document.body.append(container);
  let root = createRoot(container);
  const render = () => act(async () => { root.render(React.createElement(mod.TemaProvider, null, React.createElement(Probe))); });
  const secili = () => dom.document.documentElement.getAttribute("data-tema");
  try {
    await render();
    assert.equal(secili(), "mavi");
    await act(async () => { container.querySelector("button")!.click(); });
    assert.equal(secili(), "yesil");
    assert.equal(kayitlar.get("hesap-a"), "yesil");
    assert.equal(dom.localStorage.getItem(temalar.MISAFIR_TEMA_ANAHTARI), "yesil");

    auth.kullanici = null;
    await render();
    assert.equal(secili(), "yesil", "çıkışta login yeşil kalmalı");
    await act(async () => root.unmount());
    dom.document.documentElement.setAttribute("data-tema", "mavi");
    root = createRoot(container);
    await render();
    assert.equal(secili(), "yesil", "login yeniden açıldığında son görünüm korunmalı");

    auth.kullanici = { id: "hesap-b" };
    await render();
    assert.equal(secili(), "mavi", "ikinci hesabın mevcut tercihi öncelikli olmalı");
    assert.equal(kayitlar.get("hesap-a"), "yesil");
    assert.equal(kayitlar.get("hesap-b"), "mavi");
    assert.deepEqual(yazmalar, ["hesap-a"], "login veya ikinci hesabın tercihi başka hesaba yazılmamalı");
  } finally {
    await act(async () => root.unmount());
    await dom.happyDOM.close();
  }
});
