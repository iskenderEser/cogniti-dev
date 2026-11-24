import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { panelDonusYolu } from "../lib/panel/donusYolu.ts";
import { bmOneriEpostasiGonder } from "../lib/tclub/oneri/oneriEposta.ts";

const YAYIN_1 = "11111111-1111-4111-8111-111111111111";
const YAYIN_2 = "22222222-2222-4222-8222-222222222222";
const ONERI_1 = "33333333-3333-4333-8333-333333333333";
const ONERI_2 = "44444444-4444-4444-8444-444444444444";

test("panelDonusYolu yalnız geçerli /ana-sayfa yayın adreslerini kabul eder", () => {
  const gecerli = `?donus=${encodeURIComponent(`/ana-sayfa?yayin_id=${YAYIN_1}&oneri_id=${ONERI_1}`)}`;
  assert.equal(panelDonusYolu(gecerli), `/ana-sayfa?yayin_id=${YAYIN_1}&oneri_id=${ONERI_1}`);

  assert.equal(panelDonusYolu("?donus=%2Fana-sayfa"), "/ana-sayfa");
  assert.equal(panelDonusYolu("?donus=https%3A%2F%2Fevil.example%2Fana-sayfa"), null);
  assert.equal(panelDonusYolu("?donus=%2F%2Fevil.example%2Fana-sayfa"), null);
  assert.equal(panelDonusYolu("?donus=%2Fadmin"), null);
  assert.equal(panelDonusYolu("?donus=%2Fana-sayfa%3Fyayin_id%3Ddegil"), null);
  assert.equal(panelDonusYolu(`?donus=${encodeURIComponent(`/ana-sayfa?yayin_id=${YAYIN_1}&baska=1`)}`), null);
});

test("bmOneriEpostasiGonder çoklu yayını ayrı satırlarda link ve tarihlerle tek e-postada gönderir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.COGNITI_UYELIK_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const gidenler: Array<{ url: string; headers: Record<string, string>; body: Record<string, unknown> }> = [];

  process.env.RESEND_API_KEY = "test-key";
  process.env.COGNITI_UYELIK_EMAIL_FROM = "Cogniti <bildirim@cogniti.net>";
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    gidenler.push({
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
  }) as typeof fetch;

  const mockDb = {
    from: () => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [
              { kullanici_id: "bm-1", ad: "Selin", soyad: "Arslan", eposta: "selin@hepifarma.com" },
              { kullanici_id: "utt-1", ad: "Ahmet", soyad: "Demir", eposta: "ahmet@hepifarma.com" },
            ],
            error: null,
          }),
      }),
    }),
  } as unknown as SupabaseClient;

  try {
    await bmOneriEpostasiGonder(mockDb, {
      onerenId: "bm-1",
      siteAdresi: "https://cogniti.net/",
      kayitlar: [
        {
          oneriId: ONERI_1,
          yayinId: YAYIN_1,
          aliciId: "utt-1",
          urunAdi: "CardioPlus",
          aracTuru: "video",
          oneriBaslangic: "2026-11-25T07:00:00+03:00",
          oneriBitis: "2026-11-28T20:30:00+03:00",
        },
        {
          oneriId: ONERI_2,
          yayinId: YAYIN_2,
          aliciId: "utt-1",
          urunAdi: "Hipertansiyon Güncel Yaklaşım",
          aracTuru: "podcast",
          oneriBaslangic: "2026-11-26T07:00:00+03:00",
          oneriBitis: "2026-11-29T20:30:00+03:00",
        },
      ],
    });

    assert.equal(gidenler.length, 1);
    assert.deepEqual(gidenler[0].body.to, ["ahmet@hepifarma.com"]);
    assert.equal(gidenler[0].body.subject, "Bölge Müdürünüz Önerisini İletti");
    assert.equal(gidenler[0].headers["Idempotency-Key"], `bm-oneri/${ONERI_1}-2`);

    const html = String(gidenler[0].body.html);
    assert.match(html, /Sayın Ahmet Demir,/);
    assert.match(html, /Bölge Müdürünüz Selin Arslan tarafından sizin için aşağıdaki yayınlar önerilmiştir/);
    assert.match(html, new RegExp(`https://cogniti\\.net/ana-sayfa\\?yayin_id=${YAYIN_1}&amp;oneri_id=${ONERI_1}`));
    assert.match(html, new RegExp(`https://cogniti\\.net/ana-sayfa\\?yayin_id=${YAYIN_2}&amp;oneri_id=${ONERI_2}`));
    assert.equal((html.match(/<li /g) ?? []).length, 2);
    assert.match(html, /Başlangıç tarihi: 25\.11\.2026 07:00 · Bitiş tarihi: 28\.11\.2026 20:30/);
    assert.match(html, /Başlangıç tarihi: 26\.11\.2026 07:00 · Bitiş tarihi: 29\.11\.2026 20:30/);
    assert.match(html, /Cogniti · bilgi taşır<\/p>$/);
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.COGNITI_UYELIK_EMAIL_FROM;
    else process.env.COGNITI_UYELIK_EMAIL_FROM = oncekiFrom;
  }
});
