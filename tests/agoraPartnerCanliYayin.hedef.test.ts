import test from "node:test";
import assert from "node:assert/strict";
import {
  CANLI_YAYIN_KAPASITELERI,
  CANLI_YAYIN_SURELERI,
  canliHakedisOzetiHesapla,
  canliOturumTamponCakisiyorMu,
  partnerCanliEgitimDogrula,
} from "../lib/agora/partnerCanliYayin";

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
