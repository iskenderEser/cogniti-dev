import AgoraVitrini from "@/components/agora/AgoraVitrini";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { AGORA_GOREN_ROLLER } from "@/lib/utils/roller";

export default async function AgoraSayfasi() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/welcome");
  const rol = await rolCozucu(createAdminClient(), user.id);
  if (!AGORA_GOREN_ROLLER.includes(rol)) redirect("/ana-sayfa");

  return <AgoraVitrini/>;
}
