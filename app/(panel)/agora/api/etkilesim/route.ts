import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerJsonOku,partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
export async function POST(request:Request) {
 const body=await partnerJsonOku(request);
 if(!body.ok)return body.yanit;
 const d=body.veri;
 if(!medyaUuid(d.egitim_id)||!["begeni","favori"].includes(String(d.tur))||typeof d.deger!=="boolean")return partnerYanit({hata:"Geçersiz etkileşim."},400);
 try{
  const b=await agoraVitrinBaglami();
  if(!b)return partnerYanit({hata:"Agora erişiminiz bulunmuyor."},403);
  const {data,error}=await b.db.rpc("agora_vitrin_etkilesim_kaydet",{p_auth_id:b.authId,p_egitim_id:d.egitim_id,p_tur:d.tur,p_deger:d.deger});
  if(error)return partnerYanit({hata:"Etkileşim kaydedilemedi."},error.code==="42501"?403:503);
  return data===true?partnerYanit({tamam:true}):partnerYanit({hata:"Yayın artık Agora’da bulunmuyor."},409);
 }catch{return partnerYanit({hata:"Etkileşim kaydedilemedi."},503);}
}
