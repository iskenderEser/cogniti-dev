import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { urunFirmayaAitMi, teknikFirmayaAitMi } from "@/lib/uretici/talepKaynakSahipligi";
import { ureticiUrunListeKapsami } from "@/lib/uretici/urunKapsami";
import { URETICI_YETENEKLERI, isTalepTuru } from "@/lib/uretici/yetenekler";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import { STORE_ALABILEN_ROLLER, PM_AILESI_ROLLER, URETICI_ROLLER } from "@/lib/utils/roller";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");

test("SENARYO-YETKI-01: PM, atanmamış veya farklı takımdaki ürünle talep açamaz", async () => {
  const sahteUrunler = [
    { urun_id: "u1", firma_id: "f1", takim_id: "t1", sorumlu_pm_id: "pm1" },
    { urun_id: "u2", firma_id: "f1", takim_id: "t2", sorumlu_pm_id: "pm2" },
    { urun_id: "u3", firma_id: "f2", takim_id: "t1", sorumlu_pm_id: "pm1" },
    { urun_id: "u4", firma_id: "f1", takim_id: "t1", sorumlu_pm_id: null },
  ];

  const olusturSahteDb = () => {
    return {
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
                (item) =>
                  item.urun_id === criteria.urun_id &&
                  item.firma_id === criteria.firma_id &&
                  (!("sorumlu_pm_id" in criteria) || item.sorumlu_pm_id === criteria.sorumlu_pm_id) &&
                  (!("takim_id" in criteria) || item.takim_id === criteria.takim_id)
              );
              return { data: u ? { urun_id: u.urun_id } : null };
            },
          };
          return builder;
        },
      }),
    } as unknown as Parameters<typeof urunFirmayaAitMi>[0];
  };

  for (const rol of PM_AILESI_ROLLER) {
    const pmKullanici = { id: "pm1", rol, takimId: "t1" };

    // Kendi atandığı ürün -> Kabul
    const kendiUrunu = await urunFirmayaAitMi(olusturSahteDb(), "u1", "f1", pmKullanici);
    assert.equal(kendiUrunu, true, `${rol} kendi atandığı ürünü kullanabilmeli`);

    // Başka PM'nin ürünü -> Red
    const baskaPmUrunu = await urunFirmayaAitMi(olusturSahteDb(), "u2", "f1", pmKullanici);
    assert.equal(baskaPmUrunu, false, `${rol} başka PM'nin ürününü kullanamaz`);

    // Başka firmanın ürünü -> Red
    const baskaFirmaUrunu = await urunFirmayaAitMi(olusturSahteDb(), "u3", "f1", pmKullanici);
    assert.equal(baskaFirmaUrunu, false, `${rol} başka firmanın ürününü kullanamaz`);

    // PM atanmamış ürün -> Red
    const atanmamisUrun = await urunFirmayaAitMi(olusturSahteDb(), "u4", "f1", pmKullanici);
    assert.equal(atanmamisUrun, false, `${rol} PM atanmamış ürünü kullanamaz`);

    // Takımı olmayan PM -> Red
    const takimsizPm = await urunFirmayaAitMi(olusturSahteDb(), "u1", "f1", { id: "pm1", rol, takimId: null });
    assert.equal(takimsizPm, false, `${rol} takımsız talep açamaz`);
  }
});

test("SENARYO-YETKI-02: PM ailesi yalnız urun_egitimi talebi açabilir; diğer eğitim türleri engellenir", () => {
  const tumEgitimTurleri = ["urun_egitimi", "medikal_egitim", "satis_teknikleri", "ik_egitimi", "yonetim_egitimi"];

  for (const rol of PM_AILESI_ROLLER) {
    const yetenek = URETICI_YETENEKLERI[rol];
    assert.ok(yetenek, `${rol} yetenek tanımı bulunmalıdır`);
    assert.deepEqual(
      yetenek.acabilecegiTalepTurleri,
      ["urun_egitimi"],
      `${rol} yalnızca urun_egitimi açabilmelidir`
    );
    assert.equal(yetenek.takimZorunlu, true, `${rol} için takım zorunlu olmalıdır`);

    for (const tur of tumEgitimTurleri) {
      if (tur === "urun_egitimi") {
        assert.ok(yetenek.acabilecegiTalepTurleri.includes(tur as never));
      } else {
        assert.equal(
          yetenek.acabilecegiTalepTurleri.includes(tur as never),
          false,
          `${rol} rolü ${tur} türünde talep açamamalıdır`
        );
      }
    }
  }

  // API sözleşmesi doğrulaması
  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(talepApi, /!yetenek\.acabilecegiTalepTurleri\.includes\(egitimTuru\)/);
  assert.match(talepApi, /\$\{rol\} rolü "\$\{egitimTuru\}" türünde talep açamaz\./);
});

test("SENARYO-YETKI-03: Sorumlu PM atama triggerı takım ve firma uyumunu DB düzeyinde doğrular", () => {
  const sql = oku("scripts/sql/cogniti_urun_pm_atamasi.sql");
  assert.match(sql, /CREATE TRIGGER cogniti_urun_pm_atama_kontrolu/);
  assert.match(sql, /k\.firma_id = NEW\.firma_id AND k\.takim_id = NEW\.takim_id/);
  assert.match(sql, /k\.aktif_mi IS TRUE AND lower\(k\.rol\) IN \('pm','jr_pm','kd_pm'\)/);
  assert.match(sql, /ERRCODE = '23514'/);
  assert.match(sql, /CREATE TRIGGER cogniti_pm_profil_degisikligi/);
  assert.match(sql, /SET sorumlu_pm_id = NULL/);
});

test("SENARYO-YETKI-04: Karar sürüm kapısı eşzamanlı değişiklikleri 23514 hatasıyla engeller", () => {
  const sql = oku("scripts/sql/uretim_karar_surum_kapisi.sql");
  assert.match(sql, /FUNCTION public\.uretim_karar_surum_kapisi/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /v_mevcut_surum IS DISTINCT FROM p_beklenen_surum/);
  assert.match(sql, /ERRCODE = '23514'/);

  const kararApi = oku("app/(panel)/uretim/api/karar/route.ts");
  assert.match(kararApi, /p_beklenen_surum:\s*beklenen_surum/);
  assert.match(kararApi, /İşleminizi güncellemek için sayfanızı yenileyin/);
});

test("SENARYO-YETKI-05: PM yalnız kendi yayınını yönetebilir; başka üreticinin yayını 403 ile engellenir", () => {
  const yayinYonetimApi = oku("app/(panel)/yayin-yonetimi/api/yayinlar/[yayin_id]/route.ts");
  assert.match(yayinYonetimApi, /if \(yayin\.uretici_id !== user\.id\) return rolHatasi\("Yalnız kendi yayınınızı yönetebilirsiniz\."\)/);
  assert.match(yayinYonetimApi, /URETICI_ROLLER\.includes\(rol\)/);
});

test("SENARYO-YETKI-06: PM ailesi yalnız kişisel token satın alabilir; firma ortak hesabı engellenir", () => {
  for (const rol of PM_AILESI_ROLLER) {
    assert.equal(esnekPaketBakiyeTuru(rol), "kisisel", `${rol} bakiye türü 'kisisel' olmalıdır`);
  }

  const satinAlmaSunucu = oku("lib/satinAlma/esnekPaketSunucu.ts");
  assert.match(satinAlmaSunucu, /if \(beklenenHesap && esnekPaketBakiyeTuru\(rol\) !== beklenenHesap\)/);
  assert.match(satinAlmaSunucu, /status:\s*403/);

  const satinAlmaSql = oku("scripts/sql/cogniti_esnek_paket_siparis_adim1.sql");
  assert.match(satinAlmaSql, /IF k\.rol IN \('pm','jr_pm','kd_pm'[\s\S]*?\) THEN\s+v_tur:='kisisel';\s+v_sahip:=k\.kullanici_id;/);
});

test("SENARYO-YETKI-07: Yayına alınmış veya planlanmış içeriklerde puan değişimi kilitlidir", () => {
  const yayinYonetimApi = oku("app/(panel)/yayin-yonetimi/api/yayinlar/[yayin_id]/route.ts");
  // Tek izinli planlı işlemler: tarih_degistir, hemen_yayinla, plan_iptal
  assert.match(yayinYonetimApi, /tarih_degistir/);
  assert.match(yayinYonetimApi, /hemen_yayinla/);
  assert.match(yayinYonetimApi, /plan_iptal/);
  // Puan güncelleme fonksiyonu veya rotası yoktur
  assert.doesNotMatch(yayinYonetimApi, /arac_puani|soru_puani|video_puani/);
});

test("SENARYO-YETKI-08: Geçmişe veya bugünün 07:00 öncesine planlama engellenir", () => {
  const yayinYonetimApi = oku("app/(panel)/yayin-yonetimi/api/yayinlar/[yayin_id]/route.ts");
  assert.match(yayinYonetimApi, /aday\.getTime\(\) <= Date\.now\(\)/);
  assert.match(yayinYonetimApi, /Seçilen günün 07:00'i geçmiş\. Hemen yayınlamak için 'Hemen Yayınla' kullanın\./);
});

test("SENARYO-YETKI-09: PM rolleri FirmaStore siparişi veremez; alıcı rollerinde yer almaz", () => {
  for (const rol of PM_AILESI_ROLLER) {
    assert.equal(STORE_ALABILEN_ROLLER.includes(rol), false, `${rol} mağazadan sipariş veremez`);
  }

  const storeSiparisApi = oku("app/(panel)/store/api/siparis/route.ts");
  assert.match(storeSiparisApi, /if \(!STORE_ALABILEN_ROLLER\.includes\(rol\)\)/);
});

test("SENARYO-YETKI-10: Eczanem hedefli yayında token hesap türü seçimi zorunludur", () => {
  const yayinApi = oku("app/(panel)/yayin-yonetimi/api/yayinlar/route.ts");
  assert.match(yayinApi, /if \(eczanemHedefi && tokenHesabi !== "kisisel" && tokenHesabi !== "firma_ortak"\)/);
  assert.match(yayinApi, /Eczanem yayını için kullanılacak token hesabını seçin\./);
});
