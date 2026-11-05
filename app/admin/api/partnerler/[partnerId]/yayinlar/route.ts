import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku,partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerEgitimListesiGecerli } from "@/lib/agora/partnerEgitimleri";
import { medyaUuid,partnerVideoSonucunuIsle } from "@/lib/agora/partnerMedyaSunucu";
import { bunnyVideoDurumu } from "@/lib/video/bunnyYukleme";
import { bunnyCdnImzaliUrl } from "@/lib/ogrenmeAraci/bunnyStorage";
import { partnerAramaFiyati } from "@/lib/agora/yayinArama";
type Context={params:Promise<{partnerId:string}>};
interface Dosya {yukleme_id:string;rol?:string;video_guid?:string;dosya_yolu?:string;dosya_adi:string;durum:string;sure_saniye?:number|null}
function dosyalar(d:{egitim:{durum:string;yayin_tanitim_video_id:string|null;yayin_egitim_video_id:string|null;yayin_podcast_id:string|null};videolar:Dosya[];podcastler:Dosya[]}) {
  const e=d.egitim,yayimlanmis=e.durum!=="taslak";
  return {egitimVideo:yayimlanmis?d.videolar.find(v=>v.yukleme_id===e.yayin_egitim_video_id):d.videolar.find(v=>v.rol==="egitim"),tanitim:yayimlanmis?d.videolar.find(v=>v.yukleme_id===e.yayin_tanitim_video_id):d.videolar.find(v=>v.rol==="tanitim"),podcast:yayimlanmis?d.podcastler.find(a=>a.yukleme_id===e.yayin_podcast_id):d.podcastler[0]};
}
export async function GET(r:Request,c:Context) {
 try{
  const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
  const {partnerId}=await c.params;if(!medyaUuid(partnerId))return partnerYanit({hata:"Geçersiz partner."},400);
  const db=createAdminClient(AbortSignal.timeout(20000)),params=new URL(r.url).searchParams,egitimId=params.get("egitim_id");
  if(egitimId!==null){
   if(!medyaUuid(egitimId))return partnerYanit({hata:"Geçersiz eğitim."},400);
   const {data,error}=await db.rpc("agora_partner_admin_yayin_detayi",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId,p_egitim_id:egitimId});
   if(error)throw new Error("Eğitim bilgileri okunamadı.");if(!data)return partnerYanit({hata:"Eğitim bulunamadı."},404);
   const m=dosyalar(data);
   const video=(v:Dosya|undefined)=>v?{dosya_adi:v.dosya_adi,durum:v.durum,sure_saniye:v.sure_saniye,izleme_url:v.durum==="hazir"&&v.video_guid&&process.env.BUNNY_LIBRARY_ID?`https://player.mediadelivery.net/embed/${process.env.BUNNY_LIBRARY_ID}/${v.video_guid}`:null}:null;
   return partnerYanit({egitim:data.egitim,medya:{egitimVideo:video(m.egitimVideo),tanitim:video(m.tanitim),podcast:m.podcast?{dosya_adi:m.podcast.dosya_adi,durum:m.podcast.durum,dinleme_url:m.podcast.durum==="hazir"&&m.podcast.dosya_yolu?bunnyCdnImzaliUrl(m.podcast.dosya_yolu):null}:null}});
  }
  const durum=params.get("durum")??"tumu",sayfa=Number(params.get("sayfa")??1),arama=(params.get("arama")??"").trim();
  if(arama.length>200||!["tumu","taslak","yayinda","pasif"].includes(durum)||!Number.isSafeInteger(sayfa)||sayfa<1||sayfa>100000)return partnerYanit({hata:"Geçersiz liste seçimi."},400);
  const baslangic=params.get("baslangic")??"",bitis=params.get("bitis")??"";
  const tarihGecerli=(v:string)=>{
    if(!v)return true;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
    const [yil,ay,gun]=v.split("-").map(Number);
    const tarih=new Date(Date.UTC(yil,ay-1,gun));
    return yil>=1900&&yil<=9998&&tarih.getUTCFullYear()===yil&&tarih.getUTCMonth()===ay-1&&tarih.getUTCDate()===gun;
  };
  if(!tarihGecerli(baslangic)||!tarihGecerli(bitis)||(baslangic&&bitis&&baslangic>bitis))return partnerYanit({hata:"Geçerli bir yayın tarihi aralığı seçin."},400);
  const {data,error}=(baslangic||bitis)
   ? await db.rpc("agora_partner_admin_yayin_filtrele",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId,p_durum:durum,p_sayfa:sayfa,p_arama:arama,p_fiyat:partnerAramaFiyati(arama),p_baslangic:baslangic||null,p_bitis:bitis||null})
   : arama
   ? await db.rpc("agora_partner_admin_yayin_ara",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId,p_durum:durum,p_sayfa:sayfa,p_arama:arama,p_fiyat:partnerAramaFiyati(arama)})
   : await db.rpc("agora_partner_admin_yayinlari",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId,p_durum:durum,p_sayfa:sayfa});
  if(error)throw new Error("Yayınlar okunamadı.");if(!data)return partnerYanit({hata:"Partner bulunamadı."},404);
  if(!partnerEgitimListesiGecerli(data))throw new Error("Yayın bilgileri doğrulanamadı.");return partnerYanit(data);
 }catch(e){return partnerYanit({hata:e instanceof Error?e.message:"Yayınlar okunamadı."},503);}
}
export async function POST(r:Request,c:Context) {
 const body=await partnerJsonOku(r);if(!body.ok)return body.yanit;
 try{
  const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
  const {partnerId}=await c.params,d=body.veri;
  if(!medyaUuid(partnerId)||!medyaUuid(d.egitim_id)||!["aktif","pasif","sil"].includes(String(d.islem))||!Number.isSafeInteger(d.surum)||Number(d.surum)<1)return partnerYanit({hata:"Geçersiz yayın işlemi."},400);
  const db=createAdminClient(AbortSignal.timeout(25000));
  if(d.islem==="aktif"){
   const {data:detay,error}=await db.rpc("agora_partner_admin_yayin_detayi",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId,p_egitim_id:d.egitim_id});
   if(error)throw new Error("Eğitim dosyaları doğrulanamadı.");if(!detay)return partnerYanit({hata:"Eğitim bulunamadı."},404);
   if(detay.egitim.durum==="taslak")return partnerYanit({hata:"Taslak eğitimi önce partner Agora’da yayımlamalıdır."},409);
   const m=dosyalar(detay),videolar=detay.egitim.yayin_araci==="video"?[m.egitimVideo]:[];
   for(const v of videolar){
    if(!v?.video_guid)return partnerYanit({hata:"Yayın dosyaları eksik."},409);
    const durum=await bunnyVideoDurumu(v.video_guid);if(!durum.ok)throw new Error("Video durumu doğrulanamadı. Yeniden deneyin.");
    await partnerVideoSonucunuIsle(db,v.video_guid,durum);
    if(!durum.hazir||durum.hatali)return partnerYanit({hata:"Yayın dosyaları henüz hazır değil."},409);
   }
  }
  const {data,error}=await db.rpc("agora_partner_admin_yayin_islemi",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId,p_egitim_id:d.egitim_id,p_islem:d.islem,p_surum:d.surum});
  if(error)throw new Error("İşlem sonucu doğrulanamadı. Listeyi yenileyin.");
  const hatalar:Record<string,string>={bulunamadi:"Eğitim bulunamadı.",cakisma:"Eğitim değişmiş. Listeyi yenileyin.",taslak:"Taslak eğitimi önce partner Agora’da yayımlamalıdır.",onay_eksik:"Partnerin üyelik onayı tamamlanmalıdır.",dosya_eksik:"Yayın dosyaları tamamlanmamış."};
  if(data!=="tamam")return partnerYanit({hata:hatalar[String(data)]??"Yayın işlemi tamamlanamadı."},data==="bulunamadi"?404:409);
  return partnerYanit({mesaj:d.islem==="aktif"?"Eğitim aktife alındı.":d.islem==="pasif"?"Eğitim pasife alındı.":"Eğitim silindi."});
 }catch(e){return partnerYanit({hata:e instanceof Error?e.message:"Yayın işlemi tamamlanamadı."},503);}
}
