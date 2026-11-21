import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { URETICI_ROLLER } from "@/lib/utils/roller";

export async function GET() {
  try {
    const b = await agoraVitrinBaglami();
    if (!b || !URETICI_ROLLER.includes(b.rol)) {
      return partnerYanit({ hata: "Bu alana erişiminiz yok." }, 403);
    }

    const { data, error } = await b.db.rpc("agora_canli_yayinlarim_oku", {
      p_auth_id: b.authId,
    });

    if (error || !Array.isArray(data)) {
      return partnerYanit({ hata: "Canlı Agora yayınlarınız alınamadı." }, 503);
    }

    return partnerYanit({ yayinlar: data });
  } catch {
    return partnerYanit({ hata: "Canlı Agora yayınlarınız alınamadı." }, 503);
  }
}
