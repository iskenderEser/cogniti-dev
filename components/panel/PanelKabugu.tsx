"use client";

import { useState, type ReactNode } from "react";
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
  const [drawerAcik, setDrawerAcik] = useState(false);

  return (
    <div style={{ height: "100vh", background: "var(--tema-zemin)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PanelNavbar {...navbar} onHamburger={() => setDrawerAcik(true)} />
      <MobilDrawer
        {...baglam}
        gruplar={gruplar}
        badge={badge}
        acik={drawerAcik}
        onKapat={() => setDrawerAcik(false)}
        onCikis={navbar.onCikis}
        anaSayfaYolu={navbar.anaSayfaYolu}
        onAnaSayfa={navbar.onAnaSayfa}
        anaSayfaSecili={navbar.anaSayfaSecili}
        bilgiPilleri={navbar.bilgiPilleri}
      />
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <SolListe {...baglam} gruplar={gruplar} badge={badge} />
        <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
      {bildirimler}
    </div>
  );
}
