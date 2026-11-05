import { createAdminClient } from "@/lib/supabase/server";
import { partnerKayitIsleyicisi } from "@/lib/agora/partnerKayitApi";

export const POST = partnerKayitIsleyicisi(async (veri) => {
  const db = createAdminClient(AbortSignal.timeout(10000));
  const { data, error } = await db.rpc("agora_partner_kayit_olustur", {
    p_ad_soyad: veri.ad_soyad,
    p_eposta: veri.eposta,
    p_cep_telefonu: veri.cep_telefonu,
  });
  return !error && data === true;
});
