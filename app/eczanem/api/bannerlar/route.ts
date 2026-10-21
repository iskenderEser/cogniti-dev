import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { musteriKimligi } from "@/lib/eczanem/oturum";
import { PLATFORM_FIRMA_ID } from "@/lib/eclub/banner";
import { firmaBannerlariniOku } from "@/lib/eclub/bannerSunucu";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { hataYaniti, rolHatasi, sunucuHatasi, yetkiHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

/** Admin > Eczanem kayıtları; firma seçimi aktif üye–eczane–firma bağıyla doğrulanır. */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const admin = createAdminClient();
    const kimlik = await musteriKimligi(admin, user.id);
    if (!kimlik.ok) return rolHatasi(kimlik.hata ?? "Eczanem üyeliği doğrulanamadı.");

    const sorgu = new URL(request.url).searchParams;
    const firmaId = sorgu.get("firma_id");
    const eczaneId = sorgu.get("eczane_id");
    if ((firmaId !== null || eczaneId !== null) && (!firmaId || !eczaneId || !uuidGecerliMi(firmaId) || !uuidGecerliMi(eczaneId))) {
      return validasyonHatasi("Geçerli eczane ve firma seçin.", ["eczane_id", "firma_id"]);
    }
    if (firmaId && eczaneId) {
      if (!kimlik.eczaneIdler?.includes(eczaneId) || !kimlik.firmaIdler?.includes(firmaId)) return rolHatasi("Bu eczane ve firmanın bannerlarına erişiminiz yok.");
      const { data: bag, error: bagHatasi } = await admin.from("eclub_eczane_firma")
        .select("firma_id").eq("eczane_id", eczaneId).eq("firma_id", firmaId).eq("aktif_mi", true).maybeSingle();
      if (bagHatasi) return hataYaniti("Banner erişimi doğrulanamadı.", "Eczanem banner eczane–firma SELECT", bagHatasi);
      if (!bag) return rolHatasi("Firma seçilen eczaneye bağlı değil.");
    }
    const hedefFirma = firmaId ?? PLATFORM_FIRMA_ID;
    let firmaSorgusu = admin.from("firmalar")
      .select("firma_id").eq("firma_id", hedefFirma).eq("aktif", true);
    // Platform tanıtımı firma modülüne bağlı değildir; seçili firma kendi modül kapısından geçer.
    if (firmaId) firmaSorgusu = firmaSorgusu.eq("eclub_aktif", true).eq("eczanem_aktif", true);
    const { data: firma, error: firmaHatasi } = await firmaSorgusu.maybeSingle();
    if (firmaHatasi) return hataYaniti("Ana sayfa görselleri okunamadı.", "Eczanem banner firması SELECT", firmaHatasi);
    if (!firma) return NextResponse.json({ bannerlar: [] }, { headers: { "Cache-Control": "no-store" } });

    const sonuc = await firmaBannerlariniOku(admin, hedefFirma, "uye-ana-sayfa");
    if (sonuc.error) return hataYaniti("Ana sayfa görselleri yüklenemedi.", "Eczanem üye banner SELECT", sonuc.error);
    return NextResponse.json({ bannerlar: sonuc.bannerlar }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return sunucuHatasi(error, "GET /eczanem/api/bannerlar");
  }
}
