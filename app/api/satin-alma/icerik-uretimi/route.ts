import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { icerikUretimiOnaylandiEpostasiGonder } from "@/lib/satinAlma/satinAlmaEposta";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

export async function POST(request: Request) {
  try {
    const body = await partnerJsonOku(request);
    if (!body.ok) return body.yanit;
    const { talep_id, hesap } = body.veri;
    if (!uuidGecerliMi(talep_id) || (hesap !== "kisisel" && hesap !== "firma_ortak")) {
      return partnerYanit({ hata: "Talep veya token hesabı geçersiz." }, 400);
    }

    const supabase = await createClient();
    const { data: { user }, error: authHatasi } = await supabase.auth.getUser();
    if (authHatasi || !user) return partnerYanit({ hata: "Oturum açmanız gerekiyor." }, 401);

    const db = createAdminClient(AbortSignal.timeout(10000));
    const { data, error } = await db
      .rpc("cogniti_icerik_uretim_tahsil_et", { p_auth: user.id, p_talep: talep_id, p_hesap: hesap });
    if (error?.code === "P0001" && error.message === "ICERIK_URETIMI:bakiye_yetersiz") {
      return partnerYanit({ kod: "bakiye_yetersiz", hata: "Token bakiyeniz yetersiz. Hemen token siparişi verebilirsiniz." }, 422);
    }
    if (error?.code === "42501") return partnerYanit({ hata: "Bu talep için ödeme yetkiniz bulunmuyor." }, 403);
    if (error?.code === "22023") return partnerYanit({ hata: "İçerik ödeme için hazır değil." }, 409);
    if (error || data?.talep_id !== talep_id || !Number.isSafeInteger(data?.token) || data.token <= 0) {
      return partnerYanit({ hata: "Ödeme sonucu doğrulanamadı. Tekrar deneyin." }, 500);
    }

    if (data.tekrar !== true) {
      await icerikUretimiOnaylandiEpostasiGonder(db, {
        kullaniciId: user.id,
        talepId: talep_id,
        hesapTuru: hesap,
        tokenAdedi: data.token,
      });
    }

    return partnerYanit({ ok: true, tekrar: data.tekrar === true });
  } catch {
    return partnerYanit({ hata: "Ödeme sonucu doğrulanamadı. Tekrar deneyin." }, 500);
  }
}
