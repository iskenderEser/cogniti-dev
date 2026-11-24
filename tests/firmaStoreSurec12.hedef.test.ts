import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUREC12_TOAST } from "../lib/bildirimler/toastMesajlari.ts";
import { firmaStoreCekIptalEpostasiGonder } from "../lib/tclub/store/cekIptalEposta.ts";

test("firmaStoreCekIptalEpostasiGonder talep sahibine iptal nedeni ve puan iadesi e-postası gönderir", async () => {
  const oncekiKey = process.env.RESEND_API_KEY;
  const oncekiFrom = process.env.FIRMASTORE_CEK_EMAIL_FROM;
  const oncekiFetch = globalThis.fetch;
  const gidenler: Array<{ url: string; headers: Record<string, string>; body: Record<string, unknown> }> = [];

  process.env.RESEND_API_KEY = "test-key";
  process.env.FIRMASTORE_CEK_EMAIL_FROM = "Cogniti <odul@cogniti.net>";
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    gidenler.push({
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: JSON.parse(String(init?.body ?? "{}")),
    });
    return new Response(JSON.stringify({ id: "email-fs-1" }), { status: 200 });
  }) as typeof fetch;

  const mockDb = {
    from: (tablo: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => {
            if (tablo === "store_siparisler") {
              return Promise.resolve({
                data: {
                  siparis_id: "siparis-200",
                  firma_id: "firma-1",
                  kullanici_id: "kullanici-1",
                  urun_id: "urun-1",
                  adet: 1,
                  toplam_puan: 1000,
                  iptal_sebebi: "Tedarikçi stok güncellemesi nedeniyle talep yenilenmelidir.",
                  durum: "iptal",
                },
                error: null,
              });
            }
            if (tablo === "kullanicilar") {
              return Promise.resolve({
                data: { ad: "Ahmet", soyad: "Yılmaz", eposta: "ahmet.yilmaz@hepifarma.com" },
                error: null,
              });
            }
            if (tablo === "firmalar") {
              return Promise.resolve({ data: { firma_adi: "Hepifarma" }, error: null });
            }
            if (tablo === "store_urunler") {
              return Promise.resolve({ data: { ad: "Boyner 500 TL Hediye Çeki" }, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
        }),
      }),
    }),
  } as unknown as SupabaseClient;

  try {
    await firmaStoreCekIptalEpostasiGonder(mockDb, "siparis-200");
    assert.equal(gidenler.length, 1);
    assert.deepEqual(gidenler[0].body.to, ["ahmet.yilmaz@hepifarma.com"]);
    assert.equal(gidenler[0].body.subject, "FirmaStore Çek Talebiniz İptal Edildi");
    assert.equal(gidenler[0].headers["Idempotency-Key"], "firmastore-cek-iptal/siparis-200");
    assert.match(String(gidenler[0].body.text), /^Sayın Ahmet Yılmaz,/);
    assert.match(String(gidenler[0].body.text), /Hepifarma FirmaStore kapsamındaki Boyner 500 TL Hediye Çeki \(1 adet\) talebiniz iptal edilmiştir\./);
    assert.match(String(gidenler[0].body.text), /- İptal nedeni: Tedarikçi stok güncellemesi nedeniyle talep yenilenmelidir\./);
    assert.match(String(gidenler[0].body.text), /- Puan iadesi: Harcanan 1\.000 puan hesabınıza iade edilmiştir\./);
    assert.match(String(gidenler[0].body.text), /Cogniti · bilgi taşır$/);
    assert.match(String(gidenler[0].body.html), /<strong>Boyner 500 TL Hediye Çeki<\/strong>/);
    assert.match(String(gidenler[0].body.html), /<strong>İptal nedeni:<\/strong> Tedarikçi stok güncellemesi nedeniyle talep yenilenmelidir\./);
    assert.match(String(gidenler[0].body.html), /Cogniti · bilgi taşır<\/p>$/);
  } finally {
    globalThis.fetch = oncekiFetch;
    if (oncekiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = oncekiKey;
    if (oncekiFrom === undefined) delete process.env.FIRMASTORE_CEK_EMAIL_FROM;
    else process.env.FIRMASTORE_CEK_EMAIL_FROM = oncekiFrom;
  }
});

test("Süreç 12: SQL çek teslim şablonu, admin iptal bağlantısı, iptal nedeni görünümü ve SUREC12_TOAST sözleşmesi doğrulanır", () => {
  assert.equal(SUREC12_TOAST.cekTalebiAlindi, "Çek talebiniz alındı.");
  assert.equal(SUREC12_TOAST.kullaniciTalepIptalEdildi, "Talebiniz iptal edildi ve puanınız iade edildi.");
  assert.equal(SUREC12_TOAST.adminTalepHazirlaniyor, "Talep hazırlamaya alındı.");
  assert.equal(SUREC12_TOAST.adminCekTeslimEdildi, "Çek kodları teslim edildi ve e-posta gönderimi başlatıldı.");
  assert.equal(SUREC12_TOAST.adminTalepIptalEdildi, "Talep iptal edildi ve puan kullanıcıya iade edildi.");
  assert.equal(SUREC12_TOAST.adminEpostaYenidenKuyrukta, "Hediye çeki e-postası yeniden gönderim kuyruğuna alındı.");

  for (const sqlDosya of [
    "scripts/sql/firmastore_firma_talep_yonetimi.sql",
    "scripts/sql/firmastore_cek_eposta_standardi.sql",
  ]) {
    const sql = fs.readFileSync(path.join(process.cwd(), sqlDosya), "utf8");
    assert.match(sql, /'subject','FirmaStore Hediye Çekiniz Hazır'/);
    assert.match(sql, /'Sayın '\|\|v_ad\|\|','/);
    assert.match(sql, /'html',v_html/);
    assert.match(sql, /Hediye çekini kullan/);
    assert.match(sql, /Cogniti · bilgi taşır/);
  }

  const adminRoute = fs.readFileSync(path.join(process.cwd(), "app/admin/store/api/siparis/route.ts"), "utf8");
  assert.match(adminRoute, /firmaStoreCekIptalEpostasiGonder\(db,b\.siparis_id\)/);

  const siparislerim = fs.readFileSync(path.join(process.cwd(), "app/(panel)/store/siparislerim/page.tsx"), "utf8");
  assert.match(siparislerim, /sonrakiSayfaToastOku\(\)/);
  assert.match(siparislerim, /SUREC12_TOAST\.kullaniciTalepIptalEdildi/);
  assert.match(siparislerim, /<strong>İptal nedeni:<\/strong> \{s\.iptal_sebebi\}/);

  const storeVitrin = fs.readFileSync(path.join(process.cwd(), "app/(panel)/store/page.tsx"), "utf8");
  assert.match(storeVitrin, /sonrakiSayfaToastYaz\(SUREC12_TOAST\.cekTalebiAlindi\)/);

  const urunDetay = fs.readFileSync(path.join(process.cwd(), "app/(panel)/store/[urun_id]/page.tsx"), "utf8");
  assert.match(urunDetay, /SUREC12_TOAST\.cekTalebiAlindi/);

  const adminTalepler = fs.readFileSync(
    path.join(process.cwd(), "app/admin/store/_components/FirmaCekTalepleri.tsx"),
    "utf8",
  );
  assert.match(adminTalepler, /SUREC12_TOAST\.adminTalepHazirlaniyor/);
  assert.match(adminTalepler, /SUREC12_TOAST\.adminCekTeslimEdildi/);
  assert.match(adminTalepler, /SUREC12_TOAST\.adminTalepIptalEdildi/);
  assert.match(adminTalepler, /SUREC12_TOAST\.adminEpostaYenidenKuyrukta/);
});
