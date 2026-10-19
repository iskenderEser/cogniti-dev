import assert from "node:assert/strict";
import test from "node:test";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { GlobalWindow } from "happy-dom";
import YuruyenRehber from "@/components/rehber/YuruyenRehber";
import KityVeda from "@/components/rehber/KityVeda";
import { KITY_URETICI_ADIMLARI, KITY_METINLERI, kityKarsilamasi } from "@/lib/rehber/kityGirisTuru";
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

test("üretici karşılaması karar bekler; Evet dört durağı açar, Hayır vedayla kapanır", async () => {
  for (const cevap of ["Evet", "Hayır"]) {
    const alan = win.document.createElement("div");
    const karsilama = kityKarsilamasi("Ayşe");
    const hedefler = [karsilama, ...KITY_URETICI_ADIMLARI].map((a, i) => {
      const e = win.document.createElement("div");
      e.id = a.hedefId;
      e.getBoundingClientRect = () => ({ left: 300, top: 100 + i * 80, width: 220, height: 60, right: 520, bottom: 160 + i * 80, x: 300, y: 100 + i * 80, toJSON() {} });
      win.document.body.appendChild(e);
      return e;
    });
    win.document.body.appendChild(alan);
    const root = createRoot(alan);
    const eskiTimeout = win.setTimeout;
    let otomatikZamanlayici = 0;
    win.setTimeout = ((cb: TimerHandler, delay?: number) => {
      if (delay === 6500) otomatikZamanlayici++;
      return eskiTimeout.call(win, cb, delay);
    }) as typeof win.setTimeout;
    let kapanis = 0;
    try {
      await act(async () => root.render(createElement(YuruyenRehber, {
        adimlar: KITY_URETICI_ADIMLARI, karsilama, acik: true,
        onKapat: () => kapanis++, tarayiciSesiKullan: false, vedaMetni: KITY_METINLERI.veda,
      })));
      await kareIlerle();
      assert.match(alan.textContent ?? "", /Merhaba Ayşe!/);
      assert.match(alan.textContent ?? "", /istersen bu ekrandaki bazı başlıkları/);
      assert.equal(otomatikZamanlayici, 0, "Kullanıcı yanıt vermeden tur için zamanlayıcı kurulmaz");
      assert.equal(alan.querySelector(".vurgu"), null);
      const secim = [...alan.querySelectorAll("button")].find(b => b.textContent === cevap);
      assert.ok(secim);
      await act(async () => secim.click());
      await kareIlerle();
      if (cevap === "Evet") {
        const duraklat = alan.querySelector<HTMLButtonElement>('[aria-label="Otomatik turu duraklat"]');
        assert.ok(duraklat);
        await act(async () => duraklat.click());
        for (const [i, durak] of KITY_URETICI_ADIMLARI.entries()) {
          assert.equal(alan.querySelector("h2")?.textContent, durak.baslik);
          assert.match(alan.querySelector(".adimEtiketi")?.textContent ?? "", new RegExp("0" + (i + 1) + " / 04"));
          assert.ok(alan.querySelector(".vurgu"));
          const devam = [...alan.querySelectorAll("button")].find(b => b.textContent === (i === 3 ? "Bitir" : "İleri"));
          assert.ok(devam);
          await act(async () => devam.click());
          await kareIlerle();
        }
      }
      assert.match(alan.textContent ?? "", /Eğlenceli öğrenmeler dilerim/);
      await kareIlerle(80);
      assert.equal(kapanis, 1);
    } finally {
      win.setTimeout = eskiTimeout;
      await act(async () => root.unmount());
      alan.remove();
      hedefler.forEach(e => e.remove());
    }
    assert.equal(kareler.size, 0);
  }
});

test("geciken profil hazırlığı iptal edilince eski adım geri gelmez; canlı tur tarayıcı sesi kullanmaz", async () => {
  const alan = win.document.createElement("div");
  const hedefler = adimlar.map((a, i) => {
    const e = win.document.createElement("button");
    e.id = a.hedefId;
    e.getBoundingClientRect = () => ({ left: 400 + i * 200, top: 300, width: 160, height: 60, right: 560 + i * 200, bottom: 360, x: 400 + i * 200, y: 300, toJSON() {} });
    win.document.body.appendChild(e);
    return e;
  });
  win.document.body.appendChild(alan);
  const root = createRoot(alan);
  let hazirla: (() => void) | undefined;
  let ilkSignal: AbortSignal | undefined;
  let konusmaSayisi = 0;
  const eskiSes = Object.getOwnPropertyDescriptor(win, "speechSynthesis");
  const eskiCumle = Object.getOwnPropertyDescriptor(win, "SpeechSynthesisUtterance");
  const eskiGlobalCumle = Object.getOwnPropertyDescriptor(globalThis, "SpeechSynthesisUtterance");
  class Cumle { text: string; constructor(text: string) { this.text = text; } }
  Object.defineProperty(win, "SpeechSynthesisUtterance", { configurable: true, value: Cumle });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", { configurable: true, value: Cumle });
  Object.defineProperty(win, "speechSynthesis", { configurable: true, value: { speak: () => konusmaSayisi++, getVoices: () => [], cancel: () => {}, resume: () => {} } });
  try {
    await act(async () => root.render(createElement(YuruyenRehber, {
      adimlar, acik: true, onKapat: () => {}, sesli: true, tarayiciSesiKullan: false,
      hedefiHazirla: async (adim, signal) => {
        if (adim.hedefId === adimlar[0].hedefId) {
          ilkSignal = signal;
          await new Promise<void>(resolve => { hazirla = resolve; });
        }
      },
    })));
    await kareIlerle(3);
    assert.equal(alan.querySelector("[data-rehber-asama]")?.getAttribute("data-rehber-asama"), "yuruyor");
    assert.equal(alan.querySelector(".karakterKonum"), null, "Profil hazır olmadan avatar hedefe yerleşmemeli");
    await act(async () => [...alan.querySelectorAll("button")].find(b => b.textContent === "İleri")?.click());
    await kareIlerle(2);
    await kareIlerle();
    assert.equal(ilkSignal?.aborted, true);
    assert.match(alan.textContent ?? "", /İkinci durak/);
    await act(async () => hazirla?.());
    await kareIlerle();
    assert.match(alan.textContent ?? "", /İkinci durak/);
    assert.equal(konusmaSayisi, 0);
  } finally {
    await act(async () => root.unmount());
    alan.remove(); hedefler.forEach(e => e.remove());
    if (eskiSes) Object.defineProperty(win, "speechSynthesis", eskiSes);
    else Reflect.deleteProperty(win, "speechSynthesis");
    if (eskiCumle) Object.defineProperty(win, "SpeechSynthesisUtterance", eskiCumle);
    else Reflect.deleteProperty(win, "SpeechSynthesisUtterance");
    if (eskiGlobalCumle) Object.defineProperty(globalThis, "SpeechSynthesisUtterance", eskiGlobalCumle);
    else Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
  }
  assert.equal(kareler.size, 0);
});

test("veda Mia kaydı bitene kadar merkezde kalır; kapanış sesi ve zamanlayıcıyı temizler", async () => {
  const alan = win.document.createElement("div");
  win.document.body.appendChild(alan);
  const root = createRoot(alan);
  let bitti = 0;
  let durdu = 0;
  const kayitlar: Kayit[] = [];
  class Kayit {
    src: string;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(src: string) { this.src = src; kayitlar.push(this); }
    play() { return Promise.resolve(); }
    pause() { durdu++; }
  }
  const eskiAudio = Object.getOwnPropertyDescriptor(globalThis, "Audio");
  Object.defineProperty(globalThis, "Audio", { configurable: true, value: Kayit });
  try {
    await act(async () => root.render(createElement(KityVeda, {
      baslangic: { x: 24, y: 300 }, baslangicYukseklik: 240, onBitti: () => bitti++, sesDosyasi: "/rehber/ses/cogniti-veda.mp3",
    })));
    await kareIlerle(60);
    assert.equal(bitti, 0);
    assert.equal(alan.querySelector("[data-rehber-asama]")?.getAttribute("data-rehber-asama"), "veda-el");
    await act(async () => kayitlar[0].onended?.());
    await kareIlerle(20);
    assert.equal(bitti, 1);
  } finally {
    await act(async () => root.unmount()); alan.remove();
    if (eskiAudio) Object.defineProperty(globalThis, "Audio", eskiAudio);
    else Reflect.deleteProperty(globalThis, "Audio");
  }
  assert.equal(durdu, 1);
  assert.equal(kayitlar[0].onended, null);
  assert.equal(kareler.size, 0);
});

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

test("geniş karşılama başlığı ve dar ekranlarda balon avatarı örtmez", () => {
  for (const ekran of [
    { width: 1440, height: 810 }, { width: 1024, height: 768 },
    { width: 768, height: 600 }, { width: 632, height: 760 },
    { width: 390, height: 844 }, { width: 320, height: 568 },
    { width: 667, height: 375 },
  ]) {
    const sol = ekran.width >= 768 ? 296 : 16;
    for (const hedef of [
      { left: sol, top: 120, width: ekran.width - sol - 32, height: 64 },
      { left: sol, top: 210, width: 220, height: 110 },
      { left: 16, top: ekran.height - 160, width: ekran.width - 32, height: 100 },
    ]) {
      for (const yukseklik of [180, 230, Math.min(310, ekran.height - 160)]) {
        const k = rehberKonumu(hedef, ekran, yukseklik);
        const ayrik = k.balon.x + k.balon.width <= k.avatar.x
          || k.avatar.x + k.avatarGenislik <= k.balon.x
          || k.balon.y + yukseklik <= k.avatar.y
          || k.avatar.y + k.avatarYukseklik <= k.balon.y;
        assert.ok(ayrik, JSON.stringify({ ekran, hedef, yukseklik, k }));
        assert.ok(k.avatarYukseklik >= 100, "Avatar görünür boyutta kalmalı");
        assert.ok(k.avatar.x >= 0 && k.avatar.x + k.avatarGenislik <= ekran.width);
        assert.ok(k.avatar.y >= 0 && k.avatar.y + k.avatarYukseklik <= ekran.height);
        assert.ok(k.balon.x >= 0 && k.balon.x + k.balon.width <= ekran.width);
        assert.ok(k.balon.y >= 0 && k.balon.y + yukseklik <= ekran.height);
      }
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

test("sesli tur hedefte Türkçe konuşur; ses bitince ilerler, sessize alınca ve kapanınca konuşmayı keser", async () => {
  const alan = win.document.createElement("div");
  const hedefler = adimlar.map((a, i) => {
    const e = win.document.createElement("button");
    e.id = a.hedefId;
    e.getBoundingClientRect = () => ({ left: 400 + i * 200, top: 300, width: 160, height: 60, right: 560 + i * 200, bottom: 360, x: 400 + i * 200, y: 300, toJSON() {} });
    win.document.body.appendChild(e);
    return e;
  });
  win.document.body.appendChild(alan);
  const root = createRoot(alan);
  const turkce = { lang: "tr-TR", name: "Türkçe test sesi" } as SpeechSynthesisVoice;
  const konusmalar: SpeechSynthesisUtterance[] = [];
  let iptalSayisi = 0;
  const eskiSes = Object.getOwnPropertyDescriptor(win, "speechSynthesis");
  const eskiCumle = Object.getOwnPropertyDescriptor(win, "SpeechSynthesisUtterance");
  const eskiGlobalCumle = Object.getOwnPropertyDescriptor(globalThis, "SpeechSynthesisUtterance");
  class Cumle { text: string; constructor(text: string) { this.text = text; } }
  Object.defineProperty(win, "SpeechSynthesisUtterance", { configurable: true, value: Cumle });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", { configurable: true, value: Cumle });
  Object.defineProperty(win, "speechSynthesis", { configurable: true, value: {
    getVoices: () => [turkce], cancel: () => iptalSayisi++, resume: () => {},
    speak: (cumle: SpeechSynthesisUtterance) => konusmalar.push(cumle),
  } });
  try {
    const props = { adimlar, sesli: true, onKapat: () => {} };
    await act(async () => root.render(createElement(YuruyenRehber, { ...props, acik: true })));
    assert.equal(konusmalar.length, 0, "Yürürken konuşma başlamamalı");
    await kareIlerle();
    assert.equal(konusmalar.length, 1);
    assert.equal(konusmalar[0].lang, "tr-TR");
    assert.equal(konusmalar[0].voice, turkce);
    assert.match(konusmalar[0].text, /Merhaba, ben Kity.*İlk alan/);
    await act(async () => {
      konusmalar[0].onend?.call(konusmalar[0], {} as SpeechSynthesisEvent);
      await new Promise(resolve => setTimeout(resolve, 850));
    });
    await kareIlerle();
    assert.equal(konusmalar.length, 2, "Ses bittikten sonra ikinci durak okunmalı");
    assert.match(konusmalar[1].text, /İkinci alan/);
    const oncekiIptal = iptalSayisi;
    await act(async () => (alan.querySelector('[aria-label="Sesi kapat"]') as HTMLButtonElement).click());
    assert.ok(iptalSayisi > oncekiIptal);
    await act(async () => (alan.querySelector('[aria-label="Sesi aç"]') as HTMLButtonElement).click());
    assert.equal(konusmalar.length, 3);
    const kapanisOncesi = iptalSayisi;
    await act(async () => root.render(createElement(YuruyenRehber, { ...props, acik: false })));
    assert.ok(iptalSayisi > kapanisOncesi);
    assert.equal(konusmalar[2].onend, null, "Kapanan turun sesi ilerleme başlatmamalı");
  } finally {
    await act(async () => root.unmount());
    alan.remove(); hedefler.forEach(e => e.remove());
    for (const [nesne, ad, onceki] of [[win, "speechSynthesis", eskiSes], [win, "SpeechSynthesisUtterance", eskiCumle], [globalThis, "SpeechSynthesisUtterance", eskiGlobalCumle]] as const) {
      if (onceki) Object.defineProperty(nesne, ad, onceki);
      else Reflect.deleteProperty(nesne, ad);
    }
  }
});

test("hazır Mia kaydı hedefte çalar; sessize alınınca durur, kayıt bitince veda başlar", async () => {
  const alan = win.document.createElement("div");
  const hedef = win.document.createElement("button");
  hedef.id = adimlar[0].hedefId;
  hedef.getBoundingClientRect = () => ({ left: 400, top: 300, width: 160, height: 60, right: 560, bottom: 360, x: 400, y: 300, toJSON() {} });
  win.document.body.append(alan, hedef);
  const root = createRoot(alan);
  const eskiAudio = Object.getOwnPropertyDescriptor(globalThis, "Audio");
  const kayitlar: Kayit[] = [];
  class Kayit {
    src: string;
    durdu = false;
    onplaying: (() => void) | null = null;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(src: string) { this.src = src; kayitlar.push(this); }
    play() { this.onplaying?.(); return Promise.resolve(); }
    pause() { this.durdu = true; }
  }
  Object.defineProperty(globalThis, "Audio", { configurable: true, value: Kayit });
  try {
    await act(async () => root.render(createElement(YuruyenRehber, {
      adimlar: [{ ...adimlar[0], sesDosyasi: "/rehber/ses/kity-merhaba-mia.mp3" }],
      acik: true, sesli: true, onKapat: () => {},
    })));
    assert.equal(kayitlar.length, 0);
    await kareIlerle();
    assert.equal(kayitlar[0].src, "/rehber/ses/kity-merhaba-mia.mp3");
    await act(async () => (alan.querySelector('[aria-label="Sesi kapat"]') as HTMLButtonElement).click());
    assert.equal(kayitlar[0].durdu, true);
    await act(async () => (alan.querySelector('[aria-label="Sesi aç"]') as HTMLButtonElement).click());
    await act(async () => { kayitlar[1].onended?.(); await new Promise(resolve => setTimeout(resolve, 850)); });
    assert.equal(alan.querySelector('[aria-label="Kity sayfa rehberi"]'), null);
    assert.equal(kayitlar[1].durdu, true);
  } finally {
    await act(async () => root.unmount()); alan.remove(); hedef.remove();
    if (eskiAudio) Object.defineProperty(globalThis, "Audio", eskiAudio);
    else Reflect.deleteProperty(globalThis, "Audio");
  }
});
