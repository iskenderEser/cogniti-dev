import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sunucuHatasi, yetkiHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store" };
function dbHatasi(error: { message?: string; code?: string }) {
  const kod = error.message?.match(/COGNITI_TOKEN:(kko_\w+)/)?.[1];
  const mesajlar: Record<string, [number, string]> = {
    kko_yetkisiz: [403, "Devam onayı verme yetkiniz bulunmuyor."],
    kko_guncel_degil: [409, "Token bilgileri değişti. Güncel bakiyeyi kontrol edip yeniden deneyin."],
    kko_esik_asilmadi: [409, "Bakiye 100 token veya altına indiğinde onay verebilirsiniz."],
    kko_gecersiz_onay: [400, "Onay bilgisi geçersiz. Lütfen yeniden deneyin."],
  };
  if (kod && mesajlar[kod]) return NextResponse.json({ hata: mesajlar[kod][1] }, { status: mesajlar[kod][0], headers });
  console.error("KKÖ veritabanı hatası", error.code);
  return NextResponse.json({ hata: "Token bilgileri işlenemedi. Lütfen yeniden deneyin." }, { status: 500, headers });
}
export async function GET() {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const result = await createAdminClient().rpc("cogniti_token_kko_durum", { p_kullanici: user.id });
    if (result.error) return dbHatasi(result.error);
    return NextResponse.json(result.data, { headers });
  } catch (error) { return sunucuHatasi(error, "KKÖ durum GET"); }
}
export async function POST(request: NextRequest) {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return yetkiHatasi();
    let body;
    try { body = await request.json(); } catch { return validasyonHatasi("Geçerli onay bilgisi gönderin."); }
    if (!body || typeof body.onay_surumu !== "string" || !UUID.test(body.onay_surumu)) return validasyonHatasi("Geçerli onay bilgisi gönderin.");
    const result = await createAdminClient().rpc("cogniti_token_kko_onayla", { p_kullanici: user.id, p_surum: body.onay_surumu });
    if (result.error) return dbHatasi(result.error);
    return NextResponse.json({ ok: true, ...result.data }, { headers });
  } catch (error) { return sunucuHatasi(error, "KKÖ onay POST"); }
}
