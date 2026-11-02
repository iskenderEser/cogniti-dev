import { bannerKaynakKurulumuEksik, platformBannerFirmasi, type BannerKaynagi } from "./banner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ECLUB_BANNER_BUCKET, ECLUB_BANNER_TABLO, ECZANEM_BANNER_TABLO, bannerGorunurlukKurulumuEksik, type BannerAlani, type EclubBanner } from "./banner";

export async function firmaBannerlariniOku(admin: SupabaseClient, firmaId: string, alan: BannerAlani = "firma", gizlileriDahilEt = false) {
  const tablo = alan === "firma" ? ECLUB_BANNER_TABLO : ECZANEM_BANNER_TABLO;
  let sorgu = admin.from(tablo).select("sira, dosya_yolu, gorunur").eq("firma_id", firmaId);
  if (alan !== "firma") sorgu = sorgu.eq("alan", alan);
  const sonuc = await sorgu.order("sira");
  let { data, error } = sonuc;
  const gorunurlukHazir = !bannerGorunurlukKurulumuEksik(error);
  // Görünürlük SQL'i yüklenene kadar mevcut banner okuması devam eder.
  if (!gorunurlukHazir) {
    let eskiSorgu = admin.from(tablo).select("sira, dosya_yolu").eq("firma_id", firmaId);
    if (alan !== "firma") eskiSorgu = eskiSorgu.eq("alan", alan);
    const eskiSonuc = await eskiSorgu.order("sira");
    data = eskiSonuc.data?.map((satir) => ({ ...satir, gorunur: true })) ?? null;
    error = eskiSonuc.error;
  }
  const bitisler = new Map<number,string>();
  // Süre koşulu görünümde sunucu saatinden hesaplanır; biten görsel listelenmez.
  if (!gizlileriDahilEt) {
    const haftalik = await admin.from("firma_banner_aktif_haftalar").select("sira,dosya_yolu,gorunur,bitis_at").eq("firma_id",firmaId).eq("alan",alan);
    if (haftalik.error && !["42P01","PGRST205"].includes(haftalik.error.code)) return { bannerlar: [], error: haftalik.error, gorunurlukHazir };
    if (!haftalik.error) {
      const birlesik = new Map((data ?? []).map(b => [b.sira,b]));
      for (const b of haftalik.data ?? []) if (!birlesik.has(b.sira)) { birlesik.set(b.sira,b); bitisler.set(b.sira,b.bitis_at); }
      data = [...birlesik.values()].sort((a,b) => a.sira-b.sira);
    }
  }
  const bannerlar: EclubBanner[] = (data ?? []).filter((satir) => gizlileriDahilEt || satir.gorunur !== false).map((satir) => ({
    sira: satir.sira,
    url: admin.storage.from(ECLUB_BANNER_BUCKET).getPublicUrl(satir.dosya_yolu).data.publicUrl,
    gorunur: satir.gorunur !== false,
    ...(bitisler.has(satir.sira) ? { bitis_at: bitisler.get(satir.sira) } : {}),
  }));
  return { bannerlar, error, gorunurlukHazir };
}

export async function adminBannerlariniOku(admin: SupabaseClient, firmaId: string, alan: BannerAlani, kaynak: BannerKaynagi) {
  let sorgu = admin.from(alan === "firma" ? ECLUB_BANNER_TABLO : ECZANEM_BANNER_TABLO)
    .select("sira,dosya_yolu,gorunur,kaynak").eq("firma_id",firmaId);
  if (alan !== "firma") sorgu = sorgu.eq("alan",alan);
  const {data,error} = await sorgu.order("sira");
  if (bannerKaynakKurulumuEksik(error)) {
    const eski = await firmaBannerlariniOku(admin,firmaId,alan,true);
    return {...eski, bannerlar: kaynak === (platformBannerFirmasi(firmaId) ? "cogniti" : "firma") ? eski.bannerlar : [],
      doluSiralar:eski.bannerlar.map(b=>b.sira), kaynakHazir:false};
  }
  return {bannerlar:(data ?? []).filter(b=>b.kaynak===kaynak).map(b=>({sira:b.sira,gorunur:b.gorunur!==false,
    url:admin.storage.from(ECLUB_BANNER_BUCKET).getPublicUrl(b.dosya_yolu).data.publicUrl})),
    doluSiralar:(data ?? []).map(b=>b.sira),error,gorunurlukHazir:!bannerGorunurlukKurulumuEksik(error),kaynakHazir:!error};
}
