import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ECZANEM_KAPALI_MESAJI, uttEczanemErisimi } from "@/lib/eczanem/erisim";
import { uttEczanemUyeGonderimOzeti, uttEczanemUyeGonderimRafi } from "@/lib/eczanem/uyeGonderimOzeti";
import { hataYaniti, rolHatasi, sunucuHatasi, validasyonHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { TUKETICI_ROLLER } from "@/lib/utils/roller";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();

    const db = createAdminClient();
    const rol = await rolCozucu(db, user.id);
    if (!TUKETICI_ROLLER.includes(rol)) return rolHatasi("Bu sayfaya yalnız UTT erişebilir.");
    const erisim = await uttEczanemErisimi(db, user.id);
    if (!erisim.ok) return hataYaniti(erisim.hata ?? "Firma erişimi doğrulanamadı.", "Eczanem UTT firma kapısı", null);
    if (!erisim.acik) return rolHatasi(ECZANEM_KAPALI_MESAJI);

    const firmaId = erisim.firmaIdler[0];
    if (!firmaId) return hataYaniti("Firma kapsamı çözülemedi.", "Eczanem UTT firma kapsamı", null);
    const yil = request.nextUrl.searchParams.get("yil");
    const ay = request.nextUrl.searchParams.get("ay");
    if (yil !== null || ay !== null) {
      if (!yil || !/^[1-9]\d{3}$/.test(yil) || !ay || !/^(0[1-9]|1[0-2])$/.test(ay)) {
        return validasyonHatasi("Geçerli bir yayın ayı ve yılı seçin.", ["ay", "yil"]);
      }
      const raf = await uttEczanemUyeGonderimRafi(db, user.id, firmaId, new Date(`${yil}-${ay}-15T12:00:00Z`), new Date(), true);
      return NextResponse.json(raf, { headers: { "Cache-Control": "no-store" } });
    }
    const ozet = await uttEczanemUyeGonderimOzeti(db, user.id, firmaId);
    return NextResponse.json(ozet, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return sunucuHatasi(error, "GET /eczanem/utt/api/uye-gonderim-ozeti");
  }
}
