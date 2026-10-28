import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { yetkiHatasi, sunucuHatasi } from "@/lib/utils/hataIsle";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const result = await createAdminClient().rpc("cogniti_token_raporu", { p_kullanici: user.id });
    if (result.error?.code === "42501") return yetkiHatasi("Token raporuna erişiminiz bulunmuyor.");
    if (result.error) { console.error("Token raporu alınamadı",result.error.code); return NextResponse.json({hata:"Token bilgileri alınamadı."},{status:500}); }
    // Eski SQL kurulumu kullanılıyorsa da hareket/alıcı kayıtlarını istemciye taşıma.
    const data = result.data;
    return NextResponse.json(data && {
      hesap_var: data.hesap_var, kapsam: data.kapsam, yonetici: data.yonetici,
      paket_turu: data.paket_turu, bakiye: data.bakiye, paket_asimi: data.paket_asimi,
      toplam: data.toplam, yuklemeler: data.yuklemeler, gun_sonu: data.gun_sonu,
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return sunucuHatasi(error,"Token raporu"); }
}
