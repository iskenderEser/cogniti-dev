"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PanelNavbar from "@/components/panel/PanelNavbar";
import FiyatlarIcerigi from "./FiyatlarIcerigi";
import { panelBaslangici } from "@/lib/panel/baslangic";

export default function UyeFiyatlar({ rol, partnerAdi }: { rol: string; partnerAdi?: string }) {
  const router = useRouter();
  const { kullanici, cikisYap } = useAuth();
  const anaSayfaYolu = rol === "partner" ? "/partner/egitimler" : rol === "admin" ? "/admin"
    : rol === "firma_admin" && kullanici?.firma_id ? `/admin?${new URLSearchParams({firma:kullanici.firma_id,sayfa:"firmabilgileri"})}` : panelBaslangici(rol).yol;
  const cikis = async () => {
    if (rol === "partner") { await fetch("/partner/api/cikis", { method:"POST" }); router.replace("/partner"); }
    else await cikisYap();
  };
  return <>
    <PanelNavbar adSoyad={partnerAdi ?? kullanici?.adSoyad} profilAltBilgi={partnerAdi ? "Cogniti İş Partneri" : undefined}
      anaSayfaYolu={anaSayfaYolu} bilgiPilleri={[{key:"ana-sayfa",etiket:"Ana Sayfa",path:anaSayfaYolu}]}
      fiyatlarGoster fiyatlarYolu={rol === "partner" ? "/partner/fiyatlar" : "/fiyatlar"} onCikis={() => void cikis()} />
    <main><FiyatlarIcerigi /></main>
  </>;
}
