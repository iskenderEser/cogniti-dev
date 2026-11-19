import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { partnerCanliOdaVeTokenHazirla } from "@/lib/agora/partnerCanliOda";
import { VivaDailyHatasi } from "@/lib/viva/daily";

export async function POST(request: Request) {
  const body = await partnerJsonOku(request);
  if (!body.ok) return body.yanit;

  const oturumId = body.veri.oturum_id;
  if (!medyaUuid(oturumId)) {
    return partnerYanit({ hata: "Geçersiz oturum." }, 400);
  }

  try {
    const b = await agoraVitrinBaglami();
    if (!b) return partnerYanit({ hata: "Agora erişim yetkiniz bulunmuyor." }, 403);

    const sonuc = await partnerCanliOdaVeTokenHazirla({
      db: b.db,
      oturumId,
      authId: b.authId,
      sunucuMu: false,
    });
    if (!sonuc.ok) return partnerYanit({ hata: sonuc.hata }, sonuc.status);

    return partnerYanit({ url: sonuc.url });
  } catch (err) {
    if (err instanceof VivaDailyHatasi) {
      return partnerYanit({ hata: err.message }, err.status);
    }
    return partnerYanit({ hata: "Canlı yayın odasına bağlanılamadı." }, 503);
  }
}
