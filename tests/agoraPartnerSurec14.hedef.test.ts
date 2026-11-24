import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  partnerAdminYayinDurumEpostasiGonder,
  partnerBasvuruAlindiEpostalariGonder,
  partnerBasvuruRetEpostasiGonder,
  partnerCanliSiparisiEpostasiGonder,
  partnerErisimDurumEpostasiGonder,
  partnerYayinSiparisiEpostasiGonder,
} from "../lib/agora/partnerEposta.ts";
import { SUREC14_TOAST } from "../lib/bildirimler/toastMesajlari.ts";

function sahteEpostaYakala() {
  const gidenler: Array<{ headers: Record<string, string>; body: Record<string, unknown> }> = [];
  const fetchFn = (async (_url: string | URL | Request, init?: RequestInit) => {
    gidenler.push({
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify({ id: "email-agora-1" }), { status: 200 });
  }) as typeof fetch;
  return { gidenler, fetchFn };
}

test("partnerBasvuruAlindiEpostalariGonder ve partnerBasvuruRetEpostasiGonder standart e-postaları gönderir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.AGORA_PARTNER_EMAIL_FROM;
  const oncekiAdmin = process.env.COGNITI_ADMIN_EMAIL;
  const oncekiFetch = globalThis.fetch;
  const { gidenler, fetchFn } = sahteEpostaYakala();

  process.env.RESEND_API_KEY = "test-key";
  process.env.AGORA_PARTNER_EMAIL_FROM = "Cogniti <bildirim@cogniti.net>";
  process.env.COGNITI_ADMIN_EMAIL = "yonetim@cogniti.net";
  globalThis.fetch = fetchFn;

  try {
    await partnerBasvuruAlindiEpostalariGonder("11111111-1111-4111-8111-111111111111", {
      tur: "kisisel",
      ad_soyad: "Dr. Elif Şahin",
      cep_telefonu: "+905321112233",
      eposta: "elif.sahin@akademi.com",
      uzmanliklar: ["Klinik İletişim", "Medikal Eğitim"],
      kvkk_onay: true,
    });

    assert.equal(gidenler.length, 2);
    assert.equal(gidenler[0].body.subject, "Cogniti İş Partnerliği Başvurunuz Alındı");
    assert.deepEqual(gidenler[0].body.to, ["elif.sahin@akademi.com"]);
    assert.match(String(gidenler[0].body.text), /^Sayın Dr\. Elif Şahin,/);
    assert.match(String(gidenler[0].body.text), /Cogniti · bilgi taşır$/);
    assert.equal(
      gidenler[0].headers["Idempotency-Key"],
      "agora-partner-basvuru-aday/11111111-1111-4111-8111-111111111111",
    );

    assert.equal(gidenler[1].body.subject, "Yeni İş Partnerliği Başvurusu - Dr. Elif Şahin");
    assert.deepEqual(gidenler[1].body.to, ["yonetim@cogniti.net"]);
    assert.equal(gidenler[1].body.reply_to, "elif.sahin@akademi.com");
    assert.match(String(gidenler[1].body.text), /- Uzmanlıklar: Klinik İletişim, Medikal Eğitim/);

    gidenler.length = 0;
    await partnerBasvuruRetEpostasiGonder({
      partnerId: "11111111-1111-4111-8111-111111111111",
      eposta: "elif.sahin@akademi.com",
      adSoyad: "Dr. Elif Şahin",
      surum: 2,
    });

    assert.equal(gidenler.length, 1);
    assert.equal(gidenler[0].body.subject, "Cogniti İş Partnerliği Başvurunuz Hakkında");
    assert.match(String(gidenler[0].body.text), /^Sayın Dr\. Elif Şahin,/);
    assert.match(String(gidenler[0].body.text), /şu aşamada olumlu sonuçlandırılamamıştır\./);
    assert.match(String(gidenler[0].body.text), /Cogniti · bilgi taşır$/);
    assert.equal(
      gidenler[0].headers["Idempotency-Key"],
      "agora-partner-basvuru-ret/11111111-1111-4111-8111-111111111111/v2",
    );
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.AGORA_PARTNER_EMAIL_FROM;
    else process.env.AGORA_PARTNER_EMAIL_FROM = oncekiFrom;
    if (oncekiAdmin === undefined) delete process.env.COGNITI_ADMIN_EMAIL;
    else process.env.COGNITI_ADMIN_EMAIL = oncekiAdmin;
  }
});

test("Erişim durumu, admin yayın durumu ve Agora sipariş e-postaları RPC üzerinden doğru içerikle gönderilir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.AGORA_PARTNER_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const { gidenler, fetchFn } = sahteEpostaYakala();

  process.env.RESEND_API_KEY = "test-key";
  process.env.AGORA_PARTNER_EMAIL_FROM = "Cogniti <bildirim@cogniti.net>";
  globalThis.fetch = fetchFn;

  const mockDb = {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === "agora_partner_erisim_bilgileri") {
        return {
          data: {
            ad_soyad: "Dr. Elif Şahin",
            eposta: "elif.sahin@akademi.com",
          },
          error: null,
        };
      }
      if (fn === "agora_eposta_bildirim_oku" && args.p_tur === "yayin_siparis") {
        return {
          data: {
            siparis_id: args.p_id,
            partner_egitim_id: "AG-0042",
            egitim_adi: "Eczanede Dermokozmetik Danışmanlığı",
            yayin_araci: "video",
            satin_alma_bedeli: 12000,
            odenecek_tutar: 8400,
            partner_ad_soyad: "Dr. Elif Şahin",
            partner_eposta: "elif.sahin@akademi.com",
            alici_firma_adi: "Hepifarma İlaç",
          },
          error: null,
        };
      }
      if (fn === "agora_eposta_bildirim_oku" && args.p_tur === "canli_siparis") {
        return {
          data: {
            siparis_id: args.p_id,
            partner_egitim_id: "AGC-0018",
            egitim_adi: "Saha Ekiplerinde Klinik İkna Atölyesi",
            baslangic_at: "2026-11-30T11:00:00Z",
            sure_dakika: 60,
            kapasite: 50,
            satin_alma_bedeli: 18000,
            odenecek_tutar: 12600,
            partner_ad_soyad: "Dr. Elif Şahin",
            partner_eposta: "elif.sahin@akademi.com",
            alici_firma_adi: "Hepifarma İlaç",
          },
          error: null,
        };
      }
      return { data: null, error: null };
    },
  } as unknown as SupabaseClient;

  try {
    await partnerErisimDurumEpostasiGonder(
      mockDb,
      "admin-1",
      "11111111-1111-4111-8111-111111111111",
      false,
      3,
    );
    await partnerErisimDurumEpostasiGonder(
      mockDb,
      "admin-1",
      "11111111-1111-4111-8111-111111111111",
      true,
      4,
    );
    assert.equal(gidenler[0].body.subject, "Cogniti Partner Erişiminiz Pasife Alındı");
    assert.equal(gidenler[1].body.subject, "Cogniti Partner Erişiminiz Aktif Edildi");
    assert.match(String(gidenler[1].body.text), /yeniden aktif edilmiştir\./);

    gidenler.length = 0;
    await partnerAdminYayinDurumEpostasiGonder({
      db: mockDb,
      adminId: "admin-1",
      partnerId: "11111111-1111-4111-8111-111111111111",
      egitimId: "22222222-2222-4222-8222-222222222222",
      egitimAdi: "Eczanede Dermokozmetik Danışmanlığı",
      partnerEgitimId: "AG-0042",
      islem: "pasif",
      surum: 5,
    });
    assert.equal(gidenler.length, 1);
    assert.equal(gidenler[0].body.subject, "Cogniti Agora Yayın Durumunuz Güncellendi");
    assert.match(
      String(gidenler[0].body.text),
      /Eczanede Dermokozmetik Danışmanlığı \(AG-0042\) yayınınız Cogniti yönetimi tarafından pasife alınmıştır\./,
    );

    gidenler.length = 0;
    await partnerYayinSiparisiEpostasiGonder(
      mockDb,
      "33333333-3333-4333-8333-333333333333",
    );
    assert.equal(gidenler.length, 1);
    assert.equal(gidenler[0].body.subject, "Agora Yayınınız İçin Sipariş Alındı");
    assert.match(String(gidenler[0].body.text), /- Yayın türü: Video/);
    assert.match(String(gidenler[0].body.text), /- Satış tutarı: 12\.000,00 TL/);
    assert.match(String(gidenler[0].body.text), /- Net hak edişiniz: 8\.400,00 TL/);

    gidenler.length = 0;
    await partnerCanliSiparisiEpostasiGonder(
      mockDb,
      "44444444-4444-4444-8444-444444444444",
    );
    assert.equal(gidenler.length, 1);
    assert.equal(gidenler[0].body.subject, "Agora Canlı Yayın Oturumunuz Sipariş Edildi");
    assert.match(String(gidenler[0].body.text), /30 Kasım 2026 14:00 \(Türkiye saati\)/);
    assert.match(String(gidenler[0].body.text), /- Süre ve kontenjan: 60 dakika · 50 katılımcı/);
    assert.match(String(gidenler[0].body.text), /- Satış tutarı: 18\.000,00 TL/);
    assert.match(String(gidenler[0].body.text), /- Net hak edişiniz: 12\.600,00 TL/);
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.AGORA_PARTNER_EMAIL_FROM;
    else process.env.AGORA_PARTNER_EMAIL_FROM = oncekiFrom;
  }
});

test("Süreç 14: Onay e-postası şablonu, SQL güvenlik sözleşmesi ve SUREC14_TOAST doğrulanır", () => {
  assert.equal(
    SUREC14_TOAST.basvuruAlindi,
    "İş partnerliği başvurunuz alındı. Bilgilendirme e-postası adresinize gönderildi.",
  );
  assert.equal(
    SUREC14_TOAST.basvuruReddedildiAdli("Dr. Elif Şahin"),
    "Dr. Elif Şahin başvurusu reddedildi ve bilgilendirme e-postası gönderildi.",
  );

  const sql = fs.readFileSync(
    path.join(process.cwd(), "scripts/sql/agora_eposta_bildirim_okuma.sql"),
    "utf8",
  );
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.agora_eposta_bildirim_oku/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /SET search_path = ''/);
  assert.match(
    sql,
    /REVOKE ALL ON FUNCTION public\.agora_eposta_bildirim_oku\(text, uuid\) FROM PUBLIC, anon, authenticated, service_role;/,
  );
  assert.match(
    sql,
    /GRANT EXECUTE ON FUNCTION public\.agora_eposta_bildirim_oku\(text, uuid\) TO service_role;/,
  );

  const partnerRoute = fs.readFileSync(
    path.join(process.cwd(), "app/admin/api/partnerler/route.ts"),
    "utf8",
  );
  assert.match(partnerRoute, /subject: "Cogniti İş Partnerliği Başvurunuz Onaylandı"/);
  assert.match(partnerRoute, />Şifremi oluştur<\/a>/);
  assert.match(partnerRoute, /Idempotency-Key/);
  assert.equal((partnerRoute.match(/Cogniti · bilgi taşır/g) ?? []).length, 2);
});
