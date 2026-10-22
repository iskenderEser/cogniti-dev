import type { SupabaseClient } from '@supabase/supabase-js';
import type { UretimRaporKapsami } from './getUretimData';
import type { UretimRaporRolu } from './raporRolu';

/** V1-V4 sayıları SQL'de hesaplanır; uygulama yalnız dört sayıyı aktarır. */
export async function getTemsilciVaryantOzeti(
  db: SupabaseClient,
  kapsam: UretimRaporKapsami,
  baslangic: string,
  bitis: string,
  raporRolu: Exclude<UretimRaporRolu, 'tumu'> = 'utt',
) {
  const { data, error } = await db.rpc('get_yayin_raporlari_varyant_ozeti_v1', {
    p_yonetici_id: kapsam.raporKimligi,
    p_baslangic: baslangic,
    p_bitis: bitis,
    p_rapor_rolu: raporRolu,
  });
  if (error || !Array.isArray(data) || data.length !== 1) {
    const etiket = { utt: 'Temsilci', bm: 'BM', eczaci: 'Eczacı', eczane_teknisyeni: 'Eczane Teknisyeni', eczanem: 'Eczanem Üyesi' }[raporRolu];
    throw new Error(etiket + ' üretim yöntemleri okunamadı.');
  }
  const ozet = data[0];
  return {
    donem_normal_uretim: Number(ozet.donem_normal_uretim ?? 0),
    donem_hazir_video: Number(ozet.donem_hazir_video ?? 0),
    donem_hazir_soru_seti: Number(ozet.donem_hazir_soru_seti ?? 0),
    donem_hazir_video_ve_soru_seti: Number(ozet.donem_hazir_video_ve_soru_seti ?? 0),
  };
}
