import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBmPerformans } from "@/lib/tclub/hbligi/getBmPerformans";

test("HB Ligi getBmPerformans: RPC'den gelen eclub_puani > 0 olan UTT'lerin kazanilan_toplam ve net_puan değerleri BM saha toplamına yansır", async () => {
  const mockBm = [
    { kullanici_id: "bm-1", ad: "Ahmet", soyad: "Yılmaz", bolge_id: "bolge-1" },
  ];
  const mockBolgeler = [
    { bolge_id: "bolge-1", bolge_adi: "Marmara" },
  ];
  const mockUttPerformans = [
    {
      kullanici_id: "utt-1",
      ad: "Ali",
      soyad: "Kaya",
      tamamlanan_izleme: 4,
      benzersiz_yayin: 3,
      izleme_puani: 40,
      cevaplama_puani: 20,
      oneri_puani: 10,
      extra_puan: 5,
      ileri_sarma_kaybi: 2,
      yanlis_cevap_kaybi: 3,
      oneri_kaybi: 1,
      eclub_puani: 25, // E-Club kazanımı > 0
      kazanilan_toplam: 100, // 40 + 20 + 10 + 5 + 25 = 100
      kaybedilen_toplam: 6,  // 2 + 3 + 1 = 6
      net_puan: 94,          // 100 - 6 = 94
    },
    {
      kullanici_id: "utt-2",
      ad: "Ayşe",
      soyad: "Demir",
      tamamlanan_izleme: 2,
      benzersiz_yayin: 2,
      izleme_puani: 20,
      cevaplama_puani: 10,
      oneri_puani: 0,
      extra_puan: 0,
      ileri_sarma_kaybi: 0,
      yanlis_cevap_kaybi: 1,
      oneri_kaybi: 0,
      eclub_puani: 15, // E-Club kazanımı > 0
      kazanilan_toplam: 45, // 20 + 10 + 0 + 0 + 15 = 45
      kaybedilen_toplam: 1, // 0 + 1 + 0 = 1
      net_puan: 44,         // 45 - 1 = 44
    },
  ];

  let rpcParametreleri: Record<string, unknown> | null = null;

  const supabaseMock = {
    from(tablo: string) {
      if (tablo === "kullanicilar") {
        const sorgu = {
          select() { return sorgu; },
          eq(alan: string, _deger: unknown) {
            assert.ok(["rol", "aktif_mi", "firma_id", "takim_id"].includes(alan));
            return sorgu;
          },
          then(resolve: (val: { data: typeof mockBm; error: null }) => void) {
            resolve({ data: mockBm, error: null });
          },
        };
        return sorgu;
      }
      if (tablo === "bolgeler") {
        const sorgu = {
          select() { return sorgu; },
          in() { return sorgu; },
          then(resolve: (val: { data: typeof mockBolgeler; error: null }) => void) {
            resolve({ data: mockBolgeler, error: null });
          },
        };
        return sorgu;
      }
      throw new Error(`Beklenmeyen tablo: ${tablo}`);
    },
    async rpc(fn: string, params: Record<string, unknown>) {
      assert.equal(fn, "get_bm_utt_performans_v2");
      rpcParametreleri = params;
      return { data: mockUttPerformans, error: null };
    },
  } as unknown as SupabaseClient;

  const periyot = { periyot: "ay" as const, yil: 2026, ay: 9 };
  const sonuclar = await getBmPerformans(
    supabaseMock,
    { firma_id: "firma-1", takim_id: "takim-1" },
    periyot,
  );

  assert.equal(sonuclar.length, 1);
  const bmSonuc = sonuclar[0];

  assert.equal(bmSonuc.bm_id, "bm-1");
  assert.equal(bmSonuc.bm_adi, "Ahmet Yılmaz");
  assert.equal(bmSonuc.bolge_adi, "Marmara");
  assert.equal(bmSonuc.toplam_utt, 2);
  assert.equal(bmSonuc.aktif_utt, 2);

  // E-Club dahil RPC toplamları
  assert.equal(bmSonuc.eclub_puani, 40); // 25 + 15
  assert.equal(bmSonuc.kazanilan_toplam, 145); // 100 + 45 (E-Club dahil)
  assert.equal(bmSonuc.kaybedilen_toplam, 7); // 6 + 1
  assert.equal(bmSonuc.net_puan, 138); // 94 + 44 = 138 (145 - 7)

  // Kalemler korunmuş mu
  assert.equal(bmSonuc.izleme_puani, 60);
  assert.equal(bmSonuc.cevaplama_puani, 30);
  assert.equal(bmSonuc.oneri_puani, 10);
  assert.equal(bmSonuc.extra_puan, 5);
  assert.equal(bmSonuc.ileri_sarma_kaybi, 2);
  assert.equal(bmSonuc.yanlis_cevap_kaybi, 4);
  assert.equal(bmSonuc.oneri_kaybi, 1);

  // Eski hatalı formül (E-Club'ı dışlayan) ile karşılaştır
  const eskiHataliKazanilanToplam = bmSonuc.izleme_puani + bmSonuc.cevaplama_puani + bmSonuc.oneri_puani + bmSonuc.extra_puan;
  assert.equal(eskiHataliKazanilanToplam, 105);
  assert.notEqual(bmSonuc.kazanilan_toplam, eskiHataliKazanilanToplam, "kazanilan_toplam E-Club'ı içermeli");
  assert.equal(bmSonuc.kazanilan_toplam, eskiHataliKazanilanToplam + (bmSonuc.eclub_puani ?? 0));

  // RPC parametreleri doğru aktarılmış mı
  assert.ok(rpcParametreleri !== null);
  assert.equal((rpcParametreleri as Record<string, unknown>).p_bm_id, "bm-1");
});
