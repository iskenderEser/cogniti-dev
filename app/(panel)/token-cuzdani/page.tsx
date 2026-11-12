import { panelBaslangici } from "@/lib/panel/baslangic";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { redirect } from "next/navigation";
import styles from "../token/token.module.css";

export default async function TokenCuzdaniSayfasi() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const rol = await rolCozucu(createAdminClient(), user.id);
  if (!URETICI_ROLLER.includes(rol)) redirect(panelBaslangici(rol).yol);

  return (
    <main className={styles.page}>
      <div className={styles.breadcrumb}>Cogniti　›　<span>Token Cüzdanı</span></div>
      <h1>Token Cüzdanı</h1>
    </main>
  );
}
