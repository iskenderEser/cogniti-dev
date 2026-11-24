import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  bolisHazirListeDavetEpostalariGonder,
  bolisSinavSonucEpostasiGonder,
  bolisSinavZamaniFormatla,
} from "../lib/bolis/eposta.ts";
import { SUREC16_TOAST } from "../lib/bildirimler/toastMesajlari.ts";

test("Hazır liste sınav daveti ve sınav sonuç özeti e-postaları standart şablonla gönderilir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.BOLIS_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const gidenler: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = [];

  process.env.RESEND_API_KEY = "test-key";
  process.env.BOLIS_EMAIL_FROM = "Cogniti <bildirim@cogniti.net>";
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    gidenler.push({
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify({ id: "email-sinav-1" }), { status: 200 });
  }) as typeof fetch;

  const mockDb = {
    from: (tablo: string) => ({
      select: (_k: string, opts?: { head?: boolean }) => ({
        eq: () => {
          if (tablo === "bolis_sinavlari") {
            return {
              maybeSingle: async () => ({
                data: {
                  sinav_id: "88888888-8888-4888-8888-888888888888",
                  firma_id: "firma-1",
                  erisim_kodu: "9K4M7P2X8Q",
                  baslik: "Q4 Kardiyoloji Ürün Bilgi Ölçümü",
                  sure_dakika: 30,
                  baslangic_at: "2026-11-28T07:00:00Z",
                  bitis_at: "2026-11-28T07:30:00Z",
                  kayit_tipi: "hazir_liste",
                  durum: "yayinda",
                },
                error: null,
              }),
            };
          }
          if (tablo === "firmalar") {
            return { maybeSingle: async () => ({ data: { firma_adi: "Hepifarma İlaç" }, error: null }) };
          }
          if (tablo === "bolis_sorulari" && opts?.head) return Promise.resolve({ count: 20, error: null });
          if (tablo === "bolis_davetlileri") {
            return Promise.resolve({
              data: [
                { davetli_id: "d-1", davet_kodu: "k8N2pQ9xR4mW7vL1", ad: "Ayşe", soyad: "Yılmaz", eposta: "ayse.yilmaz@hepifarma.com" },
                { davetli_id: "d-2", davet_kodu: "bitenKod12345678", ad: "Ali", soyad: "Kaya", eposta: "ali.kaya@hepifarma.com" },
              ],
              error: null,
            });
          }
          if (tablo === "bolis_oturumlari") {
            return { eq: async () => ({ data: [{ davetli_id: "d-2" }], error: null }) };
          }
          return Promise.resolve({ data: [], error: null });
        },
      }),
    }),
  } as unknown as SupabaseClient;

  try {
    const gonderilen = await bolisHazirListeDavetEpostalariGonder(
      mockDb,
      "88888888-8888-4888-8888-888888888888",
      "https://cogniti.net",
    );
    assert.equal(gonderilen, 1);
    assert.equal(gidenler[0].body.subject, "Cogniti Sınav Davetiniz");
    assert.match(String(gidenler[0].body.text), /^Sayın Ayşe Yılmaz,/);
    assert.match(
      String(gidenler[0].body.text),
      /Hepifarma İlaç tarafından düzenlenen Q4 Kardiyoloji Ürün Bilgi Ölçümü sınavına davet edildiniz\./,
    );
    assert.match(String(gidenler[0].body.text), /https:\/\/cogniti\.net\/bolis-sinav\/9K4M7P2X8Q\?davet=k8N2pQ9xR4mW7vL1/);
    assert.match(String(gidenler[0].body.text), /Cogniti · bilgi taşır$/);

    gidenler.length = 0;
    await bolisSinavSonucEpostasiGonder({
      oturumId: "99999999-9999-4999-8999-999999999999",
      sinavBaslik: "Q4 Kardiyoloji Ürün Bilgi Ölçümü",
      adSoyad: "Ayşe Yılmaz",
      eposta: "ayse.yilmaz@hepifarma.com",
      toplamPuan: 85,
      maksimumPuan: 100,
      dogruSayisi: 17,
      yanlisSayisi: 2,
      bosSayisi: 1,
    });
    assert.equal(gidenler[0].body.subject, "Cogniti Sınav Sonucunuz");
    assert.match(String(gidenler[0].body.text), /Q4 Kardiyoloji Ürün Bilgi Ölçümü sınavını tamamladınız\./);
    assert.match(String(gidenler[0].body.text), /- Toplam puanınız: 85 \/ 100 \(%85 başarı\)/);
    assert.match(String(gidenler[0].body.text), /- Yanıt dağılımı: 17 doğru · 2 yanlış · 1 boş/);
    assert.equal(bolisSinavZamaniFormatla("2026-11-28T07:00:00Z", "2026-11-28T07:30:00Z"), "28 Kasım 2026, 10:00 – 10:30 (Türkiye saati)");
    assert.equal(SUREC16_TOAST.sinavKapatildi, "Sınav katılıma kapatıldı.");
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.BOLIS_EMAIL_FROM;
    else process.env.BOLIS_EMAIL_FROM = oncekiFrom;
  }
});
