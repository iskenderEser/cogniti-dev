import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URETICI_YETENEKLERI, TALEP_TURU_KURALLARI, teknikEkleyebilirMi } from "@/lib/uretici/yetenekler";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import {
  STORE_ALABILEN_ROLLER,
  ECZANEM_TALEP_ACAN_ROLLER,
  ECLUB_HEDEF_ROLLER,
  hedefRolIkUreticisineAcikMi,
  ureticiYayinHedefGruplari,
} from "@/lib/utils/roller";

const oku = (yol: string) => readFileSync(new URL(`../${yol}`, import.meta.url), "utf8");

const IK_ROLLER = ["ik_drk", "ik_md", "ik_yrd_md", "ik_uz", "ik_per"] as const;

test("SENARYO-IK-01: ik_* ailesi yalnız ik_egitimi ve yonetim_egitimi açabilir; diğer türler engellenir", () => {
  for (const rol of IK_ROLLER) {
    const yetenek = URETICI_YETENEKLERI[rol];
    assert.ok(yetenek, `${rol} yetenek tanımı bulunmalıdır`);
    assert.equal(yetenek.takimZorunlu, false, `${rol} için takım zorunlu olmamalıdır (firma seviyesi)`);
    assert.equal(yetenek.raporScope, "firma", `${rol} rapor kapsamı firma düzeyinde olmalıdır`);
    assert.equal(yetenek.icerikTuru, "ik", `${rol} içerik türü 'ik' olmalıdır`);
    assert.deepEqual(
      yetenek.acabilecegiTalepTurleri,
      ["ik_egitimi", "yonetim_egitimi"],
      `${rol} yalnızca ik_egitimi ve yonetim_egitimi açabilmelidir`
    );

    const engellenenTurler = ["urun_egitimi", "medikal_egitim", "urun_medikal_egitim", "satis_teknikleri"];
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

test("SENARYO-IK-02: ik_egitimi talebinde ürün ve teknik kapalıdır (null zorlanır)", () => {
  const kural = TALEP_TURU_KURALLARI.ik_egitimi;
  assert.equal(kural.urun, "yok", "ik_egitimi için ürün alanı yok olmalıdır");
  assert.equal(kural.teknik, "yok", "ik_egitimi için teknik alanı yok olmalıdır");
  assert.equal(kural.icerikTuru, "ik", "içerik türü ik olmalıdır");

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(
    talepApi,
    /const insertUrunId = turKurali\.urun === "yok" && !eczanemHedefi \? null : \(urun_id \?\? null\);/
  );
  assert.match(
    talepApi,
    /const insertTeknikId = turKurali\.teknik === "yok" \|\| tekniksizHedef \? null : \(teknik_id \?\? null\);/
  );
});

test("SENARYO-IK-03: yonetim_egitimi talebinde ürün ve teknik kapalıdır (null zorlanır)", () => {
  const kural = TALEP_TURU_KURALLARI.yonetim_egitimi;
  assert.equal(kural.urun, "yok", "yonetim_egitimi için ürün alanı yok olmalıdır");
  assert.equal(kural.teknik, "yok", "yonetim_egitimi için teknik alanı yok olmalıdır");
  assert.equal(kural.icerikTuru, "yonetim", "içerik türü yonetim olmalıdır");
});

test("SENARYO-IK-04: ik_* rolleri E-Club hedeflerine talep ve yayın açamaz", () => {
  for (const rol of IK_ROLLER) {
    for (const hedef of ECLUB_HEDEF_ROLLER) {
      assert.equal(
        hedefRolIkUreticisineAcikMi(rol, hedef),
        false,
        `${rol} rolü E-Club hedefi (${hedef}) açamamalıdır`
      );
    }
  }

  const talepApi = oku("app/(panel)/talepler/api/route.ts");
  assert.match(
    talepApi,
    /if \(hedefRoller\.some\(\(hedef\) => !hedefRolIkUreticisineAcikMi\(rol, hedef\)\)\)/
  );
});

test("SENARYO-IK-05: ik_* rolleri Eczanem hedefli talep ve yayın açamaz", () => {
  for (const rol of IK_ROLLER) {
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

test("SENARYO-IK-06: ik_* rolleri için yayın hedef grupları yalnızca utt ve bm ile sınırlıdır", () => {
  for (const rol of IK_ROLLER) {
    const hedefler = ureticiYayinHedefGruplari(rol);
    assert.deepEqual(
      hedefler,
      ["utt", "bm"],
      `${rol} yayın hedef grupları yalnızca utt ve bm olmalıdır`
    );
  }
});

test("SENARYO-IK-07: ik_* rolleri teknik ekleyemez (teknikEkleyebilirMi = false)", () => {
  for (const rol of IK_ROLLER) {
    assert.equal(teknikEkleyebilirMi(rol), false, `${rol} teknik ekleyememelidir`);
  }

  const teknikApi = oku("app/teknikler/api/route.ts");
  assert.match(teknikApi, /if \(!teknikEkleyebilirMi\(rol\)\) return rolHatasi\("Sadece yetkili roller teknik ekleyebilir\."\);/);
});

test("SENARYO-IK-08: ik_* başka üreticinin görevini onaylayamaz", () => {
  const kararApi = oku("app/(panel)/uretim/api/karar/route.ts");
  assert.match(kararApi, /\.eq\("uretici_id", user\.id\)/);
  assert.match(kararApi, /p_uretici_id:\s*user\.id/);
});

test("SENARYO-IK-09: ik_* yalnız kişisel token satın alabilir; firma ortak hesabı engellenir", () => {
  for (const rol of IK_ROLLER) {
    assert.equal(esnekPaketBakiyeTuru(rol), "kisisel", `${rol} bakiye türü 'kisisel' olmalıdır`);
  }

  const satinAlmaSunucu = oku("lib/satinAlma/esnekPaketSunucu.ts");
  assert.match(satinAlmaSunucu, /if \(beklenenHesap && esnekPaketBakiyeTuru\(rol\) !== beklenenHesap\)/);
  assert.match(satinAlmaSunucu, /status:\s*403/);
});

test("SENARYO-IK-10: ik_* rolleri FirmaStore siparişi veremez", () => {
  for (const rol of IK_ROLLER) {
    assert.equal(STORE_ALABILEN_ROLLER.includes(rol), false, `${rol} mağazadan alışveriş yapamaz`);
  }

  const storeSiparisApi = oku("app/(panel)/store/api/siparis/route.ts");
  assert.match(storeSiparisApi, /if \(!STORE_ALABILEN_ROLLER\.includes\(rol\)\)/);
});
