import { partnerProfilFormOku } from "@/lib/agora/partnerProfilForm";
import { randomUUID } from "node:crypto";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerProfilBaglami } from "@/lib/agora/partnerProfilSunucu";
import { PARTNER_LOGO_BOYUTU, PARTNER_LOGO_BUCKET, partnerLogoTuru, partnerProfilDogrula } from "@/lib/agora/partnerProfil";

export async function GET() {
  try {
    const b = await partnerProfilBaglami();
    if (!b) return partnerYanit({ hata: "Yeniden giriş yapın." }, 401);
    return partnerYanit({ profil: b.profil, uyelik_durumu: b.uyelikDurumu });
  } catch { return partnerYanit({ hata: "Profil okunamadı. Yeniden deneyin." }, 503); }
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return partnerYanit({ hata: "İstek doğrulanamadı." }, 403);
  try {
    const b = await partnerProfilBaglami();
    if (!b) return partnerYanit({ hata: "Yeniden giriş yapın." }, 401);
    if (b.uyelikDurumu === "onaylandi") return partnerYanit({ hata: "Onaylanmış profil bu ekrandan değiştirilemez." }, 409);
    const form = await partnerProfilFormOku(request);
    if (!form) return partnerYanit({ hata: "Form okunamadı. Logo en fazla 5 MB olmalıdır." }, 400);
    const keys = ["sirket_adi", "il_id", "ilce_id", "adres", "vergi_dairesi_kodu", "vergi_no", "iban", "surum"];
    if (keys.some(k => form.getAll(k).length !== 1 || typeof form.get(k) !== "string") || form.getAll("logo").length > 1) return partnerYanit({ hata: "Form bilgileri geçersiz." }, 400);
    const veri = Object.fromEntries(keys.map(k => [k, form.get(k)]));
    const dogrulama = partnerProfilDogrula({ ...veri, il_id: Number(veri.il_id), ilce_id: Number(veri.ilce_id) });
    if (!dogrulama.ok) return partnerYanit({ hata: dogrulama.hata }, 400);
    const surum = Number(veri.surum);
    if (!Number.isSafeInteger(surum) || surum < 0 || surum !== (b.profil?.surum ?? 0)) return partnerYanit({ hata: "Profil değişmiş. Sayfayı yenileyin." }, 409);
    const logo = form.get("logo");
    let logoYolu: string | null = null;
    if (logo !== null) {
      if (!(logo instanceof File) || logo.size === 0 || logo.size > PARTNER_LOGO_BOYUTU) return partnerYanit({ hata: "Logo en fazla 5 MB olmalıdır." }, 400);
      const bytes = new Uint8Array(await logo.arrayBuffer()), tur = partnerLogoTuru(bytes);
      if (!tur || logo.type !== tur.mime) return partnerYanit({ hata: "PNG, JPEG veya WebP logo yükleyin." }, 400);
      logoYolu = `${b.partnerId}/${randomUUID()}.${tur.uzanti}`;
      const { error } = await b.db.storage.from(PARTNER_LOGO_BUCKET).upload(logoYolu, bytes, { contentType: tur.mime, upsert: false });
      if (error) return partnerYanit({ hata: "Logo yüklenemedi. Yeniden deneyin." }, 503);
    } else if (!b.profil?.logo_yolu) return partnerYanit({ hata: "Logo yükleyin." }, 400);
    const { data, error } = await b.db.rpc("agora_partner_profil_kaydet", { p_token_ozeti: b.tokenOzeti, p_veri: dogrulama.veri, p_logo_yolu: logoYolu, p_surum: surum });
    // Bağlantı kesildiğinde kayıt tamamlanmış olabilir; yüklenen logo bu durumda silinmez.
    if (error) return partnerYanit({ hata: "Kayıt sonucu doğrulanamadı. Sayfayı yenileyip kontrol edin." }, 503);
    if (data !== "tamam") {
      if (logoYolu && ["yetkisiz", "cakisma", "kapali"].includes(data)) await b.db.storage.from(PARTNER_LOGO_BUCKET).remove([logoYolu]);
      return partnerYanit({ hata: "Profil kaydedilemedi. Oturumunuzu ve güncel bilgileri kontrol edin." }, data === "yetkisiz" ? 401 : 409);
    }
    return partnerYanit({ mesaj: "Profiliniz kaydedildi. Üyelik onayı bekleniyor." });
  } catch { return partnerYanit({ hata: "Profil kaydedilemedi. Yeniden deneyin." }, 503); }
}
