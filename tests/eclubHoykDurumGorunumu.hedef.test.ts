import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { eclubHoykSureDurumu, sonrakiTurkiyeGeceYarisi } from "@/lib/eclub/hoykSureCercevesi";
import { EclubVideoKarti } from "@/app/(panel)/eclub/panel/_components/EclubFirmaVideoKatalogu";
import EclubVideoOynatici from "@/app/(panel)/eclub/panel/_components/EclubVideoOynatici";
import type { PanelOneri } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";

const baslangic = "2026-10-13T21:17:23+03:00";
const bitis = "2026-10-28T21:17:23+03:00";

test("süre bilgisi Türkiye gece yarısında tam bir gün ilerler", () => {
  assert.equal(eclubHoykSureDurumu(baslangic, bitis, Date.parse("2026-10-13T23:59:59+03:00"))?.gecenGun, 0);
  assert.equal(eclubHoykSureDurumu(baslangic, bitis, Date.parse("2026-10-14T00:00:00+03:00"))?.gecenGun, 1);
  assert.equal(eclubHoykSureDurumu(baslangic, bitis, Date.parse("2026-10-21T00:00:00+03:00"))?.gecenGun, 8);
  assert.equal(sonrakiTurkiyeGeceYarisi(Date.parse("2026-10-13T23:59:59+03:00")), Date.parse("2026-10-14T00:00:00+03:00"));
});

test("açılan kart bilgi pili aktif, süresi geçmiş ve tamamlanan metnini gösterir", () => {
  const simdi = Date.now();
  const acikOneri = {
    oneri_id: "ornek-oneri",
    yayin_id: "ornek-yayin",
    urun_adi: "Örnek ürün",
    teknik_adi: null,
    video_url: null,
    oneri_durumu: "aktif" as const,
    oneri_baslangic: new Date(simdi - 24 * 60 * 60 * 1000).toISOString(),
    oneri_bitis: new Date(simdi + 14 * 24 * 60 * 60 * 1000).toISOString(),
    izlendi_mi: false,
  };
  const ortak = { onKapat: () => {}, onTamamlandi: () => {}, hata: () => {}, basari: () => {}, uyari: () => {} };
  const aktif = renderToStaticMarkup(createElement(EclubVideoOynatici, { ...ortak, oneri: acikOneri }));
  assert.match(aktif, /Bu yayını tamamlayıp puan kazanabilmeniz kalan süre 14 gündür/);
  const gecmis = renderToStaticMarkup(createElement(EclubVideoOynatici, {
    ...ortak,
    oneri: { ...acikOneri, oneri_durumu: "suresi_gecmis", oneri_bitis: new Date(simdi - 1000).toISOString() },
  }));
  assert.match(gecmis, /Bu yayının süresi geçti\. Puansız izlenebilir\./);
  const tamamlanan = renderToStaticMarkup(createElement(EclubVideoOynatici, {
    ...ortak,
    oneri: { ...acikOneri, izlendi_mi: true },
  }));
  assert.match(tamamlanan, /Bu yayını tamamladınız\. Dilerseniz yeniden izleyebilirsiniz/);
  assert.match(tamamlanan, /background-color:#2563eb/);
  const tamamlanmisGecmis = renderToStaticMarkup(createElement(EclubVideoOynatici, {
    ...ortak,
    oneri: { ...acikOneri, izlendi_mi: true, oneri_durumu: "suresi_gecmis", oneri_bitis: new Date(simdi - 1000).toISOString() },
  }));
  assert.match(tamamlanmisGecmis, /Bu yayını tamamladınız\. Dilerseniz yeniden izleyebilirsiniz/);
  assert.match(tamamlanmisGecmis, /background-color:#2563eb/);
  assert.doesNotMatch(tamamlanmisGecmis, /Bu yayının süresi geçti|background-color:#dc2626/);
});

test("15. gecede gün sayısı tamamlanır; yayın bitiş anından sonra süresi geçer", () => {
  const sonGun = eclubHoykSureDurumu(baslangic, bitis, Date.parse("2026-10-28T00:00:00+03:00"));
  assert.equal(sonGun?.gecenGun, 15);
  assert.equal(sonGun?.suresiGecti, false);
  assert.equal(eclubHoykSureDurumu(baslangic, bitis, Date.parse(bitis))?.suresiGecti, false);
  assert.equal(eclubHoykSureDurumu(baslangic, bitis, Date.parse(bitis) + 1)?.suresiGecti, true);
});

test("E-Club HOYK tamamlanmışsa mavi kalır; tamamlanmamışsa süresine göre kırmızı veya ilerleme çizgisi gösterir", () => {
  const oneri = {
    oneri_id: "ornek-oneri",
    yayin_id: "ornek-yayin",
    urun_adi: "Örnek ürün",
    oneri_baslangic: baslangic,
    oneri_bitis: bitis,
    oneri_durumu: "aktif",
    kalan_gun: 15,
    izlendi_mi: false,
    arac_turu: "video",
    video_puani: 70,
  } as PanelOneri;
  const ortak = { oneri, onSec: () => {}, onBegeni: () => {}, onFavori: () => {}, etkilesimAktif: true };
  const aktifHtml = renderToStaticMarkup(createElement(EclubVideoKarti, {
    ...ortak,
    simdi: Date.parse("2026-10-14T00:00:00+03:00"),
  }));
  assert.match(aktifHtml, /<canvas[^>]+aria-hidden="true"/);
  assert.match(aktifHtml, /border border-transparent/);

  const gecmisOneri = {
    ...oneri,
    oneri_baslangic: "2026-09-01T00:00:00+03:00",
    oneri_bitis: "2026-09-16T00:00:00+03:00",
  };
  for (const oneriDurumu of ["aktif", "suresi_gecmis"] as const) {
    const html = renderToStaticMarkup(createElement(EclubVideoKarti, {
      ...ortak,
      oneri: { ...gecmisOneri, oneri_durumu: oneriDurumu },
      simdi: Date.parse("2026-10-15T12:00:00+03:00"),
    }));
    assert.match(html, /border-\[2px\] border-\[#dc2626\]/);
    assert.doesNotMatch(html, /<canvas|border-\[#2563eb\]/);
  }

  for (const tamamlananOneri of [oneri, gecmisOneri, { ...gecmisOneri, oneri_durumu: "suresi_gecmis" as const }]) {
    const tamamlananHtml = renderToStaticMarkup(createElement(EclubVideoKarti, {
      ...ortak,
      oneri: { ...tamamlananOneri, izlendi_mi: true },
      simdi: Date.parse("2026-10-15T12:00:00+03:00"),
    }));
    assert.match(tamamlananHtml, /border-\[2px\] border-\[#2563eb\]/);
    assert.doesNotMatch(tamamlananHtml, /border-\[#dc2626\]|<canvas/);
  }
});
