import type { SupabaseClient } from "@supabase/supabase-js";
import { ECLUB_BANNER_BUCKET, ECLUB_BANNER_TABLO, ECZANEM_BANNER_TABLO, type BannerAlani, type EclubBanner } from "./banner";

export async function firmaBannerlariniOku(admin: SupabaseClient, firmaId: string, alan: BannerAlani = "firma") {
  const tablo = alan === "firma" ? ECLUB_BANNER_TABLO : ECZANEM_BANNER_TABLO;
  let sorgu = admin.from(tablo).select("sira, dosya_yolu").eq("firma_id", firmaId);
  if (alan !== "firma") sorgu = sorgu.eq("alan", alan);
  const { data, error } = await sorgu.order("sira");
  const bannerlar: EclubBanner[] = (data ?? []).map((satir) => ({
    sira: satir.sira,
    url: admin.storage.from(ECLUB_BANNER_BUCKET).getPublicUrl(satir.dosya_yolu).data.publicUrl,
  }));
  return { bannerlar, error };
}
