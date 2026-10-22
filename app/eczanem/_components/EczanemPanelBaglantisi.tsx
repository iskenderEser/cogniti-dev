"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PanelKabugu from "@/components/panel/PanelKabugu";
import type { NavGrup } from "@/components/panel/panelNav.config";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import EczanemProfilMenusu from "./EczanemProfilMenusu";
import useEczanemGezinme from "./eczanemGezinme";
import { eczanemKapsamYolu, eczanemUyeMenusuOlustur } from "./eczanemUyeMenusu";
import type { EczanemSidebarAgaci } from "../_types";

interface Props {
  children: ReactNode;
  gruplar: NavGrup[];
  gezinmeAgaci?: EczanemSidebarAgaci;
  onHesapSil?: () => void;
  onAnaSayfa?: () => void;
  anaSayfaSecili?: boolean;
}

/** Üye kimliği ve sayfalar arasında ortak eczane/firma gezintisi. */
export default function EczanemPanelBaglantisi({ children, gruplar, gezinmeAgaci, onHesapSil, onAnaSayfa, anaSayfaSecili }: Props) {
  const { kullanici, yukleniyor, cikisYap } = useAuth();
  const router = useRouter();
  const uye = kullanici?.kimlik_turu === MUSTERI_ROLU;
  const ortakAgac = useEczanemGezinme(!yukleniyor && uye ? kullanici?.id : undefined, gezinmeAgaci);
  const ortakGruplar = gezinmeAgaci !== undefined || ortakAgac.length === 0 ? gruplar : [
    ...gruplar,
    ...eczanemUyeMenusuOlustur({ agac: ortakAgac, onSecim: secim => router.push(eczanemKapsamYolu(secim)) }).filter(grup => grup.baslik === "Eczanelerim"),
  ];

  useEffect(() => {
    if (yukleniyor) return;
    if (!kullanici) { router.replace("/login"); return; }
    if (!uye) router.replace(panelBaslangici(kullanici.rol).yol);
  }, [kullanici, yukleniyor, uye, router]);

  if (yukleniyor) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--tema-zemin)]">
      <span className="size-7 animate-spin rounded-full border-2 border-[var(--tema-cizgi)] border-t-[var(--tema-eylem)]" role="status" aria-label="Oturum yükleniyor" />
    </div>;
  }
  if (!kullanici || !uye) return null;

  return (
    <PanelKabugu
      navbar={{
        adSoyad: kullanici.adSoyad || kullanici.ad || "Üye",
        email: kullanici.email,
        anaSayfaYolu: "/eczanem",
        onAnaSayfa,
        anaSayfaSecili,
        bilgiPilleri: [
          { key: "ana-sayfa", etiket: "Ana Sayfa", path: "/eczanem" },
        ],
        temaSeciciGoster: true,
        profilAltBilgi: kullanici.telefon ? `••• ••• ${kullanici.telefon.slice(-4)}` : undefined,
        profilMenusu: <EczanemProfilMenusu ad={kullanici.adSoyad || kullanici.ad || "Üye"} telefon={kullanici.telefon} onHesapSil={onHesapSil} />,
        onCikis: cikisYap,
      }}
      baglam={{
        rolKucu: kullanici.rol.trim().toLowerCase(),
        kimlikTuru: kullanici.kimlik_turu,
        storeAcik: false,
        ccAcik: false,
        eclubAcik: false,
        eclubStoreAcik: false,
        eczanemAcik: true,
      }}
      gruplar={ortakGruplar}
      badge={{}}
    >
      {children}
    </PanelKabugu>
  );
}
