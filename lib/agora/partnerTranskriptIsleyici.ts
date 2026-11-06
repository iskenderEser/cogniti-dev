import { createAdminClient } from "@/lib/supabase/server";
import { bunnyStorageNesneIndir } from "@/lib/ogrenmeAraci/bunnyStorage";
import { sesTranskriptiOlusturGemini } from "@/lib/ogrenmeAraci/geminiTranscribe";
export async function partnerTranskriptIsle(){
 const db=createAdminClient();
 const {data:j,error}=await db.rpc("agora_partner_transkript_isi",{p_islem:"al"});
 if(error||!j)return {islendi:false};
 try{
  const bytes=await bunnyStorageNesneIndir(j.dosya_yolu,250*1024**2);
  if(!bytes)throw new Error("SES_INDIRILEMEDI");
  const sonuc=await sesTranskriptiOlusturGemini({sesBaytlari:bytes,mimeType:j.mime_type,dosyaAdi:j.dosya_adi,model:j.model});
  const {data,error:hata}=await db.rpc("agora_partner_transkript_isi",{p_islem:sonuc.ok?"tamamla":"hata",p_veri:{is_id:j.is_id,lease:j.lease,
   ...(sonuc.ok?{metin:sonuc.metin}:{kalici:["GEMINI_API_KEY_EKSIK","SES_DOSYASI_BOS","KONUSMACI_AYRIMI_YAPILAMADI"].includes(sonuc.hataKodu)})}});
  return {islendi:true,basarili:sonuc.ok&&!hata&&!!data};
 }catch{
  await db.rpc("agora_partner_transkript_isi",{p_islem:"hata",p_veri:{is_id:j.is_id,lease:j.lease}});
  return {islendi:true,basarili:false};
 }
}
