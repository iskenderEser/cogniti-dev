import type { SupabaseClient } from "@supabase/supabase-js";
import { ECLUB_BANNER_BUCKET, ECLUB_BANNER_TABLO, type EclubBanner } from "./banner";

export async function firmaBannerlariniOku(admin: SupabaseClient, firmaId: string) {
  const { data, error } = await admin.from(ECLUB_BANNER_TABLO)
    .select("sira, dosya_yolu").eq("firma_id", firmaId).order("sira");
  const bannerlar: EclubBanner[] = (data ?? []).map((satir) => ({
    sira: satir.sira,
    url: admin.storage.from(ECLUB_BANNER_BUCKET).getPublicUrl(satir.dosya_yolu).data.publicUrl,
  }));
  return { bannerlar, error };
}
