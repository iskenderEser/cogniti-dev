import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { urunFirmayaAitMi } from "@/lib/uretici/talepKaynakSahipligi";
import { ureticiUrunListeKapsami } from "@/lib/uretici/urunKapsami";
import { URETICI_YETENEKLERI, TALEP_TURU_KURALLARI } from "@/lib/uretici/yetenekler";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import { STORE_ALABILEN_ROLLER, ECZANEM_TALEP_ACAN_ROLLER } from "@/lib/utils/roller";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");

test("SENARYO-MED-01: med_md yalnız medikal_egitim ve urun_medikal_egitim açabilir; diğer türler engellenir", () => {
  const yetenek = URETICI_YETENEKLERI["med_md"];
  assert.ok(yetenek, "med_md yetenek tanımı bulunmalıdır");
  assert.equal(yetenek.takimZorunlu, false, "med_md için takım zorunlu olmamalıdır (firma seviyesi)");
  assert.equal(yetenek.raporScope, "firma", "med_md rapor kapsamı firma düzeyinde olmalıdır");
  assert.deepEqual(
    yetenek.acabilecegiTalepTurleri,
    ["medikal_egitim", "urun_medikal_egitim"],
    "med_md yalnızca iki medikal eğitim türünü açabilmelidir"
  );

  const engellenenTurler = ["urun_egitimi", "satis_teknikleri", "ik_egitimi", "yonetim_egitimi"];
  for (const tur of engellenenTurler) {
    assert.equal(
      yetenek.acabilecegiTalepTurleri.includes(tur as never),
      false,
      `med_md rolü ${tur} türünde talep açamamalıdır`
    );
  }

  // API sözleşmesi doğrulaması
  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /!yetenek\.acabilecegiTalepTurleri\.includes\(egitimTuru\)/);
});

test("SENARYO-MED-02: urun_medikal_egitim talebinde ürün seçimi zorunludur", () => {
  const kural = TALEP_TURU_KURALLARI.urun_medikal_egitim;
  assert.equal(kural.urun, "zorunlu", "urun_medikal_egitim için ürün zorunlu olmalıdır");
  assert.equal(kural.teknik, "yok", "urun_medikal_egitim için teknik alanı kapalı olmalıdır");
  assert.equal(kural.icerikTuru, "urun_medikal", "içerik türü urun_medikal olmalıdır");

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /if \(turKurali\.urun === "zorunlu" && !urun_id\)/);
  assert.match(talepApi, /validasyonHatasi\("Ürün seçimi zorunludur\.", \["urun_id"\]\)/);
});

test("SENARYO-MED-03: medikal_egitim talebinde ürün ve teknik alanı kapalıdır", () => {
  const kural = TALEP_TURU_KURALLARI.medikal_egitim;
  assert.equal(kural.urun, "yok", "medikal_egitim için ürün alanı yok olmalıdır");
  assert.equal(kural.teknik, "yok", "medikal_egitim için teknik alanı yok olmalıdır");
  assert.equal(kural.icerikTuru, "medikal", "içerik türü medikal olmalıdır");
});

test("SENARYO-MED-04: med_md başka firmanın ürünü ile talep açamaz", async () => {
  const sahteUrunler = [
    { urun_id: "u1", firma_id: "f1", takim_id: "t1", sorumlu_pm_id: "pm1" },
    { urun_id: "u2", firma_id: "f2", takim_id: "t1", sorumlu_pm_id: "pm2" },
  ];

  const olusturSahteDb = () => ({
    from: () => ({
      select: () => {
        const criteria: Record<string, unknown> = {};
        const builder = {
          eq: (k: string, v: unknown) => {
            criteria[k] = v;
            return builder;
          },
          maybeSingle: async () => {
            const u = sahteUrunler.find(
              (item) => item.urun_id === criteria.urun_id && item.firma_id === criteria.firma_id
            );
            return { data: u ? { urun_id: u.urun_id } : null };
          },
        };
        return builder;
      },
    }),
  } as unknown as Parameters<typeof urunFirmayaAitMi>[0]);

  const medKullanici = { id: "med1", rol: "med_md", takimId: null };

  // Kendi firmasının ürünü -> Kabul
  const kendiFirmaUrunu = await urunFirmayaAitMi(olusturSahteDb(), "u1", "f1", medKullanici);
  assert.equal(kendiFirmaUrunu, true, "med_md kendi firmasının ürününü kullanabilmelidir");

  // Başka firmanın ürünü -> Red
  const baskaFirmaUrunu = await urunFirmayaAitMi(olusturSahteDb(), "u2", "f1", medKullanici);
  assert.equal(baskaFirmaUrunu, false, "med_md başka firmanın ürününü kullanamaz");
});

test("SENARYO-MED-05: med_md sorumlu PM atamasından bağımsız olarak firmanın tüm ürünlerini kullanabilir", async () => {
  const sahteUrunler = [
    { urun_id: "u1", firma_id: "f1", takim_id: "t1", sorumlu_pm_id: "pm_baska" }, // Başka PM'ye atanmış
    { urun_id: "u2", firma_id: "f1", takim_id: "t2", sorumlu_pm_id: null },        // PM atanmamış
  ];

  const olusturSahteDb = () => ({
    from: () => ({
      select: () => {
        const criteria: Record<string, unknown> = {};
        const builder = {
          eq: (k: string, v: unknown) => {
            criteria[k] = v;
            return builder;
          },
          maybeSingle: async () => {
            const u = sahteUrunler.find(
              (item) => item.urun_id === criteria.urun_id && item.firma_id === criteria.firma_id
            );
            return { data: u ? { urun_id: u.urun_id } : null };
          },
        };
        return builder;
      },
    }),
  } as unknown as Parameters<typeof urunFirmayaAitMi>[0]);

  const medKullanici = { id: "med1", rol: "med_md", takimId: null };

  // Başka PM'ye atanmış ürün med_md için kabul edilir
  const baskaPmAit = await urunFirmayaAitMi(olusturSahteDb(), "u1", "f1", medKullanici);
  assert.equal(baskaPmAit, true, "med_md firma seviyesinde olduğu için başka PM'ye atanmış ürünü kullanabilmelidir");

  // Atanmamış ürün med_md için kabul edilir
  const atanmamisUrun = await urunFirmayaAitMi(olusturSahteDb(), "u2", "f1", medKullanici);
  assert.equal(atanmamisUrun, true, "med_md firmanın atanmamış ürününü kullanabilmelidir");

  // Liste kapsamı: Takım seçimi opsiyoneldir
  const profil = { rol: "med_md", firma_id: "f1", takim_id: null, aktif_mi: true };
  assert.deepEqual(ureticiUrunListeKapsami(profil, "f1", null), { firma_id: "f1", takim_id: null });
  assert.deepEqual(ureticiUrunListeKapsami(profil, "f1", "t1"), { firma_id: "f1", takim_id: "t1" });
  assert.equal(ureticiUrunListeKapsami(profil, "f2", null), null, "Başka firma talep edilemez");
});

test("SENARYO-MED-06: Eczanem hedefinde eğitim türünden bağımsız olarak ürün zorunludur", () => {
  assert.ok(ECZANEM_TALEP_ACAN_ROLLER.includes("med_md"), "med_md Eczanem talep açabilen rollerde olmalıdır");

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /if \(eczanemHedefi && !urun_id\)/);
  assert.match(talepApi, /ECZANEM_TALEP_ACAN_ROLLER\.includes\(rol\)/);
});

test("SENARYO-MED-07: med_md başka üreticinin görevini onaylayamaz", () => {
  const kararApi = oku("app/(panel)/uretim/api/karar/route.ts");
  assert.match(kararApi, /\.eq\("uretici_id", user\.id\)/);
  assert.match(kararApi, /p_uretici_id:\s*user\.id/);
});

test("SENARYO-MED-08: med_md başka üreticinin yayınını yönetemez", () => {
  const yayinYonetimApi = oku("app/(panel)/yayin-yonetimi/api/yayinlar/[yayin_id]/route.ts");
  assert.match(yayinYonetimApi, /if \(yayin\.uretici_id !== user\.id\) return rolHatasi\("Yalnız kendi yayınınızı yönetebilirsiniz\."\)/);
});

test("SENARYO-MED-09: med_md yalnız kişisel token satın alabilir; firma ortak hesabı engellenir", () => {
  assert.equal(esnekPaketBakiyeTuru("med_md"), "kisisel", "med_md bakiye türü 'kisisel' olmalıdır");

  const satinAlmaSunucu = oku("lib/satinAlma/esnekPaketSunucu.ts");
  assert.match(satinAlmaSunucu, /if \(beklenenHesap && esnekPaketBakiyeTuru\(rol\) !== beklenenHesap\)/);
  assert.match(satinAlmaSunucu, /status:\s*403/);

  const satinAlmaSql = oku("scripts/sql/cogniti_esnek_paket_siparis_adim1.sql");
  assert.match(satinAlmaSql, /med_md/);
});

test("SENARYO-MED-10: med_md FirmaStore siparişi veremez", () => {
  assert.equal(STORE_ALABILEN_ROLLER.includes("med_md"), false, "med_md mağazadan alışveriş yapamaz");

  const storeSiparisApi = oku("app/(panel)/store/api/siparis/route.ts");
  assert.match(storeSiparisApi, /if \(!STORE_ALABILEN_ROLLER\.includes\(rol\)\)/);
});
