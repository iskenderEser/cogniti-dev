import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { raporOkumaHatasi, raporSayfasi, partnerRaporListesiGecerli } from "@/lib/agora/rapor";

export async function GET(request: Request) {
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const sayfa = raporSayfasi(new URL(request.url).searchParams.get("sayfa"));
    if (sayfa === null) return partnerYanit({ hata: "Geçersiz rapor sayfası." }, 400);
    const { data, error } = await b.db.rpc("agora_partner_raporlari_oku", {
      p_token_ozeti: b.tokenOzeti, p_sayfa: sayfa,
    });
    if (error) {
      const sonuc = raporOkumaHatasi(error.code);
      return partnerYanit({ hata: sonuc.mesaj }, sonuc.status);
    }
    if (data === null) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    if (!partnerRaporListesiGecerli(data, b.partnerId.toLowerCase(), sayfa)) {
      return partnerYanit({ hata: "Rapor bilgileri doğrulanamadı." }, 503);
    }
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Raporlar okunamadı. Yeniden deneyin." }, 503); }
}
