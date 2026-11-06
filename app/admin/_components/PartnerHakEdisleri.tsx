import PartnerHakEdisTablosu from "@/components/agora/PartnerHakEdisTablosu";

export default function PartnerHakEdisleri({ partnerId }: { partnerId: string }) {
  return <PartnerHakEdisTablosu key={partnerId} partnerId={partnerId} odemeDuzenlenebilir
    endpoint={`/admin/api/partnerler/${encodeURIComponent(partnerId)}/hak-edisleri`} />;
}
