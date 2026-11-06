"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useAgoraVitrini } from "@/components/agora/AgoraVitrinBaglami";
import { usePathname } from "next/navigation";
import EczaneKullanimKilavuzu from "@/components/rehber/EczaneKullanimKilavuzu";
import UreticiKullanimKilavuzu from "@/components/rehber/UreticiKullanimKilavuzu";
import TemsilciIsAkisiHaritasi from "@/components/rehber/TemsilciIsAkisiHaritasi";
import BmIsAkisiHaritasi from "@/components/rehber/BmIsAkisiHaritasi";
import TmIsAkisiHaritasi from "@/components/rehber/TmIsAkisiHaritasi";
import UreticiIsAkisiHaritasi from "@/components/rehber/UreticiIsAkisiHaritasi";
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
  const agora = useAgoraVitrini();
  const agoraYolu = pathname === "/agora" || pathname.startsWith("/agora/");
  const partnerler = agora?.veri?.partnerler ?? [];
  const agoraGruplari:NavGrup[] = [{baslik:"Cogniti Partnerleri",oglar:partnerler.map(p=>({
    etiket:p.sirket_adi,anahtar:p.partner_id,secili:agora?.seciliPartner===p.partner_id,
    onSecim:()=>agora?.partnerSec(p.partner_id),badgeKey:p.partner_id,rozetKalici:true,gate:()=>true,
  }))}];
  const etkinGruplar = agoraYolu ? agoraGruplari : gruplar;
  const etkinBadge = agoraYolu ? Object.fromEntries(partnerler.map(p=>[p.partner_id,p.yayin_sayisi])) : badge;
  const etkinNavbar = agoraYolu ? {...navbar,bilgiPilleri:[{key:"ana-sayfa",etiket:"Ana Sayfa",path:navbar.anaSayfaYolu??"/ana-sayfa"}],
    onAgora:()=>agora?.partnerSec(null),anaSayfaSecili:false} : navbar;
  const vivaYolu = pathname === "/viva" || pathname.startsWith("/viva/");
  const kilavuzVar = URETICI_ROLLER.includes(baglam.rolKucu)
    || TUKETICI_ROLLER.includes(baglam.rolKucu)
    || baglam.rolKucu === "bm"
    || baglam.rolKucu === "tm"
    || YONETICI_ROLLER.includes(baglam.rolKucu)
    || (baglam.kimlikTuru === "eclub_kisi" && ECLUB_TUKETICI_ROLLERI.includes(baglam.rolKucu));
  const [drawerAcik, setDrawerAcik] = useState(false);
  const { tema, temaDegistir } = useTema();
  const renkAnahtari = navbar.temaSeciciGoster !== false ? <TemaSecici tema={tema} onTemaDegistir={temaDegistir} yerlesim="satir" /> : undefined;
  const uttKilavuzu = useMemo(() => uttKilavuzunuSec(baglam.eclubAcik, baglam.eczanemAcik), [baglam.eclubAcik, baglam.eczanemAcik]);

  const bmKilavuzu = useMemo(() => bmKilavuzunuSec({ ccAcik: baglam.ccAcik, eclubAcik: baglam.eclubAcik, eczanemAcik: baglam.eczanemAcik }), [baglam.ccAcik, baglam.eclubAcik, baglam.eczanemAcik]);

  const tmKilavuzu = useMemo(() => tmKilavuzunuSec({ ccAcik: baglam.ccAcik, eclubAcik: baglam.eclubAcik, eczanemAcik: baglam.eczanemAcik }), [baglam.ccAcik, baglam.eclubAcik, baglam.eczanemAcik]);

  const yoneticiKilavuzu = useMemo(() => yoneticiKilavuzunuSec(baglam.ccAcik, baglam.eclubAcik), [baglam.ccAcik, baglam.eclubAcik]);

  return (
    <div data-viva-panel={vivaYolu || undefined} style={{ height: vivaYolu ? "100dvh" : "100vh", background: "var(--tema-zemin)", fontFamily: "'Nunito', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PanelNavbar {...etkinNavbar} onHamburger={() => setDrawerAcik(true)} />
      <MobilDrawer
        {...baglam}
        gruplar={etkinGruplar}
        badge={etkinBadge}
        altAlan={renkAnahtari}
        acik={drawerAcik}
        onKapat={() => setDrawerAcik(false)}
        onCikis={navbar.onCikis}
        anaSayfaYolu={etkinNavbar.anaSayfaYolu}
        onAnaSayfa={etkinNavbar.onAnaSayfa}
        anaSayfaSecili={etkinNavbar.anaSayfaSecili}
        bilgiPilleri={etkinNavbar.bilgiPilleri}
      />
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <SolListe {...baglam} gruplar={etkinGruplar} badge={etkinBadge} altAlan={renkAnahtari} />
        <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          {children}
        </main>
        {kilavuzVar && <div aria-hidden="true" className="hidden w-[20px] shrink-0 sm:block" />}
      </div>
      {URETICI_ROLLER.includes(baglam.rolKucu) && <UreticiKullanimKilavuzu akisHaritasi={(pathname === "/yayin-takip" || pathname === "/yayin-yonetimi") ? <UreticiIsAkisiHaritasi rol={baglam.rolKucu} yayinaAcma={pathname === "/yayin-yonetimi"} /> : undefined} />}
      {TUKETICI_ROLLER.includes(baglam.rolKucu) && <UreticiKullanimKilavuzu key={baglam.rolKucu} kilavuz={uttKilavuzu} akisHaritasi={<TemsilciIsAkisiHaritasi />} rolBasligi={baglam.rolKucu === "kd_utt" ? "Kıdemli Ürün Tanıtım Temsilcisi" : "Ürün Tanıtım Temsilcisi"} />}
      {baglam.rolKucu === "bm" && <UreticiKullanimKilavuzu key="bm" kilavuz={bmKilavuzu} akisHaritasi={pathname === "/ana-sayfa" || pathname === "/oneriler" || pathname.startsWith("/oneriler/") || pathname === "/challenge-club" || pathname.startsWith("/challenge-club/") || pathname === "/eclub/eczaneler-takimim" || pathname === "/eczanem/bm/mutabakat-takip" ? <BmIsAkisiHaritasi /> : undefined} rolBasligi="Bölge Müdürü" />}
      {baglam.rolKucu === "tm" && <UreticiKullanimKilavuzu key="tm" kilavuz={tmKilavuzu} akisHaritasi={pathname === "/eclub/eczaneler-takimim" || pathname === "/eczanem/tm/mutabakat-takip" ? <TmIsAkisiHaritasi /> : undefined} rolBasligi="Takım Müdürü" />}
      {YONETICI_ROLLER.includes(baglam.rolKucu) && <UreticiKullanimKilavuzu key="yonetici" kilavuz={yoneticiKilavuzu} rolBasligi="Yönetici Roller" />}
      {baglam.kimlikTuru === "eclub_kisi" && ECLUB_TUKETICI_ROLLERI.includes(baglam.rolKucu) && <EczaneKullanimKilavuzu />}
      {bildirimler}
    </div>
  );
}
