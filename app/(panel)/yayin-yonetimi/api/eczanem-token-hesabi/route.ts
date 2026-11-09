import { createClient,createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { ECZANEM_TALEP_ACAN_ROLLER } from "@/lib/utils/roller";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { partnerJsonOku,partnerYanit } from "@/lib/agora/partnerHttp";

export async function POST(request: Request) {
  try {
    const session=await createClient();
    const {data:{user}}=await session.auth.getUser();
    if(!user)return partnerYanit({hata:"Oturum açmanız gerekiyor."},401);
    const db=createAdminClient(AbortSignal.timeout(10000));
    if(!ECZANEM_TALEP_ACAN_ROLLER.includes(await rolCozucu(db,user.id)))return partnerYanit({hata:"Bu işlem için Eczanem üretici yetkisi gerekir."},403);
    const body=await partnerJsonOku(request);
    if(!body.ok)return body.yanit;
    const v=body.veri;
    if(Object.keys(v).some(k=>!["yayinId","hesapTuru"].includes(k)) || !uuidGecerliMi(v.yayinId)
      || (v.hesapTuru!==undefined && !["kisisel","firma_ortak"].includes(String(v.hesapTuru))))return partnerYanit({hata:"Geçersiz seçim."},400);
    const {data,error}=await db.rpc("eczanem_pm_token_hesabi",{p_auth:user.id,p_yayin:v.yayinId,p_tur:v.hesapTuru??null});
    if(error){
      if(error.message.includes("ECZANEM_TOKEN:yetersiz"))return partnerYanit({hata:"Eczanelerdeki gönderilmemiş üyeler için yeterli kullanılabilir token yok. Hesap seçimi kaydedilmedi."},409);
      if(error.message.includes("ECZANEM_TOKEN:hesap_degistirilemez"))return partnerYanit({hata:"Yayının token hesabı daha önce sabitlenmiş; değiştirilemez."},409);
      if(error.message.includes("ECZANEM_GONDERIM:sure_doldu"))return partnerYanit({hata:"Yayının 30 günlük gönderim süresi doldu."},409);
      return partnerYanit({hata:"Hesap bilgisi doğrulanamadı. Yeniden deneyin."},error.code==="42501"?403:503);
    }
    if(!data || typeof data.eski_yayin!=="boolean" || ![null,"kisisel","firma_ortak"].includes(data.hesap_turu)
      || ![data.blokeli,data.tuketilen,data.serbest].every(n=>Number.isSafeInteger(n)&&n>=0))return partnerYanit({hata:"Hesap bilgisi alınamadı."},503);
    return partnerYanit(data);
  }catch{return partnerYanit({hata:"Hesap bilgisi alınamadı."},503);}
}
