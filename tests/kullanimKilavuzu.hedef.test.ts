import assert from "node:assert/strict";
import test from "node:test";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { GlobalWindow } from "happy-dom";
import Kilavuz from "@/components/rehber/UreticiKullanimKilavuzu";
import { uttKilavuzunuSec } from "@/lib/rehber/uttKilavuzu";

test("yazılı kılavuz ağ ve ses başlatmadan açılır; bölüm gezinmesi ve Escape çalışır", async () => {
  const win = new GlobalWindow({ url: "http://localhost/ana-sayfa" });
  for (const name of Object.getOwnPropertyNames(win)) if (!(name in globalThis)) Object.defineProperty(globalThis, name, { value: win[name as keyof typeof win], configurable: true, writable: true });
  Object.assign(globalThis, { window: win, document: win.document, IS_REACT_ACT_ENVIRONMENT: true });
  const host = win.document.createElement("div");
  win.document.body.append(host);
  const root = createRoot(host);
  const eskiFetch = globalThis.fetch, eskiAudio = globalThis.Audio;
  let istek = 0, ses = 0;
  globalThis.fetch = (async () => { istek++; throw Error("Ağ isteği beklenmiyor."); }) as typeof fetch;
  globalThis.Audio = class { constructor() { ses++; } } as unknown as typeof Audio;
  const button = (name: string) => {
    const element = [...win.document.querySelectorAll("button")].find(e => e.getAttribute("aria-label") === name || e.textContent?.trim() === name);
    assert.ok(element, name); return element;
  };
  try {
    await act(async () => root.render(createElement(Kilavuz, { kilavuz: uttKilavuzunuSec(true, true), rolBasligi: "Ürün Tanıtım Temsilcisi" })));
    await act(async () => button("Kullanım kılavuzunu aç").click());
    assert.equal(button("Kullanım kılavuzunu kapat").getAttribute("aria-expanded"), "true");
    assert.equal(win.document.querySelectorAll('nav[aria-label="Kılavuz bölümleri"] button').length, 6);
    await act(async () => win.document.querySelector<HTMLButtonElement>('nav[aria-label="Kılavuz bölümleri"] button')!.click());
    assert.equal(win.document.querySelector("article h3")?.textContent, "Ekranınızı Tanıyın");
    await act(async () => button("Sonraki bölüm").click());
    assert.equal(win.document.querySelector("article h3")?.textContent, "Görevleriniz ve Yetkileriniz");
    await act(async () => win.document.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(button("Kullanım kılavuzunu aç").getAttribute("aria-expanded"), "false");
    assert.equal(istek, 0); assert.equal(ses, 0);
  } finally {
    await act(async () => root.unmount());
    globalThis.fetch = eskiFetch; globalThis.Audio = eskiAudio;
    await win.happyDOM.close();
  }
});
