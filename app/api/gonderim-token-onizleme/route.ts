import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { satinAlmaBakiyesiGorebilir } from "@/lib/satinAlma/bakiyeOzeti";
import { gonderimOnizlemeIstegiGecerli, gonderimTokenOnizlemesiGecerli } from "@/lib/satinAlma/gonderimOnizleme";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";

export async function POST(request: Request) {
  try {
    const oturum = await createClient();
    const { data: { user }, error } = await oturum.auth.getUser();
    if (error || !user) return partnerYanit({ hata: "Oturum açmanız gerekiyor." }, 401);
    const db = createAdminClient(AbortSignal.timeout(10000));
    const rol = await rolCozucu(db, user.id);
    if (!satinAlmaBakiyesiGorebilir(rol)) return partnerYanit({ hata: "Gönderim önizlemesine erişiminiz bulunmuyor." }, 403);
    const body = await partnerJsonOku(request, 16384);
    if (!body.ok) return body.yanit;
    if (!gonderimOnizlemeIstegiGecerli(body.veri)) return partnerYanit({ hata: "Gönderim seçimi geçersiz." }, 400);
    const girdi = body.veri;
    const { data, error: hata } = await db.rpc("cogniti_gonderim_token_onizle", {
      p_auth_id: user.id, p_akis: girdi.akis, p_bakiye_turu: girdi.bakiyeTuru,
      p_kaynak_idler: girdi.kaynakIdler, p_alici_idler: girdi.aliciIdler, p_plan_tarihi: girdi.planTarihi,
    });
    if (hata?.code === "42501") return partnerYanit({ hata: "Bu içerik, alıcı veya bakiye seçimine erişiminiz bulunmuyor." }, 403);
    if (hata?.code === "22023") return partnerYanit({ hata: "Gönderim koşulları değişmiş olabilir. Seçiminizi kontrol edin." }, 400);
    if (hata || !gonderimTokenOnizlemesiGecerli(data) || data.akis !== girdi.akis || data.bakiye_turu !== girdi.bakiyeTuru || data.planli !== Boolean(girdi.planTarihi)) {
      return partnerYanit({ hata: "Gönderim önizlemesi alınamadı. Yeniden deneyin." }, 503);
    }
    return partnerYanit(data);
  } catch {
    return partnerYanit({ hata: "Gönderim önizlemesi alınamadı. Yeniden deneyin." }, 503);
  }
}
