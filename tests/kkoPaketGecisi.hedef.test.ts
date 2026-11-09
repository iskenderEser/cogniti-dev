import assert from "node:assert/strict";
import test from "node:test";
import { URETICI_ROLLER, YONETICI_ROLLER, TUM_ROLLER } from "@/lib/utils/roller";
import { kkoHesapTuru } from "@/lib/satinAlma/kkoYetkisi";
import { kkoPaketGecisiniKontrolEt, type KkoPaketGecisDurumu } from "@/lib/satinAlma/kkoPaketGecisi";

const bos: KkoPaketGecisDurumu = {
  tercih: null, kullanilabilirPaketTokeni: 0, acikSiparisSayisi: 0, blokeliToken: 0,
};

test("izinli bütün rollerin KKÖ’den pakete geçişi yalnız kendi hesap türünde yapılır", () => {
  for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, "firma_admin"]) {
    const hesap = kkoHesapTuru(rol)!;
    const durum = Object.freeze({ ...bos, tercih: "kko" as const });
    const sonuc = kkoPaketGecisiniKontrolEt(rol, hesap, "paket", durum);
    assert.equal(sonuc.ok, true, rol);
    if (!sonuc.ok) assert.fail(rol);
    assert.equal(sonuc.sonrakiTercih, "paket");
    assert.equal(sonuc.kkoKapatilacak, true);
    assert.equal(sonuc.oncekiKkoTuketimiKorunacak, true);
    assert.equal(sonuc.pakettenDusulecekKkoTokeni, 0);
    assert.equal(durum.tercih, "kko");
    const yanlisHesap = hesap === "kisisel" ? "firma_ortak" : "kisisel";
    assert.equal(kkoPaketGecisiniKontrolEt(rol, yanlisHesap, "paket", durum).status, 403);
  }
});

test("kalan token, açık sipariş ve bloke ayrı ayrı ve birlikte KKÖ geçişini engeller", () => {
  for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, "firma_admin"]) {
    for (const engel of [
      { kullanilabilirPaketTokeni: 1 }, { acikSiparisSayisi: 1 }, { blokeliToken: 1 },
      { kullanilabilirPaketTokeni: 100, acikSiparisSayisi: 1, blokeliToken: 50 },
    ]) {
      const sonuc = kkoPaketGecisiniKontrolEt(rol, kkoHesapTuru(rol)!, "kko", { ...bos, tercih: "paket", ...engel });
      assert.equal(sonuc.ok, false, rol);
      assert.equal(sonuc.status, 409);
    }
  }
});

test("engel kalmayınca KKÖ seçilebilir; tüketilmiş veya süresi dolmuş paket tarihi engel değildir", () => {
  for (const tercih of [null, "paket"] as const) {
    const sonuc = kkoPaketGecisiniKontrolEt("pm", "kisisel", "kko", { ...bos, tercih });
    assert.equal(sonuc.ok, true);
    if (!sonuc.ok) assert.fail();
    assert.equal(sonuc.sonrakiTercih, "kko");
    assert.equal(sonuc.kkoKapatilacak, false);
  }
  assert.equal(kkoPaketGecisiniKontrolEt("pm", "kisisel", "kko", { ...bos, tercih: "kko" }).status, 409);
});

test("paket alan hesap ek paket alabilir; KKÖ blokesi paket alımını kendiliğinden iptal etmez", () => {
  for (const tercih of [null, "paket", "kko"] as const) {
    const sonuc = kkoPaketGecisiniKontrolEt("gm", "firma_ortak", "paket", {
      ...bos, tercih, blokeliToken: 10, acikSiparisSayisi: 1, kullanilabilirPaketTokeni: 5,
    });
    assert.equal(sonuc.ok, true);
    if (!sonuc.ok) assert.fail();
    assert.equal(sonuc.kkoKapatilacak, tercih === "kko");
  }
});

test("kapalı roller iki yönde de işlem yapamaz", () => {
  const izinli = [...URETICI_ROLLER, ...YONETICI_ROLLER, "firma_admin"];
  for (const rol of [...TUM_ROLLER.filter(r => !izinli.includes(r)), "partner", "eczaci", "eczane_teknisyeni", "musteri", "bilinmeyen"]) {
    for (const hedef of ["kko", "paket"] as const) {
      assert.equal(kkoPaketGecisiniKontrolEt(rol, "firma_ortak", hedef, bos).status, 403, rol);
    }
  }
});

test("okunamayan veya geçersiz hesap durumu geçiş izni sayılmaz", () => {
  const gecersizler: unknown[] = [null, {}, { ...bos, tercih: "diger" }];
  for (const alan of ["kullanilabilirPaketTokeni", "acikSiparisSayisi", "blokeliToken"]) {
    for (const deger of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "0", null, undefined]) {
      gecersizler.push({ ...bos, [alan]: deger });
    }
  }
  for (const durum of gecersizler) {
    for (const hedef of ["kko", "paket"] as const) {
      assert.equal(kkoPaketGecisiniKontrolEt("pm", "kisisel", hedef, durum as KkoPaketGecisDurumu).status, 503);
    }
  }
});
