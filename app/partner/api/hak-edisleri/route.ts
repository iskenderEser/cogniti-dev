import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { hakedisOkumaHatasi, hakedisSayfasi, partnerHakEdisListesiGecerli } from "@/lib/agora/hakedis";

export async function GET(request: Request) {
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const sayfa = hakedisSayfasi(new URL(request.url).searchParams.get("sayfa"));
    if (sayfa === null) return partnerYanit({ hata: "Geçersiz hak ediş sayfası." }, 400);
    const { data, error } = await b.db.rpc("agora_partner_hakedisleri_oku", {
      p_token_ozeti: b.tokenOzeti, p_sayfa: sayfa,
    });
    if (error) {
      const sonuc = hakedisOkumaHatasi(error.code);
      return partnerYanit({ hata: sonuc.mesaj }, sonuc.status);
    }
    if (data === null) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    if (!partnerHakEdisListesiGecerli(data, b.partnerId.toLowerCase(), sayfa)) {
      return partnerYanit({ hata: "Hak ediş bilgileri doğrulanamadı." }, 503);
    }
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Hak edişler okunamadı. Yeniden deneyin." }, 503); }
}
