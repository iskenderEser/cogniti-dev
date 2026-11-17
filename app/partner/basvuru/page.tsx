import type { Metadata } from "next";
import { montserrat } from "@/app/_components/montserrat";
import PartnerBasvuruFormu from "./PartnerBasvuruFormu";

export const metadata: Metadata = {
  title: "Cogniti İş Partnerliği Başvurusu",
  description: "Cogniti Agora kişisel ve kurumsal iş partnerliği başvuru formu.",
  robots: { index: false, follow: false },
};

export default function PartnerBasvuruPage() {
  return (
    <div className={montserrat.variable}>
      <PartnerBasvuruFormu />
    </div>
  );
}
