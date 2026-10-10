import test from "node:test";
import assert from "node:assert/strict";
import { eclubFirmaKapsami, eclubUrunGruplari } from "@/lib/eclub/firmaGezinme";
import { icerikUret } from "@/lib/push/icerik";

test("bir firmanın açık mağazası diğer firmanın çek erişimini açmaz", () => {
  const firmalar = [
    { firma_id: "a", aktif: true, eclub_aktif: true, eclub_store_aktif: true },
    { firma_id: "b", aktif: true, eclub_aktif: true, eclub_store_aktif: false },
    { firma_id: "c", aktif: true, eclub_aktif: false, eclub_store_aktif: true },
    { firma_id: "d", aktif: false, eclub_aktif: true, eclub_store_aktif: true },
  ];
  assert.deepEqual(eclubFirmaKapsami(firmalar, "b", true), []);
  assert.deepEqual(eclubFirmaKapsami(firmalar, "b").map((f) => f.firma_id), ["b"]);
  assert.deepEqual(eclubFirmaKapsami(firmalar, null, true).map((f) => f.firma_id), ["a"]);
  assert.deepEqual(eclubFirmaKapsami(firmalar, "yabanci", true), []);
});

test("aynı ürünün yayınları korunur, farklı firmaların ürünleri birleşmez", () => {
  const yayinlar = [
    { firma_id: "a", firma_adi: "A", urun_id: "u", urun_adi: "Ürün", yayin_id: "1", puan: 100 },
    { firma_id: "a", firma_adi: "A", urun_id: "u", urun_adi: "Ürün", yayin_id: "2", puan: 500 },
    { firma_id: "b", firma_adi: "B", urun_id: "u", urun_adi: "Ürün", yayin_id: "3", puan: 300 },
  ];
  const gruplar = eclubUrunGruplari(yayinlar);
  assert.equal(gruplar.length, 2);
  assert.deepEqual(gruplar[0].yayinlar, yayinlar.slice(0, 2));
  assert.deepEqual(gruplar[1].yayinlar, yayinlar.slice(2));
  assert.deepEqual(eclubUrunGruplari([]), []);
});

test("yayın ve çek push bağlantıları ilgili firmanın sayfasına gider", () => {
  for (const rol of ["eczaci", "ikinci_eczaci", "yardimci_eczaci", "eczane_teknisyeni"]) {
    assert.equal(icerikUret("eclub_oneri", rol, { firmaId: "a", bagId: "oneri-1" })?.url,
      "/eclub/firma/a/yayinlar?oneri_id=oneri-1");
    assert.equal(icerikUret("eclub_cek_teslim", rol, { firmaId: "b", bagId: "talep-1" })?.url,
      "/eclub/firma/b/cek-talepleri?talep_id=talep-1");
  }
});


test("ürün seçimi üç firma yüzeyinde korunur; geçersiz ürün ilk ürüne döner", async () => {
  const { eclubSeciliUrun, eclubUrunYolu, eclubUrunIcerigi } = await import("@/lib/eclub/firmaGezinme");
  const urunler = [{ urun_id: "u1", urun_adi: "Birinci" }, { urun_id: "u2", urun_adi: "İkinci" }];
  assert.equal(eclubSeciliUrun(urunler, "u2")?.urun_id, "u2");
  assert.equal(eclubSeciliUrun(urunler, "yabanci")?.urun_id, "u1");
  assert.equal(eclubSeciliUrun([], "u2"), null);
  for (const sayfa of ["yayinlar", "hediye-cekleri", "cek-talepleri"] as const) {
    assert.equal(eclubUrunYolu("f1", sayfa, "u2"), `/eclub/firma/f1/${sayfa}?urun_id=u2`);
  }
  const kayitlar = [{ urun_id: "u1", puan: 100 }, { urun_id: "u2", puan: 300 }, { urun_id: "u2", puan: 500 }, { urun_id: null, puan: 90 }];
  assert.deepEqual(eclubUrunIcerigi(kayitlar, "u2"), [kayitlar[1], kayitlar[2]]);
  assert.deepEqual(eclubUrunIcerigi(kayitlar, null), []);
});
