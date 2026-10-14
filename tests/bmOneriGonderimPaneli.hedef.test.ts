import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { GlobalWindow } from "happy-dom";
import BmOneriGonderimPaneli from "@/components/yayin/BmOneriGonderimPaneli";
import { trGunEkle, trGunu } from "@/lib/zaman/kontrol";
import type { YayindakiVideo } from "@/lib/video/yayindakiVideolar";

const win = new GlobalWindow();
for (const key of Object.getOwnPropertyNames(win)) {
  if (!(key in globalThis)) {
    // @ts-expect-error test DOM ortamı
    globalThis[key] = win[key];
  }
}
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = win.document as unknown as Document;
// @ts-expect-error React act test ortamı
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const yayinlar = [
  { yayin_id: "yayin-1", urun_adi: "Ürün Eğitimi" },
  { yayin_id: "yayin-2", urun_adi: "Medikal Eğitim" },
] as YayindakiVideo[];

test("BM paneli alıcı, zaman ve özet sırasıyla; yalnız yeterli hak ve geçerli tarihle ilerler", async () => {
  const container = win.document.createElement("div");
  win.document.body.appendChild(container);
  const root = createRoot(container);
  let gonderim = 0;
  const kaydet = () => { gonderim += 1; };

  function Senaryo() {
    const [baslangic, setBaslangic] = useState("");
    const [bitis, setBitis] = useState("");
    const [aliciId, setAliciId] = useState("");
    return createElement("div", null,
      createElement("button", { id: "gecerli-tarih", onClick: () => { setBaslangic(trGunEkle(trGunu(), 1)); setBitis(trGunEkle(trGunu(), 2)); } }, "Tarihleri doldur"),
      createElement(BmOneriGonderimPaneli, {
        yayinlar,
        alicilar: [
          { kullanici_id: "az", ad: "Az", soyad: "Haklı", haftalik_kalan: 1, rol: "utt" },
          { kullanici_id: "uygun", ad: "Uygun", soyad: "Temsilci", haftalik_kalan: 2, rol: "kd_utt" },
        ],
        limitler: { aylik: { kalan: 2 } }, alicilarYukleniyor: false,
        aliciId, onAliciDegistir: setAliciId,
        baslangic, onBaslangicDegistir: setBaslangic,
        bitis, onBitisDegistir: setBitis,
        gonderiliyor: false, gonderilebilir: !!aliciId && !!baslangic && !!bitis,
        hataMesaji: "", onGonder: kaydet, onKapat: () => {},
      }),
    );
  }

  const buton = (metin: string) => Array.from(container.querySelectorAll("button")).find((oge) => oge.textContent?.includes(metin));
  await act(async () => root.render(createElement(Senaryo)));
  const adimBasliklari = Array.from(container.querySelectorAll<HTMLButtonElement>("aside section > button"));
  assert.deepEqual(adimBasliklari.map((oge) => oge.querySelector("strong")?.textContent), ["Alıcı", "Zaman", "Özet"]);
  assert.equal(buton("Devam et · Zaman")?.disabled, true);
  assert.equal(adimBasliklari[1].disabled, true);
  assert.equal(gonderim, 0);

  assert.equal(buton("Az Haklı")?.disabled, true);
  assert.equal(buton("Uygun Temsilci")?.disabled, false);
  await act(async () => buton("Uygun Temsilci")?.click());
  assert.equal(buton("Devam et · Zaman")?.disabled, false);
  await act(async () => buton("Devam et · Zaman")?.click());
  assert.equal(buton("Devam et · Özet")?.disabled, true);
  await act(async () => container.querySelector<HTMLButtonElement>("#gecerli-tarih")?.click());
  assert.equal(buton("Devam et · Özet")?.disabled, false);
  await act(async () => buton("Devam et · Özet")?.click());
  assert.match(container.textContent ?? "", /Ürün Eğitimi/);
  assert.match(container.textContent ?? "", /Medikal Eğitim/);
  await act(async () => buton("Önerileri oluştur")?.click());
  assert.equal(gonderim, 1);

  await act(async () => root.unmount());
  container.remove();
});
