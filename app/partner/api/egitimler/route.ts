import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerEgitimFormDogrula } from "@/lib/agora/partnerEgitimFormu";
import { egitimAdiDogrula, partnerEgitimListesiGecerli } from "@/lib/agora/partnerEgitimleri";

export async function GET(request: Request) {
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const params = new URL(request.url).searchParams;
    const egitimId = params.get("egitim_id");
    if (egitimId !== null) {
      if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(egitimId)) return partnerYanit({ hata: "Geçersiz eğitim." }, 400);
      const { data, error } = await b.db.rpc("agora_partner_egitim_detay_oku", { p_token_ozeti: b.tokenOzeti, p_egitim_id: egitimId });
      if (error) return partnerYanit({ hata: "Eğitim bilgileri okunamadı." }, 503);
      return data ? partnerYanit(data) : partnerYanit({ hata: "Eğitim bulunamadı." }, 404);
    }
    const durum = params.get("durum") ?? "tumu", sayfa = Number(params.get("sayfa") ?? 1);
    if (!["tumu", "taslak", "yayinda", "pasif"].includes(durum) || !Number.isSafeInteger(sayfa) || sayfa < 1 || sayfa > 100000) return partnerYanit({ hata: "Geçersiz liste seçimi." }, 400);
    const { data, error } = await b.db.rpc("agora_partner_egitimleri_oku", { p_token_ozeti: b.tokenOzeti, p_durum: durum, p_sayfa: sayfa });
    if (error) return partnerYanit({ hata: "Eğitimler okunamadı. Yeniden deneyin." }, 503);
    if (!data) return partnerYanit({ hata: "Üyelik onayınızı ve oturumunuzu kontrol edin." }, 401);
    if (!partnerEgitimListesiGecerli(data)) return partnerYanit({ hata: "Eğitimler okunamadı." }, 503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Eğitimler okunamadı. Yeniden deneyin." }, 503); }
}
export async function POST(request: Request) {
  const body = await partnerJsonOku(request, 512 * 1024); if (!body.ok) return body.yanit;
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const d = body.veri, ad = egitimAdiDogrula(d.egitim_adi);
    const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
    if (!ad || typeof d.istek_id !== "string" || !uuid.test(d.istek_id)
      || !(d.egitim_id === null || (typeof d.egitim_id === "string" && uuid.test(d.egitim_id)))
      || !Number.isSafeInteger(d.surum) || Number(d.surum) < 0
      || (d.egitim_id === null ? d.surum !== 0 : Number(d.surum) < 1)) return partnerYanit({ hata: "Eğitim adı 3–200 karakter olmalı; kayıt bilgileri geçerli olmalıdır." }, 400);
    if (d.ayrintili === true) {
      const sonuc = partnerEgitimFormDogrula(d);
      if (!sonuc.ok) return partnerYanit({ hata: sonuc.hata }, 400);
      const v = sonuc.veri;
      const { data, error } = await b.db.rpc("agora_partner_egitim_formu_kaydet", { p_token_ozeti: b.tokenOzeti, p_egitim_id: d.egitim_id, p_egitim_adi: v.egitim_adi, p_surum: d.surum, p_istek_id: d.istek_id, p_kategori: v.kategori, p_yayin_araci: v.yayin_araci, p_fiyat_tl: v.fiyat_tl, p_bilgiler: v.bilgiler });
      if (error) return partnerYanit({ hata: "Kayıt sonucu doğrulanamadı. Listeyi yenileyip kontrol edin." }, 503);
      if (data !== "tamam") return partnerYanit({ hata: "Eğitim veya üyelik değişmiş. Listeyi yenileyip yeniden açın." }, data === "yetkisiz" ? 401 : 409);
      return partnerYanit({ mesaj: "Eğitim bilgileri kaydedildi." });
    }
    const { data, error } = await b.db.rpc("agora_partner_egitim_taslagi_kaydet", { p_token_ozeti: b.tokenOzeti, p_egitim_id: d.egitim_id, p_egitim_adi: ad, p_surum: d.surum, p_istek_id: d.istek_id });
    if (error) return partnerYanit({ hata: "Kayıt sonucu doğrulanamadı. Eğitimlerinizi yenileyip kontrol edin." }, 503);
    if (data === "yetkisiz") return partnerYanit({ hata: "Üyelik onayınızı ve oturumunuzu kontrol edin." }, 401);
    if (data !== "tamam") return partnerYanit({ hata: "Eğitim değişmiş veya düzenlemeye kapalı. Güncel listeyi kontrol edin." }, 409);
    return partnerYanit({ mesaj: "Eğitim taslağı kaydedildi." });
  } catch { return partnerYanit({ hata: "Eğitim kaydedilemedi. Yeniden deneyin." }, 503); }
}

export async function DELETE(request: Request) {
  const body = await partnerJsonOku(request); if (!body.ok) return body.yanit;
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const d = body.veri;
    if (typeof d.egitim_id !== "string" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.egitim_id)
      || !Number.isSafeInteger(d.surum) || Number(d.surum) < 1) return partnerYanit({ hata: "Geçersiz eğitim kaydı." }, 400);
    const { data, error } = await b.db.rpc("agora_partner_egitim_sil", { p_token_ozeti: b.tokenOzeti, p_egitim_id: d.egitim_id, p_surum: d.surum });
    if (error) return partnerYanit({ hata: "Silme sonucu doğrulanamadı. Listeyi yenileyip kontrol edin." }, 503);
    if (data === "yetkisiz") return partnerYanit({ hata: "Üyelik onayınızı ve oturumunuzu kontrol edin." }, 401);
    if (data !== "tamam") return partnerYanit({ hata: "Eğitim değişmiş veya bulunamıyor. Listeyi yenileyin." }, 409);
    return partnerYanit({ mesaj: "Eğitim silindi." });
  } catch { return partnerYanit({ hata: "Eğitim silinemedi. Yeniden deneyin." }, 503); }
}
