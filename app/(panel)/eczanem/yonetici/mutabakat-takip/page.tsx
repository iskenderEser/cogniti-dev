import { panelBaslangici } from "@/lib/panel/baslangic";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { YONETICI_ROLLER } from "@/lib/utils/roller";
import { redirect } from "next/navigation";
import BmMutabakatTakipClient from "../../bm/mutabakat-takip/_components/BmMutabakatTakipClient";

export default async function EczanemYoneticiMutabakatTakipPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const rol = await rolCozucu(createAdminClient(), user.id);
  if (!YONETICI_ROLLER.includes(rol)) redirect(panelBaslangici(rol).yol);

  return <BmMutabakatTakipClient rol="tm" yoneticiGorunumu />;
}
