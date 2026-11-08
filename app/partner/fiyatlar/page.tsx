import { redirect } from "next/navigation";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import UyeFiyatlar from "@/app/_components/UyeFiyatlar";

export const dynamic = "force-dynamic";

export default async function PartnerFiyatlar() {
  const partner = await onayliPartnerBaglami();
  if (!partner) redirect("/partner");
  return <UyeFiyatlar rol="partner" partnerAdi={partner.profil!.sirket_adi} />;
}
