import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const ON_BASVURU_TABLOSU = "cogniti_kurumsal_on_basvuru";
export const KURUMSAL_BASVURU_TABLOSU = "cogniti_kurumsal_uyelik_basvurulari";
export const KURUMSAL_BELGE_BUCKET = "kurumsal-uyelik-belgeleri";
export const davetOzeti = (token: string) => createHash("sha256").update(token).digest("hex");
export const davetBicimiGecerli = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export function ayniKaynaktan(istek: Request) {
  return istek.headers.get("origin") === new URL(istek.url).origin;
}

export interface AdayOturumBilgisi {
  id: string;
  aday_auth_id: string;
  firma_adi: string;
  web_sitesi: string | null;
  ad_soyad: string;
  eposta: string;
  cep_tel: string;
}

export async function adayOturumuDetay(): Promise<AdayOturumBilgisi | null> {
  const { data: { user }, error } = await (await createClient()).auth.getUser();
  if (error || !user?.email_confirmed_at || !user.email) return null;
  const { data, error: kayitHatasi } = await createAdminClient().from(ON_BASVURU_TABLOSU)
    .select("id,aday_auth_id,firma_adi,web_sitesi,ad_soyad,eposta,cep_tel")
    .eq("aday_auth_id", user.id).eq("eposta", user.email.toLowerCase())
    .not("kabul_at", "is", null).maybeSingle();
  if (kayitHatasi) throw kayitHatasi;
  if (!data?.aday_auth_id) return null;
  return data as AdayOturumBilgisi;
}

export async function adayOturumu() {
  const detay = await adayOturumuDetay();
  return detay ? { id: detay.id } : null;
}
