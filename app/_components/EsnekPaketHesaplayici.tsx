"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { SM2_TOKEN_ADETLERI, SM2_SURELERI, sm2MatrisiGecerli, type Sm2Fiyat } from "@/lib/fiyat/sm2";
import styles from "./fiyatlar.module.css";
const para=new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",minimumFractionDigits:2,maximumFractionDigits:2});
export default function EsnekPaketHesaplayici(){
 const pathname=usePathname();
 const [adet,setAdet]=useState(2500),[ay,setAy]=useState(5);
 const [matris,setMatris]=useState<Sm2Fiyat[]|null>(null),[hata,setHata]=useState("");
 const [deneme,setDeneme]=useState(0);
 useEffect(()=>{
  const kontrol=new AbortController();
  async function oku(){
   setMatris(null);setHata("");
   try{
    const r=await fetch(pathname.startsWith("/partner/")?"/partner/api/fiyatlar":"/fiyatlar/api",{cache:"no-store",signal:kontrol.signal});
    const d=await r.json();
    if(!r.ok||!sm2MatrisiGecerli(d.sm2))throw new Error("Fiyatlar okunamadı. Yeniden deneyin.");
    if(!kontrol.signal.aborted)setMatris(d.sm2);
   }catch{if(!kontrol.signal.aborted)setHata("Fiyatlar okunamadı. Yeniden deneyin.");}
  }
  void oku();return()=>kontrol.abort();
 },[pathname,deneme]);
 const hucre=matris?.find(h=>h.token_adedi===adet&&h.ay===ay);
 const toplamKurus=hucre?Math.round(hucre.birim_fiyat*100)*adet:0;
 return <div className={styles.hesaplayici}>
  <div className={styles.hesapKontroller}>
   <label>Toplam yüklenecek token<div className={styles.secimAlani}><select value={adet} onChange={e=>setAdet(Number(e.target.value))}>
    {SM2_TOKEN_ADETLERI.map(q=><option value={q} key={q}>{q.toLocaleString("tr-TR")} token</option>)}
   </select><ChevronDown aria-hidden="true" /></div></label>
   <label>Ödeme süresi<div className={styles.secimAlani}><select value={ay} onChange={e=>setAy(Number(e.target.value))}>
    {SM2_SURELERI.map(m=><option value={m} key={m}>{m} ay</option>)}
   </select><ChevronDown aria-hidden="true" /></div></label>
  </div>
  {hata?<div role="alert"><p>{hata}</p><button type="button" onClick={()=>setDeneme(v=>v+1)}>Yeniden Dene</button></div>
   :!hucre?<p role="status">Fiyatlar yükleniyor…</p>
   :<div className={styles.hesapSonuc} aria-live="polite" aria-atomic="true">
    <div><span>Birim fiyat / token</span><strong>{para.format(hucre.birim_fiyat)}</strong></div>
    <div><span>Toplam bedel</span><strong>{para.format(toplamKurus/100)}</strong></div>
    <div><span>Fatura tutarı</span><div className={styles.faturaOzeti}><strong>{(toplamKurus/100/ay).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2})} TL</strong></div></div>
   </div>}
  <p className={styles.hesapNotu}>Seçilen token adedi tüm süre için toplamdır. Fiyatlar KDV hariçtir.</p>
 </div>;
}
