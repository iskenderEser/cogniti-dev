import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { after } from "node:test";
import { Window } from "happy-dom";
import React, { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import config from "../postcss.config.mjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YenileButonu } from "@/components/ui/yenile-butonu";

const compiled = await postcss([tailwind(config.plugins["@tailwindcss/postcss"])]).process(readFileSync("app/globals.css", "utf8"), { from: "app/globals.css" });
assert.equal(compiled.warnings().length, 0);

function utility(sinif: string) {
  const selector = `.${sinif.replace(/[^\w-]/g, "\\$&")}`;
  let found: postcss.Rule | undefined;
  compiled.root.walkRules(selector, rule => { found = rule; });
  assert.ok(found, sinif);
  return found;
}

const siniflar = ["border-[var(--tema-yenile-cizgi)]", "bg-[var(--tema-yenile-yuzey)]", "text-[var(--tema-yenile-metin)]", "bg-destructive", "text-destructive-foreground"];
// Happy DOM @layer/nesting uygulamaz. Gerçek derleyiciden çıkan aynı utility kuralları katmansız yüklenir.
const css = `${readFileSync("app/tema.css", "utf8")}\n${siniflar.map(sinif => utility(sinif).toString()).join("\n")}`;
const hoverDecls: postcss.Declaration[] = [];
utility("hover:bg-[var(--tema-yenile-hover)]").walkDecls("background-color", decl => { hoverDecls.push(decl); });
assert.equal(hoverDecls.length, 1);

test("gerçek YenileButonu sınıfları iki temanın renklerini alır; iç içe mavi kapsam korunur", async () => {
  const window = new Window();
  const markup = renderToStaticMarkup(React.createElement(YenileButonu, { yenileniyor: false, onYenile: () => undefined }));
  window.document.head.innerHTML = `<style>${css}</style>`;
  window.document.body.innerHTML = `<section id="alan">${markup}<div data-tema="mavi">${markup}</div></section>${markup}`;
  const hoverProbe = window.document.createElement("span");
  hoverProbe.style.backgroundColor = hoverDecls[0].value;
  window.document.getElementById("alan")!.append(hoverProbe);
  try {
    const buttons = window.document.querySelectorAll("button");
    for (const tema of ["mavi", "yesil", "mavi"]) {
      window.document.getElementById("alan")!.setAttribute("data-tema", tema);
      const beklenen = tema === "mavi" ? ["#fff", "#d8e3ee", "#58708b", "#f4f8fb"] : ["#fcfdf8", "#dfe3d7", "#68766e", "#edf2e7"];
      const stil = window.getComputedStyle(buttons[0]);
      assert.deepEqual([stil.backgroundColor, stil.borderTopColor, stil.color, window.getComputedStyle(hoverProbe).backgroundColor], beklenen);
      for (const button of [buttons[1], buttons[2]]) {
        const mavi = window.getComputedStyle(button);
        assert.deepEqual([mavi.backgroundColor, mavi.borderTopColor, mavi.color], ["#fff", "#d8e3ee", "#58708b"]);
      }
    }
  } finally { await window.happyDOM.close(); }
});

test("destructive buton iki temada mevcut hata zeminini ve beyaz metnini korur", async () => {
  const window = new Window();
  window.document.head.innerHTML = `<style>${css}</style>`;
  window.document.body.innerHTML = renderToStaticMarkup(React.createElement(Button, { variant: "destructive", disabled: true }, "Sil"));
  try {
    for (const tema of ["mavi", "yesil"]) {
      window.document.documentElement.setAttribute("data-tema", tema);
      const button = window.document.querySelector("button")!;
      assert.equal(button.disabled, true);
      assert.equal(window.getComputedStyle(button).color, "#ffffff");
      assert.equal(window.getComputedStyle(button).backgroundColor, "#e24b4a");
    }
  } finally { await window.happyDOM.close(); }
});

const dom = new Window({ url: "http://localhost" });
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "HTMLInputElement", "HTMLButtonElement", "MutationObserver", "Event", "MouseEvent", "getComputedStyle"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === "getComputedStyle" ? dom.getComputedStyle.bind(dom) : dom[key] });
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import("react-dom/client");
after(async () => { await dom.happyDOM.close(); });

test("formdaki yenileme kaydetmez; yükleniyor ve disabled durumları ikinci çağrıyı engeller", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let yenileme = 0;
  let kayit = 0;
  const render = async (yenileniyor = false, disabled = false) => act(async () => {
    root.render(React.createElement("form", { onSubmit: event => { event.preventDefault(); kayit++; } },
      React.createElement(Label, { htmlFor: "baslik" }, "Başlık"),
      React.createElement(Input, { id: "baslik", name: "baslik", defaultValue: "Korunan değer" }),
      React.createElement(YenileButonu, { yenileniyor, disabled, onYenile: () => { yenileme++; }, className: "min-w-[88px] justify-center" }),
    ));
  });
  try {
    for (const tema of ["mavi", "yesil"]) {
      dom.document.documentElement.setAttribute("data-tema", tema);
      await render();
      const button = container.querySelector("button")!;
      const input = container.querySelector("input")!;
      input.focus();
      assert.equal(document.activeElement, input);
      assert.equal(container.querySelector("label")!.htmlFor, input.id);
      assert.equal(button.type, "button");
      assert.ok(button.classList.contains("min-w-[88px]"));
      assert.equal(button.getAttribute("aria-busy"), "false");
      await act(async () => button.click());
      assert.equal(yenileme, tema === "mavi" ? 1 : 2);
      assert.equal(kayit, 0);
      await render(true);
      assert.equal(button.disabled, true);
      assert.equal(button.getAttribute("aria-busy"), "true");
      assert.equal(button.getAttribute("aria-label"), "Yenileniyor…");
      assert.ok(button.querySelector("svg")!.classList.contains("animate-spin"));
      await act(async () => button.click());
      await render(false, true);
      assert.equal(button.disabled, true);
      await act(async () => button.click());
      assert.equal(yenileme, tema === "mavi" ? 1 : 2);
      assert.equal(new dom.FormData(container.querySelector("form")!).get("baslik"), "Korunan değer");
    }
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
