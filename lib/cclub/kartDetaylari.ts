import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Challenge Club video kartının UTT kartıyla aynı alt bilgileri taşıması için
 * gereken metrikler. Beğeni/favori UTT ile aynı ortak tablolardan (video_begeniler
 * / video_favoriler) gelir; izlenme CC izlemesinden (cc_izleme_kayitlari) sayılır.
 */
export interface CcKartMetrik {
  extra_puan: number;
  cek_karsiligi_var_mi?: boolean | null;
  saha_puan_modeli?: string | null;
  karsilik_puan?: number | null;
  karsilik_tl?: number | null;
  hedef_roller?: string[] | null;
  izlenme_sayisi: number;
  begeni_sayisi: number;
  favori_sayisi: number;
  begeni_mi: boolean;
  favori_mi: boolean;
  daha_once_izledi: boolean;
}

const bosMetrik = (): CcKartMetrik => ({
  extra_puan: 0,
  izlenme_sayisi: 0,
  begeni_sayisi: 0,
  favori_sayisi: 0,
  begeni_mi: false,
  favori_mi: false,
  daha_once_izledi: false,
});

/** Verilen yayınlar için BM bazlı kart metriklerini toplu (salt-okur) hesaplar. */
export async function ccKartMetrikleri(
  supabase: SupabaseClient,
  yayinIdler: string[],
  bmId: string
): Promise<Record<string, CcKartMetrik>> {
  if (yayinIdler.length === 0) return {};

  const [yayinBilgi, begeniler, favoriler, kullaniciBegeni, kullaniciFavori, ccIzlemeler] = await Promise.all([
    supabase.from("yayin_yonetimi").select("yayin_id, extra_puan, cek_karsiligi_var_mi, saha_puan_modeli, karsilik_puan, karsilik_tl, hedef_roller").in("yayin_id", yayinIdler),
    supabase.from("video_begeniler").select("yayin_id").in("yayin_id", yayinIdler),
    supabase.from("video_favoriler").select("yayin_id").in("yayin_id", yayinIdler),
    supabase.from("video_begeniler").select("yayin_id").in("yayin_id", yayinIdler).eq("kullanici_id", bmId),
    supabase.from("video_favoriler").select("yayin_id").in("yayin_id", yayinIdler).eq("kullanici_id", bmId),
    supabase.from("cc_izleme_kayitlari").select("yayin_id, bm_id").in("yayin_id", yayinIdler).eq("tamamlandi_mi", true),
  ]);

  const cekBilgiMap = new Map((yayinBilgi.data ?? []).map((y) => [y.yayin_id, y]));
  const extraMap: Record<string, number> = {};
  for (const y of yayinBilgi.data ?? []) extraMap[y.yayin_id] = y.extra_puan ?? 0;

  const say = (rows: { yayin_id: string }[] | null | undefined): Record<string, number> => {
    const m: Record<string, number> = {};
    for (const r of rows ?? []) m[r.yayin_id] = (m[r.yayin_id] ?? 0) + 1;
    return m;
  };
  const begeniSay = say(begeniler.data);
  const favoriSay = say(favoriler.data);
  const izlenmeSay = say(ccIzlemeler.data);

  const begeniSet = new Set((kullaniciBegeni.data ?? []).map((r: { yayin_id: string }) => r.yayin_id));
  const favoriSet = new Set((kullaniciFavori.data ?? []).map((r: { yayin_id: string }) => r.yayin_id));
  const izlediSet = new Set(
    (ccIzlemeler.data ?? [])
      .filter((r: { bm_id: string }) => r.bm_id === bmId)
      .map((r: { yayin_id: string }) => r.yayin_id)
  );

  const sonuc: Record<string, CcKartMetrik> = {};
  for (const yid of yayinIdler) {
    sonuc[yid] = {
      ...bosMetrik(),
      extra_puan: extraMap[yid] ?? 0,
      cek_karsiligi_var_mi: cekBilgiMap.get(yid)?.cek_karsiligi_var_mi ?? null,
      saha_puan_modeli: cekBilgiMap.get(yid)?.saha_puan_modeli ?? null,
      karsilik_puan: cekBilgiMap.get(yid)?.karsilik_puan ?? null,
      karsilik_tl: cekBilgiMap.get(yid)?.karsilik_tl ?? null,
      hedef_roller: cekBilgiMap.get(yid)?.hedef_roller ?? null,
      izlenme_sayisi: izlenmeSay[yid] ?? 0,
      begeni_sayisi: begeniSay[yid] ?? 0,
      favori_sayisi: favoriSay[yid] ?? 0,
      begeni_mi: begeniSet.has(yid),
      favori_mi: favoriSet.has(yid),
      daha_once_izledi: izlediSet.has(yid),
    };
  }
  return sonuc;
}
