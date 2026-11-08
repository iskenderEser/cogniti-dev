import { redirect } from "next/navigation";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import UyePlanlama from "@/app/_components/UyePlanlama";

export const dynamic = "force-dynamic";

import icerik from "@/app/planlama-araci/icerik.json";

export default async function PartnerPlanlama() {
  const partner = await onayliPartnerBaglami();
  if (!partner) redirect("/partner");
  return <UyePlanlama rol="partner" partnerAdi={partner.profil!.sirket_adi} icerik={icerik} />;
}
