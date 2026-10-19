import assert from "node:assert/strict";
import test from "node:test";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { kityKarsilamasi, kityTuruKapsaminda, KITY_METINLERI, KITY_URETICI_ADIMLARI } from "@/lib/rehber/kityGirisTuru";
import { KITY_GOSTERME_ANAHTARI, kityGirisiniIsaretle, kityHesapDurumunuOku, kityTercihiniKaydet } from "@/lib/auth/kityTercihi";


function hesap(id = "hesap-a") {
  const metadata: Record<string, unknown> = { baska_tercih: "korunur" };
  const yazilanlar: unknown[] = [];
  const auth = {
    getUser: async () => ({ data: { user: { id, user_metadata: metadata } }, error: null }),
    getClaims: async () => ({ data: { claims: { sub: id, session_id: "oturum-a" } }, error: null }),
    updateUser: async (attributes: { data: Record<string, boolean> }) => {
      yazilanlar.push(attributes);
      Object.assign(metadata, attributes.data);
      return { error: null };
    },
  };
  return { auth, metadata, yazilanlar };
}

test("giriş turu yalnız üretici kimliklerine açılır", () => {
  for (const rol of URETICI_ROLLER) {
    assert.equal(kityTuruKapsaminda({ rol, kimlik_turu: "kullanici" }), true, rol);
  }
  for (const rol of ["utt", "kd_utt", "bm", "tm", "gm", "iu", "admin", "bilinmeyen"]) {
    assert.equal(kityTuruKapsaminda({ rol, kimlik_turu: "kullanici" }), false, rol);
  }
  assert.equal(kityTuruKapsaminda({ rol: "pm", kimlik_turu: "eclub_kisi" }), false);
  assert.equal(kityTuruKapsaminda({ rol: "pm", kimlik_turu: "musteri" }), false);
});

test("üretici turu dört gerçek sayfa alanıdır; kişisel isim yalnız karşılamada görünür", () => {
  assert.equal(KITY_URETICI_ADIMLARI.length, 4);
  assert.equal(kityKarsilamasi("Ayşe").baslik, "Merhaba Ayşe!");
  assert.equal(kityKarsilamasi("Ayşe").aciklama, "Merhaba ben Kity, istersen bu ekrandaki bazı başlıkları sana tanıtabilirim.");
  assert.equal(KITY_METINLERI.veda, "Eğlenceli öğrenmeler dilerim.");
  assert.ok(KITY_URETICI_ADIMLARI.every(a => !a.aciklama.includes("Ayşe") && !a.sesDosyasi));
});

test("bir daha gösterme tercihi hesapta saklanır ve yeni istemciden okunur", async () => {
  const h = hesap();
  assert.deepEqual(await kityHesapDurumunuOku(h.auth, "hesap-a"), { gosterme: false, oturumId: "oturum-a" });
  assert.equal(await kityTercihiniKaydet(h.auth, "hesap-a", true), true);
  assert.deepEqual(h.yazilanlar, [{ data: { [KITY_GOSTERME_ANAHTARI]: true } }]);
  assert.equal(h.metadata.baska_tercih, "korunur");
  const baskaCihaz = { ...h.auth };
  assert.equal((await kityHesapDurumunuOku(baskaCihaz, "hesap-a"))?.gosterme, true);
  assert.equal(await kityTercihiniKaydet(baskaCihaz, "hesap-a", false), true);
  assert.equal((await kityHesapDurumunuOku(h.auth, "hesap-a"))?.gosterme, false);
});

test("eski hesap adına tercih yazılmaz; bozuk oturum ve ağ hatası giriş turunu başlatmaz", async () => {
  const h = hesap("baska-hesap");
  assert.equal(await kityHesapDurumunuOku(h.auth, "beklenen-hesap"), null);
  assert.equal(await kityTercihiniKaydet(h.auth, "beklenen-hesap", true), false);
  assert.equal(h.yazilanlar.length, 0);
  const a = hesap();
  assert.equal(await kityHesapDurumunuOku({ ...a.auth, getClaims: async () => ({ data: { claims: { sub: "baska-hesap", session_id: "x" } }, error: null }) }, "hesap-a"), null);
  assert.equal(await kityTercihiniKaydet({ ...a.auth, updateUser: async () => ({ error: new Error("ağ hatası") }) }, "hesap-a", true), false);
  assert.equal(await kityHesapDurumunuOku({ ...a.auth, getUser: async () => { throw new Error("ağ hatası"); } }, "hesap-a"), null);
});

test("sayfa yenileme ve yeni sekme aynı girişi tekrarlatmaz; yeni giriş ve farklı hesap ayrıdır", () => {
  const kayitlar = new Map<string, string>();
  const depo = { getItem: (key: string) => kayitlar.get(key) ?? null, setItem: (key: string, value: string) => { kayitlar.set(key, value); } };
  assert.equal(kityGirisiniIsaretle("oturum-testi-a", "session-1", depo), true);
  assert.equal(kityGirisiniIsaretle("oturum-testi-a", "session-1", depo), false);
  assert.equal(kityGirisiniIsaretle("oturum-testi-a", "session-2", depo), true);
  assert.equal(kityGirisiniIsaretle("oturum-testi-b", "session-1", depo), true);
  const kapaliDepo = { getItem: () => { throw new Error("kapalı"); }, setItem: () => {} };
  assert.equal(kityGirisiniIsaretle("kapali-depo", "session-1", kapaliDepo), true);
  assert.equal(kityGirisiniIsaretle("kapali-depo", "session-1", kapaliDepo), false);
});
