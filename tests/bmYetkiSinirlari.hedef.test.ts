import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { panelBaslangici } from "@/lib/panel/baslangic";
import { uretciMi } from "@/lib/uretici/yetenekler";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import {
  YONLENDIRICI_ROLLER,
  STORE_ALABILEN_ROLLER,
  STORE_GENEL_GOREN_ROLLER,
  URETICI_ROLLER,
  TUKETICI_ROLLER,
  CCLIGI_GORENLERLER,
} from "@/lib/utils/roller";
import {
  MAKS_ALICI_HAFTA,
  AYLIK_KOTA_KATSAYI,
} from "@/lib/tclub/oneri/limitKontrol";
import { oneriTarihKurali } from "@/lib/tclub/oneri/tarihKurali";
import { AYLIK_MAX_GONDERIM } from "@/lib/cclub/sabitler";
import { TemsilciKapsamHatasi } from "@/lib/rapor/bm/getBmDavranis";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");

test("SENARYO-BM-01: BM tek yetkili öneri oluşturucudur (rol !== bm 403 engeli)", () => {
  const oneriApi = oku("app/(panel)/oneriler/api/route.ts");
  assert.match(oneriApi, /if \(rol !== "bm"\) return rolHatasi\("Sadece bm öneri oluşturabilir\."\);/);

  assert.equal(YONLENDIRICI_ROLLER.includes("bm"), true, "bm YONLENDIRICI_ROLLER içinde olmalıdır");
  for (const rol of [...URETICI_ROLLER, ...TUKETICI_ROLLER, "admin"]) {
    assert.notEqual(rol, "bm", `${rol} bm rolü olmamalıdır`);
  }
});

test("SENARYO-BM-02: BM yalnızca kendi bölgesi ve firmasındaki aktif UTT'lere öneri gönderebilir", () => {
  const oneriApi = oku("app/(panel)/oneriler/api/route.ts");
  assert.match(oneriApi, /\.select\("bolge_id, firma_id, takim_id"\)/);
  assert.match(oneriApi, /\.eq\("bolge_id", bm\.bolge_id\)/);
  assert.match(oneriApi, /\.eq\("firma_id", bm\.firma_id\)/);
  assert.match(oneriApi, /return isKuraluHatasi\("Yalnızca kendi bölgenizdeki aktif UTT\/KD_UTT kullanıcılarına öneri gönderebilirsiniz\."\);/);
});

test("SENARYO-BM-03: Alıcı UTT başına haftalık maksimum öneri sınırı 3'tür", () => {
  assert.equal(MAKS_ALICI_HAFTA, 3, "MAKS_ALICI_HAFTA değeri 3 olmalıdır");
  const limitDosyasi = oku("lib/tclub/oneri/limitKontrol.ts");
  assert.match(limitDosyasi, /if \(mevcut \+ istenen > MAKS_ALICI_HAFTA\)/);
});

test("SENARYO-BM-04: Aylık BM öneri kotası bölgedeki aktif UTT sayısı × 12 adettir", () => {
  assert.equal(AYLIK_KOTA_KATSAYI, 12, "AYLIK_KOTA_KATSAYI değeri 12 olmalıdır");
  const limitDosyasi = oku("lib/tclub/oneri/limitKontrol.ts");
  assert.match(limitDosyasi, /const kota = utt_sayisi_kesin \* AYLIK_KOTA_KATSAYI;/);
  assert.match(limitDosyasi, /geciyor: mevcut_kesin \+ istek_sayisi <= kota/);
});

test("SENARYO-BM-05: Öneri başlangıcı en erken yarın, bitişi en az 1 gün sonra olmalıdır", () => {
  const bugun = "2026-11-14";

  // Bugün başlayan öneri reddedilir
  const ayniGun = oneriTarihKurali("2026-11-14", "2026-11-16", bugun);
  assert.equal(ayniGun.gecerli, false);
  assert.equal(ayniGun.sebep, "gecmis_tarih");

  // Geçmiş tarih reddedilir
  const gecmis = oneriTarihKurali("2026-11-10", "2026-11-16", bugun);
  assert.equal(gecmis.gecerli, false);
  assert.equal(gecmis.sebep, "gecmis_tarih");

  // Aynı gün başlayan ve biten öneri reddedilir
  const ayniGunBiten = oneriTarihKurali("2026-11-15", "2026-11-15", bugun);
  assert.equal(ayniGunBiten.gecerli, false);
  assert.equal(ayniGunBiten.sebep, "yanlis_sira");

  // Yarın başlayıp en az 1 gün sonra biten öneri kabul edilir
  const gecerli = oneriTarihKurali("2026-11-15", "2026-11-20", bugun);
  assert.equal(gecerli.gecerli, true);
  if (gecerli.gecerli) {
    assert.match(gecerli.baslangic_timestamp, /^2026-11-15T07:00:00\+03:00$/);
    assert.match(gecerli.bitis_timestamp, /^2026-11-20T20:30:00\+03:00$/);
  }
});

test("SENARYO-BM-06: C-Club aylık maksimum meydan okuma sayısı 3'tür", () => {
  assert.equal(AYLIK_MAX_GONDERIM, 3, "Bir BM ayda en fazla 3 challenge gönderebilir");
  const cclubSabitler = oku("lib/cclub/sabitler.ts");
  assert.match(cclubSabitler, /export const AYLIK_MAX_GONDERIM = 3;/);
});

test("SENARYO-BM-07: Challenge alıcısı yalnızca aynı firmadaki diğer aktif Bölge Müdürleri olabilir", () => {
  const aliciDosyasi = oku("lib/cclub/uygunAliciListesi.ts");
  assert.match(aliciDosyasi, /\.eq\("rol", "bm"\)/);
  assert.match(aliciDosyasi, /\.eq\("aktif_mi", true\)/);
  assert.match(aliciDosyasi, /\.eq\("firma_id", gonderenFirmaId\)/);
  assert.match(aliciDosyasi, /\.neq\("kullanici_id", gonderenId\)/);
});

test("SENARYO-BM-08: Bölge raporunda başka bölgenin temsilcisi sorgulanamaz (TemsilciKapsamHatasi)", () => {
  const hata = new TemsilciKapsamHatasi("Bu temsilcinin raporuna erişim yetkiniz yok.");
  assert.equal(hata.message, "Bu temsilcinin raporuna erişim yetkiniz yok.");

  const bmRaporApi = oku("app/(panel)/raporlar/api/bm/route.ts");
  assert.match(bmRaporApi, /if \(error instanceof TemsilciKapsamHatasi\) return yetkiHatasi\(error\.message\);/);
});

test("SENARYO-BM-09: BM içerik üreticisi değildir (talepler ve yayin-yonetimi kapalıdır)", () => {
  assert.equal(uretciMi("bm"), false, "BM üretici olmamalıdır");
  assert.equal(URETICI_ROLLER.includes("bm"), false, "BM URETICI_ROLLER içinde olmamalıdır");

  const baslangic = panelBaslangici("bm");
  assert.equal(baslangic.yol, "/ana-sayfa", "BM girişinde /ana-sayfa'ya yönlenmelidir");
});

test("SENARYO-BM-10: BM puan harcayabilir ancak token paketi satın alamaz", () => {
  assert.equal(STORE_ALABILEN_ROLLER.includes("bm"), true, "BM FirmaStore'dan alışveriş yapabilmelidir");
  assert.equal(STORE_GENEL_GOREN_ROLLER.includes("bm"), true, "BM ekip mağaza siparişlerini görebilmelidir");
  assert.equal(esnekPaketBakiyeTuru("bm"), null, "BM için token bakiye türü null olmalıdır");
});
