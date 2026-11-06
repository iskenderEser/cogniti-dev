import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerJsonOku,partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { KKO_TOKEN_FIYATI } from "@/lib/token/fiyatlandirma";
export async function POST(request:Request) {
 const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
 const d=body.veri;
 if(!medyaUuid(d.egitim_id)||!Number.isSafeInteger(d.surum)||Number(d.surum)<1||typeof d.fiyat_tl!=="number"||!Number.isFinite(d.fiyat_tl)||d.fiyat_tl<0)return partnerYanit({hata:"Sipariş bilgileri geçersiz."},400);
 try{
  const b=await agoraVitrinBaglami();
  if(!b||!URETICI_ROLLER.includes(b.rol))return partnerYanit({hata:"Yalnız üretici kullanıcılar sipariş verebilir."},403);
  const {data,error}=await b.db.rpc("agora_satin_al",{p_auth_id:b.authId,p_egitim_id:d.egitim_id,p_surum:d.surum,p_fiyat:d.fiyat_tl,p_kko_birim:KKO_TOKEN_FIYATI});
  if(error)return partnerYanit({hata:error.code==="40001"?"Yayın veya fiyat değişti. Agora’yı yenileyip tekrar onaylayın.":error.code==="42501"?"Sipariş verme yetkiniz bulunmuyor.":"Sipariş tamamlanamadı. Yeniden deneyebilirsiniz."},error.code==="40001"?409:error.code==="42501"?403:503);
  if(!data?.siparis_id)return partnerYanit({hata:"Sipariş sonucu doğrulanamadı."},503);
  return partnerYanit(data);
 }catch{return partnerYanit({hata:"Sipariş sonucu alınamadı. Yeniden denemeniz ikinci kez token düşürmez."},503);}
}
