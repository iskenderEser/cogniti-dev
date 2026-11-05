import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerUyelikListesiGecerli } from "@/lib/agora/partnerUyelikTipleri";

export async function GET(request:Request) {
  try{
    const auth=await adminGirisKontrol();if(!auth.gecerli)return auth.yanit;
    const sayfa=Number(new URL(request.url).searchParams.get("sayfa")??1);
    if(!Number.isSafeInteger(sayfa)||sayfa<1||sayfa>100000)return partnerYanit({hata:"Geçersiz sayfa."},400);
    const {data,error}=await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_uyelik_basvurulari",{p_admin_id:auth.kullaniciId,p_durum:"tumu",p_sayfa:sayfa});
    if(error||!partnerUyelikListesiGecerli(data))return partnerYanit({hata:"Partner firmalar okunamadı."},503);
    return partnerYanit({toplam:data.toplam,kayitlar:data.kayitlar.map(k=>({partner_id:k.partner_id,sirket_adi:k.profil.sirket_adi,uyelik_durumu:k.uyelik_durumu}))});
  }catch{return partnerYanit({hata:"Partner firmalar okunamadı."},503);}
}
