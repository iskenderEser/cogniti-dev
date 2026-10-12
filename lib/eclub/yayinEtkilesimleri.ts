import type { SupabaseClient } from "@supabase/supabase-js";

function sayimHaritasi(satirlar: readonly { yayin_id: string }[]): Map<string, number> {
  const harita = new Map<string, number>();
  for (const satir of satirlar) {
    harita.set(satir.yayin_id, (harita.get(satir.yayin_id) ?? 0) + 1);
  }
  return harita;
}

/** E-Club üyesinin yayın üzerindeki etkileşimleri; iç kullanıcı tablolarıyla karıştırılmaz. */
export async function eclubYayinEtkilesimSayilari(admin: SupabaseClient, yayinIdleri: readonly string[]) {
  if (yayinIdleri.length === 0) {
    return { begeniler: new Map<string, number>(), favoriler: new Map<string, number>() };
  }

  const [begeniSonucu, favoriSonucu] = await Promise.all([
    admin.from("eclub_video_begeniler").select("yayin_id").in("yayin_id", [...yayinIdleri]),
    admin.from("eclub_video_favoriler").select("yayin_id").in("yayin_id", [...yayinIdleri]),
  ]);
  if (begeniSonucu.error) throw new Error(`E-Club beğenileri alınamadı: ${begeniSonucu.error.message}`);
  if (favoriSonucu.error) throw new Error(`E-Club favorileri alınamadı: ${favoriSonucu.error.message}`);

  return {
    begeniler: sayimHaritasi(begeniSonucu.data ?? []),
    favoriler: sayimHaritasi(favoriSonucu.data ?? []),
  };
}
