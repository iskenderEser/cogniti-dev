import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { PARTNER_OTURUM_CEREZI, partnerCerezAyarlari, partnerTokenOzeti } from "@/lib/agora/partnerOturumu";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return partnerYanit({ hata: "İstek doğrulanamadı." }, 403);
  const jar = await cookies(), token = jar.get(PARTNER_OTURUM_CEREZI)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    try {
      const { error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_oturum_kapat", { p_token_ozeti: partnerTokenOzeti(token) });
      if (error) throw new Error("Çıkış yapılamadı");
    } catch { return partnerYanit({ hata: "Çıkış tamamlanamadı. Lütfen yeniden deneyin." }, 503); }
  }
  jar.set(PARTNER_OTURUM_CEREZI, "", { ...partnerCerezAyarlari, maxAge: 0 });
  return partnerYanit({ yonlendir: "/partner" });
}
