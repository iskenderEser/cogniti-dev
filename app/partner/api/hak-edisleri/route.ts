import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { odemeGunuGecerli, hakedisOkumaHatasi, hakedisSayfasi, partnerHakEdisListesiGecerli } from "@/lib/agora/hakedis";

export async function GET(request: Request) {
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const sayfa = hakedisSayfasi(new URL(request.url).searchParams.get("sayfa"));
    if (sayfa === null) return partnerYanit({ hata: "Geçersiz hak ediş sayfası." }, 400);
    const arama = (new URL(request.url).searchParams.get("arama") ?? "").trim();
    if (arama.length > 200) return partnerYanit({ hata: "Arama en fazla 200 karakter olabilir." }, 400);
    const params = new URL(request.url).searchParams;
    const baslangic = params.get("baslangic") ?? "", bitis = params.get("bitis") ?? "";
    if (!odemeGunuGecerli(baslangic || null) || !odemeGunuGecerli(bitis || null)
      || (baslangic && bitis && baslangic > bitis)) return partnerYanit({ hata: "Geçerli bir sipariş tarihi aralığı seçin." }, 400);
    const { data, error } = await b.db.rpc(arama || baslangic || bitis ? "agora_partner_hakedis_filtrele" : "agora_partner_hakedisleri_oku", {
      p_token_ozeti: b.tokenOzeti, p_sayfa: sayfa, ...(arama || baslangic || bitis ? { p_arama: arama, p_baslangic: baslangic || null, p_bitis: bitis || null } : {}),
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
