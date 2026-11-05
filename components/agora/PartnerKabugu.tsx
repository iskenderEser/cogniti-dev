"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import SolListe from "@/components/panel/SolListe";
import type { NavGrup } from "@/components/panel/panelNav.config";
import PartnerNavbar from "./PartnerNavbar";

const BAGLAM={rolKucu:"partner",kimlikTuru:"partner",storeAcik:false,ccAcik:false,eclubAcik:false,eczanemAcik:false};
const SAYFALAR=[{etiket:"Eğitimlerim",path:"/partner/egitimler"},{etiket:"Hak Edişlerim",path:"/partner/hak-edisleri"},{etiket:"Raporlarım",path:"/partner/raporlar"}];

export default function PartnerKabugu({firmaAdi,onCikis,onAnaSayfa,onGit,engelli=false,className,children}:{firmaAdi:string;onCikis:()=>void;onAnaSayfa:()=>void;onGit?:(yol:string)=>void;engelli?:boolean;className?:string;children:ReactNode}) {
  const router=useRouter();
  const gruplar=useMemo<NavGrup[]>(()=>[{baslik:"İş Partneri",oglar:SAYFALAR.map(s=>({...s,anahtar:s.path,gate:()=>true,onSecim:()=>{if(!engelli){if(onGit)onGit(s.path);else router.push(s.path);}}}))}],[onGit,engelli,router]);
  return <div className={className} style={{height:"100dvh",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--tema-zemin)",color:"var(--tema-metin)"}}>
    <PartnerNavbar firmaAdi={firmaAdi} onCikis={onCikis} onAnaSayfa={onAnaSayfa} engelli={engelli} gruplar={gruplar}/>
    <div className="flex min-h-0 flex-1">
      <SolListe {...BAGLAM} gruplar={gruplar} badge={{}}/>
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  </div>;
}
