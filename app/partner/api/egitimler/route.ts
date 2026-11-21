import { partnerAramaFiyati } from "@/lib/agora/yayinArama";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerEgitimFormDogrula } from "@/lib/agora/partnerEgitimFormu";
import { egitimAdiDogrula, partnerEgitimListesiGecerli } from "@/lib/agora/partnerEgitimleri";
import { TUM_HEDEF_ROLLER, type HedefRol } from "@/lib/utils/roller";

export async function GET(request: Request) {
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const params = new URL(request.url).searchParams;
    const egitimId = params.get("egitim_id");
    if (egitimId !== null) {
      if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(egitimId)) return partnerYanit({ hata: "Geçersiz yayın." }, 400);
      const { data, error } = await b.db.rpc("agora_partner_egitim_detay_oku", { p_token_ozeti: b.tokenOzeti, p_egitim_id: egitimId });
      if (error) return partnerYanit({ hata: "Yayın bilgileri okunamadı." }, 503);
      return data ? partnerYanit(data) : partnerYanit({ hata: "Yayın bulunamadı." }, 404);
    }
    const durum = params.get("durum") ?? "tumu", sayfa = Number(params.get("sayfa") ?? 1);
    if (!["tumu", "taslak", "yayinda", "pasif"].includes(durum) || !Number.isSafeInteger(sayfa) || sayfa < 1 || sayfa > 100000) return partnerYanit({ hata: "Geçersiz liste seçimi." }, 400);
    const arama=(params.get("arama")??"").trim(),baslangic=params.get("baslangic")??"",bitis=params.get("bitis")??"",hedef=params.get("hedef")??"";
    const tarihGecerli=(v:string)=>{
      if(!v)return true;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
      const [yil,ay,gun]=v.split("-").map(Number),tarih=new Date(Date.UTC(yil,ay-1,gun));
      return yil>=1900&&yil<=9998&&tarih.getUTCFullYear()===yil&&tarih.getUTCMonth()===ay-1&&tarih.getUTCDate()===gun;
    };
    if(arama.length>200)return partnerYanit({hata:"Arama en fazla 200 karakter olabilir."},400);
    if(hedef&&!TUM_HEDEF_ROLLER.includes(hedef as HedefRol))return partnerYanit({hata:"Geçersiz hedef kitle seçimi."},400);
    if(!tarihGecerli(baslangic)||!tarihGecerli(bitis)||(baslangic&&bitis&&baslangic>bitis))return partnerYanit({hata:"Geçerli bir yayın tarihi aralığı seçin."},400);
    const { data, error } = arama||baslangic||bitis||hedef
      ? await b.db.rpc("agora_partner_egitimleri_filtrele",{p_token_ozeti:b.tokenOzeti,p_durum:durum,p_sayfa:sayfa,p_arama:arama,p_fiyat:partnerAramaFiyati(arama),p_baslangic:baslangic||null,p_bitis:bitis||null,p_hedef_rol:hedef||null})
      : await b.db.rpc("agora_partner_egitimleri_oku", { p_token_ozeti: b.tokenOzeti, p_durum: durum, p_sayfa: sayfa });
    if (error) return partnerYanit({ hata: "Yayınlar okunamadı. Yeniden deneyin." }, 503);
    if (!data) return partnerYanit({ hata: "Üyelik onayınızı ve oturumunuzu kontrol edin." }, 401);
    if (!partnerEgitimListesiGecerli(data)) return partnerYanit({ hata: "Yayınlar okunamadı." }, 503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Yayınlar okunamadı. Yeniden deneyin." }, 503); }
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
      || (d.egitim_id === null ? d.surum !== 0 : Number(d.surum) < 1)) return partnerYanit({ hata: "Yayın adı 3–200 karakter olmalı; kayıt bilgileri geçerli olmalıdır." }, 400);
    if (d.ayrintili === true) {
      const sonuc = partnerEgitimFormDogrula(d);
      if (!sonuc.ok) return partnerYanit({ hata: sonuc.hata }, 400);
      const v = sonuc.veri;
      const { data, error } = await b.db.rpc("agora_partner_egitim_formu_kaydet", { p_token_ozeti: b.tokenOzeti, p_egitim_id: d.egitim_id, p_egitim_adi: v.egitim_adi, p_surum: d.surum, p_istek_id: d.istek_id, p_kategori: v.kategori, p_yayin_araci: v.yayin_araci, p_fiyat_tl: v.fiyat_tl, p_bilgiler: v.bilgiler });
      if (error) return partnerYanit({ hata: "Kayıt sonucu doğrulanamadı. Listeyi yenileyip kontrol edin." }, 503);
      if (data !== "tamam") return partnerYanit({ hata: "Yayın veya üyelik değişmiş. Listeyi yenileyip yeniden açın." }, data === "yetkisiz" ? 401 : 409);
      return partnerYanit({ mesaj: "Yayın bilgileri kaydedildi." });
    }
    const { data, error } = await b.db.rpc("agora_partner_egitim_taslagi_kaydet", { p_token_ozeti: b.tokenOzeti, p_egitim_id: d.egitim_id, p_egitim_adi: ad, p_surum: d.surum, p_istek_id: d.istek_id });
    if (error) return partnerYanit({ hata: "Kayıt sonucu doğrulanamadı. Yayınlarınızı yenileyip kontrol edin." }, 503);
    if (data === "yetkisiz") return partnerYanit({ hata: "Üyelik onayınızı ve oturumunuzu kontrol edin." }, 401);
    if (data !== "tamam") return partnerYanit({ hata: "Yayın değişmiş veya düzenlemeye kapalı. Güncel listeyi kontrol edin." }, 409);
    return partnerYanit({ mesaj: "Yayın taslağı kaydedildi." });
  } catch { return partnerYanit({ hata: "Yayın kaydedilemedi. Yeniden deneyin." }, 503); }
}

export async function PATCH(request: Request) {
  const body = await partnerJsonOku(request); if (!body.ok) return body.yanit;
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const d = body.veri;
    if (typeof d.egitim_id !== "string" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.egitim_id)
      || !Number.isSafeInteger(d.surum) || Number(d.surum) < 1
      || (d.durum !== "yayinda" && d.durum !== "pasif")) {
      return partnerYanit({ hata: "Geçersiz yayın veya durum bilgisi." }, 400);
    }
    const { data, error } = await b.db.rpc("agora_partner_egitim_durum_degistir", {
      p_token_ozeti: b.tokenOzeti,
      p_egitim_id: d.egitim_id,
      p_surum: d.surum,
      p_durum: d.durum,
    });
    if (error) return partnerYanit({ hata: "Yayın durumu değiştirilemedi. Listeyi yenileyip kontrol edin." }, 503);
    if (data === "yetkisiz") return partnerYanit({ hata: "Üyelik onayınızı ve oturumunuzu kontrol edin." }, 401);
    if (data === "bulunamadi") return partnerYanit({ hata: "Yayın bulunamadı." }, 404);
    if (data === "gecersiz") return partnerYanit({ hata: "Geçersiz yayın veya durum bilgisi." }, 400);
    if (data !== "tamam") {
      const mesajlar: Record<string, string> = {
        cakisma: "Yayın değişmiş. Sayfayı yenileyip yeniden deneyin.",
        taslak: "Taslak yayın önce Agora’da yayımlanmalıdır.",
        dosya_eksik: "Yayın dosyası hazır olmadığı için aktife alınamadı.",
        koruma_eksik: "Yayın koruma paketi hazır olmadığı için aktife alınamadı.",
      };
      return partnerYanit({ hata: mesajlar[String(data)] ?? "Yayın durumu değiştirilemedi." }, 409);
    }
    return partnerYanit({
      mesaj: d.durum === "yayinda" ? "Yayın yeniden aktife alındı." : "Yayın pasife alındı.",
      durum: d.durum,
      surum: Number(d.surum) + 1,
    });
  } catch { return partnerYanit({ hata: "Yayın durumu değiştirilemedi. Yeniden deneyin." }, 503); }
}

export async function DELETE(request: Request) {
  const body = await partnerJsonOku(request); if (!body.ok) return body.yanit;
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({ hata: "Oturumunuz veya üyelik onayınız doğrulanamadı." }, 401);
    const d = body.veri;
    if (typeof d.egitim_id !== "string" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.egitim_id)
      || !Number.isSafeInteger(d.surum) || Number(d.surum) < 1) return partnerYanit({ hata: "Geçersiz yayın kaydı." }, 400);
    const { data, error } = await b.db.rpc("agora_partner_egitim_sil", { p_token_ozeti: b.tokenOzeti, p_egitim_id: d.egitim_id, p_surum: d.surum });
    if (error) return partnerYanit({ hata: "Silme sonucu doğrulanamadı. Listeyi yenileyip kontrol edin." }, 503);
    if (data === "yetkisiz") return partnerYanit({ hata: "Üyelik onayınızı ve oturumunuzu kontrol edin." }, 401);
    if (data !== "tamam") return partnerYanit({ hata: "Yayın değişmiş veya bulunamıyor. Listeyi yenileyin." }, 409);
    return partnerYanit({ mesaj: "Yayın silindi." });
  } catch { return partnerYanit({ hata: "Yayın silinemedi. Yeniden deneyin." }, 503); }
}
