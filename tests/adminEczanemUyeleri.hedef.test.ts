import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminEczanemUyeIsleyicileri } from "@/lib/admin/eczanemUyeleri";
import { hataYaniti } from "@/lib/utils/hataIsle";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const baglam = { params: Promise.resolve({ firma_id: id(1) }) };
const istek = (body: unknown) => new Request("http://localhost/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
function kur(cevap: unknown, error: { code: string; message: string } | null = null, yetki = true, konumHatasi = false) {
  const cagrilar: Array<{ ad: string; args: unknown }> = [];
  const api = adminEczanemUyeIsleyicileri({
    kontrol: async () => yetki ? { gecerli: true as const, kullaniciId: id(91) } : { gecerli: false as const, yanit: hataYaniti("Yetkisiz", undefined, null, 403) },
    admin: () => ({
      rpc: async (ad: string, args: unknown) => { cagrilar.push({ ad, args }); return { data: cevap, error }; },
      from: (tablo: string) => {
        assert.equal(tablo, "eclub_eczane_master");
        return { select: (kolonlar: string) => {
          assert.equal(kolonlar, "gln, il, ilce");
          return { in: async (kolon: string, glnler: string[]) => {
            assert.equal(kolon, "gln");
            const uyeler = (cevap as { uyeler: Array<{ gln?: string }> }).uyeler;
            assert.deepEqual(glnler, [...new Set(uyeler.map((uye) => uye.gln).filter(Boolean))]);
            return { data: glnler.map((gln) => ({ gln, il: "İstanbul", ilce: "Üsküdar" })), error: konumHatasi ? { message: "Okuma başarısız" } : null };
          } };
        } };
      },
    }) as unknown as SupabaseClient,
  });
  return { api, cagrilar };
}
test("Liste firma ve filtreleri RPC'ye iletir, e-posta açık gösterilir", async () => {
  const { api, cagrilar } = kur({ uyeler: [{ telefon: "05551234567", eposta: "deneme@example.test", gln: "8680000000003" }], eczaneler: [], ozet: {}, sayfalama: {} });
  const res = await api.GET(new Request(`http://localhost/admin?q=Ali&durum=aktif&sayfa=2&eczane_id=${id(11)}`), baglam);
  assert.equal(res.status, 200);
  const veri = await res.json();
  assert.equal(veri.uyeler[0].telefon, "••• ••• 4567");
  assert.equal(veri.uyeler[0].eposta, "deneme@example.test");
  assert.equal(veri.uyeler[0].il, "İstanbul");
  assert.equal(veri.uyeler[0].ilce, "Üsküdar");
  assert.deepEqual(cagrilar[0].args, { p_firma_id: id(1), p_eczane_id: id(11), p_durum: "aktif", p_arama: "Ali", p_sayfa: 2, p_limit: 20 });
});
test("Konum sorgusu başarısızsa eksik veriyle başarı dönülmez; boş listede konum sorgulanmaz", async () => {
  const { api } = kur({ uyeler: [{ gln: "1110000000003" }] }, null, true, true);
  assert.equal((await api.GET(new Request("http://localhost/admin"), baglam)).status, 500);
  const bos = kur({ uyeler: [], eczaneler: [], ozet: {}, sayfalama: {} });
  assert.equal((await bos.api.GET(new Request("http://localhost/admin"), baglam)).status, 200);
});
test("Admin listesindeki e-postalar GLN ve alan adından bağımsız açık gösterilir", async () => {
  const { api } = kur({ uyeler: [
    { telefon: "05551234567", eposta: "ismail@testmusteri.com", gln: "1110000000003" },
    { telefon: "05551234567", eposta: "gercek@firma.com", gln: "1110000000003" },
    { telefon: "05551234567", eposta: "ismail@testmusteri.com", gln: "" },
    { telefon: "05551234567", eposta: null, gln: "1110000000003" },
    { telefon: "05551234567", eposta: "eczane001.uye01@example.com", gln: "1110000000003" },
    { telefon: "05551234567", eposta: "eczane001.uye01@example.com", gln: "8680000000003" },
  ] });
  const veri = await (await api.GET(new Request("http://localhost/admin"), baglam)).json();
  assert.equal(veri.uyeler[0].eposta, "ismail@testmusteri.com");
  assert.equal(veri.uyeler[0].telefon, "••• ••• 4567");
  assert.equal(veri.uyeler[1].eposta, "gercek@firma.com");
  assert.equal(veri.uyeler[2].eposta, "ismail@testmusteri.com");
  assert.equal(veri.uyeler[3].eposta, null);
  assert.equal(veri.uyeler[4].eposta, "eczane001.uye01@example.com");
  assert.equal(veri.uyeler[5].eposta, "eczane001.uye01@example.com");
});
test("Admin dışındaki istekler listeyi okuyamaz veya durum değiştiremez", async () => {
  const { api, cagrilar } = kur({}, null, false);
  assert.equal((await api.GET(new Request("http://localhost/admin"), baglam)).status, 403);
  assert.equal((await api.PATCH(istek({}), baglam)).status, 403);
  assert.equal(cagrilar.length, 0);
});
test("Geçersiz filtreler ve durumlar veritabanına gönderilmez", async () => {
  const { api, cagrilar } = kur({});
  for (const filtre of ["sayfa=-1", "durum=baska", "eczane_id=yanlis", "sayfa=1.5"])
    assert.equal((await api.GET(new Request(`http://localhost/admin?${filtre}`), baglam)).status, 400);
  assert.equal((await api.PATCH(istek({ musteri_id: id(21), eczane_id: id(11), aktif_mi: "false", mevcut_aktif_mi: true }), baglam)).status, 400);
  assert.equal(cagrilar.length, 0);
});
test("Müdahalede admin kimliği oturumdan alınır, hedef eczane ve eski durum korunur", async () => {
  const { api, cagrilar } = kur({ ok: true });
  const res = await api.PATCH(istek({ admin_id: id(99), musteri_id: id(21), eczane_id: id(11), aktif_mi: false, mevcut_aktif_mi: true }), baglam);
  assert.equal(res.status, 200);
  assert.deepEqual(cagrilar[0].args, { p_admin_id: id(91), p_firma_id: id(1), p_musteri_id: id(21), p_eczane_id: id(11), p_aktif_mi: false, p_mevcut_aktif_mi: true });
});
test("Kurulum eksikliği, firma dışı işlem ve eski durum hataları başarı sayılmaz", async () => {
  for (const [kod, durum] of [["PGRST202", 503], ["42501", 403], ["40001", 409], ["23514", 400]] as const) {
    const { api } = kur(null, { code: kod, message: "İşlem reddedildi" });
    assert.equal((await api.PATCH(istek({ musteri_id: id(21), eczane_id: id(11), aktif_mi: true, mevcut_aktif_mi: false }), baglam)).status, durum);
  }
});
