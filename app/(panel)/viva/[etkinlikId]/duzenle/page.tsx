import VivaEkrani from "@/components/viva/VivaEkrani";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ etkinlikId: string }>;
  searchParams: Promise<{ agora_siparis?: string | string[] }>;
}) {
  const [{ etkinlikId }, { agora_siparis }] = await Promise.all([params, searchParams]);
  const agoraSiparisId = typeof agora_siparis === "string" && agora_siparis.trim() ? agora_siparis.trim() : undefined;
  return <VivaEkrani key={`${etkinlikId}-${agoraSiparisId ?? ""}`} gorunum="duzenle" etkinlikId={etkinlikId} agoraSiparisId={agoraSiparisId} />;
}
