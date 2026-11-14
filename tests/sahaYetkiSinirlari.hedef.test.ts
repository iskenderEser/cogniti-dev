import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { panelBaslangici } from "@/lib/panel/baslangic";
import { uretciMi } from "@/lib/uretici/yetenekler";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import { tuketiciMi } from "@/lib/video/gorunurluk";
import {
  TUKETICI_ROLLER,
  STORE_ALABILEN_ROLLER,
  URETICI_ROLLER,
} from "@/lib/utils/roller";
import { CEK_TAKIP_ROLLERI } from "@/lib/eclub/hediyeTakip/cekTakipErisim";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");

test("SENARYO-SAHA-01: utt ve kd_utt içerik talebi açamaz (uretciMi = false)", () => {
  for (const rol of TUKETICI_ROLLER) {
    assert.equal(uretciMi(rol), false, `${rol} üretici rolü olmamalıdır`);
    assert.equal(URETICI_ROLLER.includes(rol), false, `${rol} URETICI_ROLLER içinde olmamalıdır`);
  }

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /const yetenek = ureticiYetenegi\(rol\);/);
  assert.match(talepApi, /if \(!yetenek\) return rolHatasi\("Sadece üretici roller talep oluşturabilir\."\);/);
});

test("SENARYO-SAHA-02: utt ve kd_utt içerik yayına alma işlemi yapamaz", () => {
  const yayinlarApi = oku("app/(panel)/yayin-yonetimi/api/yayinlar/route.ts");
  assert.match(yayinlarApi, /if \(!URETICI_ROLLER\.includes\(rol\)\)/);
});

test("SENARYO-SAHA-03: utt ve kd_utt Eczanem indirimli gönderiminde tek yetkilidir", () => {
  const eczanemGonderimApi = oku("app/eczanem/yayinlar/api/route.ts");
  assert.match(eczanemGonderimApi, /if \(!TUKETICI_ROLLER\.includes\(rol\)\) return rolHatasi\("Sadece UTT gönderim yapabilir\."\);/);

  for (const rol of TUKETICI_ROLLER) {
    assert.equal(TUKETICI_ROLLER.includes(rol), true, `${rol} gönderim yetkisine sahip olmalıdır`);
  }

  const digerRoller = ["pm", "med_md", "egt_md", "ik_md", "bm", "tm", "admin"];
  for (const rol of digerRoller) {
    assert.equal(TUKETICI_ROLLER.includes(rol), false, `${rol} Eczanem yayını gönderememelidir`);
  }
});

test("SENARYO-SAHA-04: utt ve kd_utt tam tüketici akışına sahiptir (tuketiciMi = true)", () => {
  for (const rol of TUKETICI_ROLLER) {
    assert.equal(tuketiciMi(rol), true, `${rol} tüketici akışına (puan/soru/beğeni/favori) sahip olmalıdır`);
  }

  const ureticiler = ["pm", "med_md", "egt_md", "ik_md"];
  for (const rol of ureticiler) {
    assert.equal(tuketiciMi(rol), false, `${rol} tüketici akışına sahip olmamalıdır`);
  }
});

test("SENARYO-SAHA-05: ileri sarma yapıldığında tamamlama puanı düşürülür ve soru hakkı kapatılır", () => {
  const ileriSarmaApi = oku("app/izle/api/ileri-sarma/route.ts");
  assert.match(ileriSarmaApi, /if \(!TUKETICI_ROLLER\.includes\(rol\)\) return rolHatasi\("Sadece utt ve kd_utt izleyebilir\."\);/);
  assert.match(ileriSarmaApi, /ileriSarmaKaybiHesapla/);
  assert.match(ileriSarmaApi, /ileriSarmaKaybiKaydet/);

  const ileriSarmaSql = oku("scripts/sql/eclub_ileri_sarma_kurali.sql");
  assert.match(ileriSarmaSql, /Bir kez ileri sarılan izlemeye soru hakkı verilmez/);
});

test("SENARYO-SAHA-06: utt ve kd_utt E-Club hediye çeki takibi yapabilir (CEK_TAKIP_ROLLERI)", () => {
  for (const rol of TUKETICI_ROLLER) {
    assert.equal(
      CEK_TAKIP_ROLLERI.includes(rol as never),
      true,
      `${rol} CEK_TAKIP_ROLLERI içinde yer almalıdır`
    );
  }
});

test("SENARYO-SAHA-07: utt ve kd_utt E-Club depo tercihlerini yönetebilir", () => {
  const depoErisim = oku("lib/eclub/depoErisim.ts");
  assert.match(depoErisim, /const DEPO_YONETIM_ROLLERI = \[\.\.\.TUKETICI_ROLLER, \.\.\.YONLENDIRICI_ROLLER\];/);
});

test("SENARYO-SAHA-08: utt ve kd_utt FirmaStore mağazasından puanıyla sipariş verebilir", () => {
  for (const rol of TUKETICI_ROLLER) {
    assert.equal(
      STORE_ALABILEN_ROLLER.includes(rol),
      true,
      `${rol} STORE_ALABILEN_ROLLER içinde yer almalıdır`
    );
  }

  const storeSiparisApi = oku("app/(panel)/store/api/siparis/route.ts");
  assert.match(storeSiparisApi, /if \(!STORE_ALABILEN_ROLLER\.includes\(rol\)\)/);
});

test("SENARYO-SAHA-09: utt ve kd_utt token satın alamaz (esnekPaketBakiyeTuru = null)", () => {
  for (const rol of TUKETICI_ROLLER) {
    assert.equal(
      esnekPaketBakiyeTuru(rol),
      null,
      `${rol} esnek token paketi satın alamamalıdır`
    );
  }
});

test("SENARYO-SAHA-10: panelBaslangici başlangıç rotası olarak /ana-sayfa döndürür", () => {
  for (const rol of TUKETICI_ROLLER) {
    assert.deepEqual(
      panelBaslangici(rol),
      { yol: "/ana-sayfa", etiket: "Ana Sayfa" },
      `${rol} için başlangıç rotası /ana-sayfa olmalıdır`
    );
  }
});
