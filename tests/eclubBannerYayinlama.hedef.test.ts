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
const { default: BannerYonetimi } = await import("@/app/admin/eclub/_components/EclubBannerYonetimi");

test("Seçim yalnız yerel önizleme oluşturur; yayınlama, vazgeçme ve hata mevcut bannerı korur", async () => {
  const oncekiFetch = globalThis.fetch;
  const oncekiImage = globalThis.Image;
  const oncekiUrl = URL.createObjectURL;
  const oncekiRevoke = URL.revokeObjectURL;
  let postSayisi = 0;
  let basarisiz = false;
  let urlSirasi = 0;
  const silinenler: string[] = [];
  URL.createObjectURL = () => `blob:taslak-${++urlSirasi}`;
  URL.revokeObjectURL = (url) => { silinenler.push(url); };
  // Küçük görsel mevcut optimizasyon aracından değiştirilmeden geçer.
  globalThis.Image = class {
    naturalWidth = 100;
    naturalHeight = 24;
    onload: (() => void) | null = null;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  } as unknown as typeof Image;
  globalThis.fetch = (async (_url, init) => {
    if (init?.method === "POST") {
      postSayisi++;
      assert.equal((init.body as FormData).get("firma_id"), "firma-a");
      assert.equal((init.body as FormData).get("sira"), "1");
      return new Response(JSON.stringify(basarisiz ? { hata: "Yükleme başarısız" } : { banner: { sira: 1, url: "/yeni.png" } }), { status: basarisiz ? 500 : 200 });
    }
    return new Response(JSON.stringify({ bannerlar: [{ sira: 1, url: "/mevcut.png" }] }));
  }) as typeof fetch;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const dosya = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "banner.png", { type: "image/png" });
  const kart = () => container.querySelector("article")!;
  const buton = (ad: string) => [...kart().querySelectorAll("button")].find((b) => b.textContent === ad)!;
  async function sec() {
    const input = kart().querySelector("input")!;
    Object.defineProperty(input, "files", { configurable: true, value: [dosya] });
    await act(async () => { input.dispatchEvent(new win.Event("change", { bubbles: true })); });
  }
  try {
    await act(async () => { root.render(createElement(BannerYonetimi, { firmaId: "firma-a", firmaAdi: "Firma A" })); });
    assert.equal(container.querySelectorAll("article").length, 1);
    const ekle = () => [...container.querySelectorAll("button")].find((b) => b.textContent === "Banner Ekle")!;
    await act(async () => { ekle().click(); });
    assert.equal(container.querySelectorAll("article").length, 2);
    const bosKart = container.querySelectorAll("article")[1];
    await act(async () => { [...bosKart.querySelectorAll("button")].find((b) => b.textContent === "Vazgeç")!.click(); });
    assert.equal(container.querySelectorAll("article").length, 1);
    assert.equal(postSayisi, 0);
    assert.equal(kart().querySelector("img")?.getAttribute("src"), "/mevcut.png");
    assert.equal(buton("Yayınlandı").disabled, true);
    await sec();
    assert.equal(postSayisi, 0);
    assert.equal(buton("Yayınla").disabled, false);
    assert.match(kart().textContent!, /Henüz yayınlanmadı/);
    assert.match(kart().querySelector("img")!.getAttribute("src")!, /^blob:/);
    await act(async () => { buton("Vazgeç").click(); });
    assert.equal(postSayisi, 0);
    assert.equal(kart().querySelector("img")?.getAttribute("src"), "/mevcut.png");
    await sec();
    basarisiz = true;
    await act(async () => { buton("Yayınla").click(); });
    assert.equal(postSayisi, 1);
    assert.match(kart().textContent!, /Henüz yayınlanmadı/);
    assert.match(container.textContent!, /Yükleme başarısız/);
    await act(async () => { buton("Vazgeç").click(); });
    assert.equal(kart().querySelector("img")?.getAttribute("src"), "/mevcut.png");
    await sec();
    basarisiz = false;
    await act(async () => { buton("Yayınla").click(); });
    assert.equal(postSayisi, 2);
    assert.equal(kart().querySelector("img")?.getAttribute("src"), "/yeni.png");
    assert.match(container.textContent!, /Birinci Banner yayınlandı/);
    assert.equal(buton("Yayınlandı").disabled, true);
    await sec();
    const sonTaslak = kart().querySelector("img")!.getAttribute("src")!;
    await act(async () => { root.render(createElement(BannerYonetimi, { key: "hapbilgi", firmaId: "firma-h", firmaAdi: "Hapbilgi" })); });
    assert.equal(container.querySelectorAll("article").length, 1);
    for (let i = 0; i < 4; i++) await act(async () => { ekle().click(); });
    assert.equal(container.querySelectorAll("article").length, 5);
    assert.equal(ekle().disabled, true);
    assert.match(container.textContent!, /E-Club ana sayfasında/);
    assert.ok(silinenler.includes(sonTaslak));
    await act(async () => root.unmount());
    assert.ok(silinenler.includes(sonTaslak));
  } finally {
    await act(async () => root.unmount());
    container.remove();
    globalThis.fetch = oncekiFetch;
    globalThis.Image = oncekiImage;
    URL.createObjectURL = oncekiUrl;
    URL.revokeObjectURL = oncekiRevoke;
    await win.happyDOM.close();
  }
});
