import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eclubCekIptalEpostasiGonder } from "../lib/eclub/store/cekIptalEposta.ts";

test("eclubCekIptalEpostasiGonder ana eczacıya iptal ve puan iadesi e-postası gönderir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.ECLUB_CEK_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const gidenler: Array<{ url: string; headers: Record<string, string>; body: Record<string, unknown> }> = [];

  process.env.RESEND_API_KEY = "test-key";
  process.env.ECLUB_CEK_EMAIL_FROM = "Cogniti <odul@cogniti.net>";
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    gidenler.push({
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
  }) as typeof fetch;

  const mockDb = {
    from: (tablo: string) => {
      if (tablo === "eclub_store_cek_talepleri") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    talep_id: "talep-100",
                    eczane_id: "eczane-1",
                    talep_eden_kisi_id: "kisi-1",
                    talep_edilen_cek_tl: 500,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { eclub_kisiler: { kisi_id: "kisi-2", ad: "Can", soyad: "Demir", eposta: "can@eczane.com", rol: "eczane_teknisyeni" } },
                  { eclub_kisiler: { kisi_id: "kisi-1", ad: "Ayşe", soyad: "Kaya", eposta: "ayse@eczane.com", rol: "eczaci" } },
                ],
                error: null,
              }),
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;

  try {
    await eclubCekIptalEpostasiGonder(mockDb, "talep-100");
    assert.equal(gidenler.length, 1);
    assert.deepEqual(gidenler[0].body.to, ["ayse@eczane.com"]);
    assert.equal(gidenler[0].body.subject, "E-Club Çek Talebiniz İptal Edildi");
    assert.equal(gidenler[0].headers["Idempotency-Key"], "eclub-cek-iptal/talep-100");
    assert.match(String(gidenler[0].body.text), /Sayın Ayşe Kaya,/);
    assert.match(String(gidenler[0].body.text), /500 TL tutarındaki E-Club hediye çeki talebiniz iptal edilmiştir/);
    assert.match(String(gidenler[0].body.text), /Cogniti · bilgi taşır$/);
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.ECLUB_CEK_EMAIL_FROM;
    else process.env.ECLUB_CEK_EMAIL_FROM = oncekiFrom;
  }
});
