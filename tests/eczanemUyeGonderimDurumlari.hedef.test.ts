import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { eczaneUyeGonderimDurumlari, eczaneVideoGonderimOzetleri, type EczaneGelenVideo, type EczaneUye } from "@/lib/eczanem/gonderim";

const yayinA = "11111111-1111-4111-8111-111111111111";
const yayinB = "22222222-2222-4222-8222-222222222222";

test("çoklu yayında yalnız aktif danışanların durumunu tüm sayfalardan toplar", async () => {
  const araliklar: Array<[number, number]> = [];
  const tumKayitlar = Array.from({ length: 1001 }, (_, sira) => ({
    gonderim_id: `g-${sira.toString().padStart(4, "0")}`,
    yayin_id: sira === 1000 ? yayinB : yayinA,
    musteri_id: sira === 1000 ? "aktif-2" : sira === 0 ? "aktif-1" : "pasif",
  }));
  const sorgu = {
    select: () => sorgu,
    eq: () => sorgu,
    in: () => sorgu,
    order: () => sorgu,
    range: async (baslangic: number, bitis: number) => {
      araliklar.push([baslangic, bitis]);
      return { data: tumKayitlar.slice(baslangic, Math.min(bitis + 1, baslangic + 500)), count: tumKayitlar.length, error: null };
    },
  };
  const supabase = { from: (tablo: string) => {
    assert.equal(tablo, "eczanem_gonderimler");
    return sorgu;
  } } as unknown as SupabaseClient;
  const uyeler = ["aktif-1", "aktif-2"].map((musteri_id): EczaneUye => ({
    musteri_id, ad_soyad: musteri_id, telefon_maskeli: "", gonderildi_mi: false,
  }));

  const sonuc = await eczaneUyeGonderimDurumlari(supabase, "eczane-1", [yayinA, yayinB], uyeler);
  assert.deepEqual(araliklar, [[0, 999], [500, 1499], [1000, 1999]]);
  assert.deepEqual(sonuc, [
    { yayin_id: yayinA, musteri_id: "aktif-1" },
    { yayin_id: yayinB, musteri_id: "aktif-2" },
  ]);

  const videolar = [yayinA, yayinB].map((yayin_id): EczaneGelenVideo => ({
    yayin_id, firma_adi: null, talep_no: null, video_puani: null, urun_adi: "Yayın", gorunen_urun_id: null,
    teknik_adi: "", icerik_turu: null, yayin_tarihi: null, video_url: null,
    thumbnail_url: null, gelis_tarihi: "2026-10-14", arac_id: "arac-1", arac_turu: "video",
  }));
  const ozetler = await eczaneVideoGonderimOzetleri(supabase, "eczane-1", videolar, uyeler);
  assert.deepEqual(ozetler.map((ozet) => [ozet.gonderilen_uye_sayisi, ozet.gonderilebilir_uye_sayisi]), [[1, 1], [1, 1]]);
});

test("aktif danışan yoksa gönderim sorgusu açılmaz", async () => {
  const supabase = { from: () => { throw new Error("Beklenmeyen sorgu"); } } as unknown as SupabaseClient;
  assert.deepEqual(await eczaneUyeGonderimDurumlari(supabase, "eczane-1", [yayinA], []), []);
});
