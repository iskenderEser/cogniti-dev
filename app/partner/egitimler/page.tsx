import { redirect } from "next/navigation";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import PartnerEgitimAlani from "./PartnerEgitimAlani";

export default async function PartnerEgitimlerPage() {
  const b = await onayliPartnerBaglami();
  if (!b) redirect("/partner/profil");
  return <PartnerEgitimAlani sirketAdi={b.profil!.sirket_adi} logoSurumu={b.profil!.surum} />;
}
