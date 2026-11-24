import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aliciCanliSiparisiEpostalariGonder,
  aliciYayinSiparisiEpostalariGonder,
} from "../lib/agora/aliciEposta.ts";
import { SUREC15_TOAST } from "../lib/bildirimler/toastMesajlari.ts";

function sahteEpostaYakala() {
  const gidenler: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = [];
  const fetchFn = (async (_url: string | URL | Request, init?: RequestInit) => {
    gidenler.push({
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify({ id: "email-agora-alici-1" }), { status: 200 });
  }) as typeof fetch;
  return { gidenler, fetchFn };
}

function sahteAliciDb(firmaAdminAktif = true): SupabaseClient {
  return {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "agora_eposta_bildirim_oku" && args.p_tur === "yayin_siparis") {
        return {
          data: {
            siparis_id: args.p_id,
            partner_egitim_id: "PE-0042",
            egitim_adi: "Eczanede Dermokozmetik Danışmanlığı",
            yayin_araci: "video",
            satin_alma_bedeli: 12000,
            token_tutari: 240,
            partner_sirket_adi: "Dr. Elif Şahin Akademi",
            alici_ad_soyad: "Selin Arslan",
            alici_eposta: "selin.arslan@hepifarma.com",
            alici_firma_adi: "Hepifarma İlaç",
          },
          error: null,
        };
      }
      if (fn === "agora_eposta_bildirim_oku" && args.p_tur === "canli_siparis") {
        return {
          data: {
            siparis_id: args.p_id,
            partner_egitim_id: "PEC-0018",
            egitim_adi: "Saha Ekiplerinde Klinik İkna Atölyesi",
            baslangic_at: "2026-11-30T11:00:00Z",
            sure_dakika: 60,
            kapasite: 50,
            satin_alma_bedeli: 18000,
            token_tutari: 360,
            partner_sirket_adi: "Dr. Elif Şahin Akademi",
            alici_ad_soyad: "Selin Arslan",
            alici_eposta: "selin.arslan@hepifarma.com",
            alici_firma_adi: "Hepifarma İlaç",
          },
          error: null,
        };
      }
      return { data: null, error: null };
    },
    from: (tablo: string) => ({
      select: () => ({
        eq: (kolon: string) => {
          if (tablo === "firmalar") {
            return {
              maybeSingle: async () => ({
                data: { aktif: true, firma_admin_aktif: firmaAdminAktif },
                error: null,
              }),
            };
          }
          if (tablo === "kullanicilar" && kolon === "kullanici_id") {
            return {
              maybeSingle: async () => ({
                data: { firma_id: "firma-1" },
                error: null,
              }),
            };
          }
          return {
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    kullanici_id: "admin-firma-1",
                    ad: "Zeynep",
                    soyad: "Yıldız",
                    eposta: "zeynep.yildiz@hepifarma.com",
                  },
                  error: null,
                }),
              }),
            }),
          };
        },
      }),
    }),
  } as unknown as SupabaseClient;
}

test("aliciYayinSiparisiEpostalariGonder hem alıcı üreticiye hem aktif Firma Adminine standart e-posta gönderir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.AGORA_PARTNER_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const { gidenler, fetchFn } = sahteEpostaYakala();

  process.env.RESEND_API_KEY = "test-key";
  process.env.AGORA_PARTNER_EMAIL_FROM = "Cogniti <bildirim@cogniti.net>";
  globalThis.fetch = fetchFn;

  try {
    await aliciYayinSiparisiEpostalariGonder({
      db: sahteAliciDb(true),
      siparisId: "55555555-5555-4555-8555-555555555555",
      aliciId: "uretici-1",
      borcaYazilanToken: 40,
    });

    assert.equal(gidenler.length, 2);
    assert.equal(gidenler[0].body.subject, "Agora Yayın Siparişiniz Tamamlandı");
    assert.deepEqual(gidenler[0].body.to, ["selin.arslan@hepifarma.com"]);
    assert.match(String(gidenler[0].body.text), /^Sayın Selin Arslan,/);
    assert.match(
      String(gidenler[0].body.text),
      /Eczanede Dermokozmetik Danışmanlığı \(PE-0042\) yayın siparişiniz tamamlanmış/,
    );
    assert.match(String(gidenler[0].body.text), /- İş partneri: Dr\. Elif Şahin Akademi/);
    assert.match(String(gidenler[0].body.text), /- Kullanılan token: 240 Token \(40 token borca yazıldı\)/);
    assert.match(String(gidenler[0].body.text), /Cogniti · bilgi taşır$/);

    assert.equal(gidenler[1].body.subject, "Firmanızda Yeni Agora Yayın Siparişi");
    assert.deepEqual(gidenler[1].body.to, ["zeynep.yildiz@hepifarma.com"]);
    assert.match(String(gidenler[1].body.text), /^Sayın Zeynep Yıldız,/);
    assert.match(String(gidenler[1].body.text), /Selin Arslan tarafından Agora üzerinden yeni bir yayın siparişi/);
    assert.match(String(gidenler[1].body.text), /- Sipariş tutarı: 12\.000,00 TL \(240 Token\)/);
    assert.match(String(gidenler[1].body.text), /Firma Yönetimi > Agora Proformaları/);
    assert.match(String(gidenler[1].body.text), /Cogniti · bilgi taşır$/);
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.AGORA_PARTNER_EMAIL_FROM;
    else process.env.AGORA_PARTNER_EMAIL_FROM = oncekiFrom;
  }
});

test("aliciCanliSiparisiEpostalariGonder canlı yayın siparişinde alıcıya ve aktifse Firma Adminine e-posta gönderir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.AGORA_PARTNER_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const { gidenler, fetchFn } = sahteEpostaYakala();

  process.env.RESEND_API_KEY = "test-key";
  process.env.AGORA_PARTNER_EMAIL_FROM = "Cogniti <bildirim@cogniti.net>";
  globalThis.fetch = fetchFn;

  try {
    await aliciCanliSiparisiEpostalariGonder({
      db: sahteAliciDb(true),
      siparisId: "66666666-6666-4666-8666-666666666666",
      aliciId: "uretici-1",
      borcaYazilanToken: 0,
    });

    assert.equal(gidenler.length, 2);
    assert.equal(gidenler[0].body.subject, "Agora Canlı Yayın Siparişiniz Oluşturuldu");
    assert.match(String(gidenler[0].body.text), /30 Kasım 2026 14:00 \(Türkiye saati\)/);
    assert.match(String(gidenler[0].body.text), /- Süre ve kontenjan: 60 dakika · 50 katılımcı/);
    assert.match(String(gidenler[0].body.text), /- Kullanılan token: 360 Token\n/);

    assert.equal(gidenler[1].body.subject, "Firmanızda Yeni Canlı Yayın Siparişi");
    assert.match(String(gidenler[1].body.text), /- Sipariş tutarı: 18\.000,00 TL \(360 Token\)/);
    assert.match(String(gidenler[1].body.text), /Firma Yönetimi > Token Yönetimi/);

    // firma_admin_aktif kapalıysa yalnız üreticiye gider
    gidenler.length = 0;
    await aliciCanliSiparisiEpostalariGonder({
      db: sahteAliciDb(false),
      siparisId: "77777777-7777-4777-8777-777777777777",
      aliciId: "uretici-1",
    });
    assert.equal(gidenler.length, 1);
    assert.deepEqual(gidenler[0].body.to, ["selin.arslan@hepifarma.com"]);
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.AGORA_PARTNER_EMAIL_FROM;
    else process.env.AGORA_PARTNER_EMAIL_FROM = oncekiFrom;
  }
});

test("SUREC15_TOAST mesajları borçlu ve borçsuz senaryoları doğru biçimler", () => {
  assert.equal(
    SUREC15_TOAST.yayinSiparisTamamlandi(0),
    "Yayın siparişiniz tamamlandı ve yayın havuzunuza eklendi.",
  );
  assert.equal(
    SUREC15_TOAST.yayinSiparisTamamlandi(40),
    "Yayın siparişiniz tamamlandı ve yayın havuzunuza eklendi. 40 token borca yazıldı.",
  );
  assert.equal(
    SUREC15_TOAST.canliSiparisTamamlandi("Saha Ekiplerinde Klinik İkna Atölyesi", 60),
    "“Saha Ekiplerinde Klinik İkna Atölyesi” canlı yayın oturumu için siparişiniz oluşturuldu. 60 token borca yazıldı.",
  );
  assert.equal(
    SUREC15_TOAST.yayinAyarlariKaydedildi,
    "Yayın ayarları kaydedildi; puan ve tarih seçerek yayına alabilirsiniz.",
  );
});
