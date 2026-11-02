import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const firmaStoreGonderici = () => process.env.FIRMASTORE_CEK_EMAIL_FROM || process.env.ECLUB_CEK_EMAIL_FROM || "";
/** Tek ve dondurulmuş gövde + sabit anahtar; 23 saatten eski belirsiz işler SQL'de durur. */
export async function firmaStoreEpostalariniIsle(db:SupabaseClient,siparisId:string|null=null,max=5) {
 const key=process.env.RESEND_API_KEY,from=firmaStoreGonderici();
 if(!key||!from)return{islenen:0,gonderilen:0,hata:0,ayar_hazir:false};
 let islenen=0,gonderilen=0,hata=0;
 for(let i=0;i<Math.min(max,5);i++) {
  const lease=randomUUID();
  const claim=await db.rpc("store_cek_eposta_is_al",{p_lease:lease,p_from:from,p_siparis:siparisId});
  if(claim.error)throw new Error("FIRMASTORE_EPOSTA_KUYRUK");
  const job=claim.data as {is_id:string;govde:Record<string,unknown>}|null;
  if(!job?.is_id)break;
  islenen++;let sonuc="kontrol",kod:string|null=null,id:string|null=null;
  try {
   const res=await fetch("https://api.resend.com/emails",{method:"POST",signal:AbortSignal.timeout(8000),headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json","Idempotency-Key":`firmastore-cek/${job.is_id}`},body:JSON.stringify(job.govde)});
   if(res.ok) { const d=await res.json();if(typeof d.id!=="string"||!d.id)throw new Error("YANIT");sonuc="gonderildi";id=d.id; }
   else { kod=`RESEND_HTTP_${res.status}`;sonuc=res.status===429||res.status>=500?"hata":"kontrol";
    if(res.status===409){const d=await res.json().catch(()=>null);if(d?.name==="concurrent_idempotent_requests")sonuc="hata";}
   }
  }catch {sonuc="hata";kod="AG_YANITI_BELIRSIZ";}
  const finish=await db.rpc("store_cek_eposta_is_bitir",{p_is:job.is_id,p_lease:lease,p_sonuc:sonuc,p_hata:kod,p_saglayici:id});
  if(finish.error||finish.data!==true)throw new Error("FIRMASTORE_EPOSTA_KAYIT");
  if(sonuc==="gonderildi")gonderilen++;else hata++;
 }
 return{islenen,gonderilen,hata,ayar_hazir:true};
}
