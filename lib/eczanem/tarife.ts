// Puan–TL: merkezi firma tanımı. Barkod ve satış fiyatı: ürün bazında.
// Mevcut tarife tarihçesi korunur; indirim talebi oranı snapshot olarak saklar.
import { SupabaseClient } from "@supabase/supabase-js";

export interface GuncelTarife {
  puan: number;
  tl: number;
  satis_fiyati: number | null;
}

// Ürünün şu an geçerli tarifesi: gecerlilik_baslangic <= now olan en son satır.
// Hiç tarife yoksa null (ürün ilk kez eczanem yayınına giriyor).
export async function guncelTarife(
  adminSupabase: SupabaseClient,
  urun_id: string
): Promise<GuncelTarife | null> {
  const simdi = new Date().toISOString();
  const { data } = await adminSupabase
    .from("eczanem_merkezi_urun_tarifeleri")
    .select("puan, tl, satis_fiyati")
    .eq("urun_id", urun_id)
    .lte("gecerlilik_baslangic", simdi)
    .order("gecerlilik_baslangic", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { puan: data.puan, tl: Number(data.tl), satis_fiyati: data.satis_fiyati == null ? null : Number(data.satis_fiyati) };
}
