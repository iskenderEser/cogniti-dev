import test from "node:test";
import assert from "node:assert/strict";

import {
  ECLUB_GONDERI_AYARLARI,
  eclubGonderiAyariMi,
  eclubGonderiAyariVarsayilani,
  eclubGonderiAyariDegeriGecerliMi,
  ECLUB_EMEKLI_GONDERI_ANAHTARLARI,
} from "@/lib/eclub/gonderiAyarlari";
import { ayniYayinTekrarAcikZamani, oneriBitisHesapla } from "@/lib/eclub/oneriLimit";

test("E-Club tamamlama süresi 15 gündür; video tekrar ayarı kullanım dışıdır", () => {
  assert.equal(ECLUB_GONDERI_AYARLARI.length, 1);
  assert.equal(eclubGonderiAyariVarsayilani("eclub_oneri_gecerlilik_gun"), 15);
  assert.equal(eclubGonderiAyariMi("eclub_ayni_video_tekrar_bekleme_gun"), false);
  assert.equal(ECLUB_EMEKLI_GONDERI_ANAHTARLARI.has("eclub_ayni_video_tekrar_bekleme_gun"), true);
  for (const ayar of ECLUB_GONDERI_AYARLARI) {
    assert.equal(eclubGonderiAyariMi(ayar.anahtar), true);
    assert.equal(Number.isInteger(ayar.varsayilan), true);
    assert.ok(eclubGonderiAyariVarsayilani(ayar.anahtar) > 0);
  }
});

test("yeniden gönderim aralığı başlangıçtan 15 gündür; tamamlama süresi eklenmez", () => {
  const baslangic = new Date("2026-08-14T12:00:00.000Z");
  assert.equal(ayniYayinTekrarAcikZamani(baslangic).toISOString(), "2026-08-29T12:00:00.000Z");
  assert.equal(oneriBitisHesapla(baslangic).getTime(), ayniYayinTekrarAcikZamani(baslangic).getTime());
});

test("eski çağrının 7 veya 21 gün değeri yeni gönderimin süresini değiştiremez", () => {
  const simdi = new Date("2026-08-14T12:00:00.000Z");
  for (const eskiDeger of [7, 21, 0, -1, Number.NaN]) {
    assert.equal(oneriBitisHesapla(simdi, eskiDeger).toISOString(), "2026-08-29T12:00:00.000Z");
  }
});

test("admin değer doğrulaması eski süreleri ve yanlış JSON türlerini reddeder", () => {
  assert.equal(eclubGonderiAyariDegeriGecerliMi("eclub_oneri_gecerlilik_gun", 15), true);
  for (const deger of [7, 21, 15.5, "15", [15], null, true]) {
    assert.equal(eclubGonderiAyariDegeriGecerliMi("eclub_oneri_gecerlilik_gun", deger), false);
  }
  assert.equal(eclubGonderiAyariDegeriGecerliMi("eclub_ayni_video_tekrar_bekleme_gun", 15), false);
});

test("tamamlama süresi yıl geçişini ve hafta sonunu kesmeden 15 gün ilerler", () => {
  const baslangic = new Date("2026-12-25T23:59:59+03:00");
  const beklenen = new Date("2027-01-09T23:59:59+03:00").getTime();
  assert.equal(oneriBitisHesapla(baslangic).getTime(), beklenen);
  assert.equal(ayniYayinTekrarAcikZamani(baslangic).getTime(), beklenen);
});
