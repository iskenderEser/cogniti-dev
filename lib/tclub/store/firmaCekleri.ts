import type { SupabaseClient } from "@supabase/supabase-js";
import { bazPuanGecerliMi, minimumSiparisTlGecerliMi } from "./katalog";
import type { FirmaStoreCeki } from "./tipler";

// Vitrin yalnız açık firma seçimi + baz puan + merkezî minimum TL ile oluşur.
export async function firmaMagazaCekleri(
  db: SupabaseClient,
  firmaId: string,
  urunId?: string,
): Promise<{ cekler: FirmaStoreCeki[]; hata: unknown | null }> {
  let ayarSorgusu = db.from("store_urun_firma_ayarlari")
    .select("urun_id,baz_puan").eq("firma_id", firmaId).eq("aktif_mi", true);
  if (urunId) ayarSorgusu = ayarSorgusu.eq("urun_id", urunId);
  const ayarlar = await ayarSorgusu;
  if (ayarlar.error) return { cekler: [], hata: ayarlar.error };
  const puanlar = new Map<string, number>();
  for (const ayar of ayarlar.data ?? []) {
    if (bazPuanGecerliMi(ayar.baz_puan)) puanlar.set(ayar.urun_id, ayar.baz_puan);
  }
  if (!puanlar.size) return { cekler: [], hata: null };
  const urunler = await db.from("store_urunler")
    .select("urun_id,ad,aciklama,gorsel_url,minimum_siparis_tl,stok,aktif_mi,created_at,updated_at")
    .in("urun_id", [...puanlar.keys()]).eq("aktif_mi", true)
    .order("created_at", { ascending: false });
  if (urunler.error) return { cekler: [], hata: urunler.error };
  const cekler: FirmaStoreCeki[] = [];
  for (const urun of urunler.data ?? []) {
    const bazPuan = puanlar.get(urun.urun_id);
    if (!bazPuanGecerliMi(bazPuan) || !minimumSiparisTlGecerliMi(urun.minimum_siparis_tl)) continue;
    cekler.push({ ...urun, baz_puan: bazPuan, minimum_siparis_tl: urun.minimum_siparis_tl });
  }
  return { cekler, hata: null };
}
