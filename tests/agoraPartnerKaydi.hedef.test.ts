import assert from "node:assert/strict";
import test from "node:test";
import { partnerKaydiniDogrula } from "@/lib/agora/partnerKaydi";
import { partnerKayitIsleyicisi } from "@/lib/agora/partnerKayitApi";

const kurumsalVeri = {
  tur: "kurumsal" as const,
  ad_soyad: "Ayşe Öztürk",
  eposta: "ayse@example.invalid",
  cep_telefonu: "5321234567",
  firma_adi: "Örnek Eğitim A.Ş.",
  web_adresi: "https://ornek.invalid",
  vergi_no: "1234567890",
  vergi_dairesi: "Kadıköy",
  adres: "Bağdat Caddesi No 10 Kadıköy İstanbul",
  banka_adi: "Örnek Bankası",
  iban: "TR123456789012345678901234",
  hesap_adi: "Örnek Eğitim A.Ş.",
};

const istek = (data: unknown = kurumsalVeri, headers: Record<string, string> = {}) =>
  new Request("http://localhost/partner/api/kayit", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json", ...headers },
    body: JSON.stringify(data),
  });

test("Ad ve iletişim bilgileri Türkçe karakterleri koruyarak tek biçime gelir", () => {
  for (const cep_telefonu of ["5321234567", "0532 123 45 67", "+90 (532) 123-45-67", "905321234567"]) {
    const r = partnerKaydiniDogrula({
      ...kurumsalVeri,
      ad_soyad: "  Ayşe   Öztürk  ",
      eposta: " AYSE@EXAMPLE.INVALID ",
      cep_telefonu,
    });
    assert.deepEqual(r, { ok: true, veri: kurumsalVeri });
  }
});

test("Eksik alan, tek ad, aşırı uzun değer, hatalı e-posta/telefon ve kontrol karakteri reddedilir", () => {
  for (const d of [
    null,
    [],
    {},
    { ...kurumsalVeri, ad_soyad: "Ayşe" },
    { ...kurumsalVeri, ad_soyad: "Ayşe\nÖztürk" },
    { ...kurumsalVeri, ad_soyad: "A".repeat(150) + " B" },
    { ...kurumsalVeri, eposta: "a@@b.c" },
    { ...kurumsalVeri, cep_telefonu: "02121234567" },
    { ...kurumsalVeri, cep_telefonu: "0532123456a7" },
    { ...kurumsalVeri, cep_telefonu: "53212345678" },
    { ...kurumsalVeri, eposta: 42 },
  ]) {
    assert.equal(partnerKaydiniDogrula(d).ok, false, JSON.stringify(d));
  }
});

test("API yalnız doğrulanmış alanları kalıcı kayda iletir ve yetki alanlarını yok sayar", async () => {
  const yazilanlar: unknown[] = [];
  const post = partnerKayitIsleyicisi(async d => {
    yazilanlar.push(d);
    return true;
  });
  const r = await post(istek({ ...kurumsalVeri, rol: "admin", aktif: true, firma_id: "baska-firma" }));
  assert.equal(r.status, 202);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.deepEqual(yazilanlar, [kurumsalVeri]);
  assert.deepEqual(await r.json(), { mesaj: "Üyelik bilgileriniz alındı." });
});

test("Yanlış/eksik origin, JSON dışı istek, geçersiz veri ve büyük gövde kayıt yazmaz", async () => {
  let cagri = 0;
  const post = partnerKayitIsleyicisi(async () => {
    cagri++;
    return true;
  });
  for (const [req, status] of [
    [istek(kurumsalVeri, { origin: "https://baska.invalid" }), 403],
    [istek(kurumsalVeri, { origin: "" }), 403],
    [istek(kurumsalVeri, { "content-type": "text/plain" }), 415],
    [istek({ ...kurumsalVeri, cep_telefonu: "abc" }), 400],
    [istek(kurumsalVeri, { "content-length": "16385" }), 413],
    [istek({ fazla: "ö".repeat(16384) }), 413],
    [
      new Request("http://localhost/partner/api/kayit", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: "{",
      }),
      400,
    ],
  ] as const) {
    assert.equal((await post(req)).status, status);
  }
  assert.equal(cagri, 0);
});

test("DB/kurulum/ağ hatası başarı sayılmaz ve teknik hata veya kişisel veri döndürülmez", async () => {
  for (const kaydet of [async () => false, async () => { throw new Error("gizli SQL hatası"); }]) {
    const r = await partnerKayitIsleyicisi(kaydet)(istek());
    assert.equal(r.status, 503);
    const text = await r.text();
    assert.doesNotMatch(text, /gizli|SQL|ayse@|5321234567/);
    assert.match(text, /Üyelik kaydı şu anda yapılamıyor/);
  }
});
