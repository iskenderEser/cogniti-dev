import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const ON_BASVURU_TABLOSU = "cogniti_kurumsal_on_basvuru";
export const davetOzeti = (token: string) => createHash("sha256").update(token).digest("hex");
export const davetBicimiGecerli = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export function ayniKaynaktan(istek: Request) {
  return istek.headers.get("origin") === new URL(istek.url).origin;
}

export async function adayOturumu() {
  const { data: { user }, error } = await (await createClient()).auth.getUser();
  if (error || !user?.email_confirmed_at || !user.email) return null;
  const { data, error: kayitHatasi } = await createAdminClient().from(ON_BASVURU_TABLOSU)
    .select("id").eq("aday_auth_id", user.id).eq("eposta", user.email.toLowerCase())
    .not("kabul_at", "is", null).maybeSingle();
  if (kayitHatasi) throw kayitHatasi;
  return data;
}
