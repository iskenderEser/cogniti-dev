import BolisRaporEkrani from "@/components/bolis/BolisRaporEkrani";

export default async function BolisRaporSayfasi({
  params,
}: {
  params: Promise<{ sinavId: string }>;
}) {
  const { sinavId } = await params;
  return <BolisRaporEkrani sinavId={sinavId} />;
}
