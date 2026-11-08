import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { fiyatlariGorebilir } from "@/lib/fiyat/erisim";
import UyePlanlama from "@/app/_components/UyePlanlama";

export const dynamic = "force-dynamic";

import icerik from "./icerik.json";

export default async function PlanlamaAraci() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const rol = await rolCozucu(createAdminClient(AbortSignal.timeout(10000)), user.id);
  if (!fiyatlariGorebilir(rol)) notFound();
  return <UyePlanlama rol={rol} kullaniciId={user.id} icerik={icerik} />;
}
