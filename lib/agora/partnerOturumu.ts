import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

export const PARTNER_OTURUM_CEREZI = "cogniti_partner_oturum";
export const partnerTokenOzeti = (token: string) => createHash("sha256").update(token).digest("hex");
export const partnerTokenOlustur = () => randomBytes(32).toString("hex");
export const partnerCerezAyarlari = {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const,
  path: "/partner", maxAge: 8 * 60 * 60,
};
export interface PartnerProfilKimligi { partner_id: string; ad_soyad: string; eposta: string; cep_telefonu: string }
export async function partnerOturumuOku(): Promise<PartnerProfilKimligi | null> {
  const token = (await cookies()).get(PARTNER_OTURUM_CEREZI)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_oturum_oku", { p_token_ozeti: partnerTokenOzeti(token) });
  if (error) throw new Error("Partner oturumu doğrulanamadı.");
  if (!data) return null;
  if (typeof data !== "object" || !["partner_id", "ad_soyad", "eposta", "cep_telefonu"].every(k => typeof data[k] === "string")) throw new Error("Partner oturumu okunamadı.");
  return { partner_id: data.partner_id, ad_soyad: data.ad_soyad, eposta: data.eposta, cep_telefonu: data.cep_telefonu };
}
