import type { Metadata } from "next";
import PartnerGiris from "./PartnerGiris";

export const metadata: Metadata = {
  title: "Cogniti Agora | İş Partnerleri",
  description: "Cogniti Agora iş partneri kayıt ve giriş alanı.",
  robots: { index: false, follow: false },
};

export default function PartnerPage() {
  return <PartnerGiris />;
}
