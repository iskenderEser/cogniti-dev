import { randomUUID,createHash } from "node:crypto";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { partnerJsonOku,partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { bunnyCdnImzaliUrl,bunnyStorageNesneYukle,bunnyStorageNesneSil } from "@/lib/ogrenmeAraci/bunnyStorage";
import { podcastDestekDosyasiDogrula,podcastDestekDosyasiImzasiDogrula } from "@/lib/ogrenmeAraci/sozlesme";
import { transkriptDosyasindanMetinCikar } from "@/lib/ogrenmeAraci/transkriptMetinCikarici";
export const maxDuration=60;
function yanit(e:Record<string,unknown>){return partnerYanit({...e,kapak_url:typeof e.kapak_yolu==="string"?bunnyCdnImzaliUrl(e.kapak_yolu):null});}
export async function GET(request:Request){
 try{
  const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumu doğrulanamadı."},401);
  const q=new URL(request.url).searchParams,id=q.get("egitim_id"),medya=q.get("yukleme_id");
  if(!medyaUuid(id)||!medyaUuid(medya))return partnerYanit({hata:"Geçersiz podcast."},400);
  const {data,error}=await b.db.rpc("agora_partner_podcast_ekleri_islem",{p_token_ozeti:b.tokenOzeti,p_egitim_id:id,p_yukleme_id:medya,p_islem:"oku"});
  return error||!data?partnerYanit({hata:"Podcast ekleri okunamadı."},error?.code==="42501"?403:503):yanit(data);
 }catch{return partnerYanit({hata:"Podcast ekleri okunamadı."},503);}
}
export async function POST(request:Request){
 const body=await partnerJsonOku(request,600000);if(!body.ok)return body.yanit;
 const d=body.veri;
 if(!medyaUuid(d.egitim_id)||!medyaUuid(d.yukleme_id)||!Number.isSafeInteger(d.surum)||!["metin","onayla","iptal","ai","kapak_kaldir"].includes(String(d.islem)))return partnerYanit({hata:"Geçersiz podcast işlemi."},400);
 if(["metin","onayla"].includes(String(d.islem))&&(typeof d.metin!=="string"||d.metin.trim().length<10||d.metin.length>100000))return partnerYanit({hata:"Transkript 10–100000 karakter olmalıdır."},400);
 try{
  const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumu doğrulanamadı."},401);
  const {data,error}=await b.db.rpc("agora_partner_podcast_ekleri_islem",{p_token_ozeti:b.tokenOzeti,p_egitim_id:d.egitim_id,p_yukleme_id:d.yukleme_id,p_surum:d.surum,
   p_islem:d.islem==="kapak_kaldir"?"kapak":d.islem,p_veri:d.islem==="ai"?{model:process.env.GEMINI_MODEL||"gemini-3.5-flash"}:{metin:d.metin}});
  if(error||!data)return partnerYanit({hata:error?.code==="40001"?"Podcast bilgileri değişti. Yenileyip tekrar deneyin.":"Podcast ekleri kaydedilemedi."},error?.code==="42501"?403:error?.code==="40001"?409:503);
  if(d.islem==="ai"&&process.env.NODE_ENV==="development"){
   const {baslatLocalTranskriptWorker}=await import("@/lib/ogrenmeAraci/localTranskriptWorker");baslatLocalTranskriptWorker();
  }
  return yanit(data);
 }catch{return partnerYanit({hata:"Podcast işlemi tamamlanamadı."},503);}
}
export async function PUT(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return partnerYanit({hata:"İstek doğrulanamadı."},403);
 try{
  const b=await onayliPartnerBaglami();if(!b)return partnerYanit({hata:"Partner oturumu doğrulanamadı."},401);
  // FormData ayrıştırmadan önce gerçek gövdeyi sınırla (20 MB destek dosyası).
  const reader=request.body?.getReader();if(!reader)return partnerYanit({hata:"Dosya eksik."},400);
  const chunks:Uint8Array[]=[];let toplam=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;toplam+=value.byteLength;if(toplam>21*1024**2){await reader.cancel();return partnerYanit({hata:"Dosya en fazla 20 MB olabilir."},413);}chunks.push(value);}}finally{reader.releaseLock();}
  const form=await new Response(Buffer.concat(chunks),{headers:{"Content-Type":request.headers.get("content-type")||""}}).formData();
  const id=form.get("egitim_id"),medya=form.get("yukleme_id"),surum=Number(form.get("surum")),rol=form.get("rol"),file=form.get("dosya");
  if(!medyaUuid(id)||!medyaUuid(medya)||!Number.isSafeInteger(surum)||!(file instanceof File)||!["kapak","transkript"].includes(String(rol)))return partnerYanit({hata:"Dosya bilgileri geçersiz."},400);
  const kontrol=podcastDestekDosyasiDogrula({rol:rol as "kapak"|"transkript",dosyaAdi:file.name,mimeType:file.type,dosyaBoyutu:file.size});
  if(!kontrol.ok)return partnerYanit({hata:kontrol.hata},400);
  const yetki=await b.db.rpc("agora_partner_podcast_ekleri_islem",{p_token_ozeti:b.tokenOzeti,p_egitim_id:id,p_yukleme_id:medya,p_islem:"oku"});
  if(yetki.error||!yetki.data)return partnerYanit({hata:"Podcast erişimi doğrulanamadı."},403);
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!podcastDestekDosyasiImzasiDogrula(rol as "kapak"|"transkript",kontrol.uzanti,bytes))return partnerYanit({hata:"Dosya içeriği geçersiz."},400);
  let yol:string|null=null,metin:string|undefined;
  if(rol==="transkript"){
   const sonuc=await transkriptDosyasindanMetinCikar(kontrol.uzanti,bytes);if(!sonuc.ok)return partnerYanit({hata:sonuc.hata},400);metin=sonuc.metin;
  }else{
   yol=`agora/${b.partnerId}/${id}/${medya}/kapak/${randomUUID()}.${kontrol.uzanti}`;
   if(!await bunnyStorageNesneYukle({dosyaYolu:yol,mimeType:file.type,checksumSha256:createHash("sha256").update(bytes).digest("hex"),govde:bytes}))return partnerYanit({hata:"Yayın görseli yüklenemedi."},502);
  }
  const {data,error}=await b.db.rpc("agora_partner_podcast_ekleri_islem",{p_token_ozeti:b.tokenOzeti,p_egitim_id:id,p_yukleme_id:medya,p_islem:rol==="kapak"?"kapak":"metin",p_surum:surum,p_veri:{yol,metin}});
  if(error||!data){if(yol)await bunnyStorageNesneSil(yol);return partnerYanit({hata:"Podcast bilgileri değişti veya kaydedilemedi. Yenileyin."},error?.code==="42501"?403:409);}
  return yanit(data);
 }catch{return partnerYanit({hata:"Dosya işlenemedi."},503);}
}
