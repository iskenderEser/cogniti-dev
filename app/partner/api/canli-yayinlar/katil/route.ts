import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerCanliOdaVeTokenHazirla } from "@/lib/agora/partnerCanliOda";
import { VivaDailyHatasi } from "@/lib/viva/daily";

const UUID_RE = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export async function POST(request: Request) {
  const body = await partnerJsonOku(request);
  if (!body.ok) return body.yanit;

  const oturumId = body.veri.oturum_id;
  if (typeof oturumId !== "string" || !UUID_RE.test(oturumId)) {
    return partnerYanit({ hata: "Geçersiz oturum." }, 400);
  }

  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);

    const sonuc = await partnerCanliOdaVeTokenHazirla({
      db: b.db,
      oturumId,
      partnerId: b.partnerId,
      sunucuMu: true,
    });
    if (!sonuc.ok) return partnerYanit({ hata: sonuc.hata }, sonuc.status);

    return partnerYanit({ url: sonuc.url });
  } catch (err) {
    if (err instanceof VivaDailyHatasi) {
      return partnerYanit({ hata: err.message }, err.status);
    }
    return partnerYanit({ hata: "Canlı yayın odası başlatılamadı." }, 503);
  }
}
