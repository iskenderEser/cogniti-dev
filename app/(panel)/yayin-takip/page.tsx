// app/(panel)/yayin-takip/page.tsx
//
// Yayın Oluşturma ve Takip — Üretici roller için operasyon ve takip sayfası.
//

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { UreticiRolGorunum } from "../talepler/_components/UreticiRolGorunum";
import YeniYayinHesapKapisi from "@/components/token/YeniYayinHesapKapisi";

export default function YayinTakipPage() {
  const router = useRouter();
  const { kullanici, yukleniyor } = useAuth();
  const [yeniYayinAcik, setYeniYayinAcik] = useState(false);

  useEffect(() => {
    if (!yukleniyor && kullanici && !URETICI_ROLLER.includes((kullanici.rol ?? "").toLowerCase())) {
      router.replace("/ana-sayfa");
    }
  }, [kullanici, router, yukleniyor]);

  return <YeniYayinHesapKapisi key={kullanici?.id ?? "oturum"} etkin={yeniYayinAcik}>
    <UreticiRolGorunum onYeniYayinAcikDegisti={setYeniYayinAcik} />
  </YeniYayinHesapKapisi>;
}
