import assert from "node:assert/strict";
import test, { after } from "node:test";
import React, { act, useMemo, useState } from "react";
import { Window } from "happy-dom";

const dom = new Window({ url: "http://localhost/egitim-yayinlari/urun-egitimleri" });
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLSelectElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "MutationObserver", "CustomEvent", "DocumentFragment", "NodeFilter"] as const) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, getComputedStyle: dom.getComputedStyle.bind(dom) });
const { createRoot } = await import("react-dom/client");
const { default: EgitimYayinFiltreleri, useEgitimUrunFiltresi } = await import("@/components/yayin/EgitimYayinFiltreleri");
const { useListe } = await import("@/components/liste");
type Tur = "video" | "podcast" | "gorsel" | "flip_pdf";
interface Yayin { yayin_id: string; urun_adi: string; gorunen_urun_id: string | null; teknik_adi: string; arac_turu: Tur; }
const ornekler = (): Yayin[] => [
  { yayin_id: "a-v", urun_adi: "Alfa", gorunen_urun_id: "30-001", teknik_adi: "İçerik bir", arac_turu: "video" },
  { yayin_id: "a-p", urun_adi: "Alfa", gorunen_urun_id: "30-001", teknik_adi: "İçerik iki", arac_turu: "podcast" },
  { yayin_id: "b-v", urun_adi: "Beta", gorunen_urun_id: "30-002", teknik_adi: "İçerik üç", arac_turu: "video" },
  { yayin_id: "b-f", urun_adi: "Beta", gorunen_urun_id: "30-002", teknik_adi: "İçerik dört", arac_turu: "flip_pdf" },
];

function Sayfa({ yayinlar, etkin }: { yayinlar: Yayin[]; etkin: boolean }) {
  const [secim, setSecim] = useState<string | null>(null);
  const [tur, setTur] = useState<"tumu" | Tur>("tumu");
  const { urunler, seciliUrun, urunYayinlari } = useEgitimUrunFiltresi(yayinlar, etkin, secim);
  const turFiltreli = useMemo(() => urunYayinlari.filter(yayin => tur === "tumu" || yayin.arac_turu === tur), [urunYayinlari, tur]);
  const aramaAlanlari = useMemo(() => [
    { anahtar: "tumu", etiket: "Tümü", deger: (y: Yayin) => `${y.urun_adi} ${y.teknik_adi}` },
    { anahtar: "teknik", etiket: "Teknik Adı", deger: (y: Yayin) => y.teknik_adi },
  ], []);
  const liste = useListe({ veri: turFiltreli, aramaAlanlari, adim: Infinity });
  return React.createElement(React.Fragment, null,
    React.createElement(EgitimYayinFiltreleri<Yayin>, {
      urunler, seciliUrun, onUrunSec: setSecim,
      yayinlar: urunYayinlari, aktifTur: tur, onTurDegistir: setTur, arama: liste.arama,
    }),
    React.createElement("ul", null, ...liste.gorunen.map(yayin =>
      React.createElement("li", { key: yayin.yayin_id, "data-yayin": yayin.yayin_id }, yayin.teknik_adi))),
  );
}

async function ortam(ilkVeri = ornekler()) {
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  let veri = ilkVeri, etkin = true;
  const render = () => act(async () => root.render(React.createElement(Sayfa, { yayinlar: veri, etkin })));
  const buton = (ad: string, parent: Element = container) => [...parent.querySelectorAll<HTMLButtonElement>("button")].find(el => el.textContent?.trim() === ad)!;
  await render();
  return {
    container, buton,
    urunler: () => container.querySelector('[aria-label="Ürün filtresi"]')!,
    turler: () => container.querySelector('[aria-label="Yayın türüne göre filtrele"]')!,
    idler: () => [...container.querySelectorAll("[data-yayin]")].map(el => el.getAttribute("data-yayin")),
    tikla: (el: Element) => act(async () => { assert.ok(el); (el as HTMLElement).click(); }),
    yaz: (deger: string) => act(async () => {
      const input = container.querySelector("input")!;
      Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype, "value")!.set!.call(input, deger);
      input.dispatchEvent(new dom.Event("input", { bubbles: true }));
    }),
    yenile: async (yeni: Yayin[]) => { veri = yeni; await render(); },
    kategoriyiKapat: async () => { etkin = false; await render(); },
    kapat: async () => { await act(async () => root.unmount()); container.remove(); },
  };
}

after(async () => dom.happyDOM.close());

test("ürünler tekrarsızdır; tür kapsülü ürün filtresinin ardından gelir ve kaynak liste değişmez", async () => {
  const veri = ornekler(), onceki = JSON.stringify(veri);
  const o = await ortam(veri);
  try {
    assert.deepEqual([...o.urunler().querySelectorAll("button")].map(el => el.textContent), ["Tüm Ürünler", "Alfa", "Beta"]);
    assert.equal(o.buton("Tüm Ürünler").getAttribute("aria-pressed"), "true");
    assert.ok(o.urunler().compareDocumentPosition(o.turler()) & dom.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.equal(JSON.stringify(veri), onceki);
  } finally { await o.kapat(); }
});

test("ürün, tür ve arama birlikte süzer; kapsül sayıları seçilen üründen gelir", async () => {
  const o = await ortam();
  try {
    await o.tikla(o.buton("Alfa"));
    assert.deepEqual(o.idler(), ["a-v", "a-p"]);
    assert.ok(o.buton("Tümü 2", o.turler()));
    assert.ok(o.buton("Videolar 1", o.turler()));
    await o.tikla(o.buton("Podcastler 1", o.turler()));
    assert.deepEqual(o.idler(), ["a-p"]);
    await o.yaz("İÇERİK İKİ");
    assert.deepEqual(o.idler(), ["a-p"]);
    await o.yaz("üç");
    assert.deepEqual(o.idler(), []);
    await o.tikla(o.container.querySelector('[aria-label="Aramayı temizle"]')!);
    assert.deepEqual(o.idler(), ["a-p"]);
    assert.equal(o.buton("Alfa").getAttribute("aria-pressed"), "true");
    await o.tikla(o.buton("Tüm Ürünler"));
    await o.tikla(o.buton("Tümü 4", o.turler()));
    assert.equal(o.idler().length, 4);
  } finally { await o.kapat(); }
});

test("aynı adlı farklı ürünler görünen ürün ID'siyle ayrı süzülür", async () => {
  const veri = ornekler(); veri[2].urun_adi = "Alfa"; veri[3].urun_adi = "Alfa";
  const o = await ortam(veri);
  try {
    const butonlar = [...o.urunler().querySelectorAll("button")].filter(el => el.textContent === "Alfa");
    assert.equal(butonlar.length, 2);
    await o.tikla(butonlar[1]);
    assert.deepEqual(o.idler(), ["b-v", "b-f"]);
  } finally { await o.kapat(); }
});

test("ürün ID'si bulunmayan eski kayıtlar ürün adıyla gruplanır", async () => {
  const veri = ornekler().map(yayin => ({ ...yayin, gorunen_urun_id: null }));
  const o = await ortam(veri);
  try {
    assert.equal(o.urunler().querySelectorAll("button").length, 3);
    await o.tikla(o.buton("Beta"));
    assert.deepEqual(o.idler(), ["b-v", "b-f"]);
  } finally { await o.kapat(); }
});

test("yenileme ürün seçimini korur; ürün erişilebilir listeden kalkınca Tüm Ürünler açılır", async () => {
  const o = await ortam();
  try {
    await o.tikla(o.buton("Beta"));
    await o.yenile(ornekler());
    assert.equal(o.buton("Beta").getAttribute("aria-pressed"), "true");
    assert.deepEqual(o.idler(), ["b-v", "b-f"]);
    await o.yenile(ornekler().slice(0, 2));
    assert.equal(o.buton("Tüm Ürünler").getAttribute("aria-pressed"), "true");
    assert.deepEqual(o.idler(), ["a-v", "a-p"]);
  } finally { await o.kapat(); }
});

test("ortak altı çizgili kontrol klavye seçimini destekler; diğer kategoriler ürün filtresi açmaz", async () => {
  const o = await ortam();
  try {
    const tumu = o.buton("Tüm Ürünler"); tumu.focus();
    await act(async () => tumu.dispatchEvent(new dom.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
    assert.equal(o.buton("Alfa").getAttribute("aria-pressed"), "true");
    assert.equal(dom.document.activeElement, o.buton("Alfa"));
    await o.kategoriyiKapat();
    assert.equal(o.container.querySelector('[aria-label="Ürün filtresi"]'), null);
    assert.equal(o.idler().length, 4);
    assert.ok(o.turler());
  } finally { await o.kapat(); }
});
