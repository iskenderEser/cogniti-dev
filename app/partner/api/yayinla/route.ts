import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerEgitimFormDogrula } from "@/lib/agora/partnerEgitimFormu";
import { medyaUuid, partnerVideoSonucunuIsle } from "@/lib/agora/partnerMedyaSunucu";
import { bunnyVideoDurumu } from "@/lib/video/bunnyYukleme";

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
      const roller=form.veri.yayin_araci==="video"?["egitim","tanitim"]:["tanitim"];
      for(const rol of roller){
        const v=m.videolar.find((v:{rol:string})=>v.rol===rol);
        const ad=rol==="tanitim"?"Tanıtım videosu":"Eğitim videosu";
        if(!v)return partnerYanit({hata:`${ad} yüklenmelidir.`},400);
        const durum=await bunnyVideoDurumu(v.video_guid);
        if(!durum.ok)throw new Error(`${ad} doğrulanamadı. Yeniden deneyin.`);
        await partnerVideoSonucunuIsle(b.db,v.video_guid,durum);
        if(durum.hatali)return partnerYanit({hata:`${ad} işlenemedi. Yeniden yükleyin.`},400);
        if(!durum.hazir)return partnerYanit({hata:`${ad} henüz hazır değil. İşlenmesi tamamlandıktan sonra yeniden deneyin.`},409);
        if(rol==="tanitim"&&Number(durum.videoSuresiSaniye)>120)return partnerYanit({hata:"Tanıtım videosu en fazla 2 dakika olmalıdır."},400);
      }
    }
    const {data,error}=await b.db.rpc("agora_partner_egitim_yayimla",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id,p_surum:d.surum});
    if(error)throw new Error("Yayımlama sonucu doğrulanamadı. Listeyi yenileyip kontrol edin.");
    const mesajlar:Record<string,string>={yetkisiz:"Partner oturumunuz doğrulanamadı.",bulunamadi:"Eğitim bulunamadı.",kapali:"Bu eğitim yayımlamaya kapalı.",cakisma:"Eğitim değişmiş. Listeyi yenileyin.",bilgiler_eksik:"Önce eğitim bilgilerini tamamlayıp kaydedin.",tanitim_eksik:"En fazla 2 dakikalık tanıtım videosu yüklenip işlenmiş olmalıdır.",video_eksik:"Eğitim videosunun yüklenmesi ve işlenmesi tamamlanmalıdır.",podcast_eksik:"Podcast yüklemesi tamamlanmalıdır."};
    if(data!=="tamam")return partnerYanit({hata:mesajlar[String(data)]??"Eğitim yayımlanamadı."},data==="yetkisiz"?401:409);
    return partnerYanit({mesaj:"Eğitim Agora’da yayımlandı."});
  }catch(e){return partnerYanit({hata:e instanceof Error?e.message:"Eğitim yayımlanamadı."},503);}
}
