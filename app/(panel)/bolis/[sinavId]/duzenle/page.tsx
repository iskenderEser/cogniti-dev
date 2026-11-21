import BolisSinavFormu from "@/components/bolis/BolisSinavFormu";

export default async function BolisDuzenleSayfasi({
  params,
}: {
  params: Promise<{ sinavId: string }>;
}) {
  const { sinavId } = await params;
  return <BolisSinavFormu sinavId={sinavId} />;
}
