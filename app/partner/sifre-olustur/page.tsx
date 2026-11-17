import PartnerSifreOlusturFormu from "./PartnerSifreOlusturFormu";

export const dynamic = "force-dynamic";

export default async function PartnerSifreOlusturSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ davet?: string | string[] }>;
}) {
  const params = await searchParams;
  const ham = Array.isArray(params.davet) ? params.davet[0] : params.davet;
  const davetToken = typeof ham === "string" ? ham.trim() : "";
  return <PartnerSifreOlusturFormu davetToken={davetToken} />;
}
