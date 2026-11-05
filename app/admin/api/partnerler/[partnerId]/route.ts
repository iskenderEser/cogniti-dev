import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerUyelikListesiGecerli } from "@/lib/agora/partnerUyelikTipleri";

export async function GET(_request:Request,context:{params:Promise<{partnerId:string}>}) {
  try{
    const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
    const {partnerId}=await context.params;
    if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(partnerId))return partnerYanit({hata:"Geçersiz partner."},400);
    const {data,error}=await createAdminClient(AbortSignal.timeout(15000)).rpc("agora_partner_firma_bilgileri_oku",{p_admin_id:auth.kullaniciId,p_partner_id:partnerId});
    if(error)return partnerYanit({hata:"Partner firma bilgileri okunamadı."},503);
    if(!data)return partnerYanit({hata:"Partner firma bulunamadı."},404);
    if(data.partner_id!==partnerId||!partnerUyelikListesiGecerli({toplam:1,kayitlar:[data]}))return partnerYanit({hata:"Partner firma bilgileri doğrulanamadı."},503);
    return partnerYanit({firma:data});
  }catch{return partnerYanit({hata:"Partner firma bilgileri okunamadı."},503);}
}
