import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerEgitimFormDogrula } from "@/lib/agora/partnerEgitimFormu";
import { medyaUuid, partnerVideoSonucunuIsle } from "@/lib/agora/partnerMedyaSunucu";
import { bunnyVideoDurumu } from "@/lib/video/bunnyYukleme";

import { sesliUyariHazir } from "@/lib/agora/korumaSunucu";
import { bunnyStorageOrtami } from "@/lib/ogrenmeAraci/bunnyStorage";

export async function POST(request:Request) {
  const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
  try{
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumunuz doğrulanamadı."},401);
    const d=body.veri;
    if(!medyaUuid(d.egitim_id)||!Number.isSafeInteger(d.surum)||Number(d.surum)<1)return partnerYanit({hata:"Geçersiz eğitim kaydı."},400);
    const {data:e,error:detayHata}=await b.db.rpc("agora_partner_egitim_detay_oku",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id});
    if(detayHata)throw new Error("Eğitim bilgileri doğrulanamadı.");
    if(!e)return partnerYanit({hata:"Eğitim bulunamadı."},404);
    if(e.durum!=="yayinda"){
      if(e.durum!=="taslak"||e.surum!==d.surum)return partnerYanit({hata:"Eğitim değişmiş veya yayımlamaya kapalı. Listeyi yenileyin."},409);
      const form=partnerEgitimFormDogrula({...e.bilgiler,egitim_adi:e.egitim_adi});
      if(!form.ok)return partnerYanit({hata:`Önce eğitim bilgilerini tamamlayıp kaydedin. ${form.hata}`},400);
      const {data:m,error:medyaHata}=await b.db.rpc("agora_partner_medya_oku",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id});
      if(medyaHata)throw new Error("Dosya bilgileri doğrulanamadı.");
      if(!m)return partnerYanit({hata:"Eğitim dosyaları bulunamadı."},404);
      const roller=form.veri.yayin_araci==="video"?["egitim"]:[];
      for(const rol of roller){
        const v=m.videolar.find((v:{rol:string})=>v.rol===rol);
        const ad="Eğitim videosu";
        if(!v)return partnerYanit({hata:`${ad} yüklenmelidir.`},400);
        const durum=await bunnyVideoDurumu(v.video_guid);
        if(!durum.ok)throw new Error(`${ad} doğrulanamadı. Yeniden deneyin.`);
        await partnerVideoSonucunuIsle(b.db,v.video_guid,durum);
        if(durum.hatali)return partnerYanit({hata:`${ad} işlenemedi. Yeniden yükleyin.`},400);
        if(!durum.hazir)return partnerYanit({hata:`${ad} henüz hazır değil. İşlenmesi tamamlandıktan sonra yeniden deneyin.`},409);
      }
    }
    const {data:korumaMedya,error:korumaHata}=await b.db.rpc("agora_partner_medya_oku",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id});
    if(korumaHata||!korumaMedya)throw new Error("Koruma dosyaları doğrulanamadı.");
    const yayinda=e.durum==="yayinda";
    const video=e.yayin_araci==="video";
    const kaynak=video
      ? (yayinda?korumaMedya.videolar.find((v:{yukleme_id:string})=>v.yukleme_id===e.yayin_egitim_video_id):korumaMedya.videolar.find((v:{rol:string})=>v.rol==="egitim"))
      : (yayinda?korumaMedya.podcastler.find((a:{yukleme_id:string})=>a.yukleme_id===e.yayin_podcast_id):korumaMedya.podcastler[0]);
    if(!kaynak||kaynak.durum!=="hazir")return partnerYanit({hata:"Koruma için hazır yayın dosyası bulunamadı."},409);
    if(!video&&(!bunnyStorageOrtami()||!await sesliUyariHazir()))return partnerYanit({hata:"Podcast erişimi veya sesli koruma dosyası hazır değil."},409);
    const {data:hazir,error:hazirHata}=await b.db.rpc("agora_partner_koruma_hazirla",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id,p_surum:e.surum,p_kaynak_id:kaynak.yukleme_id});
    if(hazirHata)throw new Error("Koruma paketi kurulumu doğrulanamadı. Koruma SQL’ini uygulayın.");
    if(hazir!==true)return partnerYanit({hata:"Yayın dosyası değişmiş. Listeyi yenileyip yeniden deneyin."},409);
    const {data,error}=await b.db.rpc("agora_partner_egitim_yayimla",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id,p_surum:d.surum});
    if(error)throw new Error("Yayımlama sonucu doğrulanamadı. Listeyi yenileyip kontrol edin.");
    const mesajlar:Record<string,string>={yetkisiz:"Partner oturumunuz doğrulanamadı.",bulunamadi:"Eğitim bulunamadı.",kapali:"Bu eğitim yayımlamaya kapalı.",cakisma:"Eğitim değişmiş. Listeyi yenileyin.",bilgiler_eksik:"Önce eğitim bilgilerini tamamlayıp kaydedin.",video_eksik:"Eğitim videosunun yüklenmesi ve işlenmesi tamamlanmalıdır.",podcast_eksik:"Podcast yüklemesi tamamlanmalıdır.",koruma_eksik:"Koruma paketi hazır değil."};
    if(data!=="tamam")return partnerYanit({hata:mesajlar[String(data)]??"Eğitim yayımlanamadı."},data==="yetkisiz"?401:409);
    return partnerYanit({mesaj:"Eğitim Agora’da yayımlandı."});
  }catch(e){return partnerYanit({hata:e instanceof Error?e.message:"Eğitim yayımlanamadı."},503);}
}
