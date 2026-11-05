"use client";

import { useState } from "react";
import PanelNavbar from "@/components/panel/PanelNavbar";
import type { NavGrup } from "@/components/panel/panelNav.config";
import MobilDrawer from "@/components/panel/MobilDrawer";

/** Ortak Cogniti navbarı; partner oturumu ve gezinme hedefleri çağıran sayfadan gelir. */
export default function PartnerNavbar({firmaAdi,onCikis,onAnaSayfa,engelli=false,gruplar=[]}:{firmaAdi:string;onCikis:()=>void;onAnaSayfa:()=>void;engelli?:boolean;gruplar?:NavGrup[]}) {
  const [menuAcik,setMenuAcik]=useState(false);
  const cikis=()=>{if(!engelli)onCikis();};
  const anaSayfa=()=>{if(!engelli)onAnaSayfa();};
  return <>
    <PanelNavbar adSoyad={firmaAdi} profilAltBilgi="Cogniti İş Partneri"
      anaSayfaYolu="/partner/egitimler" onAnaSayfa={anaSayfa} bilgiPilleri={[]}
      onCikis={cikis} onHamburger={()=>setMenuAcik(true)}
      profilMenusu={<><p className="px-2 py-1 text-sm font-bold">{firmaAdi}</p><p className="px-2 pb-2 text-xs text-[var(--tema-ikincil-metin)]">Cogniti İş Partneri</p><button type="button" role="menuitem" disabled={engelli} onClick={cikis} className="w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-[var(--tema-vurgu)] disabled:opacity-50">Çıkış</button></>}/>
    <MobilDrawer rolKucu="partner" kimlikTuru="partner" storeAcik={false} ccAcik={false} eclubAcik={false} eczanemAcik={false}
      gruplar={gruplar} bilgiPilleri={[]} badge={{}} acik={menuAcik} onKapat={()=>setMenuAcik(false)} onCikis={cikis}
      anaSayfaYolu="/partner/egitimler" onAnaSayfa={anaSayfa}/>
  </>;
}
