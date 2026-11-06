import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { ayniSiteMedyaIstegi,korumaliVideoUrl,podcastAkisi,sesliUyariHazir } from "@/lib/agora/korumaSunucu";
import { bunnyCdnImzaliUrl } from "@/lib/ogrenmeAraci/bunnyStorage";
import { AGORA_KORUMA_SURUMU } from "@/lib/agora/koruma";
export async function GET(request:Request,{params}:{params:Promise<{egitimId:string}>}) {
 if(!ayniSiteMedyaIstegi(request))return partnerYanit({hata:"Yayını Cogniti içinden açın."},403);
 const {egitimId}=await params;
 if(!medyaUuid(egitimId))return partnerYanit({hata:"Geçersiz yayın."},400);
 try{
  const b=await agoraVitrinBaglami();
  if(!b)return partnerYanit({hata:"Agora erişiminiz bulunmuyor."},403);
  const {data:m,error}=await b.db.rpc("agora_vitrin_medya",{p_auth_id:b.authId,p_egitim_id:egitimId});
  if(error||!m)return partnerYanit({hata:"Yayın açılamadı."},error?.code==="42501"?403:404);
  if(m.tur==="video"){
   const library=process.env.BUNNY_LIBRARY_ID;
   if(!library||!medyaUuid(m.guid))return partnerYanit({hata:"Video oynatıcısı hazır değil."},503);
   const imzali=korumaliVideoUrl(m.guid);
   const url=imzali??`https://player.mediadelivery.net/embed/${encodeURIComponent(library)}/${m.guid}?autoplay=false&disableIosPlayer=true`;
   return partnerYanit({tur:"video",url,korumaSurumu:AGORA_KORUMA_SURUMU});
  }
  if(m.tur!=="podcast"||!await sesliUyariHazir())return partnerYanit({hata:"Podcast ön izlemesi hazır değil."},503);
  if(new URL(request.url).searchParams.get("akis")==="1")return podcastAkisi(request,m.dosya_yolu,m.mime_type);
  return partnerYanit({tur:"podcast",url:`/agora/api/yayin/${egitimId}?akis=1`,korumaSurumu:AGORA_KORUMA_SURUMU,kapak_url:m.kapak_yolu?bunnyCdnImzaliUrl(m.kapak_yolu):null,transkript_metni:typeof m.transkript_metni==="string"?m.transkript_metni:null});
 }catch{return partnerYanit({hata:"Yayın açılamadı."},503);}
}
