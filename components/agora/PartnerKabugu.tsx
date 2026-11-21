"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SolListe from "@/components/panel/SolListe";
import type { NavGrup } from "@/components/panel/panelNav.config";
import PartnerNavbar from "./PartnerNavbar";

const BAGLAM={rolKucu:"partner",kimlikTuru:"partner",storeAcik:false,ccAcik:false,eclubAcik:false,eczanemAcik:false};

export default function PartnerKabugu({firmaAdi,onCikis,onAnaSayfa,onGit,engelli=false,className,children}:{firmaAdi:string;onCikis:()=>void;onAnaSayfa:()=>void;onGit?:(yol:string)=>void;engelli?:boolean;className?:string;children:ReactNode}) {
  const router=useRouter();
  const pathname=usePathname();
  const gruplar=useMemo<NavGrup[]>(()=>{
    const git=(yol:string)=>{if(!engelli){if(onGit)onGit(yol);else router.push(yol);}};
    return [
      {
        baslik:"Yayınlar",
        oglar:[
          {
            etiket:"Video ve Podcast Yayınlar",
            anahtar:"/partner/egitimler",
            gate:()=>true,
            altOglar:[
              {
                etiket:"Yayın Planlama",
                path:"/partner/egitimler/yeni",
                anahtar:"/partner/egitimler/yeni",
                tamEslesme:true,
                secili:pathname==="/partner/egitimler/yeni",
                gate:()=>true,
                onSecim:()=>git("/partner/egitimler/yeni"),
              },
              {
                etiket:"Agora Video ve Podcast Yayınlar",
                path:"/partner/egitimler",
                anahtar:"/partner/egitimler/agora",
                tamEslesme:true,
                secili:pathname==="/partner/egitimler",
                gate:()=>true,
                onSecim:()=>git("/partner/egitimler"),
              },
              {
                etiket:"Pasif Yayınlar",
                path:"/partner/egitimler/pasif",
                anahtar:"/partner/egitimler/pasif",
                tamEslesme:true,
                secili:pathname==="/partner/egitimler/pasif",
                gate:()=>true,
                onSecim:()=>git("/partner/egitimler/pasif"),
              },
            ],
          },
          {
            etiket:"Viva Canlı Yayınlar",
            anahtar:"/partner/canli-yayinlar",
            gate:()=>true,
            altOglar:[
              {
                etiket:"Canlı Yayın Planlama",
                path:"/partner/canli-yayinlar",
                anahtar:"/partner/canli-yayinlar/planlama",
                tamEslesme:true,
                secili:pathname==="/partner/canli-yayinlar",
                gate:()=>true,
                onSecim:()=>git("/partner/canli-yayinlar"),
              },
              {
                etiket:"Agora Canlı Yayınlar",
                path:"/partner/canli-yayinlar/agora",
                anahtar:"/partner/canli-yayinlar/agora",
                tamEslesme:true,
                secili:pathname==="/partner/canli-yayinlar/agora",
                gate:()=>true,
                onSecim:()=>git("/partner/canli-yayinlar/agora"),
              },
              {
                etiket:"Pasif Yayınlar",
                path:"/partner/canli-yayinlar/pasif",
                anahtar:"/partner/canli-yayinlar/pasif",
                tamEslesme:true,
                secili:pathname==="/partner/canli-yayinlar/pasif",
                gate:()=>true,
                onSecim:()=>git("/partner/canli-yayinlar/pasif"),
              },
            ],
          },
        ],
      },
      {
        baslik:"Hak Edişler",
        baslikGoster:false,
        oglar:[
          {etiket:"HAK EDİŞLER",path:"/partner/hak-edisleri",anahtar:"/partner/hak-edisleri",kalin:true,yaziBoyutu:12,gate:()=>true,onSecim:()=>git("/partner/hak-edisleri")},
        ],
      },
      {
        baslik:"Raporlar",
        baslikGoster:false,
        oglar:[
          {etiket:"RAPORLAR",path:"/partner/raporlar",anahtar:"/partner/raporlar",kalin:true,yaziBoyutu:12,gate:()=>true,onSecim:()=>git("/partner/raporlar")},
        ],
      },
    ];
  },[onGit,engelli,router,pathname]);
  return <div className={className} style={{height:"100dvh",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--tema-zemin)",color:"var(--tema-metin)"}}>
    <PartnerNavbar onFiyatlar={()=>{if(!engelli){if(onGit)onGit("/partner/fiyatlar");else router.push("/partner/fiyatlar");}}} firmaAdi={firmaAdi} onCikis={onCikis} onAnaSayfa={onAnaSayfa} engelli={engelli} gruplar={gruplar}/>
    <div className="flex min-h-0 flex-1">
      <SolListe {...BAGLAM} gruplar={gruplar} badge={{}}/>
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  </div>;
}
