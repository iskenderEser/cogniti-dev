import assert from "node:assert/strict";
import test from "node:test";
import { eczanemUyeMenusuOlustur } from "@/app/eczanem/_components/eczanemUyeMenusu";
import { mobilPanelNavOlustur, type NavContext, type NavGrup, type NavOge } from "@/components/panel/panelNav.config";
import type { EczanemSidebarAgaci, EczanemSidebarSecim } from "@/app/eczanem/_types";

const uyeBaglami: NavContext = { rolKucu: "musteri", kimlikTuru: "musteri", storeAcik: false, ccAcik: false, eclubAcik: false, eclubStoreAcik: false, eczanemAcik: true };

function agacOlustur(): EczanemSidebarAgaci {
  return ["eczane-a", "eczane-b"].map(eczane_id => ({
    eczane_id, eczane_adi: "Aynı Eczane Adı",
    firmalar: [{ firma_id: "firma", firma_adi: "Firma", urunler: [null, "genel"].map(urun_id => ({
      urun_id, urun_adi: "Aynı Ürün Adı", yayinlar: [{ yayin_id: "yayin", yayin_basligi: "Yayın", araclar: [
        { arac_id: "video", arac_turu: "video" }, { arac_id: "podcast", arac_turu: "podcast" },
        { arac_id: "gorsel", arac_turu: "gorsel" }, { arac_id: "pdf", arac_turu: "flip_pdf" },
      ] }],
    })) }],
  }));
}

function ogeleriAc(gruplar: NavGrup[]): NavOge[] {
  const ac = (oge: NavOge): NavOge[] => [oge, ...(oge.altOglar ?? []).flatMap(ac)];
  return gruplar.flatMap(grup => grup.oglar.flatMap(ac));
}

test("sidebar eczane ve firmada biter; ürün seçiliyken ilgili firma aktif kalır", () => {
  const secimler: EczanemSidebarSecim[] = [];
  const gruplar = eczanemUyeMenusuOlustur({ agac: agacOlustur(), secim: { tip: "urun", eczane_id: "eczane-b", firma_id: "firma", urun_id: null }, onSecim: s => secimler.push(s) });
  const eczane = gruplar[1].oglar[1], firma = eczane.altOglar![0];
  assert.equal(firma.altOglar, undefined);
  assert.equal(ogeleriAc(gruplar).length, 6);
  for (const oge of [gruplar[0].oglar[0], eczane, firma]) oge.onSecim!();
  assert.deepEqual(secimler, [{ tip: "tum" }, { tip: "eczane", eczane_id: "eczane-b" }, { tip: "firma", eczane_id: "eczane-b", firma_id: "firma" }]);
  assert.deepEqual(ogeleriAc(gruplar).filter(oge => oge.secili), [firma]);
});

test("aynı adlar ve tekrarlanan ürün/yayın kimlikleri ayrı kalır; ad değişimi anahtarları değiştirmez", () => {
  const agac = agacOlustur();
  const onceki = JSON.stringify(agac);
  const hazirla = () => eczanemUyeMenusuOlustur({ agac, secim: { tip: "tum" }, onSecim: () => undefined });
  const ilk = ogeleriAc(hazirla());
  assert.equal(JSON.stringify(agac), onceki, "Kaynak ağaç değiştirilmemeli");
  const anahtarlar = ilk.map(oge => oge.anahtar);
  assert.equal(new Set(anahtarlar).size, anahtarlar.length);
  assert.equal(ilk.some(oge => oge.etiket.includes("Ürün") || oge.etiket.includes("Yayın (")), false);
  agac[0].eczane_adi = "Yeni Eczane Adı";
  agac[0].firmalar[0].urunler[1].urun_adi = "Yeni Ürün Adı";
  assert.deepEqual(ogeleriAc(hazirla()).map(oge => oge.anahtar), anahtarlar);
});

test("içerik kapsamı olmayan sayfalarda yalnız üye bağlantıları vardır; diğer kimliklere açılmaz", () => {
  for (const gruplar of [eczanemUyeMenusuOlustur(), eczanemUyeMenusuOlustur({ agac: [], secim: { tip: "tum" }, onSecim: () => undefined })]) {
    assert.equal(gruplar.length, 1);
    assert.deepEqual(gruplar[0].oglar.map(oge => oge.path), ["/eczanem", "/eczanem/puanlarim"]);
    for (const oge of ogeleriAc(gruplar)) {
      assert.equal(oge.gate(uyeBaglami), true);
      for (const kimlikTuru of ["kullanici", "eclub_kisi", undefined]) assert.equal(oge.gate({ ...uyeBaglami, kimlikTuru }), false);
    }
  }
  assert.equal(eczanemUyeMenusuOlustur()[0].oglar[0].onSecim, undefined, "Diğer sayfalarda Tüm İçerikler adresle çalışmalı");
  assert.equal(eczanemUyeMenusuOlustur()[0].oglar[0].secili, undefined, "Diğer sayfalarda aktiflik mevcut adresle belirlenmeli");
});

test("mobil menü aynı kapsam seçimlerini korur ve üye menüsüne iç kullanıcı grubu eklemez", () => {
  const secimler: EczanemSidebarSecim[] = [];
  const masaustu = eczanemUyeMenusuOlustur({ agac: agacOlustur(), secim: { tip: "tum" }, onSecim: secim => secimler.push(secim) });
  const mobil = mobilPanelNavOlustur(masaustu, uyeBaglami);
  assert.deepEqual(mobil.map(grup => grup.baslik), ["Eczanem", "Eczanelerim"]);
  const onceki = ogeleriAc(masaustu);
  const sonraki = ogeleriAc(mobil);
  assert.equal(sonraki.length, onceki.length);
  for (let index = 0; index < onceki.length; index++) {
    assert.equal(sonraki[index].anahtar, onceki[index].anahtar);
    assert.equal(sonraki[index].onSecim, onceki[index].onSecim);
  }
  sonraki.at(-1)!.onSecim!();
  assert.deepEqual(secimler, [{ tip: "firma", eczane_id: "eczane-b", firma_id: "firma" }]);
});
