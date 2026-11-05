import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku,partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerErisimGecerli } from "@/lib/agora/partnerErisim";
const uuid=(v:string)=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(v);
type Context={params:Promise<{partnerId:string}>};
export async function GET(_r:Request,c:Context) {
  try{
    const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
    const {partnerId}=await c.params;if(!uuid(partnerId))return partnerYanit({hata:"Geçersiz partner."},400);
    const {data,error}=await createAdminClient(AbortSignal.timeout(15000)).rpc("agora_partner_erisim_bilgileri",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId});
    if(error)return partnerYanit({hata:"Üyelik ve erişim bilgileri okunamadı."},503);
    if(!data)return partnerYanit({hata:"Partner bulunamadı."},404);
    if(!partnerErisimGecerli(data)||data.partner_id!==partnerId)return partnerYanit({hata:"Erişim bilgileri doğrulanamadı."},503);
    return partnerYanit({bilgiler:data});
  }catch{return partnerYanit({hata:"Üyelik ve erişim bilgileri okunamadı."},503);}
}
export async function POST(r:Request,c:Context) {
  const body=await partnerJsonOku(r);if(!body.ok)return body.yanit;
  try{
    const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
    const {partnerId}=await c.params,d=body.veri;
    if(!uuid(partnerId)||typeof d.acik!=="boolean"||!Number.isSafeInteger(d.surum)||Number(d.surum)<1)return partnerYanit({hata:"Geçersiz erişim kararı."},400);
    const {data,error}=await createAdminClient(AbortSignal.timeout(15000)).rpc("agora_partner_erisim_degistir",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId,p_acik:d.acik,p_surum:d.surum});
    if(error)return partnerYanit({hata:"Erişim kararı doğrulanamadı. Güncel durumu kontrol edin."},503);
    if(data!=="tamam")return partnerYanit({hata:data==="bulunamadi"?"Partner bulunamadı.":"Erişim durumu değişmiş. Sayfayı yenileyin."},data==="bulunamadi"?404:409);
    return partnerYanit({mesaj:d.acik?"Partner erişimi açıldı.":"Partner erişimi kapatıldı."});
  }catch{return partnerYanit({hata:"Erişim kararı kaydedilemedi."},503);}
}
