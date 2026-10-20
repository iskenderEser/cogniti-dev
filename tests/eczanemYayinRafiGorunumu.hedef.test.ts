import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createElement as h, act } from "react";
import { createRoot } from "react-dom/client";
import { Window } from "happy-dom";
import EczanemVideoRafi from "@/app/eczanem/_components/EczanemVideoRafi";
import { VideoRafi } from "@/app/(panel)/eclub/panel/_components/EclubFirmaVideoKatalogu";
import type { PanelOneri } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";
import type { EczanemMusteriVideo } from "@/app/eczanem/_types";

const dom = new Window({ url: "http://localhost/eczanem" });
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent"] as const) Object.defineProperty(globalThis, key, { configurable: true, value: dom[key] });
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
after(async () => { await dom.happyDOM.close(); });

function video(index = 0): EczanemMusteriVideo {
  return {
    gonderim_id: `g-${index}`, yayin_id: "ortak-yayin", eczane_id: `eczane-${index}`, eczane_adi: `Eczane ${index}`,
    firma_id: "firma", firma_adi: "Firma", urun_id: "urun", urun_adi: "Ürün", teknik_adi: null,
    video_url: null, arac_id: `arac-${index}`, arac_turu: "video", thumbnail_url: "https://example.invalid/kapak.png",
    video_puani: 20, soru_puani: 5, soru_sayisi: 3, gelis_tarihi: "2026-10-20", izleme_basladi: index === 1,
    izlendi: index === 2, cevaplandi: false, izleme_baslangic: null, izleme_bitis: null, son_konum_saniye: 45,
    begeni_sayisi: 2, favori_sayisi: 1, begeni_mi: false, favori_mi: false,
  };
}
function oneri(): PanelOneri {
  return {
    ...video(), oneri_id: "oneri", oneri_baslangic: "2026-10-20", oneri_bitis: "2026-11-04", oneri_durumu: "aktif",
    kalan_gun: 15, izlendi_mi: false, izleme_tamamlandi_mi: false, kazanilan_izleme_puani: 0,
    kazanilan_cevaplama_puani: 0, ileri_sarma_kaybi: 0, dogru_cevap: 0, yanlis_cevap: 0, created_at: "2026-10-20",
  };
}
const noop = () => undefined;

test("Eczanem rafının başlık, kart genişliği, aralık, ok ve boş durum görünümü gerçek E-Club rafıyla eşleşir", async () => {
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  const render = (bos = false) => act(async () => root.render(h("div", null,
    h("div", { "data-karsilastir": "eclub" }, h(VideoRafi, { baslik: "Referans", videolar: bos ? [] : [oneri()], etkilesimAktif: true, onVideoSec: noop, onBegeni: noop, onFavori: noop })),
    h("div", { "data-karsilastir": "eczanem" }, h(EczanemVideoRafi, { baslik: "Üye Yayınları", videolar: bos ? [] : [video()], bosMesaj: "Boş raf", onVideoSec: noop, onBegeni: noop, onFavori: noop })),
  )));
  try {
    await render();
    const eclub = container.querySelector('[data-karsilastir="eclub"]')!;
    const eczanem = container.querySelector('[data-karsilastir="eczanem"]')!;
    assert.equal(eczanem.querySelector("h2")!.className, eclub.querySelector("h2")!.className);
    const hedefKart = eczanem.querySelector<HTMLElement>('.hidden.sm\\:block [data-eczanem-hoyk-kart]')!;
    const referansKart = eclub.querySelector<HTMLElement>('.hidden.sm\\:block [data-eclub-hoyk-kart]')!;
    assert.equal(hedefKart.className, referansKart.className);
    assert.equal(eczanem.querySelector('.flex.snap-x')!.className, eclub.querySelector('.flex.snap-x')!.className);
    for (const yon of ["sola", "sağa"]) {
      const hedef = eczanem.querySelector(`[aria-label="Üye Yayınları rafını ${yon} kaydır"]`)!;
      const referans = eclub.querySelector(`[aria-label="Referans rafını ${yon} kaydır"]`)!;
      assert.equal(hedef.className, referans.className);
    }
    const raf = eczanem.querySelector<HTMLElement>('.flex.snap-x')!;
    Object.defineProperty(raf, "clientWidth", { value: 400 });
    const kaydirmalar: Array<{ left?: number; behavior?: string }> = [];
    raf.scrollBy = (options: ScrollToOptions | number) => { if (typeof options !== "number") kaydirmalar.push(options); };
    await act(async () => { (eczanem.querySelector('[aria-label="Üye Yayınları rafını sağa kaydır"]') as HTMLElement).click(); });
    assert.deepEqual(kaydirmalar, [{ left: 340, behavior: "smooth" }]);
    await render(true);
    assert.equal(eczanem.querySelector('.text-center')!.className, eclub.querySelector('.text-center')!.className);
  } finally { await act(async () => root.unmount()); container.remove(); }
});

test("dört araç ve gönderim ayrımı korunur; rozet kapaktadır, kart etkileşimleri oynatıcıyı kendiliğinden başlatmaz", async () => {
  const container = dom.document.createElement("div"); dom.document.body.append(container);
  const root = createRoot(container);
  const videolar = ["video", "podcast", "gorsel", "flip_pdf"].map((tur, index) => ({ ...video(index), arac_turu: tur as EczanemMusteriVideo["arac_turu"] }));
  const secimler: string[] = [], begeniler: string[] = [], favoriler: string[] = [];
  const render = (isliyor?: string) => act(async () => root.render(h(EczanemVideoRafi, {
    baslik: "Araçlar", videolar, bosMesaj: "Boş", etkilesimIsliyor: isliyor,
    onVideoSec: v => secimler.push(v.gonderim_id), onBegeni: v => { begeniler.push(v.gonderim_id); }, onFavori: v => { favoriler.push(v.gonderim_id); },
  })));
  try {
    await render();
    assert.equal(secimler.length, 0);
    const masaustu = container.querySelector('.hidden.sm\\:block')!;
    const kartlar = masaustu.querySelectorAll<HTMLElement>('[data-hoyk-kart]');
    assert.equal(kartlar.length, 4);
    for (const kart of kartlar) {
      assert.match(kart.textContent!, /20 p/);
      assert.match(kart.textContent!, /3 ad/);
      assert.match(kart.textContent!, /5 p/);
      assert.ok(kart.querySelector('[data-hoyk-kapak] .h-10.w-10'));
      assert.equal(kart.querySelector('[data-hoyk-kapsul]'), null);
      assert.doesNotMatch(kart.textContent!, /Çekli Puan|Çeksiz Puan|Sipariş zorunlu|15 gün/);
    }
    assert.match(kartlar[0].querySelector('[data-hoyk-kapak]')!.textContent!, /Yeni/);
    assert.match(kartlar[1].querySelector('[data-hoyk-kapak]')!.textContent!, /Devam Et · 0:45/);
    assert.match(kartlar[2].querySelector('[data-hoyk-kapak]')!.textContent!, /Tamamlandı/);
    assert.ok(kartlar[2].classList.contains('border-[2px]'));
    assert.match(kartlar[1].textContent!, /Eczane 1/);
    await act(async () => {
      kartlar[1].querySelector<HTMLButtonElement>('button[aria-label*="Beğen"]')!.click();
      kartlar[1].querySelector<HTMLButtonElement>('button[aria-label*="Favori"]')!.click();
    });
    assert.deepEqual(begeniler, ["g-1"]); assert.deepEqual(favoriler, ["g-1"]); assert.equal(secimler.length, 0);
    await act(async () => kartlar[1].click());
    assert.deepEqual(secimler, ["g-1"]);
    await render("ortak-yayin");
    assert.ok([...masaustu.querySelectorAll<HTMLButtonElement>('button[aria-label*="Beğen"], button[aria-label*="Favori"]')].every(button => button.disabled));
  } finally { await act(async () => root.unmount()); container.remove(); }
});
