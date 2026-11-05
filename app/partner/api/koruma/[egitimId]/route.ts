import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { ayniSiteMedyaIstegi, korumaliVideoUrl, podcastAkisi, sesliUyariHazir } from "@/lib/agora/korumaSunucu";
import { AGORA_KORUMA_SURUMU } from "@/lib/agora/koruma";

/** Partnerin tek yayın oynatıcısı: taslak orijinal, yayımlanmış içerik korumalı. Alıcı yetkisi vermez. */
export async function GET(request:Request, context:{params:Promise<{egitimId:string}>}) {
  if (!ayniSiteMedyaIstegi(request)) return partnerYanit({hata:"İçeriği Cogniti içinden açın."},403);
  try {
    const b = await onayliPartnerBaglami();
    if (!b) return partnerYanit({hata:"Partner oturumu doğrulanamadı."},401);
    const {egitimId} = await context.params;
    if (!medyaUuid(egitimId)) return partnerYanit({hata:"Geçersiz eğitim."},400);
    const args = {p_token_ozeti:b.tokenOzeti,p_egitim_id:egitimId};
    const [{data:e,error:eh},{data:m,error:mh}] = await Promise.all([b.db.rpc("agora_partner_egitim_detay_oku",args),b.db.rpc("agora_partner_medya_oku",args)]);
    if (eh || mh) throw new Error("Koruma bilgileri okunamadı.");
    if (!e || !m) return partnerYanit({hata:"Eğitim bulunamadı."},404);
    const yayimlanmis = e.durum !== "taslak";
    // Bu uç yalnız eğitim sahibine açıktır. Sağlayıcı kurulumu sahip incelemesini kapatmaz; yayımlama API/SQL kapısı ayrı korunur.
    const paketHazir=e.koruma_surumu===AGORA_KORUMA_SURUMU;
    const korumaSurumu=yayimlanmis?AGORA_KORUMA_SURUMU:0;
    const tur = yayimlanmis ? e.yayin_araci : (new URL(request.url).searchParams.get("tur") ?? e.yayin_araci);
    if (tur === "video") {
      const v = yayimlanmis ? m.videolar.find((v:{yukleme_id:string})=>v.yukleme_id === e.yayin_egitim_video_id) : m.videolar.find((v:{rol:string})=>v.rol === "egitim");
      if(!v||v.durum!=="hazir")return partnerYanit({hata:"Video yüklemesi ve işlenmesi tamamlanmalıdır."},409);
      const imzali=yayimlanmis?korumaliVideoUrl(v.video_guid):null;
      const url=imzali??(process.env.BUNNY_LIBRARY_ID?`https://player.mediadelivery.net/embed/${encodeURIComponent(process.env.BUNNY_LIBRARY_ID)}/${v.video_guid}?autoplay=false&disableIosPlayer=true`:null);
      if(!url)return partnerYanit({hata:"Video oynatıcısı yapılandırılmamış."},503);
      const uyari=yayimlanmis&&(!paketHazir||!imzali)?"Video indirme korumasının kurulumu bekleniyor. Bu dosya incelemesi yalnız size ait partner hesabına açıktır.":undefined;
      return partnerYanit({tur:"video",url,korumaSurumu,uyari});
    }
    if (tur !== "podcast") return partnerYanit({hata:"Yayın Aracı seçin."},409);
    const a = yayimlanmis ? m.podcastler.find((a:{yukleme_id:string})=>a.yukleme_id === e.yayin_podcast_id) : m.podcastler[0];
    if (!a || a.durum !== "hazir") return partnerYanit({hata:"Podcast yüklemesi tamamlanmalıdır."},409);
    if (yayimlanmis&&!await sesliUyariHazir()) return partnerYanit({hata:"Sesli koruma dosyası hazır değil."},503);
    if (new URL(request.url).searchParams.get("akis") === "1") return podcastAkisi(request,a.dosya_yolu,a.mime_type);
    return partnerYanit({tur:"podcast",url:`/partner/api/koruma/${egitimId}?akis=1&tur=podcast`,korumaSurumu,uyari:yayimlanmis&&!paketHazir?"Koruma paketi hazırlanmalı. Bu dosya incelemesi yalnız size ait partner hesabına açıktır.":undefined});
  } catch { return partnerYanit({hata:"Koruma önizlemesi açılamadı."},503); }
}
