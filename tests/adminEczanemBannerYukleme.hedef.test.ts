import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { act, createElement } from "react";
import { GlobalWindow } from "happy-dom";
import { PLATFORM_FIRMA_ID } from "@/lib/eclub/banner";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) {
  if (!(key in globalThis)) {
    // @ts-expect-error Test DOM ortamı.
    globalThis[key] = win[key];
  }
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
// @ts-expect-error React test ortamı.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { default: BannerYonetimi } = await import("@/app/admin/eczanem/_components/EczanemBannerYonetimi");

test("Admin Eczanem alanı mevcut yükleme akışını kullanır; seçim yayınlamaz, yayınla/değiştir/kaldır doğru alana gider", async () => {
  const oncekiFetch = globalThis.fetch, oncekiImage = globalThis.Image;
  const oncekiCreate = URL.createObjectURL, oncekiRevoke = URL.revokeObjectURL;
  const istekler: Array<{ url: string; method: string }> = [];
  let blobNo = 0, postNo = 0;
  URL.createObjectURL = () => `blob:taslak-${++blobNo}`; URL.revokeObjectURL = () => undefined;
  globalThis.Image = class { naturalWidth = 100; naturalHeight = 20; onload: (() => void) | null = null; set src(_v: string) { queueMicrotask(() => this.onload?.()); } } as unknown as typeof Image;
  globalThis.fetch = (async (url, init) => {
    istekler.push({ url: String(url), method: init?.method ?? "GET" });
    if (init?.method === "POST") {
      assert.equal((init.body as FormData).get("alan"), "uye-ana-sayfa");
      assert.equal((init.body as FormData).get("firma_id"), "11111111-1111-4111-8111-111111111111");
      return Response.json({ banner: { sira: 1, url: `/yayinda-${++postNo}.png` } });
    }
    if (init?.method === "DELETE") { assert.match(String(url), /alan=uye-ana-sayfa/); return Response.json({ ok: true }); }
    assert.match(String(url), /alan=uye-ana-sayfa/); return Response.json({ bannerlar: [] });
  }) as typeof fetch;
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
  const buton = (ad: string) => [...host.querySelectorAll("button")].find(b => b.textContent === ad)!;
  const sec = async () => {
    const input = host.querySelector("input")!;
    Object.defineProperty(input, "files", { configurable: true, value: [new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "banner.png", { type: "image/png" })] });
    await act(async () => input.dispatchEvent(new win.Event("change", { bubbles: true })));
  };
  try {
    assert.match(readFileSync("app/admin/page.tsx", "utf8"), /seciliSekme === "eczanem"[\s\S]*?<EczanemBannerYonetimi/);
    await act(async () => root.render(createElement(BannerYonetimi, { firmaId: "11111111-1111-4111-8111-111111111111", firmaAdi: "Hepifarma" })));
    assert.equal(host.querySelector("h2")!.textContent, "Hepifarma · Eczanem Bannerları");
    await act(async () => buton("Banner Ekle").click()); await sec();
    assert.equal(postNo, 0); assert.match(host.querySelector("img")!.src, /^blob:/);
    await act(async () => buton("Yayınla").click()); assert.equal(postNo, 1);
    assert.equal(host.querySelector("img")!.getAttribute("src"), "/yayinda-1.png");
    await sec(); await act(async () => buton("Vazgeç").click()); assert.equal(postNo, 1);
    assert.equal(host.querySelector("img")!.getAttribute("src"), "/yayinda-1.png");
    await sec(); await act(async () => buton("Yayınla").click()); assert.equal(postNo, 2);
    await act(async () => buton("Kaldır").click()); assert.equal(host.querySelectorAll("article").length, 0);
    assert.equal(istekler.filter(i => i.method === "DELETE").length, 1);
    for (let i = 0; i < 3; i++) await act(async () => buton("Banner Ekle").click());
    assert.equal(host.querySelectorAll("article").length, 3); assert.equal(buton("Banner Ekle").disabled, true);
    await act(async () => root.render(createElement(BannerYonetimi, { key: "platform", firmaId: PLATFORM_FIRMA_ID, firmaAdi: "Cogniti" })));
    assert.equal(host.querySelector("h2")!.textContent, "Eczanem Ana Sayfa Bannerları");
    for (let i = 0; i < 5; i++) await act(async () => buton("Banner Ekle").click());
    assert.equal(host.querySelectorAll("article").length, 5); assert.equal(buton("Banner Ekle").disabled, true);
  } finally {
    await act(async () => root.unmount()); host.remove();
    globalThis.fetch = oncekiFetch; globalThis.Image = oncekiImage;
    URL.createObjectURL = oncekiCreate; URL.revokeObjectURL = oncekiRevoke; await win.happyDOM.close();
  }
});
