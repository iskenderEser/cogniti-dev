import { createAdminClient } from "@/lib/supabase/server";
import { taahhutluPaketlerGecerli } from "./taahhut";
import { sm2MatrisiGecerli } from "./sm2";
import { partnerYanit } from "@/lib/agora/partnerHttp";

/** Yalnız oturum ve rol kapısı geçildikten sonra çağrılır. */
export async function sm2FiyatYaniti() {
  const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_sm2_fiyatlari_oku");
  if (error || !data || !sm2MatrisiGecerli(data.sm2) || !taahhutluPaketlerGecerli(data.paketler)) return partnerYanit({hata:"Fiyatlar okunamadı. SQL kurulumunu kontrol edin."},503);
  return partnerYanit(data);
}
