"use client";
import { useEffect, useState } from "react";
import { partnerFirmaListesiGecerli, type PartnerFirmaOzeti } from "@/lib/agora/partnerFirmaYonetimi";

export function usePartnerFirmalari(aktif:boolean) {
  const [firmalar,setFirmalar]=useState<PartnerFirmaOzeti[]>([]),[yukleniyor,setYukleniyor]=useState(true),[hata,setHata]=useState("");
  useEffect(()=>{
    if(!aktif)return;
    const c=new AbortController();
    void(async()=>{
      setYukleniyor(true);setHata("");
      try{
        const kayitlar:PartnerFirmaOzeti[]=[];let sayfa=1,toplam=0;
        do{
          const r=await fetch(`/admin/api/partnerler/firmalar?sayfa=${sayfa}`,{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(15000)])});
          const d:unknown=await r.json();if(!r.ok||!partnerFirmaListesiGecerli(d))throw new Error("Partner firmalar okunamadı. Sayfayı yenileyin.");
          kayitlar.push(...d.kayitlar);toplam=d.toplam;
          if(!d.kayitlar.length&&kayitlar.length<toplam)throw new Error("Partner firma listesi tamamlanamadı. Sayfayı yenileyin.");
          sayfa++;
        }while(kayitlar.length<toplam);
        if(!c.signal.aborted)setFirmalar([...new Map(kayitlar.map(k=>[k.partner_id,k])).values()].sort((a,b)=>a.sirket_adi.localeCompare(b.sirket_adi,"tr")));
      }catch(e){if(!c.signal.aborted){setFirmalar([]);setHata(e instanceof Error?e.message:"Partner firmalar okunamadı.");}}
      finally{if(!c.signal.aborted)setYukleniyor(false);}
    })();return()=>c.abort();
  },[aktif]);
  return {firmalar,yukleniyor,hata};
}
