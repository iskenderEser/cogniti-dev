import type { SupabaseClient } from "@supabase/supabase-js";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import type { UretimRaporRolu } from "@/lib/rapor/uretim/raporRolu";

const TURLER: OgrenmeAraciTuru[] = ["video", "podcast", "gorsel", "flip_pdf"];
export type RolMetrigi = {
  baslatma: number;
  tamamlama: number;
  kazanilan_puan?: number;
  kaybedilen_puan?: number;
  net_puan?: number;
};
type OlayToplami = {
  baslatma: number; tamamlama: number; dogru_cevap: number; yanlis_cevap: number;
  kazanilan_puan: number; kaybedilen_puan: number; oneri_gonderildi: number;
  oneri_tamamlandi: number; challenge_gonderildi: number; challenge_tamamlandi: number;
  eclub_dagitim: number; eclub_dagitim_tamamlandi: number; eczanem_dagitim: number;
  eczanem_dagitim_tamamlandi: number;
};

export interface AracTuruRaporSatiri extends OlayToplami {
  arac_turu: OgrenmeAraciTuru;
  yayin_sayisi: number;
  toplam_yayin_sayisi?: number;
  potansiyel_puan?: number;
  tamamlama_orani?: number | null;
  kayitli_arac_puani: number;
  net_kazanilan_puan: number;
  dogru_cevap_yuzdesi: number | null;
  roller: Record<string, RolMetrigi>;
  etkilesim_yayin_sayisi?: number;
  yayinlar: Array<{
    yayin_id: string; yayin_kodu: string; talep_id: string | null; talep_no: number | null;
    kayitli_arac_puani: number; kazanilan_puan: number; kaybedilen_puan: number;
    baslatma: number; tamamlama: number;
  }>;
}

const BOS: OlayToplami = {
  baslatma: 0, tamamlama: 0, dogru_cevap: 0, yanlis_cevap: 0,
  kazanilan_puan: 0, kaybedilen_puan: 0, oneri_gonderildi: 0,
  oneri_tamamlandi: 0, challenge_gonderildi: 0, challenge_tamamlandi: 0,
  eclub_dagitim: 0, eclub_dagitim_tamamlandi: 0, eczanem_dagitim: 0,
  eczanem_dagitim_tamamlandi: 0,
};

export type AracRaporAraligi = { baslangic: string; bitis: string };
export type AracRaporDetayKapsami = AracRaporAraligi & { periyot: string; raporRolu: UretimRaporRolu };
type AracRaporGirdisi = AracRaporAraligi & { raporKimligi: string; raporRolu: UretimRaporRolu };
export type AracYayinSayfasi = { yayinlar: AracTuruRaporSatiri["yayinlar"]; sonrakiImlec: string | null };

export const aracTuruMu = (deger: string): deger is OgrenmeAraciTuru => TURLER.includes(deger as OgrenmeAraciTuru);
const sayi = (deger: unknown) => Number(deger ?? 0);
const rpcArgumanlari = (girdi: AracRaporGirdisi) => ({
  p_yonetici_id: girdi.raporKimligi, p_baslangic: girdi.baslangic,
  p_bitis: girdi.bitis, p_rapor_rolu: girdi.raporRolu,
});

// Sayısal toplamlar SQL'den gelir; burada yalnız yanıtın veri tipleri uyarlanır.
export async function aracTuruDagilimi(db: SupabaseClient, girdi: AracRaporGirdisi): Promise<AracTuruRaporSatiri[]> {
  const [{ data, error }, tuketimYaniti, potansiyelYaniti] = await Promise.all([
    db.rpc('get_yayin_raporlari_arac_performansi_v1', rpcArgumanlari(girdi)),
    db.rpc('get_yayin_raporlari_arac_tuketimi_v1', rpcArgumanlari(girdi)),
    db.rpc('get_yayin_raporlari_arac_potansiyel_puani_v1', rpcArgumanlari(girdi)),
  ]);
  if (error || !Array.isArray(data) || data.length !== TURLER.length
    || new Set(data.map((r) => r.arac_turu)).size !== TURLER.length
    || data.some((r) => !TURLER.includes(r.arac_turu))) {
    throw new Error('Öğrenme aracı türü rapor kaynağı okunamadı.');
  }
  const hamTuketim = tuketimYaniti.data;
  if (tuketimYaniti.error || !Array.isArray(hamTuketim) || hamTuketim.length !== TURLER.length
    || new Set(hamTuketim.map((r) => r.arac_turu)).size !== TURLER.length
    || hamTuketim.some((r) => !TURLER.includes(r.arac_turu)
      || ['toplam_yayin_sayisi', 'baslatma', 'tamamlama'].some((alan) => r[alan] == null
        || !Number.isSafeInteger(Number(r[alan])) || Number(r[alan]) < 0)
      || (r.tamamlama_orani !== null && (r.tamamlama_orani == null
        || !Number.isFinite(Number(r.tamamlama_orani)) || Number(r.tamamlama_orani) < 0 || Number(r.tamamlama_orani) > 100)))) {
    throw new Error('Öğrenme aracı tüketim özeti okunamadı.');
  }
  const hamPotansiyel = potansiyelYaniti.data;
  if (potansiyelYaniti.error || !Array.isArray(hamPotansiyel) || hamPotansiyel.length !== TURLER.length
    || new Set(hamPotansiyel.map((r) => r.arac_turu)).size !== TURLER.length
    || hamPotansiyel.some((r) => !TURLER.includes(r.arac_turu) || r.potansiyel_puan == null
      || !Number.isSafeInteger(Number(r.potansiyel_puan)) || Number(r.potansiyel_puan) < 0)) {
    throw new Error('Öğrenme aracı potansiyel puanı okunamadı.');
  }
  const potansiyeller = new Map<string, number>(hamPotansiyel.map((r) => [r.arac_turu, Number(r.potansiyel_puan)]));
  const tuketimler = new Map<string, Record<string, unknown>>(hamTuketim.map((r) => [r.arac_turu, r]));
  const satirlar = new Map<string, Record<string, unknown>>(data.map((satir) => [satir.arac_turu, satir]));
  return TURLER.map((arac_turu) => {
    const ham = satirlar.get(arac_turu);
    if (!ham) throw new Error('Öğrenme aracı türü rapor kaynağı eksik.');
    const toplam = { ...BOS };
    for (const alan of Object.keys(BOS) as Array<keyof OlayToplami>) toplam[alan] = sayi(ham[alan]);
    const roller = Object.fromEntries(Object.entries((ham.roller ?? {}) as Record<string, RolMetrigi>).map(([rol, m]) => [rol, {
      baslatma: sayi(m.baslatma), tamamlama: sayi(m.tamamlama),
      kazanilan_puan: sayi(m.kazanilan_puan), kaybedilen_puan: sayi(m.kaybedilen_puan), net_puan: sayi(m.net_puan),
    }]));
    return {
      arac_turu, ...toplam, roller,
      potansiyel_puan: potansiyeller.get(arac_turu)!,
      toplam_yayin_sayisi: sayi(tuketimler.get(arac_turu)!.toplam_yayin_sayisi),
      baslatma: sayi(tuketimler.get(arac_turu)!.baslatma),
      tamamlama: sayi(tuketimler.get(arac_turu)!.tamamlama),
      tamamlama_orani: tuketimler.get(arac_turu)!.tamamlama_orani === null ? null : sayi(tuketimler.get(arac_turu)!.tamamlama_orani),
      yayin_sayisi: sayi(ham.yayin_sayisi), kayitli_arac_puani: sayi(ham.kayitli_arac_puani),
      net_kazanilan_puan: sayi(ham.net_kazanilan_puan),
      dogru_cevap_yuzdesi: ham.dogru_cevap_yuzdesi == null ? null : sayi(ham.dogru_cevap_yuzdesi),
      etkilesim_yayin_sayisi: sayi(ham.etkilesim_yayin_sayisi), yayinlar: [],
    };
  });
}

export async function aracYayinlari(db: SupabaseClient, girdi: AracRaporGirdisi & {
  aracTuru: OgrenmeAraciTuru; sonYayinId: string | null;
}): Promise<AracYayinSayfasi> {
  const sayfaBoyutu = 50;
  const { data, error } = await db.rpc('get_yayin_raporlari_arac_yayinlari_v1', {
    ...rpcArgumanlari(girdi), p_arac_turu: girdi.aracTuru,
    p_sayfa_boyutu: sayfaBoyutu, p_son_yayin_id: girdi.sonYayinId,
  });
  if (error || !Array.isArray(data)) throw new Error('Öğrenme aracı yayınları okunamadı.');
  const yayinlar: AracTuruRaporSatiri['yayinlar'] = data.map((y) => ({
    yayin_id: y.yayin_id, yayin_kodu: y.yayin_kodu ?? '-', talep_id: y.talep_id ?? null,
    talep_no: y.talep_no == null ? null : sayi(y.talep_no),
    kayitli_arac_puani: sayi(y.kayitli_arac_puani), kazanilan_puan: sayi(y.kazanilan_puan),
    kaybedilen_puan: sayi(y.kaybedilen_puan), baslatma: sayi(y.baslatma), tamamlama: sayi(y.tamamlama),
  }));
  return { yayinlar, sonrakiImlec: yayinlar.length === sayfaBoyutu ? yayinlar[yayinlar.length - 1].yayin_id : null };
}
