import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { davetHash } from "@/lib/eclub/uyelikDaveti";
import {
  ECZANEM_KVKK_ONAY_HATASI,
  eczanemDavetSifresiniKaydet,
  eczanemDavetTokeniMi,
  eczanemUyelikDavetiGonder,
} from "@/lib/eczanem/uyelikDaveti";
import { eczaneAktifUyeler } from "@/lib/eczanem/gonderim";
import { baglamaTalebiEpostasiGonder } from "@/lib/eczanem/baglamaTalebiEposta";
import {
  eczanemTelefonSorguIzniAl,
  TELEFON_SORGU_ECZANE_LIMIT,
  TELEFON_SORGU_KISI_LIMIT,
  TELEFON_SORGU_PENCERE_DAKIKA,
  telefonSorguHash,
} from "@/lib/eczanem/telefonSorguSiniri";
import { digerKimlikTelefonuMu } from "@/lib/eczanem/eclubUyesiKontrol";
import { eczanemUyelikDurumEpostasiGonder } from "@/lib/eczanem/uyelikDurumEposta";

const token = "E".repeat(43);

function fixture() {
  let durum = "bekliyor";
  let authHatasi = false;
  let bitisHatasi = false;
  let musteriAktif = true;
  let uyelikAktif = true;
  const metadata: Record<string, unknown> = { eczanem_davet_bekliyor: true, provider: "email" };
  const updates: Record<string, unknown>[] = [];
  const calls: string[] = [];
  const row = { auth_user_id: "auth-m1", davet_id: "eczanem-davet-1", eposta: "danisan@example.invalid" };

  const db = {
    auth: {
      admin: {
        getUserById: async () => ({
          data: {
            user: {
              email: row.eposta,
              app_metadata: { ...metadata },
              user_metadata: { ad: "Ayşe", soyad: "Demir", ad_soyad: "Ayşe Demir" },
            },
          },
          error: null,
        }),
        updateUserById: async (_id: string, body: Record<string, unknown>) => {
          updates.push(body);
          if (authHatasi) return { error: { message: "auth error", status: 422 } };
          Object.assign(metadata, body.app_metadata);
          return { error: null };
        },
      },
    },
    from: (table: string) => {
      const filtreler: Record<string, unknown> = {};
      const q = {
        select: () => q,
        eq: (alan: string, deger: unknown) => {
          filtreler[alan] = deger;
          return q;
        },
        maybeSingle: async () => {
          if (table === "eczanem_uyelik_davetleri") {
            return {
              data: filtreler.token_hash === davetHash(token) ? { auth_user_id: row.auth_user_id } : null,
              error: null,
            };
          }
          if (table === "eczanem_musteriler") {
            return { data: { musteri_id: "m1", aktif_mi: musteriAktif }, error: null };
          }
          return { data: null, error: null };
        },
        limit: async () => {
          if (table === "eczanem_uyelikler") {
            return { data: uyelikAktif ? [{ uyelik_id: "u1" }] : [], error: null };
          }
          return { data: [], error: null };
        },
        update: () => q,
        then: (fn: (r: unknown) => unknown) => Promise.resolve({ error: null }).then(fn),
      };
      return q;
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push(name);
      if (name === "eczanem_davet_yenile") return { data: row.davet_id, error: null };
      if (name === "eczanem_davet_islem_al") {
        if (args.p_hash !== davetHash(token) || durum !== "bekliyor") return { data: [], error: null };
        durum = "isleniyor";
        return { data: [row], error: null };
      }
      if (bitisHatasi) return { data: null, error: { message: "db error" } };
      durum = args.p_basarili ? "tamamlandi" : "bekliyor";
      return { data: true, error: null };
    },
  } as unknown as SupabaseClient;

  return {
    db,
    updates,
    calls,
    metadata,
    setAuthHatasi: (v: boolean) => { authHatasi = v; },
    setBitisHatasi: (v: boolean) => { bitisHatasi = v; },
    setMusteriAktif: (v: boolean) => { musteriAktif = v; },
    setUyelikAktif: (v: boolean) => { uyelikAktif = v; },
    recoverLease: () => { durum = "bekliyor"; },
  };
}

test("hatalı token, KVKK onayı eksik, zayıf/kısa/ardışık veya eşleşmeyen şifre Auth ve DB'ye hiç ulaşmaz", async () => {
  const f = fixture();
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, "bad", "GucluParola92", "GucluParola92", true));
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "GucluParola92", false), new RegExp(ECZANEM_KVKK_ONAY_HATASI));
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "GucluParola92", undefined), new RegExp(ECZANEM_KVKK_ONAY_HATASI));
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "GucluParola92", "true"), new RegExp(ECZANEM_KVKK_ONAY_HATASI));
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "123456", "123456", true));
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "Sifre1234", "Sifre1234", true));
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "sadeceharf", "sadeceharf", true));
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "BaskaParola84", true));
  assert.equal(f.calls.length, 0);
  assert.equal(f.updates.length, 0);
});

test("şifre ve etkinleşme tek Auth güncellemesinde tamamlanır; token tekrar kullanılamaz", async () => {
  const f = fixture();
  assert.equal(await eczanemDavetTokeniMi(f.db, token), true);
  assert.equal(await eczanemDavetTokeniMi(f.db, "X".repeat(43)), false);

  await eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "GucluParola92", true);
  assert.equal(f.updates.length, 1);
  assert.deepEqual(f.updates[0], {
    password: "GucluParola92",
    email_confirm: true,
    ban_duration: "none",
    app_metadata: {
      provider: "email",
      eczanem_davet_bekliyor: false,
      eczanem_davet_tamamlandi: "eczanem-davet-1",
    },
  });

  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "YeniParola73", "YeniParola73", true));
  assert.equal(f.updates.length, 1);
});

test("eşzamanlı iki istekten yalnız biri şifre yazar", async () => {
  const f = fixture();
  const results = await Promise.allSettled([
    eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "GucluParola92", true),
    eczanemDavetSifresiniKaydet(f.db, token, "DigerParola84", "DigerParola84", true),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(f.updates.length, 1);
});

test("Auth hatasında davet yeniden denenebilir; DB sonlandırma hatasında şifre tekrar yazılmaz", async () => {
  const f = fixture();
  f.setAuthHatasi(true);
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "GucluParola92", true));
  assert.equal(f.metadata.eczanem_davet_bekliyor, true);

  f.setAuthHatasi(false);
  f.setBitisHatasi(true);
  await assert.rejects(eczanemDavetSifresiniKaydet(f.db, token, "GucluParola92", "GucluParola92", true));

  const before = f.updates.length;
  f.setBitisHatasi(false);
  f.recoverLease();
  await eczanemDavetSifresiniKaydet(f.db, token, "YeniParola73", "YeniParola73", true);
  assert.equal(f.updates.length, before);
});

test("pasife alınmış eczane üyeliği veya kapalı hesap davetten etkinleşemez", async () => {
  const f1 = fixture();
  f1.setUyelikAktif(false);
  await assert.rejects(eczanemDavetSifresiniKaydet(f1.db, token, "GucluParola92", "GucluParola92", true), /pasife/);
  assert.equal(f1.updates.length, 0);

  const f2 = fixture();
  f2.setMusteriAktif(false);
  await assert.rejects(eczanemDavetSifresiniKaydet(f2.db, token, "GucluParola92", "GucluParola92", true), /aktif değil/);
  assert.equal(f2.updates.length, 0);
});

test("mevcut hazır hesap için yeni davet veya şifre güncellemesi yapılmaz", async () => {
  const f = fixture();
  f.metadata.eczanem_davet_bekliyor = false;
  await assert.rejects(eczanemUyelikDavetiGonder(f.db, "auth-m1", "http://localhost:3000"), /zaten hazır/);
  assert.equal(f.calls.length, 0);
  assert.equal(f.updates.length, 0);
});

test("davet e-postası standart konu/gövde ile gönderilir; gönderim hatası üye kaydını kaybetmez ve token yanıta sızmaz", async () => {
  const f = fixture();
  const previousFetch = globalThis.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  const oldFrom = process.env.ECZANEM_DAVET_EMAIL_FROM;
  process.env.RESEND_API_KEY = "test-key";
  process.env.ECZANEM_DAVET_EMAIL_FROM = "Cogniti <noreply@cogniti.net>";

  let payload: Record<string, string> = {};
  globalThis.fetch = async (_url, init) => {
    payload = JSON.parse(String(init?.body ?? "{}")) as Record<string, string>;
    return Response.json({ id: "mail_1" }, { status: 200 });
  };

  try {
    const basarili = await eczanemUyelikDavetiGonder(f.db, "auth-m1", "http://localhost:3000", "Şifa Eczanesi");
    assert.equal(basarili.gonderildi, true);
    assert.equal(payload.subject, "Cogniti Eczanem Üyelik Davetiniz");
    assert.match(payload.html, /Sayın Ayşe Demir,/);
    assert.match(payload.html, /Şifa Eczanesi tarafından Cogniti Eczanem üyeliğiniz oluşturuldu/);
    assert.match(payload.html, /sifre-olustur\?token=/);
    assert.match(payload.html, /Cogniti · bilgi taşır/);
    assert.match(payload.text, /Sayın Ayşe Demir,/);
    assert.match(payload.text, /Cogniti · bilgi taşır/);
    assert.ok(!JSON.stringify(basarili).includes("?token="));

    globalThis.fetch = async () => Response.json({}, { status: 503 });
    const hatali = await eczanemUyelikDavetiGonder(f.db, "auth-m1", "http://localhost:3000", "Şifa Eczanesi");
    assert.equal(hatali.gonderildi, false);
    assert.match(hatali.mesaj, /Üye kaydedildi/);
    assert.ok(!JSON.stringify(hatali).includes("?token="));
    assert.equal(f.updates.length, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldKey;
    if (oldFrom === undefined) delete process.env.ECZANEM_DAVET_EMAIL_FROM;
    else process.env.ECZANEM_DAVET_EMAIL_FROM = oldFrom;
  }
});

test("Adım 1 sözleşmesi: geçici şifre kaldırıldı, kilitli hesap + davet akışı kuruldu", () => {
  const musteriRoute = readFileSync("app/(panel)/eczanem/eczane/api/musteri-ekle/route.ts", "utf8");
  const uyelerSayfa = readFileSync("app/(panel)/eczanem/eczane/uyeler/page.tsx", "utf8");
  const sifreOlusturApi = readFileSync("app/sifre-olustur/api/route.ts", "utf8");
  const proxy = readFileSync("proxy.ts", "utf8");
  const sql = readFileSync("scripts/sql/eczanem_uyelik_daveti.sql", "utf8");

  assert.doesNotMatch(musteriRoute, /body\?\.sifre/);
  assert.doesNotMatch(musteriRoute, /password:\s*sifre/);
  assert.doesNotMatch(musteriRoute, /email_confirm:\s*true/);
  assert.match(musteriRoute, /eczanem_davet_bekliyor:\s*true/);
  assert.match(musteriRoute, /ban_duration:\s*"876000h"/);
  assert.match(musteriRoute, /email_confirm:\s*false/);
  assert.match(musteriRoute, /kayitSonrasiEczanemDavetiGonder/);

  assert.doesNotMatch(uyelerSayfa, /Geçici şifre/);
  assert.doesNotMatch(uyelerSayfa, /musteri-sifre/);

  assert.match(sifreOlusturApi, /eczanemDavetTokeniMi/);
  assert.match(sifreOlusturApi, /eczanemDavetSifresiniKaydet/);
  assert.match(proxy, /eczanem_davet_bekliyor === true/);

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.eczanem_uyelik_davetleri/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_davet_bekleyen_kayit/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_davet_yenile/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_davet_islem_al/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_davet_islem_bitir/);
});

test("Adım 2 sözleşmesi: KVKK onayı davet beklerken NULL, danışan kendi onaylayınca atomik yazılır", () => {
  const kvkkSql = readFileSync("scripts/sql/eczanem_kvkk_onay_akisi.sql", "utf8");
  const sifreSayfa = readFileSync("app/sifre-olustur/page.tsx", "utf8");
  const sifreApi = readFileSync("app/sifre-olustur/api/route.ts", "utf8");
  const kart = readFileSync("components/auth/DavetSifreKarti.tsx", "utf8");

  assert.match(kvkkSql, /ALTER COLUMN kvkk_onay_tarihi DROP NOT NULL/);
  assert.match(kvkkSql, /CASE WHEN v_davet_bekliyor THEN NULL ELSE now\(\) END/);
  assert.match(kvkkSql, /SET kvkk_onay_tarihi = COALESCE\(kvkk_onay_tarihi, now\(\)\)/);

  assert.match(sifreSayfa, /eczanemDavetTokeniMi/);
  assert.match(sifreSayfa, /kvkkOnayiGerekli=\{kvkkOnayiGerekli\}/);
  assert.match(sifreApi, /eczanemDavetSifresiniKaydet\(db, body\.token, body\.sifre, body\.tekrar, body\.kvkk_onay\)/);
  assert.match(kart, /YASAL_METINLER/);
  assert.match(kart, /kvkk_onay: kvkkOnay/);
});

test("Adım 3: davet bekleyen üye eczaneAktifUyeler dağıtım listesine dahil edilmez", async () => {
  const db = {
    from: (table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        in: () => q,
        neq: () => q,
        then: (fn: (r: unknown) => unknown) => {
          if (table === "eczanem_uyelikler") {
            return Promise.resolve({ data: [{ musteri_id: "m-aktif" }, { musteri_id: "m-davet" }], error: null }).then(fn);
          }
          if (table === "eczanem_musteriler") {
            return Promise.resolve({
              data: [
                { musteri_id: "m-aktif", ad_soyad: "Aktif Üye", telefon: "5321112233", auth_user_id: "auth-aktif" },
                { musteri_id: "m-davet", ad_soyad: "Bekleyen Üye", telefon: "5324445566", auth_user_id: "auth-davet" },
              ],
              error: null,
            }).then(fn);
          }
          if (table === "eczanem_uyelik_davetleri") {
            return Promise.resolve({ data: [{ auth_user_id: "auth-davet" }], error: null }).then(fn);
          }
          return Promise.resolve({ data: [], error: null }).then(fn);
        },
      };
      return q;
    },
  } as unknown as SupabaseClient;

  const uyeler = await eczaneAktifUyeler(db, "eczane-1");
  assert.deepEqual(
    uyeler.map((u) => u.musteri_id),
    ["m-aktif"],
  );
});

test("Adım 3 sözleşmesi: davet durumu, eşik/dağıtım hariç tutma, yeniden gönderim, düzeltme ve iptal kurulu", () => {
  const sql = readFileSync("scripts/sql/eczanem_davet_yonetimi.sql", "utf8");
  const davetApi = readFileSync("app/(panel)/eczanem/eczane/api/davet/route.ts", "utf8");
  const musterilerApi = readFileSync("app/(panel)/eczanem/eczane/api/musteriler/route.ts", "utf8");
  const musteriEkleApi = readFileSync("app/(panel)/eczanem/eczane/api/musteri-ekle/route.ts", "utf8");
  const gonderim = readFileSync("lib/eczanem/gonderim.ts", "utf8");
  const uyelerSayfa = readFileSync("app/(panel)/eczanem/eczane/uyeler/page.tsx", "utf8");

  assert.match(sql, /CREATE OR REPLACE VIEW public\.v_eczanem_musteri_liste_admin/);
  assert.match(sql, /AS davet_bekliyor/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_utt_eczaneye_gonder/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_musterilere_video_gonder/);
  assert.match(sql, /eczanem_eclub_gecis_talepleri/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_bekleyen_davet_bilgi_guncelle/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_bekleyen_davet_iptal/);
  assert.match(sql, /'davet_guncellendi'/);
  assert.match(sql, /'davet_iptal_edildi'/);

  assert.match(davetApi, /export async function POST/);
  assert.match(davetApi, /export async function PATCH/);
  assert.match(davetApi, /export async function DELETE/);
  assert.match(davetApi, /eczanem_bekleyen_davet_bilgi_guncelle/);
  assert.match(davetApi, /eczanem_bekleyen_davet_iptal/);
  assert.match(davetApi, /auth\.admin\.deleteUser/);

  assert.match(musterilerApi, /davet_bekliyor/);
  assert.match(musteriEkleApi, /mevcutDavetBekliyor/);
  assert.match(gonderim, /bekleyenDavetAuthIdleri/);

  assert.match(uyelerSayfa, /Davet Bekliyor/);
  assert.match(uyelerSayfa, /\/eczanem\/eczane\/api\/davet/);
  assert.doesNotMatch(uyelerSayfa, /window\.(alert|confirm|prompt)/);
});

test("Adım 4: bağlama ve yeniden aktifleştirme onay talebi e-postası standart formatla gönderilir", async () => {
  const f = fixture();
  const previousFetch = globalThis.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  const oldFrom = process.env.ECZANEM_DAVET_EMAIL_FROM;
  process.env.RESEND_API_KEY = "test-key";
  process.env.ECZANEM_DAVET_EMAIL_FROM = "Cogniti <noreply@cogniti.net>";

  const gonderilenler: Array<{ payload: Record<string, string>; idempotency: string }> = [];
  globalThis.fetch = async (_url, init) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    gonderilenler.push({
      payload: JSON.parse(String(init?.body ?? "{}")) as Record<string, string>,
      idempotency: headers["Idempotency-Key"] ?? "",
    });
    return Response.json({ id: "mail_baglama" }, { status: 200 });
  };

  try {
    const yeniBag = await baglamaTalebiEpostasiGonder(f.db, {
      authUserId: "auth-m1",
      talepId: "talep-1",
      talepTuru: "yeni_bag",
      eczaneAdi: "Şifa Eczanesi",
      origin: "http://localhost:3000",
    });
    assert.equal(yeniBag.gonderildi, true);

    const yenidenAktif = await baglamaTalebiEpostasiGonder(f.db, {
      authUserId: "auth-m1",
      talepId: "talep-2",
      talepTuru: "yeniden_aktivasyon",
      eczaneAdi: "Şifa Eczanesi",
      origin: "http://localhost:3000",
    });
    assert.equal(yenidenAktif.gonderildi, true);

    assert.equal(gonderilenler.length, 2);
    assert.equal(gonderilenler[0].idempotency, "eczanem-baglama-talebi/talep-1");
    assert.equal(gonderilenler[0].payload.subject, "Cogniti Eczanem Bağlantı Onay Talebi");
    assert.match(gonderilenler[0].payload.html, /Sayın Ayşe Demir,/);
    assert.match(gonderilenler[0].payload.html, /üye listesine eklemek istiyor/);
    assert.match(gonderilenler[0].payload.html, /Cogniti · bilgi taşır/);
    assert.match(gonderilenler[0].payload.text, /\/eczanem/);

    assert.equal(gonderilenler[1].idempotency, "eczanem-baglama-talebi/talep-2");
    assert.match(gonderilenler[1].payload.html, /yeniden aktifleştirmek istiyor/);
    assert.match(gonderilenler[1].payload.text, /Cogniti · bilgi taşır/);
  } finally {
    globalThis.fetch = previousFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldKey;
    if (oldFrom === undefined) delete process.env.ECZANEM_DAVET_EMAIL_FROM;
    else process.env.ECZANEM_DAVET_EMAIL_FROM = oldFrom;
  }
});

test("Adım 4 sözleşmesi: yeni bağ ve yeniden aktifleştirme üye onayı olmadan aktifleşmez", () => {
  const sql = readFileSync("scripts/sql/eczanem_baglama_onay_talepleri.sql", "utf8");
  const uyeApi = readFileSync("app/eczanem/api/baglama-talepleri/route.ts", "utf8");
  const uyeKart = readFileSync("app/eczanem/_components/EczaneBaglamaTalepleriKarti.tsx", "utf8");
  const anaSayfa = readFileSync("app/eczanem/page.tsx", "utf8");
  const kapaliSayfa = readFileSync("app/eczanem/kapali/page.tsx", "utf8");
  const proxy = readFileSync("proxy.ts", "utf8");
  const musteriEkleApi = readFileSync("app/(panel)/eczanem/eczane/api/musteri-ekle/route.ts", "utf8");
  const musterilerApi = readFileSync("app/(panel)/eczanem/eczane/api/musteriler/route.ts", "utf8");

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.eczanem_baglama_talepleri/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS ux_eczanem_baglama_tek_bekleyen/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_baglama_talebi_olustur/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_baglama_talebi_karar_ver/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_baglama_talebi_iptal_et/);

  assert.match(uyeApi, /eczanem_baglama_talebi_karar_ver/);
  assert.match(uyeKart, /\/eczanem\/api\/baglama-talepleri/);
  assert.doesNotMatch(uyeKart, /window\.(alert|confirm|prompt)/);
  assert.match(anaSayfa, /EczaneBaglamaTalepleriKarti/);
  assert.match(kapaliSayfa, /EczaneBaglamaTalepleriKarti/);
  assert.match(proxy, /pathname\.startsWith\("\/eczanem\/api\/baglama-talepleri"\)/);

  assert.match(musteriEkleApi, /eczanem_baglama_talebi_olustur/);
  assert.match(musteriEkleApi, /baglamaTalebiEpostasiGonder/);
  assert.match(musterilerApi, /if \(body\.aktif_mi === true\)/);
  assert.match(musterilerApi, /eczanem_baglama_talebi_olustur/);
});

test("Adım 5: telefon sorgu hız sınırı numarayı açık taşımaz, izinli/red ve hata durumlarını yönetir", async () => {
  const ozet = telefonSorguHash("5321234567");
  assert.equal(ozet.length, 64);
  assert.match(ozet, /^[0-9a-f]{64}$/);
  assert.ok(!ozet.includes("5321234567"));

  let sonArgs: Record<string, unknown> = {};
  let mod: "izinli" | "limit" | "hata" = "izinli";
  const db = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      assert.equal(name, "eczanem_telefon_sorgu_kontrol");
      sonArgs = args;
      if (mod === "hata") return { data: null, error: { message: "db down" } };
      if (mod === "limit") return { data: [{ izinli: false, kalan: 0, hata: "Sınır aşıldı." }], error: null };
      return { data: [{ izinli: true, kalan: 19, hata: null }], error: null };
    },
  } as unknown as SupabaseClient;

  const r1 = await eczanemTelefonSorguIzniAl(db, { eczaneId: "e1", kisiId: "k1", telefon: "5321234567" });
  assert.equal(r1.ok, true);
  assert.equal(r1.izinli, true);
  assert.equal(r1.kalan, 19);
  assert.equal(sonArgs.p_telefon_hash, ozet);
  assert.equal(sonArgs.p_pencere_dakika, TELEFON_SORGU_PENCERE_DAKIKA);
  assert.equal(sonArgs.p_kisi_limit, TELEFON_SORGU_KISI_LIMIT);
  assert.equal(sonArgs.p_eczane_limit, TELEFON_SORGU_ECZANE_LIMIT);

  mod = "limit";
  const r2 = await eczanemTelefonSorguIzniAl(db, { eczaneId: "e1", kisiId: "k1", telefon: "5321234567" });
  assert.equal(r2.ok, true);
  assert.equal(r2.izinli, false);
  assert.equal(r2.hata, "Sınır aşıldı.");

  mod = "hata";
  const r3 = await eczanemTelefonSorguIzniAl(db, { eczaneId: "e1", kisiId: "k1", telefon: "5321234567" });
  assert.equal(r3.ok, false);
  assert.equal(r3.izinli, false);
});

test("Adım 5 sözleşmesi: sorgulama sınırı E-Club/Eczanem varlık kontrolünden önce çalışır ve 429 döner", () => {
  const route = readFileSync("app/(panel)/eczanem/eczane/api/musteri-ekle/route.ts", "utf8");
  const sql = readFileSync("scripts/sql/eczanem_telefon_sorgu_siniri.sql", "utf8");

  const postGovde = route.slice(route.indexOf("export async function POST"));
  const sinirSirasi = postGovde.indexOf("eczanemTelefonSorguIzniAl");
  const eclubSirasi = postGovde.indexOf("eclubUyesiTelefonMu");
  assert.ok(sinirSirasi > 0 && eclubSirasi > sinirSirasi);
  assert.match(route, /status:\s*429/);

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.eczanem_telefon_sorgu_kayitlari/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_telefon_sorgu_kontrol/);
  assert.match(sql, /pg_advisory_xact_lock/);
});

test("Adım 6: iç kullanıcı ve iş partneri telefon çakışması RPC üzerinden yakalanır", async () => {
  let mod: "temiz" | "ic_kullanici" | "is_partneri" | "hata" = "temiz";
  const db = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      assert.equal(name, "eczanem_telefon_baska_kimlik_kontrol");
      assert.equal(args.p_telefon, "5321234567");
      if (mod === "hata") return { data: null, error: { message: "rpc error" } };
      if (mod === "ic_kullanici") {
        return { data: [{ cakisma_var: true, kimlik_turu: "ic_kullanici", mesaj: "Kurumsal kullanıcı çakışması" }], error: null };
      }
      if (mod === "is_partneri") {
        return { data: [{ cakisma_var: true, kimlik_turu: "is_partneri", mesaj: "İş partneri çakışması" }], error: null };
      }
      return { data: [{ cakisma_var: false, kimlik_turu: null, mesaj: null }], error: null };
    },
  } as unknown as SupabaseClient;

  const r1 = await digerKimlikTelefonuMu(db, "5321234567");
  assert.equal(r1.ok, true);
  assert.equal(r1.cakismaVar, false);

  mod = "ic_kullanici";
  const r2 = await digerKimlikTelefonuMu(db, "5321234567");
  assert.equal(r2.ok, true);
  assert.equal(r2.cakismaVar, true);
  assert.equal(r2.kimlikTuru, "ic_kullanici");

  mod = "is_partneri";
  const r3 = await digerKimlikTelefonuMu(db, "5321234567");
  assert.equal(r3.ok, true);
  assert.equal(r3.cakismaVar, true);
  assert.equal(r3.kimlikTuru, "is_partneri");

  mod = "hata";
  const r4 = await digerKimlikTelefonuMu(db, "5321234567");
  assert.equal(r4.ok, false);
  assert.equal(r4.cakismaVar, false);
});

test("Adım 6 sözleşmesi: kullanicilar ve agora_is_partnerleri telefon çakışması hem API hem DB trigger'ında engellenir", () => {
  const route = readFileSync("app/(panel)/eczanem/eczane/api/musteri-ekle/route.ts", "utf8");
  const sql = readFileSync("scripts/sql/eczanem_telefon_cakisma_kontrolu.sql", "utf8");

  const postGovde = route.slice(route.indexOf("export async function POST"));
  const digerSirasi = postGovde.indexOf("digerKimlikTelefonuMu");
  const islemSirasi = postGovde.indexOf("const islem =");
  assert.ok(digerSirasi > 0 && islemSirasi > digerSirasi);

  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.eczanem_telefon_baska_kimlik_kontrol/);
  assert.match(sql, /FROM public\.kullanicilar/);
  assert.match(sql, /FROM public\.agora_is_partnerleri/);
  assert.match(sql, /cep_telefonu = v_telefon/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.hapbilgi_kimlik_telefon_ayir_trg/);
});

test("Adım 7: pasife alma ve listeden silme bilgilendirme e-postaları standart formatla gönderilir", async () => {
  const f = fixture();
  const previousFetch = globalThis.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  const oldFrom = process.env.ECZANEM_DAVET_EMAIL_FROM;
  process.env.RESEND_API_KEY = "test-key";
  process.env.ECZANEM_DAVET_EMAIL_FROM = "Cogniti <noreply@cogniti.net>";

  const payloads: Array<Record<string, string>> = [];
  globalThis.fetch = async (_url, init) => {
    payloads.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, string>);
    return Response.json({ id: "mail_durum" }, { status: 200 });
  };

  try {
    const r1 = await eczanemUyelikDurumEpostasiGonder(f.db, {
      authUserId: "auth-m1",
      adSoyad: "Ayşe Demir",
      eczaneAdi: "Şifa Eczanesi",
      tur: "pasife_alindi",
      origin: "http://localhost:3000",
    });
    assert.equal(r1.gonderildi, true);

    const r2 = await eczanemUyelikDurumEpostasiGonder(f.db, {
      authUserId: "auth-m1",
      eposta: "danisan@example.invalid",
      adSoyad: "Ayşe Demir",
      eczaneAdi: "Şifa Eczanesi",
      tur: "listeden_silindi",
      origin: "http://localhost:3000",
    });
    assert.equal(r2.gonderildi, true);

    assert.equal(payloads.length, 2);
    assert.equal(payloads[0].subject, "Cogniti Eczanem Üyeliğiniz Pasife Alındı");
    assert.match(payloads[0].html, /Sayın Ayşe Demir,/);
    assert.match(payloads[0].html, /30 gün içinde Puanlarım/);
    assert.match(payloads[0].html, /\/eczanem\/puanlarim/);
    assert.match(payloads[0].html, /Cogniti · bilgi taşır/);

    assert.equal(payloads[1].subject, "Cogniti Eczanem Üyelik Bağınız Kaldırıldı");
    assert.match(payloads[1].html, /Sayın Ayşe Demir,/);
    assert.match(payloads[1].html, /üye listesinden çıkarıldınız/);
    assert.match(payloads[1].html, /Cogniti · bilgi taşır/);
  } finally {
    globalThis.fetch = previousFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oldKey;
    if (oldFrom === undefined) delete process.env.ECZANEM_DAVET_EMAIL_FROM;
    else process.env.ECZANEM_DAVET_EMAIL_FROM = oldFrom;
  }
});

test("Adım 7 sözleşmesi: pasife alma/silme e-postası ve ana sayfa 30 günlük geçiş bildirimi bağlıdır", () => {
  const musterilerApi = readFileSync("app/(panel)/eczanem/eczane/api/musteriler/route.ts", "utf8");
  const videolarApi = readFileSync("app/eczanem/api/videolar/route.ts", "utf8");
  const anaSayfa = readFileSync("app/eczanem/page.tsx", "utf8");

  assert.match(musterilerApi, /tur:\s*"pasife_alindi"/);
  assert.match(musterilerApi, /tur:\s*"listeden_silindi"/);
  assert.match(videolarApi, /pasif_uyelikler/);
  assert.match(anaSayfa, /pasifUyelikler/);
  assert.match(anaSayfa, /\/eczanem\/puanlarim/);
});

test("Adım 8 sözleşmesi: arayüz dili Üye olarak birleştirildi, E-Club mesajı ve eski /eczanem/davet kalıntıları temizlendi", () => {
  const uyelerSayfa = readFileSync("app/(panel)/eczanem/eczane/uyeler/page.tsx", "utf8");
  const eclubKontrol = readFileSync("lib/eczanem/eclubUyesiKontrol.ts", "utf8");
  const proxy = readFileSync("proxy.ts", "utf8");

  assert.doesNotMatch(uyelerSayfa, /Yeni müşteri kayıt formu|Müşteriyi kaydet|Müşteriyi sorgula|Müşteriler yükleniyor/);
  assert.match(uyelerSayfa, /Yeni üye kayıt formu/);
  assert.match(uyelerSayfa, /Üyeyi sorgula/);
  assert.match(uyelerSayfa, /Üyeyi kaydet ve davet gönder/);
  assert.match(eclubKontrol, /Bu kişi Cogniti'de E-Club üyesi olduğu için Eczanem üyesi olarak kaydedilemez\./);
  assert.doesNotMatch(proxy, /\/eczanem\/davet/);
  assert.doesNotMatch(proxy, /\/eczanem\/api\/davet-kabul/);
});

test("Süreç 11 kalan 2 madde: siparisReddet üyeye Web Push gönderir ve SUREC11_TOAST bağlıdır", () => {
  const kasa = readFileSync("lib/eczanem/kasa.ts", "utf8");
  const reddetBlok = kasa.slice(kasa.indexOf("export async function siparisReddet"), kasa.indexOf("export interface OnaySonuc"));
  const toastlar = readFileSync("lib/bildirimler/toastMesajlari.ts", "utf8");
  const kuyruk = readFileSync("app/(panel)/eczanem/eczane/_components/EczanemSiparisKuyrugu.tsx", "utf8");

  assert.match(reddetBlok, /pushYayinlaEczanemMusterilereArkada\(adminSupabase, "eczanem_siparis", \[siparis\.musteri_id\]\)/);
  assert.match(toastlar, /export const SUREC11_TOAST =/);
  assert.match(kuyruk, /SUREC11_TOAST\.siparisReddedildi/);
});
