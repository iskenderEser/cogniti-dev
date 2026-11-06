import "server-only";
import { createClient,createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { AGORA_GOREN_ROLLER } from "@/lib/utils/roller";
export async function agoraVitrinBaglami() {
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return null;
 const db=createAdminClient();
 const rol=await rolCozucu(db,user.id);
 return AGORA_GOREN_ROLLER.includes(rol)?{db,authId:user.id,rol}:null;
}
