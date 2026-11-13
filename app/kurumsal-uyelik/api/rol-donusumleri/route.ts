import { createAdminClient } from "@/lib/supabase/server";
import { sunucuHatasi } from "@/lib/utils/hataIsle";

export async function GET() {
  try {
    const db = createAdminClient(AbortSignal.timeout(10_000));
    const { data, error } = await db.from("cogniti_rol_donusumleri").select("unvan_anahtari,rol_kodu");
    if (error) return sunucuHatasi(error, "Kurumsal üyelik rol dönüşümleri");
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return sunucuHatasi(error, "Kurumsal üyelik rol dönüşümleri");
  }
}
