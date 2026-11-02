import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { eclubKisiErisimi } from "@/lib/eclub/kisiErisim";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { eclubCekTalebiOlusturabilirMi } from "@/lib/eclub/store/cekTalebiYetkisi";
import { hataYaniti, sunucuHatasi, yetkiHatasi, rolHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
export async function GET(_request:NextRequest,{params}:{params:Promise<{talepId:string}>}) {
 try{
  const db=await createClient();const{data:{user},error}=await db.auth.getUser();if(error||!user)return yetkiHatasi();
  const{talepId}=await params;if(!uuidGecerliMi(talepId))return validasyonHatasi("Talep kimliği geçersiz.",["talepId"]);
  const admin=createAdminClient(),erisim=await eclubKisiErisimi(admin,user.id);
  if(!erisim.kisi||!eclubCekTalebiOlusturabilirMi(erisim.kisi.rol))return rolHatasi("Çek kodunu yalnız ana eczacı görüntüleyebilir.");
  const r=await admin.rpc("eclub_cek_teslim_bilgisi",{p_kisi:erisim.kisi.kisi_id,p_talep:talepId});
  if(r.error)return hataYaniti("Teslimat bilgisi alınamadı.","eclub_cek_teslim_bilgisi",r.error);
  if(!r.data||!erisim.firmalar.some(f=>f.firma_id===r.data.firma_id))return NextResponse.json({hata:"Teslimat bilgisi bulunamadı."},{status:404});
  return NextResponse.json(r.data,{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return sunucuHatasi(e,"GET E-Club çek teslimi");}
}
