import VivaEkrani from "@/components/viva/VivaEkrani";
export default async function Page({ params }: { params: Promise<{ etkinlikId: string }> }) {
  const { etkinlikId } = await params;
  return <VivaEkrani key={etkinlikId} gorunum="duzenle" etkinlikId={etkinlikId} />;
}
