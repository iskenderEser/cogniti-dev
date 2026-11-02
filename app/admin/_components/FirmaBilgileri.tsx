"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";
import {useEffect,useState} from "react";
import YeniFirmaFormu from "./YeniFirmaFormu";
import type {Firma,YeniFirmaBilgileri} from "../_types";
import styles from "../admin.module.css";
const ALANLAR = ["firma_adi","adres","vergi_dairesi","vergi_numarasi","sorumlu_ad_soyad","sorumlu_telefon","sorumlu_eposta","logo_url","vergi_dairesi_kodu"] as const;
function FirmaBilgileri({firmaId,onGuncellendi}:{firmaId:string;onGuncellendi:(firma:Firma)=>void}) {
 const [bilgiler,setBilgiler]=useState<YeniFirmaBilgileri|null>(null);
 const [hata,setHata]=useState("");
 const [kaydedildi,setKaydedildi]=useState(false);
 const [deneme,setDeneme]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch(`/admin/api/firmalar/${firmaId}`,{cache:"no-store",signal:controller.signal}).then(async res=>{
   const data=await res.json();
   if(!res.ok)throw new Error(data.hata ?? "Firma bilgileri yüklenemedi.");
   if(!controller.signal.aborted) {
    setBilgiler({...Object.fromEntries(ALANLAR.map(alan=>[alan,data.firma[alan] ?? ""])),il_id:data.firma.il_id ?? null,ilce_id:data.firma.ilce_id ?? null} as YeniFirmaBilgileri);
    setHata("");
   }
  }).catch(err=>{if(!controller.signal.aborted)setHata(err.message);});
  return ()=>controller.abort();
 },[firmaId,deneme]);
 async function kaydet(veri:YeniFirmaBilgileri) {
  setHata("");setKaydedildi(false);
  try {
   const res=await fetch(`/admin/api/firmalar/${firmaId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(veri)});
   const data=await res.json();
   if(!res.ok)throw new Error(data.hata ?? "Firma bilgileri kaydedilemedi.");
   onGuncellendi(data.firma);setKaydedildi(true);return true;
  }catch(err){setHata(err instanceof Error?err.message:"Firma bilgileri kaydedilemedi.");return false;}
 }
 return <div className={styles.stack}>
  {hata && <div role="alert" className={styles.notice}>{hata}{!bilgiler && <button type="button" className={styles.button} onClick={()=>setDeneme(n=>n+1)}>Tekrar Dene</button>}</div>}
  {bilgiler ? <><YeniFirmaFormu firmaId={firmaId} ilkBilgiler={bilgiler} duzenleme onKaydet={kaydet} />{kaydedildi && <p role="status">Firma bilgileri kaydedildi.</p>}</> : !hata && <p role="status">Firma bilgileri yükleniyor…</p>}
 </div>;
}

export default saltOkunurAlan(FirmaBilgileri);
