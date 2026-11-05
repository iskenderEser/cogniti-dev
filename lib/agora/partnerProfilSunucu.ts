import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { PARTNER_OTURUM_CEREZI, partnerTokenOzeti } from "@/lib/agora/partnerOturumu";
import type { PartnerKayitliProfil } from "@/lib/agora/partnerProfil";

export async function partnerProfilBaglami() {
  const token = (await cookies()).get(PARTNER_OTURUM_CEREZI)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenOzeti = partnerTokenOzeti(token);
  const db = createAdminClient(AbortSignal.timeout(30000));
  const { data, error } = await db.rpc("agora_partner_profil_oku", { p_token_ozeti: tokenOzeti });
  if (error) throw new Error("Profil okunamadı.");
  if (!data) return null;
  if (typeof data.partner_id !== "string" || typeof data.uyelik_durumu !== "string" || !(data.profil === null || (typeof data.profil === "object" && Number.isSafeInteger(data.profil.surum)))) throw new Error("Profil okunamadı.");
  return { db, tokenOzeti, partnerId: data.partner_id as string, uyelikDurumu: data.uyelik_durumu as string, profil: data.profil as PartnerKayitliProfil | null };
}


/** Eğitim sayfaları ve sonraki eğitim API'leri bu sunucu kapısını kullanır. */
export async function onayliPartnerBaglami() {
  const b = await partnerProfilBaglami();
  return b?.uyelikDurumu === "onaylandi" && b.profil ? b : null;
}
