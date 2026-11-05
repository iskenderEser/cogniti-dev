import { partnerProfilBaglami } from "@/lib/agora/partnerProfilSunucu";
import { PARTNER_LOGO_BUCKET, partnerLogoTuru } from "@/lib/agora/partnerProfil";
import { partnerYanit } from "@/lib/agora/partnerHttp";

export async function GET() {
  try {
    const b = await partnerProfilBaglami();
    if (!b) return partnerYanit({ hata: "Yeniden giriş yapın." }, 401);
    const yol = b.profil?.logo_yolu;
    if (!yol || !yol.startsWith(`${b.partnerId}/`)) return partnerYanit({ hata: "Logo bulunamadı." }, 404);
    const { data, error } = await b.db.storage.from(PARTNER_LOGO_BUCKET).download(yol);
    if (error || !data) return partnerYanit({ hata: "Logo okunamadı." }, 503);
    const bytes = new Uint8Array(await data.arrayBuffer()), tur = partnerLogoTuru(bytes);
    if (!tur) return partnerYanit({ hata: "Logo okunamadı." }, 503);
    return new Response(bytes, { headers: { "Content-Type": tur.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return partnerYanit({ hata: "Logo okunamadı." }, 503); }
}
