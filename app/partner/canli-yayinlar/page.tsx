import { redirect } from "next/navigation";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import PartnerCanliYayinAlani from "./PartnerCanliYayinAlani";

export default async function PartnerCanliYayinlarPage() {
  const b = await onayliPartnerBaglami();
  if (!b) redirect("/partner/profil");
  return <PartnerCanliYayinAlani sirketAdi={b.profil!.sirket_adi} logoSurumu={b.profil!.surum} />;
}
