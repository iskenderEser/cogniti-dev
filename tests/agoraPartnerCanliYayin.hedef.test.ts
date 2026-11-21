import test from "node:test";
import assert from "node:assert/strict";
import {
  CANLI_YAYIN_KAPASITELERI,
  CANLI_YAYIN_SAATLERI,
  CANLI_YAYIN_SURELERI,
  canliHakedisOzetiHesapla,
  canliIlkMusaitSaatiSec,
  canliOturumTamponCakisiyorMu,
  canliSaatSecenekleriniHesapla,
  partnerCanliEgitimDogrula,
} from "../lib/agora/partnerCanliYayin";
import { partnerKomisyonOraniGecerli } from "../lib/agora/komisyon";

test("Süre ve kapasite kademeleri beklenen değerlerdedir", () => {
  assert.deepEqual([...CANLI_YAYIN_SURELERI], [45, 60, 120, 180]);
  assert.deepEqual([...CANLI_YAYIN_KAPASITELERI], [15, 20, 25, 30, 40, 50]);
});

test("%15 komisyon ve net hak ediş doğru hesaplanır", () => {
  const ozet = canliHakedisOzetiHesapla(5000);
  assert.equal(ozet.fiyatTl, 5000);
  assert.equal(ozet.hizmetBedeliTl, 750);
  assert.equal(ozet.netHakedisTl, 4250);
});

test("30 dakikalık ara tampon kuralı çakışmaları yakalar ve tam sınırda izin verir", () => {
  const bas10 = Date.parse("2026-11-25T10:00:00+03:00");
  const mevcut = [{ baslangicMs: bas10, sureDakika: 120 }];

  assert.equal(
    canliOturumTamponCakisiyorMu({ baslangicMs: Date.parse("2026-11-25T12:00:00+03:00"), sureDakika: 45 }, mevcut),
    true,
  );
  assert.equal(
    canliOturumTamponCakisiyorMu({ baslangicMs: Date.parse("2026-11-25T12:29:00+03:00"), sureDakika: 45 }, mevcut),
    true,
  );
  assert.equal(
    canliOturumTamponCakisiyorMu({ baslangicMs: Date.parse("2026-11-25T12:30:00+03:00"), sureDakika: 45 }, mevcut),
    false,
  );
  assert.equal(
    canliOturumTamponCakisiyorMu({ baslangicMs: Date.parse("2026-11-25T08:46:00+03:00"), sureDakika: 45 }, mevcut),
    true,
  );
  assert.equal(
    canliOturumTamponCakisiyorMu({ baslangicMs: Date.parse("2026-11-25T08:45:00+03:00"), sureDakika: 45 }, mevcut),
    false,
  );
});

test("Geçersiz fiyat reddedilir, geçerli canlı eğitim formu onaylanır", () => {
  const temel = {
    egitim_adi: "Eczanede Etkili İletişim",
    kategori: "urun_egitimi",
    hedef_roller: ["eczaci", "utt"],
    aciklama: "Canlı yayın açıklaması",
    sure_dakika: 60,
    kapasite: 25,
  };

  const sifir = partnerCanliEgitimDogrula({ ...temel, fiyat_tl: "0" });
  assert.equal(sifir.ok, false);

  const gecerli = partnerCanliEgitimDogrula({ ...temel, fiyat_tl: "5000" });
  assert.equal(gecerli.ok, true);
  if (gecerli.ok) {
    assert.equal(gecerli.ozet.netHakedisTl, 4250);
  }
});

test("15 dakikalık sabit saatler geçmiş ve 30 dk ara süre çakışmalarını engeller", () => {
  assert.equal(CANLI_YAYIN_SAATLERI.length, 96);
  assert.equal(CANLI_YAYIN_SAATLERI[0], "00:00");
  assert.equal(CANLI_YAYIN_SAATLERI[95], "23:45");

  const simdi = Date.parse("2026-11-24T09:10:00+03:00");
  const mevcut = [{ baslangicMs: Date.parse("2026-11-24T10:30:00+03:00"), sureDakika: 45 }];
  const secenekler = canliSaatSecenekleriniHesapla("2026-11-24", 45, mevcut, simdi);

  const bul = (saat: string) => secenekler.find((s) => s.saat === saat)!;
  assert.equal(bul("09:00").gecmis, true);
  assert.equal(bul("09:00").musait, false);
  assert.equal(bul("09:15").musait, true); // 09:15 + 45 + 30 = 10:30
  assert.equal(bul("09:30").cakisiyor, true); // 09:30 + 45 + 30 = 10:45 > 10:30
  assert.equal(bul("11:30").cakisiyor, true); // 10:30 + 45 + 30 = 11:45
  assert.equal(bul("11:45").musait, true);

  assert.equal(canliIlkMusaitSaatiSec(secenekler, "10:30"), "11:45");
});

test("Dinamik partner komisyon oranı doğrulaması ve hesaplaması tüm oranlarda doğru çalışır", () => {
  for (const gecerli of [0.01, 1, 12.5, 15, 20, 99.99]) {
    assert.equal(partnerKomisyonOraniGecerli(gecerli), true);
  }
  for (const gecersiz of [0, -5, 100, 120, 12.345, Number.NaN, Number.POSITIVE_INFINITY, "15", null]) {
    assert.equal(partnerKomisyonOraniGecerli(gecersiz), false);
  }

  const ozet20 = canliHakedisOzetiHesapla(5000, 20);
  assert.equal(ozet20.komisyonOrani, 20);
  assert.equal(ozet20.hizmetBedeliTl, 1000);
  assert.equal(ozet20.netHakedisTl, 4000);

  const ozet125 = canliHakedisOzetiHesapla(1000, 12.5);
  assert.equal(ozet125.komisyonOrani, 12.5);
  assert.equal(ozet125.hizmetBedeliTl, 125);
  assert.equal(ozet125.netHakedisTl, 875);

  const form20 = partnerCanliEgitimDogrula(
    {
      egitim_adi: "Dinamik Komisyon Testi",
      kategori: "urun_egitimi",
      hedef_roller: ["eczaci"],
      aciklama: "Açıklama",
      sure_dakika: 60,
      kapasite: 25,
      fiyat_tl: "5000",
    },
    20,
  );
  assert.equal(form20.ok, true);
  if (form20.ok) {
    assert.equal(form20.ozet.komisyonOrani, 20);
    assert.equal(form20.ozet.hizmetBedeliTl, 1000);
    assert.equal(form20.ozet.netHakedisTl, 4000);
  }
});
