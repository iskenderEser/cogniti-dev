import assert from "node:assert/strict";
import test from "node:test";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { GlobalWindow } from "happy-dom";
import YuruyenRehber from "@/components/rehber/YuruyenRehber";
import { rehberKonumu, rehberMerkezi } from "@/components/rehber/konum";

const win = new GlobalWindow({ width: 1366, height: 900 });
for (const key of Object.getOwnPropertyNames(win)) {
  if (!(key in globalThis)) Object.defineProperty(globalThis, key, { value: win[key as keyof typeof win], writable: true, configurable: true });
}
Object.assign(globalThis, { window: win, document: win.document, IS_REACT_ACT_ENVIRONMENT: true });
let kareId = 0;
let zaman = 0;
const kareler = new Map<number, FrameRequestCallback>();
Object.assign(globalThis, {
  requestAnimationFrame: (cb: FrameRequestCallback) => { kareler.set(++kareId, cb); return kareId; },
  cancelAnimationFrame: (id: number) => kareler.delete(id),
  Image: class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_: string) { queueMicrotask(() => this.onload?.()); }
  },
});

async function kareIlerle(adet = 40) {
  await act(async () => {
    for (let i = 0; i < adet; i++) {
      const anlik = [...kareler.values()];
      kareler.clear();
      zaman += 100;
      for (const cb of anlik) cb(zaman);
    }
  });
}

const adimlar = [
  { hedefId: "hedef-bir", baslik: "Birinci durak", aciklama: "İlk alan." },
  { hedefId: "hedef-iki", baslik: "İkinci durak", aciklama: "İkinci alan." },
];

test("avatar ve balon masaüstü ve mobil ekran sınırları içinde kalır", () => {
  for (const ekran of [{ width: 1366, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    for (const hedef of [{ left: 20, top: 120, width: 260, height: 100 }, { left: ekran.width - 150, top: 360, width: 130, height: 45 }]) {
      const k = rehberKonumu(hedef, ekran);
      assert.ok(k.avatar.x >= 0 && k.avatar.y >= 0);
      assert.ok(k.avatar.x + k.avatarGenislik <= ekran.width);
      assert.ok(k.avatar.y + k.avatarYukseklik <= ekran.height);
      assert.ok(k.balon.x >= 0 && k.balon.x + k.balon.width <= ekran.width);
      assert.ok(k.balon.y >= 0 && k.balon.y + 270 <= ekran.height);
    }
  }
});

test("veda hedefi masaüstü ve mobilde avatarın merkezini ekranın ortasına koyar", () => {
  for (const ekran of [{ width: 1366, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    const k = rehberMerkezi(ekran);
    assert.equal(k.x + k.genislik / 2, ekran.width / 2);
    assert.equal(k.y + k.yukseklik / 2, ekran.height / 2);
  }
});

test("yürüyüş hedefe varır; duraklatılmış otomatik turda elle ileri/geri ve bitirme çalışır", async () => {
  const alan = win.document.createElement("div");
  const hedefler = adimlar.map((a, i) => {
    const e = win.document.createElement("button");
    e.id = a.hedefId;
    e.getBoundingClientRect = () => ({ left: 400 + i * 400, top: 300, width: 160, height: 60, right: 560 + i * 400, bottom: 360, x: 400 + i * 400, y: 300, toJSON() {} });
    win.document.body.appendChild(e);
    return e;
  });
  win.document.body.appendChild(alan);
  const root = createRoot(alan);
  let kapatildi = 0;
  let tamamlandi = 0;
  try {
    await act(async () => root.render(createElement(YuruyenRehber, { adimlar, acik: true, onKapat: () => kapatildi++, onTamamla: () => tamamlandi++ })));
    await kareIlerle();
    assert.equal(alan.querySelector("[data-rehber-asama]")?.getAttribute("data-rehber-asama"), "anlatiyor");
    assert.match(alan.textContent ?? "", /Birinci durak/);
    const baslangic = alan.querySelector(".karakterKonum")?.getAttribute("style");
    await act(async () => (alan.querySelector('[aria-label="Otomatik turu duraklat"]') as HTMLButtonElement).click());
    await act(async () => [...alan.querySelectorAll("button")].find(b => b.textContent === "İleri")?.click());
    await kareIlerle();
    assert.match(alan.textContent ?? "", /İkinci durak/);
    assert.notEqual(alan.querySelector(".karakterKonum")?.getAttribute("style"), baslangic);
    assert.equal(alan.querySelector("[data-rehber-asama]")?.getAttribute("data-rehber-asama"), "anlatiyor");
    await act(async () => (alan.querySelector('[aria-label="Önceki adım"]') as HTMLButtonElement).click());
    await kareIlerle();
    assert.match(alan.textContent ?? "", /Birinci durak/);
    await act(async () => [...alan.querySelectorAll("button")].find(b => b.textContent === "İleri")?.click());
    await kareIlerle();
    await act(async () => [...alan.querySelectorAll("button")].find(b => b.textContent === "Bitir")?.click());
    assert.equal(kapatildi, 0, "Bitir'e basınca aniden kapanmamalı");
    assert.equal(tamamlandi, 0);
    assert.equal(alan.querySelector('[aria-label="Kity sayfa rehberi"]'), null, "Veda sırasında anlatım balonu kapanmalı");
    await kareIlerle(14);
    assert.equal(alan.querySelector("[data-rehber-asama]")?.getAttribute("data-rehber-asama"), "veda-el");
    const merkez = rehberMerkezi({ width: win.innerWidth, height: win.innerHeight });
    assert.match(alan.querySelector(".karakterKonum")?.getAttribute("style") ?? "", new RegExp(`translate3d\\(${merkez.x}px, ${merkez.y}px`));
    assert.ok(alan.querySelector(".vedaKarakteri"), "Merkezde el kaldırma görseli kullanılmalı");
    assert.equal(kapatildi, 0);
    await kareIlerle(13);
    assert.equal(alan.querySelector("[data-rehber-asama]")?.getAttribute("data-rehber-asama"), "veda-kayboluyor");
    await kareIlerle(20);
    assert.equal(kapatildi, 1);
    assert.equal(tamamlandi, 1);
  } finally {
    await act(async () => root.unmount());
    alan.remove();
    hedefler.forEach(e => e.remove());
  }
  assert.equal(kareler.size, 0, "Tur kapandığında animasyon karesi kalmamalı");
});

test("olmayan hedef turu kilitlemez; Escape kapatır, yeniden açılış ilk adımdan başlar", async () => {
  const alan = win.document.createElement("div");
  win.document.body.appendChild(alan);
  const root = createRoot(alan);
  let kapatildi = 0;
  const props = { adimlar, onKapat: () => kapatildi++ };
  try {
    await act(async () => root.render(createElement(YuruyenRehber, { ...props, acik: true })));
    await kareIlerle();
    assert.match(alan.textContent ?? "", /şu anda görünmüyor/);
    await act(async () => [...alan.querySelectorAll("button")].find(b => b.textContent === "İleri")?.click());
    await kareIlerle();
    assert.match(alan.textContent ?? "", /İkinci durak/);
    await act(async () => win.document.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape" })));
    assert.equal(kapatildi, 1);
    await act(async () => root.render(createElement(YuruyenRehber, { ...props, acik: false })));
    assert.equal(alan.textContent, "");
    await act(async () => root.render(createElement(YuruyenRehber, { ...props, acik: true })));
    await kareIlerle();
    assert.match(alan.textContent ?? "", /Birinci durak/);
  } finally { await act(async () => root.unmount()); alan.remove(); }
});

test("veda sırasında Esc kapanışı tek kez tamamlar ve bütün animasyon karelerini temizler", async () => {
  const alan = win.document.createElement("div");
  win.document.body.appendChild(alan);
  const root = createRoot(alan);
  let kapatildi = 0;
  let tamamlandi = 0;
  try {
    await act(async () => root.render(createElement(YuruyenRehber, { adimlar: [adimlar[0]], acik: true, onKapat: () => kapatildi++, onTamamla: () => tamamlandi++ })));
    await kareIlerle();
    await act(async () => [...alan.querySelectorAll("button")].find(b => b.textContent === "Bitir")?.click());
    await kareIlerle(1);
    await act(async () => win.document.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape" })));
    await act(async () => win.document.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Escape" })));
    assert.equal(kapatildi, 1);
    assert.equal(tamamlandi, 1);
  } finally { await act(async () => root.unmount()); alan.remove(); }
  assert.equal(kareler.size, 0);
});
