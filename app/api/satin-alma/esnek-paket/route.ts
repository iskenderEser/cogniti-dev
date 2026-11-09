import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { esnekPaketSiparisIstegiGecerli } from "@/lib/satinAlma/esnekPaket";
import { esnekPaketSiparisiOlustur } from "@/lib/satinAlma/esnekPaketSunucu";

export async function POST(request: Request) {
  const body = await partnerJsonOku(request);
  if (!body.ok) return body.yanit;
  const { hesapTuru, ...istek } = body.veri;
  if ((hesapTuru !== "kisisel" && hesapTuru !== "firma_ortak") || !esnekPaketSiparisIstegiGecerli(istek)) {
    return partnerYanit({ hata: "Sipariş bilgileri geçersiz." }, 400);
  }
  const sonuc = await esnekPaketSiparisiOlustur(istek, hesapTuru);
  return partnerYanit(sonuc, sonuc.ok ? 200 : sonuc.status);
}
