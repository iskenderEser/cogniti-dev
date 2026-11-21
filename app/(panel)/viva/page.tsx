import { redirect } from "next/navigation";
import VivaEkrani from "@/components/viva/VivaEkrani";
import { vivaListeKaynagi } from "@/lib/viva/detay";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string | string[]; kaynak?: string | string[]; agora_siparis?: string | string[] }>;
}) {
  const { tur, kaynak, agora_siparis } = await searchParams;
  const listeKaynagi = vivaListeKaynagi(kaynak);
  if (listeKaynagi) redirect(`/viva/yayinlar?kaynak=${listeKaynagi}`);
  const agoraSiparisId = typeof agora_siparis === "string" && agora_siparis.trim() ? agora_siparis.trim() : undefined;
  const ilkTur = agoraSiparisId ? "planli" : tur === "anlik" ? "anlik" : "planli";
  return <VivaEkrani key={`${ilkTur}-${agoraSiparisId ?? ""}`} gorunum="yeni" ilkTur={ilkTur} agoraSiparisId={agoraSiparisId} />;
}
