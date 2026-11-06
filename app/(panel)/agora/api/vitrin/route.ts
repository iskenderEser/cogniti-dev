import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { bunnyCdnImzaliUrl } from "@/lib/ogrenmeAraci/bunnyStorage";
import type { AgoraVitrinVerisi } from "@/lib/agora/vitrin";
import { partnerYanit } from "@/lib/agora/partnerHttp";
export async function GET() {
 try {
  const b=await agoraVitrinBaglami();
  if(!b)return partnerYanit({hata:"Agora erişiminiz bulunmuyor."},403);
  const {data,error}=await b.db.rpc("agora_vitrin_oku",{p_auth_id:b.authId});
  if(error)return partnerYanit({hata:error.code==="42501"?"Agora erişiminiz bulunmuyor.":"Agora bilgileri alınamadı."},error.code==="42501"?403:503);
  const {data:ekler,error:ekHata}=await b.db.rpc("agora_vitrin_podcast_bilgileri",{p_auth_id:b.authId});
  if(ekHata||!Array.isArray(ekler))return partnerYanit({hata:"Podcast özellikleri alınamadı."},503);
  const bilgiler=new Map<string,{transkript_var:boolean;kapak_var:boolean;kapak_yolu:string|null}>(ekler.map(e=>[e.egitim_id,e]));
  const sonuc=data as AgoraVitrinVerisi;
  for(const y of sonuc.yayinlar){
   if(y.yayin_araci!=="podcast")continue;
   const e=bilgiler.get(y.egitim_id);
   if(!e||typeof e.transkript_var!=="boolean"||typeof e.kapak_var!=="boolean")return partnerYanit({hata:"Podcast bilgileri değişti. Yenileyin."},409);
   y.transkript_var=e.transkript_var;y.kapak_var=e.kapak_var;y.kapak_url=e.kapak_yolu?bunnyCdnImzaliUrl(e.kapak_yolu):null;
  }
  return partnerYanit(sonuc);
 }catch{return partnerYanit({hata:"Agora bilgileri alınamadı."},503);}
}
