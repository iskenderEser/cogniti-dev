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
  AGORA_GOREN_ROLLER,
  URETICI_ROLLER,
  TUKETICI_ROLLER,
} from "@/lib/utils/roller";
import { tmRaporKapsami } from "@/lib/rapor/tm/getTmDavranis";
import { TemsilciKapsamHatasi } from "@/lib/rapor/bm/getBmDavranis";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");

test("SENARYO-TM-01: TM öneri gönderemez (POST /oneriler/api yalnız BM'ye açıktır)", () => {
  const oneriApi = oku("app/(panel)/oneriler/api/route.ts");
  assert.match(oneriApi, /if \(rol !== "bm"\) return rolHatasi\("Sadece bm öneri oluşturabilir\."\);/);

  assert.equal(YONLENDIRICI_ROLLER.includes("tm"), true, "tm YONLENDIRICI_ROLLER içinde olmalıdır");
  assert.notEqual("tm", "bm", "tm ve bm farklı rollerdir");
});

test("SENARYO-TM-02: TM raporunda başka takımın BM veya UTT'si sorgulanamaz (TemsilciKapsamHatasi)", () => {
  const kisiler = [
    { kullanici_id: "bm-1", ad: "Ahmet", soyad: "Yılmaz", rol: "bm", bolge_id: "bolge-1" },
    { kullanici_id: "utt-1", ad: "Mehmet", soyad: "Kaya", rol: "utt", bolge_id: "bolge-1" },
  ];

  // Kendi takımındaki BM seçilebilir
  const kapsamGecerli = tmRaporKapsami(kisiler, "bm-1", "");
  assert.equal(kapsamGecerli.bm?.kullanici_id, "bm-1");

  // Takım dışı BM seçildiğinde hata verir
  assert.throws(
    () => tmRaporKapsami(kisiler, "baska-takim-bm", ""),
    (err: unknown) => err instanceof TemsilciKapsamHatasi && err.message === "Bu bölge müdürünün raporuna erişim yetkiniz yok."
  );

  // Takım dışı UTT seçildiğinde hata verir
  assert.throws(
    () => tmRaporKapsami(kisiler, "bm-1", "baska-utt"),
    (err: unknown) => err instanceof TemsilciKapsamHatasi && err.message === "Bu temsilcinin raporuna erişim yetkiniz yok."
  );
});

test("SENARYO-TM-03: TM takımındaki iki farklı BM'yi yan yana karşılaştırabilir", () => {
  const tmRaporApi = oku("app/(panel)/raporlar/api/tm/route.ts");
  assert.match(tmRaporApi, /if \(ikinciBmId && \(!bmId \|\| bmId === ikinciBmId \|\| params\.get\('temsilci'\)\)\)/);
  assert.match(tmRaporApi, /return validasyonHatasi\('İki farklı bölge müdürü seçiniz\.', \['bm', 'karsilastir'\]\);/);

  const getTmDavranisKodu = oku("lib/rapor/tm/getTmDavranis.ts");
  assert.match(getTmDavranisKodu, /if \(!ilkBmId \|\| !ikinciBmId \|\| ilkBmId === ikinciBmId\) throw new TemsilciKapsamHatasi\('Karşılaştırmak için iki farklı bölge müdürü seçiniz\.'\);/);
});

test("SENARYO-TM-04: TM Eczanem mutabakatında nihai onaylayıcıdır", () => {
  const mutabakatDosyasi = oku("lib/eczanem/uttMutabakat.ts");
  assert.match(mutabakatDosyasi, /export async function tmMutabakatKarariVer\(/);
  assert.match(mutabakatDosyasi, /"eczanem_mutabakat_tm_karar_ver"/);
  assert.match(mutabakatDosyasi, /export const tmMutabakatiOnayla = \(db: SupabaseClient, tmId: string, mutabakatId: string\) =>/);
  assert.match(mutabakatDosyasi, /mutabakatOnayIslemi\(db, "eczanem_mutabakat_tm_onayla", "p_tm_id", tmId, mutabakatId\);/);
});

test("SENARYO-TM-05: TM C-Club challenge gönderemez (yalnız BM'ler arasıdır)", () => {
  const aliciDosyasi = oku("lib/cclub/uygunAliciListesi.ts");
  assert.match(aliciDosyasi, /\.eq\("rol", "bm"\)/);
  assert.doesNotMatch(aliciDosyasi, /\.eq\("rol", "tm"\)/);
});

test("SENARYO-TM-06: TM FirmaStore mağazasından sipariş veremez (puan harcayamaz)", () => {
  assert.equal(STORE_ALABILEN_ROLLER.includes("tm"), false, "TM FirmaStore'dan alışveriş yapamamalıdır");
});

test("SENARYO-TM-07: TM takımındaki personelin mağaza siparişlerini izleyebilir", () => {
  assert.equal(STORE_GENEL_GOREN_ROLLER.includes("tm"), true, "TM ekip mağaza siparişlerini izleyebilmelidir");
});

test("SENARYO-TM-08: TM Agora vitrinini görüntüleme yetkisine sahiptir", () => {
  assert.equal(AGORA_GOREN_ROLLER.includes("tm"), true, "TM Agora vitrinini görebilmelidir");
});

test("SENARYO-TM-09: TM içerik üreticisi değildir (talepler ve yayin-yonetimi kapalıdır)", () => {
  assert.equal(uretciMi("tm"), false, "TM üretici olmamalıdır");
  assert.equal(URETICI_ROLLER.includes("tm"), false, "TM URETICI_ROLLER içinde olmamalıdır");

  const baslangic = panelBaslangici("tm");
  assert.equal(baslangic.yol, "/ana-sayfa", "TM başlangıç rotası /ana-sayfa olmalıdır");
});

test("SENARYO-TM-10: TM token paketi satın alamaz (bakiye türü null)", () => {
  assert.equal(esnekPaketBakiyeTuru("tm"), null, "TM için token satın alma kapalı olmalıdır");
});
