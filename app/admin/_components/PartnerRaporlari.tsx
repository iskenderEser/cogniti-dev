import PartnerRaporTablosu from "@/components/agora/PartnerRaporTablosu";

export default function PartnerRaporlari({ partnerId }: { partnerId: string }) {
  return <PartnerRaporTablosu key={partnerId} partnerId={partnerId}
    endpoint={`/admin/api/partnerler/${encodeURIComponent(partnerId)}/raporlar`} />;
}
