import { redirect } from "next/navigation";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import PartnerOzetSayfasi from "@/components/agora/PartnerOzetSayfasi";

export default async function PartnerOzetPage(){
  const b=await onayliPartnerBaglami();
  if(!b)redirect("/partner/profil");
  return <PartnerOzetSayfasi firmaAdi={b.profil!.sirket_adi} tur="raporlar"/>;
}
