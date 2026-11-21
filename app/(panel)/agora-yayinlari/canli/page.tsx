import { redirect } from "next/navigation";
import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import CanliAgoraYayinlarim from "@/components/agora/CanliAgoraYayinlarim";

export default async function CanliAgoraYayinlariSayfasi() {
  const b = await agoraVitrinBaglami();
  if (!b || !URETICI_ROLLER.includes(b.rol)) redirect("/ana-sayfa");
  return <CanliAgoraYayinlarim />;
}
