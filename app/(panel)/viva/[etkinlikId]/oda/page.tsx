import VivaEkrani from "@/components/viva/VivaEkrani";
export default async function Page({ params, searchParams }: { params: Promise<{ etkinlikId: string }>; searchParams: Promise<{ onizleme?: string; baslat?: string }> }) {
  const { etkinlikId } = await params;
  const { onizleme, baslat } = await searchParams;
  return <VivaEkrani key={etkinlikId} gorunum="oda" etkinlikId={etkinlikId} onizleme={onizleme === "1"} anlikBaslat={baslat === "1"} />;
}
