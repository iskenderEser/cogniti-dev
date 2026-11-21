import BolisSinavEkrani from "@/components/bolis/BolisSinavEkrani";

export default async function BolisKatilimSayfasi({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  return <BolisSinavEkrani kod={kod} />;
}
