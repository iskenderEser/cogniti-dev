import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");
const sql = oku("scripts/sql/ogrenme_araclari_tamamlama_faz7_raporlama.sql");
const raporSql = oku("scripts/sql/get_yayin_raporlari_arac_performansi_v1.sql");
const ortak = oku("lib/rapor/paylasilan/aracTuruDagilimi.ts");
const panel = oku("components/raporlar/OgrenmeAraciPerformansi.tsx");
const uretimApi = oku("app/(panel)/raporlar/api/uretim/route.ts");
const yayinRaporlari = oku("app/(panel)/raporlar/yayin-raporlari/page.tsx");
const digerApiYollari = ["utt", "bm", "tm", "yonetici", "uretici"]
  .map((ad) => oku(`app/(panel)/raporlar/api/${ad}/route.ts`));
const digerSayfaYollari = ["utt", "bm", "tm", "yonetici", "uretici"]
  .map((ad) => oku(`app/(panel)/raporlar/${ad}/page.tsx`));

test("araç bazında dönemsel yayın sayısı dört araç için üretilir", () => {
  assert.match(ortak, /\["video", "podcast", "gorsel", "flip_pdf"\]/);
  assert.match(raporSql, /COUNT\(\*\) FILTER \(WHERE k\.kaynak = 'yayin'\)/);
  assert.match(raporSql, /y\.yayin_tarihi >= p_baslangic\s+AND y\.yayin_tarihi < p_bitis/);
});

test("davranış metrikleri yayın tarihi yerine olay tarihiyle dönemlenir", () => {
  assert.match(sql, /o\.olay_tarihi/);
  assert.match(raporSql, /o\.olay_tarihi >= p_baslangic\s+AND o\.olay_tarihi < p_bitis/);
});

test("başlatma ve tamamlama UTT, BM, E-Club rolleri ve müşteri için ayrılır", () => {
  for (const tablo of ["izleme_kayitlari", "cc_izleme_kayitlari", "eclub_izleme_kayitlari", "eczanem_izleme_kayitlari"]) assert.match(sql, new RegExp(`FROM public\\.${tablo}`));
  assert.match(ortak, /Record<string, RolMetrigi>/);
  assert.match(raporSql, /GROUP BY GROUPING SETS/);
});

test("doğru ve yanlış cevaplar dört tüketim kanalından okunur", () => {
  for (const tablo of ["soru_cevaplari", "cc_yanlis_cevap_kayitlari", "eclub_dogru_cevap_kayitlari", "eclub_yanlis_cevap_kayitlari", "eczanem_cevap_kayitlari"]) assert.match(sql, new RegExp(`public\\.${tablo}`));
  assert.match(sql, /p\.puan_turu='cevaplama'/);
});

test("Eczanem cevap ayrıntısı mevcut atomik RPC içinde kalıcılaştırılır", () => {
  assert.match(sql, /eczanem_cevaplari_kaydet_cekirdek/);
  assert.match(sql, /INSERT INTO public\.eczanem_cevap_kayitlari/);
  assert.match(sql, /UNIQUE \(izleme_id, soru_index\)/);
  assert.match(sql, /ON CONFLICT \(izleme_id,soru_index\) DO NOTHING/);
});

test("cevap bulunmadığında başarı yüzdesi sıfır yerine null olur", () => {
  assert.match(raporSql, /= 0 THEN NULL::numeric/);
  assert.match(panel, /deger === null \? "—"/);
});

test("kayıtlı araç puanı gerçek kazanım ve kayıptan ayrı tutulur", () => {
  assert.match(ortak, /kayitli_arac_puani/);
  assert.match(raporSql, /COALESCE\(g\.kazanilan_puan, 0\) - COALESCE\(g\.kaybedilen_puan, 0\)/);
  assert.doesNotMatch(panel, /satir\.kayitli_arac_puani/);
  assert.match(panel, /satir\.potansiyel_puan/);
  assert.match(panel, /satir\.net_kazanilan_puan/);
});

test("öneri ve challenge gönderim ile tamamlanma performansı raporlanır", () => {
  for (const olay of ["oneri_gonderildi", "oneri_tamamlandi", "challenge_gonderildi", "challenge_tamamlandi"]) {
    assert.match(sql, new RegExp(olay)); assert.match(ortak, new RegExp(olay));
  }
});

test("E-Club ve Eczanem dağıtımı gönderim ve tamamlanma olarak ayrılır", () => {
  for (const olay of ["eclub_dagitim", "eclub_dagitim_tamamlandi", "eczanem_dagitim", "eczanem_dagitim_tamamlandi"]) {
    assert.match(sql, new RegExp(olay)); assert.match(ortak, new RegExp(olay));
  }
});

test("aynı eğitim ailesindeki yayınlar yayin_id ile ayrı, talep_id ile izlenebilir kalır", () => {
  assert.match(sql, /ky\.talep_id,ky\.talep_no/);
  assert.match(raporSql, /GROUP BY k\.yayin_id/);
  assert.match(raporSql, /MIN\(k\.talep_id::text\)::uuid AS talep_id/);
  assert.match(panel, /key=\{y\.yayin_id\}/);
});

test("öğrenme aracı performansı yalnız üretici Yayın Raporlarında kullanılır", () => {
  assert.match(uretimApi, /aracTuruDagilimi/);
  assert.match(uretimApi, /arac_turu_dagilimi/);
  assert.match(yayinRaporlari, /OgrenmeAraciPerformansi/);

  for (const api of digerApiYollari) {
    assert.doesNotMatch(api, /aracTuruDagilimi|arac_turu_dagilimi/);
  }
  for (const sayfa of digerSayfaYollari) {
    assert.doesNotMatch(sayfa, /OgrenmeAraciPerformansi/);
  }
});
