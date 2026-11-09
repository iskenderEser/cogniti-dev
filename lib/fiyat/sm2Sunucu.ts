import { createAdminClient } from "@/lib/supabase/server";
import { planlamaTarifesiGecerli } from "./planlama";
import { partnerYanit } from "@/lib/agora/partnerHttp";

/** Yalnız oturum ve rol kapısı geçildikten sonra çağrılır. */
export async function sm2FiyatYaniti() {
  const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_sm2_fiyatlari_oku");
  if (error || !planlamaTarifesiGecerli(data)) return partnerYanit({hata:"Fiyatlar okunamadı. SQL kurulumunu kontrol edin."},503);
  return partnerYanit(data);
}
