import { redirect } from "next/navigation";
import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import AgoraYayinlarim from "@/components/agora/AgoraYayinlarim";

export default async function AgoraYayinYonetimiSayfasi() {
  const b = await agoraVitrinBaglami();
  if (!b || !URETICI_ROLLER.includes(b.rol)) redirect("/ana-sayfa");
  return <AgoraYayinlarim gorunum="yonetim" />;
}
