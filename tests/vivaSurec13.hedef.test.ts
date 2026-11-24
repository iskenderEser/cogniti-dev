import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUREC13_TOAST } from "../lib/bildirimler/toastMesajlari.ts";
import { vivaDavetEpostaGovdesi } from "../lib/viva/epostaGonderimSunucu.ts";
import {
  vivaEtkinlikIptalEpostalariGonder,
  vivaKatilimciDavetEpostalariGonder,
} from "../lib/viva/katilimciEposta.ts";

test("vivaDavetEpostaGovdesi harici e-posta davetini standart konu, HTML ve düz metin ile üretir", () => {
  const govde = vivaDavetEpostaGovdesi(
    {
      davet_id: "00000000-0000-4000-8000-000000000001",
      kilit_id: "00000000-0000-4000-8000-000000000002",
      token_hash: "a".repeat(64),
      deneme_sayisi: 1,
      icerik: {
        from: "Cogniti <bildirim@cogniti.net>",
        to: "mehmet.demir@klinik.com",
        subject: "Cogniti Viva yayın daveti",
        baslik: "Kardiyovasküler Güncel Yaklaşımlar",
        baslangic: "2026-11-28T11:00:00Z",
        site: "https://cogniti.net",
      },
    },
    "test-token-123",
  );

  assert.equal(govde.subject, "Cogniti Viva Canlı Yayın Davetiniz");
  assert.match(govde.text, /^Sayın Katılımcımız,/);
  assert.match(govde.text, /Kardiyovasküler Güncel Yaklaşımlar Viva canlı yayınına davet edildiniz\./);
  assert.match(govde.text, /- Katılım bağlantısı: https:\/\/cogniti\.net\/viva\/davet\/test-token-123/);
  assert.match(govde.text, /Cogniti · bilgi taşır$/);
  assert.match(govde.html, /<strong>Kardiyovasküler Güncel Yaklaşımlar<\/strong>/);
  assert.match(govde.html, />Canlı yayına katıl<\/a>/);
  assert.match(govde.html, /Cogniti · bilgi taşır<\/p>$/);
});

test("vivaKatilimciDavetEpostalariGonder ve vivaEtkinlikIptalEpostalariGonder katılımcılara standart e-posta gönderir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.VIVA_DAVET_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const gidenler: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = [];

  process.env.RESEND_API_KEY = "test-key";
  process.env.VIVA_DAVET_EMAIL_FROM = "Cogniti <bildirim@cogniti.net>";
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    gidenler.push({
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify({ id: "email-viva-1" }), { status: 200 });
  }) as typeof fetch;

  let durum = "planlandi";
  const mockDb = {
    from: (tablo: string) => ({
      select: () => ({
        eq: () => {
          if (tablo === "viva_etkinlikler") {
            return {
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    etkinlik_id: "7b9c4e20-12a4-4f08-9b5a-31c8204f91a2",
                    baslik: "Kardiyovasküler Güncel Yaklaşımlar",
                    baslangic: "2026-11-28T11:00:00Z",
                    bitis: "2026-11-28T12:00:00Z",
                    durum,
                    surum: 2,
                  },
                  error: null,
                }),
            };
          }
          if (tablo === "viva_katilimcilar") {
            return Promise.resolve({
              data: [
                { tur: "ic", kullanici_id: "ic-1", kisi_id: null },
                { tur: "eclub", kullanici_id: null, kisi_id: "ec-1" },
              ],
              error: null,
            });
          }
          if (tablo === "viva_davetler") {
            return Promise.resolve({
              data: [{ davet_id: "d-1", ad: "Dr. Mehmet Demir", eposta: "mehmet.demir@klinik.com" }],
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        },
        in: () => {
          if (tablo === "kullanicilar") {
            return {
              eq: () =>
                Promise.resolve({
                  data: [
                    {
                      kullanici_id: "ic-1",
                      ad: "Ahmet",
                      soyad: "Yılmaz",
                      eposta: "ahmet.yilmaz@hepifarma.com",
                    },
                  ],
                  error: null,
                }),
            };
          }
          if (tablo === "eclub_kisiler") {
            return Promise.resolve({
              data: [
                {
                  kisi_id: "ec-1",
                  ad: "Ayşe",
                  soyad: "Kaya",
                  eposta: "ayse.kaya@sifaeczanesi.com",
                },
              ],
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        },
      }),
    }),
  } as unknown as SupabaseClient;

  try {
    await vivaKatilimciDavetEpostalariGonder(
      mockDb,
      "7b9c4e20-12a4-4f08-9b5a-31c8204f91a2",
      "https://cogniti.net",
    );
    assert.equal(gidenler.length, 2);
    assert.equal(gidenler[0].body.subject, "Cogniti Viva Canlı Yayın Davetiniz");
    assert.match(String(gidenler[0].body.text), /^Sayın Ahmet Yılmaz,/);
    assert.match(String(gidenler[0].body.text), /- Süre: 60 dakika/);
    assert.match(
      String(gidenler[0].body.text),
      /https:\/\/cogniti\.net\/viva\/7b9c4e20-12a4-4f08-9b5a-31c8204f91a2/,
    );
    assert.match(String(gidenler[0].body.text), /Cogniti · bilgi taşır$/);

    gidenler.length = 0;
    durum = "iptal";
    await vivaEtkinlikIptalEpostalariGonder(mockDb, "7b9c4e20-12a4-4f08-9b5a-31c8204f91a2");
    assert.equal(gidenler.length, 3);
    assert.equal(gidenler[0].body.subject, "Cogniti Viva Canlı Yayını İptal Edildi");
    assert.match(String(gidenler[2].body.text), /^Sayın Dr\. Mehmet Demir,/);
    assert.match(String(gidenler[2].body.text), /Viva canlı yayını iptal edilmiştir\./);
    assert.match(String(gidenler[2].body.text), /Cogniti · bilgi taşır$/);
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.VIVA_DAVET_EMAIL_FROM;
    else process.env.VIVA_DAVET_EMAIL_FROM = oncekiFrom;
  }
});

test("Süreç 13: SQL, OTP şablonu ve SUREC13_TOAST sözleşmesi doğrulanır", () => {
  assert.equal(
    SUREC13_TOAST.yayinPlanlandi,
    "Viva canlı yayını planlandı ve davetler gönderildi.",
  );
  assert.equal(SUREC13_TOAST.davetYenidenGonderildi, "Davet e-postası yeniden gönderildi.");

  for (const sqlDosya of [
    "scripts/sql/viva_eposta_gonderim_isleyici.sql",
    "scripts/sql/viva_eposta_davet_standardi.sql",
  ]) {
    const sql = fs.readFileSync(path.join(process.cwd(), sqlDosya), "utf8");
    assert.match(sql, /'subject','Cogniti Viva Canlı Yayın Davetiniz'/);
  }

  const sunucu = fs.readFileSync(path.join(process.cwd(), "lib/viva/sunucu.ts"), "utf8");
  assert.match(sunucu, /subject: "Viva Katılım Doğrulama Kodunuz"/);
  assert.match(sunucu, /Sayın Katılımcımız,/);
  assert.match(sunucu, /Cogniti · bilgi taşır/);
});
