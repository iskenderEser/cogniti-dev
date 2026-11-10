"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { SM2_TOKEN_ADETLERI, sm2MatrisiGecerli, type Sm2Fiyat } from "@/lib/fiyat/sm2";
import styles from "./fiyatlar.module.css";
import EsnekPaketSiparis from "@/components/satinAlma/EsnekPaketSiparis";
const para=new Intl.NumberFormat("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function EsnekPaketHesaplayici({rol="",kullaniciId=""}:{rol?:string;kullaniciId?:string}){
 const pathname=usePathname();
 const [adet,setAdet]=useState<number|null>(null);
 const [matris,setMatris]=useState<Sm2Fiyat[]|null>(null),[hata,setHata]=useState("");
 const [deneme,setDeneme]=useState(0);
 const [surum,setSurum]=useState<number|null>(null);
 useEffect(()=>{
  const kontrol=new AbortController();
  async function oku(){
   setMatris(null);setSurum(null);setHata("");
   try{
    const r=await fetch(pathname.startsWith("/partner/")?"/partner/api/fiyatlar":"/fiyatlar/api",{cache:"no-store",signal:kontrol.signal});
    const d=await r.json();
    if(!r.ok||!sm2MatrisiGecerli(d.sm2))throw new Error("Fiyatlar okunamadı. Yeniden deneyin.");
    if(!kontrol.signal.aborted){setMatris(d.sm2);setSurum(Number.isSafeInteger(d.surum)&&d.surum>0?d.surum:null);}
   }catch{if(!kontrol.signal.aborted)setHata("Fiyatlar okunamadı. Yeniden deneyin.");}
  }
  void oku();return()=>kontrol.abort();
 },[pathname,deneme]);
 const hucre=matris?.find(h=>h.token_adedi===adet&&h.ay===0);
 const toplamKurus=hucre?Math.round(hucre.birim_fiyat*100)*hucre.token_adedi:0;
 return <div className={styles.hesaplayici}>
  <div className={styles.hesapUstSatir}>
   <label className={styles.hesapSecim}>Toplam yüklenecek token<div className={styles.secimAlani}><select value={adet??""} onChange={e=>setAdet(e.target.value===""?null:Number(e.target.value))}>
    <option value="">Token Seçin</option>
    {SM2_TOKEN_ADETLERI.map(q=><option value={q} key={q}>{q.toLocaleString("tr-TR")} token</option>)}
   </select><ChevronDown aria-hidden="true" /></div></label>
   <div className={styles.hesapDeger} aria-live="polite"><span>Toplam fiyat</span><strong>{hucre?`${para.format(toplamKurus/100)} TL`:"—"}</strong></div>
   <div className={styles.hesapDeger} aria-live="polite"><span>Birim fiyat / token</span><strong>{hucre?`${para.format(hucre.birim_fiyat)} TL`:"—"}</strong></div>
  </div>
  {hata?<div role="alert"><p>{hata}</p><button type="button" onClick={()=>setDeneme(v=>v+1)}>Yeniden Dene</button></div>
   :!matris?<p role="status">Fiyatlar yükleniyor…</p>:null}
  <p className={styles.hesapNotu}>KDV hariçtir.</p>
  {kullaniciId && <EsnekPaketSiparis key={`${kullaniciId}:${rol}`} rol={rol} kullaniciId={kullaniciId}
   teklif={hucre&&surum?{tokenAdedi:hucre.token_adedi,tarifeSurumu:surum,birimFiyat:hucre.birim_fiyat}:null}
   fiyatYenile={()=>setDeneme(v=>v+1)} />}
 </div>;
}
