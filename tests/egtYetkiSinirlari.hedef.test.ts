import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { urunFirmayaAitMi, teknikFirmayaAitMi } from "@/lib/uretici/talepKaynakSahipligi";
import { ureticiUrunListeKapsami } from "@/lib/uretici/urunKapsami";
import { URETICI_YETENEKLERI, TALEP_TURU_KURALLARI, teknikEkleyebilirMi } from "@/lib/uretici/yetenekler";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import { STORE_ALABILEN_ROLLER, ECZANEM_TALEP_ACAN_ROLLER } from "@/lib/utils/roller";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");

const EGT_ROLLER = ["egt_md", "egt_yrd_md", "egt_yon", "egt_uz"] as const;

test("SENARYO-EGT-01: egt_* ailesi yalnız satis_teknikleri ve yonetim_egitimi açabilir; diğer türler engellenir", () => {
  for (const rol of EGT_ROLLER) {
    const yetenek = URETICI_YETENEKLERI[rol];
    assert.ok(yetenek, `${rol} yetenek tanımı bulunmalıdır`);
    assert.equal(yetenek.takimZorunlu, false, `${rol} için takım zorunlu olmamalıdır (firma seviyesi)`);
    assert.equal(yetenek.raporScope, "firma", `${rol} rapor kapsamı firma düzeyinde olmalıdır`);
    assert.equal(yetenek.icerikTuru, "egitim", `${rol} içerik türü 'egitim' olmalıdır`);
    assert.deepEqual(
      yetenek.acabilecegiTalepTurleri,
      ["satis_teknikleri", "yonetim_egitimi"],
      `${rol} yalnızca satis_teknikleri ve yonetim_egitimi açabilmelidir`
    );

    const engellenenTurler = ["urun_egitimi", "medikal_egitim", "urun_medikal_egitim", "ik_egitimi"];
    for (const tur of engellenenTurler) {
      assert.equal(
        yetenek.acabilecegiTalepTurleri.includes(tur as never),
        false,
        `${rol} rolü ${tur} türünde talep açamamalıdır`
      );
    }
  }

  // API sözleşmesi doğrulaması
  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /!yetenek\.acabilecegiTalepTurleri\.includes\(egitimTuru\)/);
});

test("SENARYO-EGT-02: satis_teknikleri talebinde Saha hedefi seçildiğinde teknik seçimi zorunludur", () => {
  const kural = TALEP_TURU_KURALLARI.satis_teknikleri;
  assert.equal(kural.urun, "tercihli", "satis_teknikleri için ürün tercihli olmalıdır");
  assert.equal(kural.teknik, "zorunlu", "satis_teknikleri kuralında teknik zorunlu olmalıdır");
  assert.equal(kural.icerikTuru, "egitim", "içerik türü egitim olmalıdır");

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /if \(!tekniksizHedef && turKurali\.teknik === "zorunlu" && !teknik_id\)/);
  assert.match(talepApi, /validasyonHatasi\("Teknik seçimi zorunludur\.", \["teknik_id"\]\)/);
});

test("SENARYO-EGT-03: satis_teknikleri talebinde E-Club hedefi seçildiğinde teknik_id null'a zorlanır", () => {
  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(
    talepApi,
    /const tekniksizHedef = eczanemHedefi \|\| hedefRoller\.some\(\(hedef\) => ECLUB_HEDEF_ROLLER\.includes\(hedef\)\);/
  );
  assert.match(
    talepApi,
    /const insertTeknikId = turKurali\.teknik === "yok" \|\| tekniksizHedef \? null : \(teknik_id \?\? null\);/
  );
});

test("SENARYO-EGT-04: yonetim_egitimi talebinde ürün ve teknik alanı kapalıdır (null zorlanır)", () => {
  const kural = TALEP_TURU_KURALLARI.yonetim_egitimi;
  assert.equal(kural.urun, "yok", "yonetim_egitimi için ürün alanı yok olmalıdır");
  assert.equal(kural.teknik, "yok", "yonetim_egitimi için teknik alanı yok olmalıdır");
  assert.equal(kural.icerikTuru, "yonetim", "içerik türü yonetim olmalıdır");

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(
    talepApi,
    /const insertUrunId = turKurali\.urun === "yok" && !eczanemHedefi \? null : \(urun_id \?\? null\);/
  );
});

test("SENARYO-EGT-05: egt_* rolleri Eczanem hedefli talep ve yayın açamaz", () => {
  for (const rol of EGT_ROLLER) {
    assert.equal(
      ECZANEM_TALEP_ACAN_ROLLER.includes(rol),
      false,
      `${rol} Eczanem talep açabilen rollerde olmamalıdır`
    );
  }

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /if \(hedefRoller\.includes\("eczanem"\) && !ECZANEM_TALEP_ACAN_ROLLER\.includes\(rol\)\)/);

  const yayinlarApi = oku("app/(panel)/yayin-yonetimi/api/yayinlar/route.ts");
  assert.match(yayinlarApi, /if \(eczanemHedefi && !ECZANEM_TALEP_ACAN_ROLLER\.includes\(rol\)\)/);
});

test("SENARYO-EGT-06: egt_* rolleri teknik ekleyebilir ve başka firma adına ekleme engellenir", async () => {
  for (const rol of EGT_ROLLER) {
    assert.equal(teknikEkleyebilirMi(rol), true, `${rol} yeni teknik ekleyebilmelidir`);
  }

  // API rotasında oturumdaki firma doğrulaması kontrolü
  const teknikApi = oku("app/teknikler/api/route.ts");
  assert.match(teknikApi, /if \(!teknikEkleyebilirMi\(rol\)\) return rolHatasi\("Sadece yetkili roller teknik ekleyebilir\."\);/);
  assert.match(teknikApi, /if \(!kullaniciKaydi\?\.firma_id \|\| kullaniciKaydi\.firma_id !== firma_id\)/);
  assert.match(teknikApi, /return rolHatasi\("Başka firma adına teknik ekleyemezsiniz\."\);/);

  // DB yardımcı fonksiyonuyla teknik sahipliği kontrolü
  const sahteTeknikler = [{ teknik_id: "tek-1", firma_id: "f1", teknik_adi: "Çapraz Satış" }];
  const sahteDb = {
    from: () => ({
      select: () => ({
        eq: (_k1: string, v1: string) => ({
          eq: (_k2: string, v2: string) => ({
            maybeSingle: async () => {
              const t = sahteTeknikler.find((item) => item.teknik_id === v1 && item.firma_id === v2);
              return { data: t ? { teknik_id: t.teknik_id } : null };
            },
          }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof teknikFirmayaAitMi>[0];

  assert.equal(await teknikFirmayaAitMi(sahteDb, "tek-1", "f1"), true, "Kendi firmasının tekniği kabul edilmelidir");
  assert.equal(await teknikFirmayaAitMi(sahteDb, "tek-1", "f2"), false, "Başka firmaya ait teknik reddedilmelidir");
});

test("SENARYO-EGT-07: egt_* sorumlu PM atamasından bağımsız olarak firmanın tüm ürünlerini kullanabilir", async () => {
  const sahteUrunler = [
    { urun_id: "u1", firma_id: "f1", takim_id: "t1", sorumlu_pm_id: "pm_baska" }, // Başka PM'ye atanmış
    { urun_id: "u2", firma_id: "f1", takim_id: "t2", sorumlu_pm_id: null },        // PM atanmamış
    { urun_id: "u3", firma_id: "f2", takim_id: "t1", sorumlu_pm_id: "pm1" },        // Başka firma
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

  for (const rol of EGT_ROLLER) {
    const egtKullanici = { id: `user_${rol}`, rol, takimId: null };

    // Başka PM'ye atanmış ürün kabul edilir
    const baskaPmAit = await urunFirmayaAitMi(olusturSahteDb(), "u1", "f1", egtKullanici);
    assert.equal(baskaPmAit, true, `${rol} firma seviyesinde olduğu için başka PM'ye atanmış ürünü kullanabilmelidir`);

    // Atanmamış ürün kabul edilir
    const atanmamisUrun = await urunFirmayaAitMi(olusturSahteDb(), "u2", "f1", egtKullanici);
    assert.equal(atanmamisUrun, true, `${rol} firmanın atanmamış ürününü kullanabilmelidir`);

    // Başka firmanın ürünü reddedilir
    const baskaFirmaUrun = await urunFirmayaAitMi(olusturSahteDb(), "u3", "f1", egtKullanici);
    assert.equal(baskaFirmaUrun, false, `${rol} başka firmanın ürününü kullanamaz`);

    // Liste kapsamı: Takım seçimi opsiyoneldir
    const profil = { rol, firma_id: "f1", takim_id: null, aktif_mi: true };
    assert.deepEqual(ureticiUrunListeKapsami(profil, "f1", null), { firma_id: "f1", takim_id: null });
    assert.deepEqual(ureticiUrunListeKapsami(profil, "f1", "t1"), { firma_id: "f1", takim_id: "t1" });
    assert.equal(ureticiUrunListeKapsami(profil, "f2", null), null, `${rol} başka firma talep edemez`);
  }
});

test("SENARYO-EGT-08: egt_* başka üreticinin görevini onaylayamaz", () => {
  const kararApi = oku("app/(panel)/uretim/api/karar/route.ts");
  assert.match(kararApi, /\.eq\("uretici_id", user\.id\)/);
  assert.match(kararApi, /p_uretici_id:\s*user\.id/);
});

test("SENARYO-EGT-09: egt_* yalnız kişisel token satın alabilir; firma ortak hesabı engellenir", () => {
  for (const rol of EGT_ROLLER) {
    assert.equal(esnekPaketBakiyeTuru(rol), "kisisel", `${rol} bakiye türü 'kisisel' olmalıdır`);
  }

  const satinAlmaSunucu = oku("lib/satinAlma/esnekPaketSunucu.ts");
  assert.match(satinAlmaSunucu, /if \(beklenenHesap && esnekPaketBakiyeTuru\(rol\) !== beklenenHesap\)/);
  assert.match(satinAlmaSunucu, /status:\s*403/);
});

test("SENARYO-EGT-10: egt_* rolleri FirmaStore siparişi veremez", () => {
  for (const rol of EGT_ROLLER) {
    assert.equal(STORE_ALABILEN_ROLLER.includes(rol), false, `${rol} mağazadan alışveriş yapamaz`);
  }

  const storeSiparisApi = oku("app/(panel)/store/api/siparis/route.ts");
  assert.match(storeSiparisApi, /if \(!STORE_ALABILEN_ROLLER\.includes\(rol\)\)/);
});
