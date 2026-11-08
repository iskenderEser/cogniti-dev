import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import { sm2FiyatYaniti } from "@/lib/fiyat/sm2Sunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
export async function GET() {
 try {
  if(!await onayliPartnerBaglami())return partnerYanit({hata:"Partner oturumu gerekiyor."},401);
  return await sm2FiyatYaniti();
 }catch{return partnerYanit({hata:"Fiyatlar okunamadı."},503);}
}
