import VivaEkrani from "@/components/viva/VivaEkrani";
export default async function Page({ searchParams }: { searchParams: Promise<{ tur?: string }> }) {
  const { tur } = await searchParams;
  const ilkTur = tur === "anlik" || tur === "planli" ? tur : undefined;
  return <VivaEkrani key={ilkTur ?? "secim"} gorunum="yeni" ilkTur={ilkTur} />;
}
