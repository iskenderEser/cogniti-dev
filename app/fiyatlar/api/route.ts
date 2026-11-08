import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { fiyatlariGorebilir } from "@/lib/fiyat/erisim";
import { sm2FiyatYaniti } from "@/lib/fiyat/sm2Sunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
export async function GET() {
 try {
  const db=await createClient(); const {data:{user}}=await db.auth.getUser();
  if(!user)return partnerYanit({hata:"Oturum açmanız gerekiyor."},401);
  const rol=await rolCozucu(createAdminClient(AbortSignal.timeout(10000)),user.id);
  if(!fiyatlariGorebilir(rol))return partnerYanit({hata:"Bu alana erişim yetkiniz bulunmuyor."},403);
  return await sm2FiyatYaniti();
 }catch{return partnerYanit({hata:"Fiyatlar okunamadı."},503);}
}
