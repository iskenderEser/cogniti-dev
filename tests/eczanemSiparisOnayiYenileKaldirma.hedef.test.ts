import test from "node:test";
import assert from "node:assert/strict";
import { act, createElement } from "react";
import { GlobalWindow } from "happy-dom";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) {
  if (!(key in globalThis)) {
    // @ts-expect-error Test ortamındaki DOM nesneleri.
    globalThis[key] = win[key];
  }
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
globalThis.Event = win.Event as unknown as typeof Event;
globalThis.CustomEvent = win.CustomEvent as unknown as typeof CustomEvent;
Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
// @ts-expect-error React test ortamı bayrağı.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const { default: SiparisKuyrugu } = await import("@/app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu");

const siparis = {
  siparis_id: "test-siparis", musteri_bas_harfleri: "T. M.", musteri_maskeli: "••• ••• 1234", urun_adi: "Test Ürünü",
  adet: 1, kullanilan_puan: 100, indirim_tl: 10, satis_fiyati: 50, indirimli_fiyat: 40,
  durum: "bekliyor", islem_kodu: null, onay_tarihi: null, karar_tarihi: null,
  islem_yapan: null, sonuc_durumu: "bekliyor", created_at: "2026-10-10T10:00:00Z",
};
const veri = (tamamlandi = false) => ({
  bekleyen: tamamlandi ? [] : [siparis],
  gecmis: tamamlandi ? [{ ...siparis, durum: "onaylandi", sonuc_durumu: "onaylandi", islem_kodu: "ONAY-1", islem_yapan: "Test Eczacısı" }] : [],
  ozet: { bekleyen: tamamlandi ? 0 : 1, bugun_onaylanan: tamamlandi ? 1 : 0, gecmis: tamamlandi ? 1 : 0 },
  sayfalama: {
    bekleyen: { sayfa: 1, toplam: tamamlandi ? 0 : 1, toplam_sayfa: 1 },
    gecmis: { sayfa: 1, toplam: tamamlandi ? 1 : 0, toplam_sayfa: 1 },
  },
});

async function kur(onFetch: typeof fetch, gorunumTesti = false) {
  const oncekiFetch = globalThis.fetch;
  const oncekiInterval = win.setInterval;
  const oncekiClear = win.clearInterval;
  let otomatik: (() => void) | undefined;
  let temizlenen = 0;
  win.setInterval = ((callback: () => void, ms: number) => {
    assert.equal(ms, 30000);
    otomatik = callback;
    return 123;
  }) as typeof win.setInterval;
  win.clearInterval = (() => { temizlenen++; }) as typeof win.clearInterval;
  globalThis.fetch = onFetch;
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host);
  const hatalar: string[] = [];
  const basarilar: string[] = [];
  try {
    await act(async () => root.render(createElement(SiparisKuyrugu, {
      hata: (mesaj: string) => { hatalar.push(mesaj); },
      basari: (mesaj: string) => { basarilar.push(mesaj); },
      gorunumTesti,
    })));
  } catch (error) {
    await act(async () => root.unmount()); host.remove();
    globalThis.fetch = oncekiFetch; win.setInterval = oncekiInterval; win.clearInterval = oncekiClear;
    throw error;
  }
  return {
    host, hatalar, basarilar,
    async tikla(metin: string) {
      const buton = [...document.querySelectorAll("button")].find((b) => b.textContent?.replace(/\s+/g, "") === metin.replace(/\s+/g, ""));
      assert.ok(buton, `Buton bulunamadı: ${metin}. Mevcut: ${[...document.querySelectorAll("button")].map((b) => b.textContent).join(" | ")}`);
      await act(async () => buton.click());
    },
    async sonButonaTikla(metin: string) {
      const buton = [...document.querySelectorAll("button")].filter((b) => b.textContent?.replace(/\s+/g, "") === metin.replace(/\s+/g, "")).at(-1);
      assert.ok(buton, `Buton bulunamadı: ${metin}`);
      await act(async () => buton.click());
    },
    async otomatikYenile() { assert.ok(otomatik); await act(async () => otomatik!()); },
    async kapat() {
      await act(async () => root.unmount()); host.remove();
      globalThis.fetch = oncekiFetch; win.setInterval = oncekiInterval; win.clearInterval = oncekiClear;
      assert.ok(temizlenen > 0, "Sayfa kapanırken otomatik sorgu temizlenmeli.");
    },
  };
}

test("Yenile olmadan onay doğru POST'u gönderir, listeyi günceller ve otomatik sorgu sürer", async () => {
  const istekler: string[] = [];
  let onaylandi = false;
  let rozet = 0;
  const rozetDinle = () => { rozet++; };
  window.addEventListener("hapbilgi:bildirim-rozetleri-degisti", rozetDinle);
  const ekran = await kur(async (url, init) => {
    assert.ok(String(url).startsWith("/eczanem/eczane/api/siparisler"));
    istekler.push(init?.method ?? "GET");
    if (init?.method === "POST") {
      assert.deepEqual(JSON.parse(String(init.body)), { siparis_id: "test-siparis", aksiyon: "onayla" });
      onaylandi = true;
      return Response.json({ ok: true, indirim_tl: 10, islem_kodu: "ONAY-1" });
    }
    return Response.json(veri(onaylandi));
  });
  try {
    assert.ok(![...ekran.host.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Yenile"));
    await ekran.tikla("Onay");
    assert.equal(istekler.filter((i) => i === "POST").length, 0, "Onay penceresi açılması işlem yapmamalı.");
    await ekran.tikla("Siparişi onayla");
    assert.deepEqual(istekler, ["GET", "POST", "GET"]);
    assert.match(ekran.host.textContent ?? "", /Onay bekleyen sipariş yok/);
    assert.equal(ekran.hatalar.length, 0);
    assert.equal(ekran.basarilar.length, 1);
    assert.equal(rozet, 1);
    await ekran.tikla("Geçmiş");
    assert.match(ekran.host.textContent ?? "", /ONAY-1/);
    await ekran.otomatikYenile();
    assert.equal(istekler.at(-1), "GET");
    assert.match(ekran.host.textContent ?? "", /ONAY-1/);
  } finally { await ekran.kapat(); window.removeEventListener("hapbilgi:bildirim-rozetleri-degisti", rozetDinle); }
});

test("Onay hatasında sipariş korunur; okuma hatası Tekrar dene ile giderilir", async () => {
  let okumaHatasi = false;
  const ekran = await kur(async (_url, init) => {
    if (init?.method === "POST") return Response.json({ hata: "Onay reddedildi." }, { status: 400 });
    if (okumaHatasi) return Response.json({ hata: "Liste alınamadı." }, { status: 500 });
    return Response.json(veri());
  });
  try {
    await ekran.tikla("Onay"); await ekran.tikla("Siparişi onayla");
    assert.deepEqual(ekran.hatalar, ["Onay reddedildi."]);
    assert.equal(ekran.basarilar.length, 0);
    assert.match(ekran.host.textContent ?? "", /Test Ürünü/);
    okumaHatasi = true;
    await ekran.otomatikYenile();
    assert.match(ekran.host.textContent ?? "", /Liste alınamadı/);
    okumaHatasi = false;
    await ekran.tikla("Tekrar dene");
    assert.doesNotMatch(ekran.host.textContent ?? "", /Liste alınamadı/);
    assert.match(ekran.host.textContent ?? "", /Test Ürünü/);
  } finally { await ekran.kapat(); }
});

test("(F) örnekleri onaylamak veya reddetmek gerçek sipariş isteği göndermez", async () => {
  const istekler: string[] = [];
  const ekran = await kur(async (_url, init) => {
    istekler.push(init?.method ?? "GET");
    return Response.json(veri(true));
  }, true);
  try {
    assert.match(ekran.host.textContent ?? "", /Örnek Ürün A\s*\(F\)/);
    assert.match(ekran.host.textContent ?? "", /Örnek Ürün D\s*\(F\)/);
    assert.match(ekran.host.textContent ?? "", /Örnek Ürün E\s*\(F\)/);
    assert.match(ekran.host.textContent ?? "", /Örnek Ürün F\s*\(F\)/);
    assert.match(ekran.host.textContent ?? "", /gerçek sipariş veya puan oluşturmaz/);
    const basliklar = [...ekran.host.querySelectorAll("thead th")].map((baslik) => baslik.textContent?.trim());
    assert.deepEqual(basliklar, ["Ürün adı", "Satış fiyatı", "ÜYE", "Satış tarihi", "Satılan kutu adedi", "Toplam tutar", "Kullanılan puan", "İndirim tutarı", "İndirimli satış fiyatı", "İşlem"]);
    const ornekSatir = [...ekran.host.querySelectorAll("tbody tr")].find((satir) => satir.textContent?.includes("Örnek Ürün A"));
    assert.ok(ornekSatir);
    assert.match(ornekSatir.textContent ?? "", /A\. Y\..*0101/);
    assert.match(ornekSatir.textContent ?? "", /360,00/);
    assert.match(ornekSatir.textContent ?? "", /320,00/);
    await ekran.tikla("Onay");
    await ekran.tikla("Siparişi onayla");
    assert.deepEqual(istekler, ["GET"]);
    assert.match(ekran.host.textContent ?? "", /Onay Bekleyenler 3/);
    await ekran.tikla("Geçmiş");
    assert.match(ekran.host.textContent ?? "", /ORNEK-001/);
    await ekran.tikla("Örnekleri sıfırla");
    await ekran.tikla("Onay Bekleyenler 4");
    await ekran.tikla("İptal");
    await ekran.sonButonaTikla("Talebi iptal et");
    assert.deepEqual(istekler, ["GET"]);
    assert.equal(ekran.hatalar.length, 0);
  } finally { await ekran.kapat(); }
});
