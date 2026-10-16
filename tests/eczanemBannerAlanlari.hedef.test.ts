import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bannerAlaniGecerli, ECZANEM_BANNER_ALANLARI, type BannerAlani } from "@/lib/eclub/banner";
import { firmaBannerlariniOku } from "@/lib/eclub/bannerSunucu";

test("Yalnız mevcut firma alanı ve üç Eczanem sayfası kabul edilir", () => {
  for (const alan of ["firma", ...Object.keys(ECZANEM_BANNER_ALANLARI)]) assert.equal(bannerAlaniGecerli(alan), true);
  for (const alan of ["", "__proto__", "constructor", "baska-sayfa"]) assert.equal(bannerAlaniGecerli(alan), false);
});

test("Aynı firmanın aynı sıradaki bannerları sayfalar arasında karışmaz; eski firma okuması korunur", async () => {
  const kayitlar = ["firma", ...Object.keys(ECZANEM_BANNER_ALANLARI)].flatMap((alan) => ["firma-a", "firma-b"].map((firma) => ({
    tablo: alan === "firma" ? "eclub_firma_bannerlari" : "eczanem_sayfa_bannerlari",
    firma_id: firma, alan, sira: 1, dosya_yolu: `${firma}/${alan}.png`,
  })));
  const admin = {
    from(tablo: string) {
      const filtreler: Record<string, string> = {};
      const sorgu = {
        select() { return sorgu; },
        eq(alan: string, deger: string) { filtreler[alan] = deger; return sorgu; },
        async order() {
          return { error: null, data: kayitlar.filter((k) => k.tablo === tablo && Object.entries(filtreler).every(([a, d]) => k[a as "firma_id" | "alan"] === d)) };
        },
      };
      return sorgu;
    },
    storage: { from: () => ({ getPublicUrl: (yol: string) => ({ data: { publicUrl: yol } }) }) },
  } as unknown as SupabaseClient;
  assert.deepEqual((await firmaBannerlariniOku(admin, "firma-a")).bannerlar, [{ sira: 1, url: "firma-a/firma.png" }]);
  for (const alan of Object.keys(ECZANEM_BANNER_ALANLARI) as BannerAlani[]) {
    assert.deepEqual((await firmaBannerlariniOku(admin, "firma-a", alan)).bannerlar, [{ sira: 1, url: `firma-a/${alan}.png` }]);
  }
});
