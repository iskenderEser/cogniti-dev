import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { eclubKisiErisimi } from "@/lib/eclub/kisiErisim";
import { eclubFirmaKapsami } from "@/lib/eclub/firmaGezinme";
import { firmaBannerlariniOku } from "@/lib/eclub/bannerSunucu";
import { bannerKurulumuEksik } from "@/lib/eclub/banner";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { yetkiHatasi, rolHatasi, validasyonHatasi, hataYaniti, sunucuHatasi } from "@/lib/utils/hataIsle";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const admin = createAdminClient();
    const erisim = await eclubKisiErisimi(admin, user.id);
    if (!erisim.kisi || !ECLUB_TUKETICI_ROLLERI.includes(erisim.kisi.rol)) return rolHatasi();
    const firmaId = new URL(request.url).searchParams.get("firma_id");
    if (firmaId !== null && !uuidGecerliMi(firmaId)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    let hedefFirmaId = firmaId;
    if (firmaId) {
      if (!eclubFirmaKapsami(erisim.firmalar, firmaId).length) return rolHatasi("Bu firmaya erişiminiz bulunmuyor.");
    } else {
      // Ana sayfa görselleri bütün aktif E-Club üyelerine gösterilir.
      if (!erisim.eclub_aktif) return rolHatasi();
      const { data: hapbilgi, error: firmaHatasi } = await admin.from("firmalar")
        .select("firma_id").ilike("firma_adi", "hapbilgi").eq("aktif", true).eq("eclub_aktif", true).maybeSingle();
      if (firmaHatasi) return hataYaniti("Ana sayfa banner firması okunamadı.", "Banner firma SELECT", firmaHatasi);
      hedefFirmaId = hapbilgi?.firma_id ?? null;
    }
    if (!hedefFirmaId) return NextResponse.json({ bannerlar: [] }, { headers: { "Cache-Control": "no-store" } });
    const sonuc = await firmaBannerlariniOku(admin, hedefFirmaId);
    if (sonuc.error && !bannerKurulumuEksik(sonuc.error)) return hataYaniti("Bannerlar yüklenemedi.", "E-Club banner SELECT", sonuc.error);
    return NextResponse.json({ bannerlar: sonuc.bannerlar }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "GET E-Club bannerlar"); }
}
