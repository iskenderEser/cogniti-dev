import test from "node:test";
import assert from "node:assert/strict";
import { act, createElement } from "react";
import { GlobalWindow } from "happy-dom";

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
const { default: SayfaBanner } = await import("@/components/eczanem/EczanemSayfaBanner");

test("Üç sayfa ayrı banner okur; ortak galeride seçim çalışır, boş sayfada alan gösterilmez", async () => {
  const oncekiFetch = globalThis.fetch;
  const istekler: string[] = [];
  globalThis.fetch = (async (url) => {
    istekler.push(String(url));
    const alan = new URL(String(url), "http://localhost").searchParams.get("alan");
    return Response.json({ bannerlar: alan === "indirim-onayi" ? [] : [
      { sira: 1, url: `/${alan}-1.png` }, { sira: 2, url: `/${alan}-2.png` },
    ] });
  }) as typeof fetch;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(createElement(SayfaBanner, { alan: "uyeler" })));
    assert.equal(host.querySelectorAll("img").length, 2);
    assert.equal(host.querySelector("img")?.getAttribute("src"), "/uyeler-1.png");
    const buton = host.querySelector<HTMLButtonElement>('[aria-label="2. bannerı göster"]')!;
    await act(async () => buton.click());
    assert.equal(buton.getAttribute("aria-pressed"), "true");
    assert.equal(host.querySelector('[aria-label="2 / 2"]')?.getAttribute("aria-hidden"), "false");
    await act(async () => root.render(createElement(SayfaBanner, { alan: "uye-yayinlari" })));
    assert.equal(host.querySelector("img")?.getAttribute("src"), "/uye-yayinlari-1.png");
    assert.equal(host.querySelector('[aria-label="1 / 2"]')?.getAttribute("aria-hidden"), "false");
    await act(async () => root.render(createElement(SayfaBanner, { alan: "indirim-onayi" })));
    assert.equal(host.querySelector("section"), null);
    assert.deepEqual(istekler, ["/eczanem/eczane/api/bannerlar?alan=uyeler", "/eczanem/eczane/api/bannerlar?alan=uye-yayinlari", "/eczanem/eczane/api/bannerlar?alan=indirim-onayi"]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    globalThis.fetch = oncekiFetch;
    await win.happyDOM.close();
  }
});
