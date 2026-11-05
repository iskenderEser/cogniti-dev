import { redirect } from "next/navigation";
import { partnerOturumuOku } from "@/lib/agora/partnerOturumu";
import { partnerProfilBaglami } from "@/lib/agora/partnerProfilSunucu";
import PartnerProfil from "./PartnerProfil";

export default async function PartnerProfilPage() {
  const partner = await partnerOturumuOku();
  if (!partner) redirect("/partner");
  const b = await partnerProfilBaglami();
  if (!b) redirect("/partner");
  if (b.uyelikDurumu === "onaylandi" && b.profil) redirect("/partner/egitimler");
  return <PartnerProfil partner={partner} />;
}
