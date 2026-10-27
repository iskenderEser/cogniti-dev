"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import EczaneKullanimKilavuzu from "@/components/rehber/EczaneKullanimKilavuzu";
import UreticiKullanimKilavuzu from "@/components/rehber/UreticiKullanimKilavuzu";
import { yoneticiKilavuzunuSec } from "@/lib/rehber/yoneticiKilavuzu";
import { tmKilavuzunuSec } from "@/lib/rehber/tmKilavuzu";
import { bmKilavuzunuSec } from "@/lib/rehber/bmKilavuzu";
import { uttKilavuzunuSec } from "@/lib/rehber/uttKilavuzu";
import { TUKETICI_ROLLER, URETICI_ROLLER, YONETICI_ROLLER, ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { useTema } from "@/app/providers/TemaProvider";
import TemaSecici from "@/components/tema/TemaSecici";
import PanelNavbar, { type PanelNavbarProps } from "./PanelNavbar";
import SolListe from "./SolListe";
import MobilDrawer from "./MobilDrawer";
import type { NavContext, NavGrup } from "./panelNav.config";

interface Props {
  children: ReactNode;
  navbar: Omit<PanelNavbarProps, "onHamburger">;
  baglam: NavContext;
  gruplar: NavGrup[];
  badge: Record<string, number>;
  bildirimler?: ReactNode;
}

/** PanelLayout'tan taşınan ortak yerleşim; kimlik veya uzak veri işlemi yapmaz. */
export default function PanelKabugu({ children, navbar, baglam, gruplar, badge, bildirimler }: Props) {
  const pathname = usePathname();
  const vivaYolu = pathname === "/viva" || pathname.startsWith("/viva/");
  const [drawerAcik, setDrawerAcik] = useState(false);
  const { tema, temaDegistir } = useTema();
  const renkAnahtari = navbar.temaSeciciGoster !== false ? <TemaSecici tema={tema} onTemaDegistir={temaDegistir} yerlesim="satir" /> : undefined;
  const uttKilavuzu = useMemo(() => uttKilavuzunuSec(baglam.eclubAcik, baglam.eczanemAcik), [baglam.eclubAcik, baglam.eczanemAcik]);

  const bmKilavuzu = useMemo(() => bmKilavuzunuSec({ ccAcik: baglam.ccAcik, eclubAcik: baglam.eclubAcik, eclubStoreAcik: baglam.eclubStoreAcik, eczanemAcik: baglam.eczanemAcik }), [baglam.ccAcik, baglam.eclubAcik, baglam.eclubStoreAcik, baglam.eczanemAcik]);

  const tmKilavuzu = useMemo(() => tmKilavuzunuSec({ ccAcik: baglam.ccAcik, eclubAcik: baglam.eclubAcik, eclubStoreAcik: baglam.eclubStoreAcik, eczanemAcik: baglam.eczanemAcik }), [baglam.ccAcik, baglam.eclubAcik, baglam.eclubStoreAcik, baglam.eczanemAcik]);

  const yoneticiKilavuzu = useMemo(() => yoneticiKilavuzunuSec(baglam.ccAcik, baglam.eclubAcik), [baglam.ccAcik, baglam.eclubAcik]);

  return (
    <div data-viva-panel={vivaYolu || undefined} style={{ height: vivaYolu ? "100dvh" : "100vh", background: "var(--tema-zemin)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PanelNavbar {...navbar} onHamburger={() => setDrawerAcik(true)} />
      <MobilDrawer
        {...baglam}
        gruplar={gruplar}
        badge={badge}
        altAlan={renkAnahtari}
        acik={drawerAcik}
        onKapat={() => setDrawerAcik(false)}
        onCikis={navbar.onCikis}
        anaSayfaYolu={navbar.anaSayfaYolu}
        onAnaSayfa={navbar.onAnaSayfa}
        anaSayfaSecili={navbar.anaSayfaSecili}
        bilgiPilleri={navbar.bilgiPilleri}
      />
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <SolListe {...baglam} gruplar={gruplar} badge={badge} altAlan={renkAnahtari} />
        <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
      {URETICI_ROLLER.includes(baglam.rolKucu) && <UreticiKullanimKilavuzu />}
      {TUKETICI_ROLLER.includes(baglam.rolKucu) && <UreticiKullanimKilavuzu key={baglam.rolKucu} kilavuz={uttKilavuzu} rolBasligi={baglam.rolKucu === "kd_utt" ? "Kıdemli Ürün Tanıtım Temsilcisi" : "Ürün Tanıtım Temsilcisi"} />}
      {baglam.rolKucu === "bm" && <UreticiKullanimKilavuzu key="bm" kilavuz={bmKilavuzu} rolBasligi="Bölge Müdürü" />}
      {baglam.rolKucu === "tm" && <UreticiKullanimKilavuzu key="tm" kilavuz={tmKilavuzu} rolBasligi="Takım Müdürü" />}
      {YONETICI_ROLLER.includes(baglam.rolKucu) && <UreticiKullanimKilavuzu key="yonetici" kilavuz={yoneticiKilavuzu} rolBasligi="Yönetici Roller" />}
      {baglam.kimlikTuru === "eclub_kisi" && ECLUB_TUKETICI_ROLLERI.includes(baglam.rolKucu) && <EczaneKullanimKilavuzu />}
      {bildirimler}
    </div>
  );
}
