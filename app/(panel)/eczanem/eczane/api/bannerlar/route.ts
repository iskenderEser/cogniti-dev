import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { eczaciAktifEczanesi } from "@/lib/eczanem/eczaci";
import { bannerAlaniGecerli } from "@/lib/eclub/banner";
import { firmaBannerlariniOku } from "@/lib/eclub/bannerSunucu";
import { yetkiHatasi, rolHatasi, validasyonHatasi, isKuraluHatasi, hataYaniti, sunucuHatasi } from "@/lib/utils/hataIsle";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const admin = createAdminClient();
    const rol = await rolCozucu(admin, user.id);
    if (!ECLUB_TUKETICI_ROLLERI.includes(rol)) return rolHatasi();
    const alan = new URL(request.url).searchParams.get("alan") ?? "";
    if (!bannerAlaniGecerli(alan) || alan === "firma") return validasyonHatasi("Geçersiz sayfa banner alanı.", ["alan"]);
    const erisim = await eczaciAktifEczanesi(admin, user.id);
    if (!erisim.ok) return isKuraluHatasi(erisim.hata ?? "Eczanem erişimi bulunamadı.");
    const sonuclar = await Promise.all([...new Set(erisim.firmaIdler ?? [])].sort().map((firmaId) => firmaBannerlariniOku(admin, firmaId, alan)));
    const okumaHatasi = sonuclar.find((sonuc) => sonuc.error)?.error;
    if (okumaHatasi) return hataYaniti("Sayfa bannerları yüklenemedi.", "Eczanem banner SELECT", okumaHatasi);
    return NextResponse.json({ bannerlar: sonuclar.flatMap((sonuc) => sonuc.bannerlar) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "GET Eczanem sayfa bannerları"); }
}
