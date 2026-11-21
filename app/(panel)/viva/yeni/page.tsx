import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string | string[]; agora_siparis?: string | string[] }>;
}) {
  const { tur, agora_siparis } = await searchParams;
  const agoraSiparisId = typeof agora_siparis === "string" && agora_siparis.trim() ? agora_siparis.trim() : null;
  if (agoraSiparisId) {
    redirect(`/viva?agora_siparis=${encodeURIComponent(agoraSiparisId)}`);
  }
  redirect(tur === "anlik" ? "/viva?tur=anlik" : "/viva");
}
