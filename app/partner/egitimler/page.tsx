import { redirect } from "next/navigation";
import { onayliPartnerBaglami } from "@/lib/agora/partnerProfilSunucu";
import PartnerEgitimAlani from "./PartnerEgitimAlani";

export default async function PartnerEgitimlerPage({searchParams}:{searchParams:Promise<{kaydedildi?:string}>}) {
  const b = await onayliPartnerBaglami();
  if (!b) redirect("/partner/profil");
  const sorgu=await searchParams;
  return <PartnerEgitimAlani kaydedildi={sorgu.kaydedildi==="1"} sirketAdi={b.profil!.sirket_adi} logoSurumu={b.profil!.surum} />;
}
