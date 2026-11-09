import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { URETICI_ROLLER, YONETICI_ROLLER, TUM_ROLLER } from "@/lib/utils/roller";
import { kkoHesapTuru, kkoEtkinlestirmeKontrol } from "@/lib/satinAlma/kkoYetkisi";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

const firmaId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000002";

test("bütün roller yalnız yetkili oldukları KKÖ hesabını seçebilir", () => {
  for (const rol of [...TUM_ROLLER, "partner", "eczaci", "eczane_teknisyeni", "musteri", "bilinmeyen", ""]) {
    const beklenen = URETICI_ROLLER.includes(rol) ? "kisisel"
      : YONETICI_ROLLER.includes(rol) || rol === "firma_admin" ? "firma_ortak" : null;
    assert.equal(kkoHesapTuru(rol), beklenen, rol);
    for (const hesap of ["kisisel", "firma_ortak", "other", null]) {
      const sonuc = kkoEtkinlestirmeKontrol(rol, hesap, false);
      assert.equal(sonuc.ok, beklenen !== null && beklenen === hesap, `${rol}/${hesap}`);
    }
  }
  assert.equal(kkoHesapTuru(" PM "), "kisisel");
  assert.equal(kkoHesapTuru(null), null);
  assert.equal(kkoHesapTuru(undefined), null);
});

test("etkin hesap mükerrer seçilemez; bilinmeyen durum etkin değil sayılamaz", () => {
  for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, "firma_admin"]) {
    const hesap = kkoHesapTuru(rol);
    assert.equal(kkoEtkinlestirmeKontrol(rol, hesap, true).status, 409);
    assert.equal(kkoEtkinlestirmeKontrol(rol, hesap, null).status, 503);
    assert.equal(kkoEtkinlestirmeKontrol(rol, hesap, false).ok, true);
  }
});

function sunucuKur() {
  const durum = { rol: "pm", oturum: true, authError: false, kisiError: false, firmaError: false,
    kisi: { firma_id: firmaId, aktif_mi: true } as Record<string, unknown> | null,
    firma: { aktif: true } as Record<string, unknown> | null, patla: false };
  const sorgular: string[] = [];
  const db = { from(tablo: string) {
    sorgular.push(tablo);
    const builder = { select() { return builder; }, eq(kolon: string, deger: unknown) {
      assert.equal(deger, tablo === "kullanicilar" ? userId : firmaId);
      assert.equal(kolon, tablo === "kullanicilar" ? "kullanici_id" : "firma_id"); return builder;
    }, async maybeSingle() { return tablo === "kullanicilar"
      ? { data: durum.kisi, error: durum.kisiError }
      : { data: durum.firma, error: durum.firmaError }; } };
    return builder;
  } };
  const exports = {} as { kkoYetkiliHesabiOku: (hesap: unknown) => Promise<Record<string, unknown>> };
  const deps: Record<string, unknown> = {
    "server-only": {},
    "@/lib/supabase/server": { createClient: async () => {
      if (durum.patla) throw new Error("test");
      return { auth: { getUser: async () => ({ data: { user: durum.oturum ? { id: userId } : null }, error: durum.authError }) } };
    }, createAdminClient: () => db },
    "@/lib/utils/rolCozucu": { rolCozucu: async () => durum.rol },
    "@/lib/uretim/rpcTemel": { uuidGecerliMi }, "./kkoYetkisi": { kkoHesapTuru },
  };
  vm.runInNewContext(ts.transpileModule(readFileSync("lib/satinAlma/kkoYetkisiSunucu.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: (ad: string) => deps[ad] ?? assert.fail(ad), AbortSignal });
  return { durum, sorgular, oku: exports.kkoYetkiliHesabiOku };
}

test("sunucu bütün izinli rollerde hesap sahibini oturumdan belirler", async () => {
  for (const rol of [...URETICI_ROLLER, ...YONETICI_ROLLER, "firma_admin"]) {
    const s = sunucuKur(); s.durum.rol = rol;
    const sonuc = await s.oku(kkoHesapTuru(rol));
    assert.equal(sonuc.ok, true, rol);
    assert.equal(sonuc.firmaId, firmaId);
    assert.equal(sonuc.sahipId, URETICI_ROLLER.includes(rol) ? userId : null);
    assert.deepEqual(s.sorgular, ["kullanicilar", "firmalar"]);
  }
});

test("sunucu yasak rolü ve yanlış hesap seçimini reddeder", async () => {
  for (const rol of ["tm", "admin", "bm", "utt", "kd_utt", "iu", "partner", "eczaci", "musteri", ""]) {
    const s = sunucuKur(); s.durum.rol = rol;
    assert.equal((await s.oku("firma_ortak")).status, 403, rol);
    assert.equal(s.sorgular.length, 0);
  }
  const s = sunucuKur();
  assert.equal((await s.oku("firma_ortak")).status, 403);
  assert.equal((await s.oku({ hesapTuru: "kisisel", sahipId: firmaId })).status, 403);
});

test("oturum, pasif hesap ve okuma hatalarında yetki verilmez", async () => {
  for (const hata of ["oturum", "authError", "kisiError", "firmaError", "kisiYok", "firmaYok", "kisiPasif", "firmaPasif", "firmaGecersiz", "patla"]) {
    const s = sunucuKur();
    if (hata === "oturum") s.durum.oturum = false;
    else if (hata === "kisiYok") s.durum.kisi = null;
    else if (hata === "firmaYok") s.durum.firma = null;
    else if (hata === "kisiPasif") s.durum.kisi!.aktif_mi = false;
    else if (hata === "firmaPasif") s.durum.firma!.aktif = false;
    else if (hata === "firmaGecersiz") s.durum.kisi!.firma_id = "gecersiz";
    else s.durum[hata as "authError" | "kisiError" | "firmaError" | "patla"] = true;
    const sonuc = await s.oku("kisisel");
    assert.equal(sonuc.ok, false, hata);
    assert.equal(sonuc.status, ["oturum", "authError"].includes(hata) ? 401
      : ["kisiError", "firmaError", "patla"].includes(hata) ? 503 : 403, hata);
  }
});
