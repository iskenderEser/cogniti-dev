import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerSifreDogrula, partnerTestSifresiGecerli } from "@/lib/agora/partnerSifre";
import { PARTNER_OTURUM_CEREZI, partnerCerezAyarlari, partnerTokenOlustur, partnerTokenOzeti } from "@/lib/agora/partnerOturumu";

export async function POST(request: Request) {
  const body = await partnerJsonOku(request); if (!body.ok) return body.yanit;
  const { eposta, sifre } = body.veri;
  if (typeof eposta !== "string" || eposta.trim().length > 254 || !partnerTestSifresiGecerli(sifre)) return partnerYanit({ hata: "E-posta veya şifre geçersiz ya da ilk girişiniz onaylanmamış." }, 401);
  try {
    const db = createAdminClient(AbortSignal.timeout(10000));
    const { data, error } = await db.rpc("agora_partner_giris_hazirla", { p_eposta: eposta.trim().toLowerCase() });
    if (error) return partnerYanit({ hata: "Giriş şu anda yapılamıyor. Yeniden deneyin." }, 503);
    const hesap = data && typeof data === "object" && typeof data.partner_id === "string" && typeof data.sifre_ozeti === "string" && Number.isSafeInteger(data.giris_surum) ? data : null;
    const dogru = await partnerSifreDogrula(sifre, hesap?.sifre_ozeti ?? null);
    if (!hesap || !dogru) return partnerYanit({ hata: "E-posta veya şifre geçersiz ya da ilk girişiniz onaylanmamış." }, 401);
    const token = partnerTokenOlustur();
    const { data: acildi, error: oturumHatasi } = await db.rpc("agora_partner_oturum_ac", { p_partner_id: hesap.partner_id, p_surum: hesap.giris_surum, p_token_ozeti: partnerTokenOzeti(token) });
    if (oturumHatasi) return partnerYanit({ hata: "Giriş şu anda yapılamıyor. Yeniden deneyin." }, 503);
    if (acildi !== true) return partnerYanit({ hata: "Giriş onayınız değişti. Lütfen yeniden deneyin." }, 401);
    (await cookies()).set(PARTNER_OTURUM_CEREZI, token, partnerCerezAyarlari);
    return partnerYanit({ yonlendir: "/partner/profil" });
  } catch { return partnerYanit({ hata: "Giriş şu anda yapılamıyor. Yeniden deneyin." }, 503); }
}
