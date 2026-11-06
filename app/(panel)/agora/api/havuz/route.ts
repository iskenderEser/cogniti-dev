import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerJsonOku,partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { URETICI_ROLLER,ureticiYayinHedefGruplari } from "@/lib/utils/roller";
export async function GET() {
 try{
  const b=await agoraVitrinBaglami();if(!b||!URETICI_ROLLER.includes(b.rol))return partnerYanit({hata:"Yayın havuzuna erişiminiz yok."},403);
  const {data,error}=await b.db.rpc("agora_havuz_oku",{p_auth_id:b.authId});
  return error?partnerYanit({hata:"Satın alınan yayınlar alınamadı."},503):partnerYanit({yayinlar:data});
 }catch{return partnerYanit({hata:"Satın alınan yayınlar alınamadı."},503);}
}
export async function POST(request:Request) {
 const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
 const d=body.veri;
 if(!medyaUuid(d.siparis_id)||!medyaUuid(d.istek_id)||typeof d.hedef!=="string")return partnerYanit({hata:"Yayın hazırlama bilgileri geçersiz."},400);
 try{
  const b=await agoraVitrinBaglami();if(!b||!ureticiYayinHedefGruplari(b.rol).some(h=>h===d.hedef))return partnerYanit({hata:"Bu hedef kitleye yayın hazırlama yetkiniz yok."},403);
  const {data,error}=await b.db.rpc("agora_yayin_hazirla",{p_auth_id:b.authId,p_siparis_id:d.siparis_id,p_hedef:d.hedef,p_istek_id:d.istek_id});
  if(error)return partnerYanit({hata:"Yayın hazırlanamadı."},error.code==="42501"?403:error.code==="40001"?409:503);
  return partnerYanit(data);
 }catch{return partnerYanit({hata:"Yayın hazırlama sonucu alınamadı."},503);}
}
