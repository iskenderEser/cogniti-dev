import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { onayliPartnerBaglami } from "./partnerProfilSunucu";
import { partnerJsonOku, partnerYanit } from "./partnerHttp";
import { egitimAdiDogrula } from "./partnerEgitimleri";
import { bunnyVideoDurumu, bunnyYuklemeBaslat, bunnyVideoSil, BUNNY_TUS_ENDPOINT } from "@/lib/video/bunnyYukleme";
import { bunnyCdnImzaliUrl, bunnyNesneBilgisi, bunnyStorageOrtami, yuklemeYetkisiOlustur, yuklemeMakbuzuDogrula } from "@/lib/ogrenmeAraci/bunnyStorage";
import { dosyaBeyaniDogrula, dosyaImzasiDogrula } from "@/lib/ogrenmeAraci/sozlesme";

type Baglam = NonNullable<Awaited<ReturnType<typeof onayliPartnerBaglami>>>;
export const medyaUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v);
interface Video { yukleme_id: string; video_guid: string; rol: "egitim" | "tanitim"; dosya_adi: string; durum: string; sure_saniye: number | null }
interface Podcast { yukleme_id: string; dosya_yolu: string; dosya_adi: string; dosya_boyutu: number; mime_type: string; checksum_sha256: string; durum: string }
async function oku(b: Baglam, id: string): Promise<{videolar: Video[]; podcastler: Podcast[]} | null> {
  const {data,error}=await b.db.rpc("agora_partner_medya_oku",{p_token_ozeti:b.tokenOzeti,p_egitim_id:id});
  if(error) throw new Error("Medya kurulumu veya kayıtları okunamadı.");
  return data;
}
async function egitim(b: Baglam,d: Record<string,unknown>) {
  if (!(d.egitim_id===null || medyaUuid(d.egitim_id)) || !medyaUuid(d.istek_id) || !egitimAdiDogrula(d.egitim_adi)) throw new Error("Önce Eğitim Adını Girin.");
  const {data,error}=await b.db.rpc("agora_partner_medya_egitimi",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id,p_egitim_adi:d.egitim_adi,p_istek_id:d.istek_id});
  if(error)throw new Error("Medya yükleme kurulumu doğrulanamadı.");
  if(!data)throw new Error("Eğitim bulunamadı veya düzenlemeye kapalı.");
  return data as {egitim_id:string;surum:number};
}
export async function partnerVideoSonucunuIsle(db: SupabaseClient,guid:string,durum:{hazir:boolean;hatali:boolean;videoSuresiSaniye:number|null}) {
  const {error}=await db.rpc("agora_partner_video_sonucu",{p_guid:guid,p_hazir:durum.hazir,p_hatali:durum.hatali,p_sure:durum.videoSuresiSaniye});
  // Adım 7 SQL'i uygulanana kadar mevcut firma webhook zinciri çalışmaya devam eder.
  if(error && !["42883","PGRST202"].includes(error.code))throw new Error("Partner video sonucu kaydedilemedi.");
}
export async function partnerVideoAktarim(request: Request) {
  const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
  try {
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumunuz doğrulanamadı."},401);
    const d=body.veri;if(!medyaUuid(d.egitim_id)||!medyaUuid(d.yukleme_id))return partnerYanit({hata:"Geçersiz video kaydı."},400);
    const {data,error}=await b.db.rpc("agora_partner_video_aktarim",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id,p_yukleme_id:d.yukleme_id});
    if(error||data!==true)return partnerYanit({hata:"Video aktarımı kaydedilemedi. Yeniden deneyin."},409);
    return partnerYanit({mesaj:"Video aktarıldı. İşlenme durumu kontrol edilebilir."});
  }catch{return partnerYanit({hata:"Video aktarım sonucu doğrulanamadı."},503);}
}
export async function videoBaslat(request:Request) {
  const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
  try{
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumunuz doğrulanamadı."},401);
    const d=body.veri;
    if(!["egitim","tanitim"].includes(String(d.rol))||typeof d.dosya_adi!=="string"||!d.dosya_adi.trim()||d.dosya_adi.length>255||typeof d.mime_type!=="string"||!["video/mp4","video/webm","video/quicktime"].includes(d.mime_type)||!Number.isSafeInteger(d.dosya_boyutu)||Number(d.dosya_boyutu)<=0||Number(d.dosya_boyutu)>5*1024**3)return partnerYanit({hata:"MP4, WebM veya MOV video seçin (en fazla 5 GB)."},400);
    const e=await egitim(b,d),id=randomUUID();
    const baslik=`Agora_${e.egitim_id}_${d.rol}`;
    const izin=await bunnyYuklemeBaslat(baslik);if(!izin.ok)return partnerYanit({hata:izin.hata},503);
    const {data,error}=await b.db.rpc("agora_partner_video_ekle",{p_token_ozeti:b.tokenOzeti,p_egitim_id:e.egitim_id,p_yukleme_id:id,p_rol:d.rol,p_guid:izin.videoGuid,p_dosya_adi:d.dosya_adi,p_boyut:d.dosya_boyutu});
    if(error||data!==true){await bunnyVideoSil(izin.videoGuid);return partnerYanit({hata:"Video kaydı oluşturulamadı."},409);}
    return partnerYanit({...e,yukleme_id:id,video_guid:izin.videoGuid,library_id:izin.libraryId,imza:izin.imza,son_kullanma:izin.sonKullanma,tus_endpoint:BUNNY_TUS_ENDPOINT,embed_url:izin.embedUrl,baslik});
  }catch(e){return partnerYanit({hata:e instanceof Error?e.message:"Video yükleme başlatılamadı."},503);}
}
export async function videoOku(request:Request) {
  try{
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumunuz doğrulanamadı."},401);
    const id=new URL(request.url).searchParams.get("egitim_id");if(!medyaUuid(id))return partnerYanit({hata:"Geçersiz eğitim."},400);
    let m=await oku(b,id);if(!m)return partnerYanit({hata:"Eğitim bulunamadı."},404);
    const videolar=["egitim","tanitim"].map(rol=>m!.videolar.find(v=>v.rol===rol)).filter((v):v is Video=>!!v);
    for(const v of videolar.filter(v=>v.durum==="isleniyor" || v.durum==="yukleniyor")){
      const durum=await bunnyVideoDurumu(v.video_guid);if(!durum.ok)throw new Error("Video işlenme durumu alınamadı; yeniden kontrol edin.");
      await partnerVideoSonucunuIsle(b.db,v.video_guid,durum);
    }
    m=await oku(b,id);if(!m)return partnerYanit({hata:"Eğitim bulunamadı."},404);
    return partnerYanit({videolar:["egitim","tanitim"].map(rol=>m!.videolar.find(v=>v.rol===rol)).filter(Boolean).map(v=>({...v,izleme_url:v!.durum==="hazir"?`https://player.mediadelivery.net/embed/${process.env.BUNNY_LIBRARY_ID}/${v!.video_guid}`:null}))});
  }catch(e){return partnerYanit({hata:e instanceof Error?e.message:"Video bilgileri okunamadı."},503);}
}
export async function podcastBaslat(request:Request) {
  const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
  try{
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumunuz doğrulanamadı."},401);
    const d=body.veri;
    if(typeof d.dosya_adi!=="string"||d.dosya_adi.length>255||typeof d.mime_type!=="string"||typeof d.checksum_sha256!=="string"||!/^[0-9a-f]{64}$/.test(d.checksum_sha256))return partnerYanit({hata:"Geçersiz podcast bilgileri."},400);
    const dosya=dosyaBeyaniDogrula({aracTuru:"podcast",dosyaAdi:d.dosya_adi,mimeType:d.mime_type,dosyaBoyutu:Number(d.dosya_boyutu)});if(!dosya.ok)return partnerYanit({hata:dosya.hata},400);
    const ortam=bunnyStorageOrtami();if(!ortam)return partnerYanit({hata:"Podcast yükleme hizmeti yapılandırılmamış."},503);
    const e=await egitim(b,d),id=randomUUID(),yol=`agora/${b.partnerId}/${e.egitim_id}/${id}.${dosya.uzanti}`;
    const imza=yuklemeYetkisiOlustur({aracId:id,kullaniciId:b.partnerId,dosyaYolu:yol,dosyaBoyutu:Number(d.dosya_boyutu),mimeType:d.mime_type,checksumSha256:d.checksum_sha256});
    if(!imza)throw new Error("Podcast yükleme izni oluşturulamadı.");
    const {data,error}=await b.db.rpc("agora_partner_podcast_ekle",{p_token_ozeti:b.tokenOzeti,p_egitim_id:e.egitim_id,p_yukleme_id:id,p_yol:yol,p_dosya_adi:d.dosya_adi,p_boyut:d.dosya_boyutu,p_mime:d.mime_type,p_checksum:d.checksum_sha256});
    if(error||data!==true)return partnerYanit({hata:"Podcast kaydı oluşturulamadı."},409);
    return partnerYanit({...e,yukleme_id:id,yukleme:{endpoint:process.env.NODE_ENV==="development"?"/partner/api/medya/podcast":ortam.uploadEndpoint,headers:{"Content-Type":d.mime_type,"x-arac-id":id,"x-kullanici-id":b.partnerId,"x-dosya-yolu":yol,"x-dosya-boyutu":String(d.dosya_boyutu),"x-checksum-sha256":d.checksum_sha256,"x-yukleme-token":imza.token}}});
  }catch(e){return partnerYanit({hata:e instanceof Error?e.message:"Podcast başlatılamadı."},503);}
}
export async function podcastTamamla(request:Request) {
  const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
  try{
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumunuz doğrulanamadı."},401);
    const d=body.veri;if(!medyaUuid(d.egitim_id)||!medyaUuid(d.yukleme_id)||typeof d.makbuz!=="string")return partnerYanit({hata:"Geçersiz podcast kaydı."},400);
    const m=await oku(b,d.egitim_id),a=m?.podcastler.find(a=>a.yukleme_id===d.yukleme_id);if(!a)return partnerYanit({hata:"Podcast bulunamadı."},404);
    if(!yuklemeMakbuzuDogrula({makbuz:d.makbuz,aracId:a.yukleme_id,kullaniciId:b.partnerId,dosyaYolu:a.dosya_yolu,dosyaBoyutu:a.dosya_boyutu,mimeType:a.mime_type,checksumSha256:a.checksum_sha256}))return partnerYanit({hata:"Podcast aktarımı doğrulanamadı; yeniden yükleyin."},400);
    const nesne=await bunnyNesneBilgisi(a.dosya_yolu);
    if(!nesne||nesne.dosyaBoyutu!==a.dosya_boyutu||(nesne.checksumSha256!==null&&nesne.checksumSha256!==a.checksum_sha256)||!dosyaImzasiDogrula("podcast",nesne.ilkBaytlar))return partnerYanit({hata:"Ses dosyasının içeriği veya boyutu doğrulanamadı."},400);
    const {data,error}=await b.db.rpc("agora_partner_podcast_tamamla",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id,p_yukleme_id:d.yukleme_id});
    if(error||data!==true)return partnerYanit({hata:"Podcast kaydedilemedi."},409);
    return partnerYanit({mesaj:"Podcast yüklendi."});
  }catch{return partnerYanit({hata:"Podcast sonucu doğrulanamadı."},503);}
}
export async function podcastOku(request:Request) {
  try{
    const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumunuz doğrulanamadı."},401);
    const id=new URL(request.url).searchParams.get("egitim_id");if(!medyaUuid(id))return partnerYanit({hata:"Geçersiz eğitim."},400);
    const m=await oku(b,id);if(!m)return partnerYanit({hata:"Eğitim bulunamadı."},404);
    const a=m.podcastler[0];return partnerYanit({podcast:a?{yukleme_id:a.yukleme_id,dosya_adi:a.dosya_adi,durum:a.durum,dinleme_url:a.durum==="hazir"?bunnyCdnImzaliUrl(a.dosya_yolu):null}:null});
  }catch{return partnerYanit({hata:"Podcast bilgileri okunamadı."},503);}
}
