import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { vivaYasamMutabakat, type VivaYasamRpc } from "./yasam";
export function vivaYasamRpc(db: ReturnType<typeof createAdminClient>, etkinlik: string, auth: string | null): VivaYasamRpc {
  return async (islem, veri = {}) => {
    const { data, error } = await db.rpc("viva_daily_yasam_islem", { p_auth: auth, p_etkinlik: etkinlik, p_islem: islem, p_veri: veri });
    if (error) throw error;
    return data;
  };
}
export async function vivaSunucuMutabakat(etkinlik: string, db = createAdminClient()) {
  return vivaYasamMutabakat(vivaYasamRpc(db, etkinlik, null));
}
