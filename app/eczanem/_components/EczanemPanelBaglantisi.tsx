"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PanelKabugu from "@/components/panel/PanelKabugu";
import type { NavGrup } from "@/components/panel/panelNav.config";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import { BILDIRIM_ROZETLERI_DEGISTI } from "@/lib/bildirimler/rozet";
import EczanemProfilMenusu from "./EczanemProfilMenusu";
import useEczanemGezinme from "./eczanemGezinme";
import { eczanemKapsamYolu, eczanemUyeMenusuOlustur } from "./eczanemUyeMenusu";
import type { EczanemSidebarAgaci, EczanemVideolarYaniti } from "../_types";

interface Props {
  children: ReactNode;
  gruplar: NavGrup[];
  gezinmeAgaci?: EczanemSidebarAgaci;
  yeniIcerikSayisi?: number;
  onHesapSil?: () => void;
  onAnaSayfa?: () => void;
  anaSayfaSecili?: boolean;
}

/** Üye kimliği ve sayfalar arasında ortak eczane/firma gezintisi. */
export default function EczanemPanelBaglantisi({ children, gruplar, gezinmeAgaci, yeniIcerikSayisi, onHesapSil, onAnaSayfa, anaSayfaSecili }: Props) {
  const { kullanici, yukleniyor, cikisYap } = useAuth();
  const router = useRouter();
  const uye = kullanici?.kimlik_turu === MUSTERI_ROLU;
  const [uzakYeniSayisi, setUzakYeniSayisi] = useState(0);
  const ortakAgac = useEczanemGezinme(!yukleniyor && uye ? kullanici?.id : undefined, gezinmeAgaci);
  const ortakGruplar = gezinmeAgaci !== undefined || ortakAgac.length === 0 ? gruplar : [
    ...gruplar,
    ...eczanemUyeMenusuOlustur({ agac: ortakAgac, onSecim: secim => router.push(eczanemKapsamYolu(secim)) }).filter(grup => grup.baslik === "Eczanelerim"),
  ];

  useEffect(() => {
    if (yukleniyor || !kullanici || !uye || yeniIcerikSayisi !== undefined) return;
    let aktif = true;
    const sayiyiCek = async () => {
      try {
        const res = await fetch("/eczanem/api/videolar", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as EczanemVideolarYaniti;
        if (!aktif) return;
        setUzakYeniSayisi((data.videolar ?? []).filter((v) => !v.izleme_basladi).length);
      } catch {}
    };
    void sayiyiCek();
    window.addEventListener(BILDIRIM_ROZETLERI_DEGISTI, sayiyiCek);
    return () => {
      aktif = false;
      window.removeEventListener(BILDIRIM_ROZETLERI_DEGISTI, sayiyiCek);
    };
  }, [kullanici, uye, yeniIcerikSayisi, yukleniyor]);

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
        eczanemAcik: true,
      }}
      gruplar={ortakGruplar}
      badge={{ eczanem_yeni: yeniIcerikSayisi ?? uzakYeniSayisi }}
    >
      {children}
    </PanelKabugu>
  );
}
