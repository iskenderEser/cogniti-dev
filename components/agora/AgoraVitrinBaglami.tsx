"use client";

import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from "react";
import type { AgoraVitrinVerisi,AgoraYayini } from "@/lib/agora/vitrin";

interface Baglam {
 veri:AgoraVitrinVerisi|null; yukleniyor:boolean; hata:string; seciliPartner:string|null;
 partnerSec:(id:string|null)=>void; yenile:()=>Promise<void>;
 etkilesim:(yayin:AgoraYayini,tur:"begeni"|"favori")=>Promise<void>; mesgul:string|null;
}
const AgoraBaglami=createContext<Baglam|null>(null);
export const useAgoraVitrini=()=>useContext(AgoraBaglami);

export function AgoraVitrinSaglayici({etkin,kimlik,children}:{etkin:boolean;kimlik:string;children:ReactNode}) {
 const [veri,setVeri]=useState<AgoraVitrinVerisi|null>(null),[hata,setHata]=useState(""),[yukleniyor,setYukleniyor]=useState(false);
 const [seciliPartner,partnerSec]=useState<string|null>(null),[mesgul,setMesgul]=useState<string|null>(null);
 const istek=useRef<AbortController|null>(null),kilit=useRef(false),yasiyor=useRef(false);
 const yenile=useCallback(async()=>{
  if(!etkin||!yasiyor.current)return;
  istek.current?.abort();
  const c=new AbortController();istek.current=c;
  try{
   const r=await fetch("/agora/api/vitrin",{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(20000)])});
   const d=await r.json();
   if(!r.ok)throw new Error(d.hata||"Agora bilgileri alınamadı.");
   if(!d.stat||!Array.isArray(d.partnerler)||!Array.isArray(d.yayinlar))throw new Error("Agora bilgileri doğrulanamadı.");
   if(!c.signal.aborted&&yasiyor.current){setVeri(d);setHata("");}
  }catch(e){if(!c.signal.aborted&&yasiyor.current)setHata(e instanceof Error?e.message:"Agora bilgileri alınamadı.");}
  finally{if(!c.signal.aborted&&yasiyor.current)setYukleniyor(false);}
 },[etkin]);
 useEffect(()=>{
  yasiyor.current=true;setVeri(null);partnerSec(null);setHata("");setYukleniyor(etkin);
  void yenile();
  const gorunur=()=>{if(document.visibilityState==="visible")void yenile();};
  const timer=etkin?window.setInterval(gorunur,60000):undefined;
  if(etkin)document.addEventListener("visibilitychange",gorunur);
  return()=>{yasiyor.current=false;istek.current?.abort();window.clearInterval(timer);document.removeEventListener("visibilitychange",gorunur);};
 },[etkin,kimlik,yenile]);
 const etkilesim=async(yayin:AgoraYayini,tur:"begeni"|"favori")=>{
  if(kilit.current)return;
  kilit.current=true;setMesgul(yayin.egitim_id);setHata("");
  try{
   const r=await fetch("/agora/api/etkilesim",{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(15000),
    body:JSON.stringify({egitim_id:yayin.egitim_id,tur,deger:!(tur==="begeni"?yayin.begeni_mi:yayin.favori_mi)})});
   const d=await r.json();if(!r.ok)throw new Error(d.hata||"Etkileşim kaydedilemedi.");
   await yenile();
  }catch(e){if(yasiyor.current)setHata(e instanceof Error?e.message:"Etkileşim kaydedilemedi.");}
  finally{kilit.current=false;if(yasiyor.current)setMesgul(null);}
 };
 return <AgoraBaglami.Provider value={{veri,hata,yukleniyor,seciliPartner,partnerSec,yenile,etkilesim,mesgul}}>{children}</AgoraBaglami.Provider>;
}
