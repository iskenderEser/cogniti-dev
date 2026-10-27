import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { yetkiHatasi, validasyonHatasi, sunucuHatasi } from "@/lib/utils/hataIsle";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const params = request.nextUrl.searchParams;
    const kapsam = params.get("kapsam") ?? "kapsam";
    const arama = params.get("arama") ?? "";
    const tur = params.get("tur") ?? "";
    const sayfaText = params.get("sayfa") ?? "0";
    if (!/^(0|[1-9][0-9]{0,5})$/.test(sayfaText) || Number(sayfaText)>100000 || !["benim","kapsam"].includes(kapsam) || arama.length>100 || !["","yayin","tclub_oneri","cclub_challenge","eclub_oneri","eczanem_musteri","viva_davet"].includes(tur)) return validasyonHatasi("Geçersiz rapor seçimi.");
    const result = await createAdminClient().rpc("cogniti_token_raporu", { p_kullanici: user.id, p_kapsam: kapsam, p_sayfa: Number(sayfaText), p_arama: arama, p_tur: tur });
    if (result.error?.code === "42501") return yetkiHatasi("Token raporuna erişiminiz bulunmuyor.");
    if (result.error) { console.error("Token raporu alınamadı",result.error.code); return NextResponse.json({hata:"Token bilgileri alınamadı."},{status:500}); }
    return NextResponse.json(result.data,{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return sunucuHatasi(error,"Token raporu"); }
}
