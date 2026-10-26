import { redirect } from "next/navigation";
import VivaEkrani from "@/components/viva/VivaEkrani";
import { vivaListeKaynagi } from "@/lib/viva/detay";

export default async function Page({ searchParams }: { searchParams: Promise<{ tur?: string | string[]; kaynak?: string | string[] }> }) {
  const { tur, kaynak } = await searchParams;
  const listeKaynagi = vivaListeKaynagi(kaynak);
  if (listeKaynagi) redirect(`/viva/yayinlar?kaynak=${listeKaynagi}`);
  const ilkTur = tur === "anlik" ? "anlik" : "planli";
  return <VivaEkrani key={ilkTur} gorunum="yeni" ilkTur={ilkTur} />;
}
