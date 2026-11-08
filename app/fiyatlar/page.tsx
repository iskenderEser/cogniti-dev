import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { fiyatlariGorebilir } from "@/lib/fiyat/erisim";
import UyeFiyatlar from "@/app/_components/UyeFiyatlar";

export const dynamic = "force-dynamic";

export default async function Fiyatlar() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const rol = await rolCozucu(createAdminClient(AbortSignal.timeout(10000)), user.id);
  if (!fiyatlariGorebilir(rol)) notFound();
  return <UyeFiyatlar rol={rol} />;
}
