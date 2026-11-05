"use client";
import { useEffect,useLayoutEffect,useRef,useState } from "react";
import Image from "next/image";
import PartnerUyelikYetkiler from "./PartnerUyelikYetkiler";
import { Building2, UserRound } from "lucide-react";
import local from "./PartnerFirmaBilgileri.module.css";
import { ilSecenekleri,ilinIlceleri } from "@/lib/firma/konumReferansi";
import { partnerUyelikListesiGecerli,type PartnerUyelikBasvurusu } from "@/lib/agora/partnerUyelikTipleri";
import styles from "../admin.module.css";

function AdresAlani({deger}:{deger:string}) {
  const ref=useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(()=>{
    const alan=ref.current;if(!alan)return;
    let etkin=true,sonGenislik=-1;
    const boyutlandir=()=>{
      if(!etkin)return;
      alan.style.height="auto";
      alan.style.height=`${alan.scrollHeight+alan.offsetHeight-alan.clientHeight}px`;
    };
    boyutlandir();
    const gozlemci=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>{
      const genislik=alan.getBoundingClientRect().width;
      if(genislik!==sonGenislik){sonGenislik=genislik;boyutlandir();}
    }):null;
    gozlemci?.observe(alan);
    window.addEventListener("resize",boyutlandir);
    void document.fonts?.ready.then(boyutlandir);
    return()=>{etkin=false;gozlemci?.disconnect();window.removeEventListener("resize",boyutlandir);};
  },[deger]);
  return <textarea ref={ref} readOnly value={deger} rows={1} className={local.deger} />;
}

export default function PartnerFirmaBilgileri({partnerId}:{partnerId:string}) {
  const [firma,setFirma]=useState<PartnerUyelikBasvurusu|null>(null),[hata,setHata]=useState(""),[deneme,setDeneme]=useState(0);
  useEffect(()=>{
    const c=new AbortController();setFirma(null);setHata("");
    void(async()=>{
      try{
        const r=await fetch(`/admin/api/partnerler/${partnerId}`,{cache:"no-store",signal:AbortSignal.any([c.signal,AbortSignal.timeout(15000)])});
        const d=await r.json();if(!r.ok)throw new Error(d.hata||"Firma bilgileri okunamadı.");
        if(d.firma?.partner_id!==partnerId||!partnerUyelikListesiGecerli({toplam:1,kayitlar:[d.firma]}))throw new Error("Firma bilgileri doğrulanamadı.");
        if(!c.signal.aborted)setFirma(d.firma);
      }catch(e){if(!c.signal.aborted)setHata(e instanceof Error?e.message:"Firma bilgileri okunamadı.");}
    })();return()=>c.abort();
  },[partnerId,deneme]);
  if(hata)return <div role="alert" className={styles.notice}>{hata}<button type="button" className={styles.button} onClick={()=>setDeneme(n=>n+1)}>Tekrar Dene</button></div>;
  if(!firma||firma.partner_id!==partnerId)return <p role="status" className={styles.empty}>Firma bilgileri yükleniyor…</p>;
  const f=firma.profil;
  const konum=[
    ["Şirket Adı",f.sirket_adi],
    ["İl",ilSecenekleri.find(i=>i.deger===String(f.il_id))?.etiket??String(f.il_id)],
    ["İlçe",ilinIlceleri(f.il_id).find(i=>i.deger===String(f.ilce_id))?.etiket??String(f.ilce_id)],
    ["Adres",f.adres],
    ["Vergi Dairesi",f.vergi_dairesi],["Vergi Numarası",f.vergi_no],
    ["IBAN",f.iban.replace(/^(TR\d{2})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{2})$/,"$1 $2 $3 $4 $5 $6 $7")],
  ];
  function alanlar(veriler:string[][]) {
    return <div className={local.alanlar}>{veriler.map(([etiket,deger])=><label key={etiket} className={etiket==="IBAN" ? `${local.alan} ${local.tamSatir}` : local.alan}>{etiket}{etiket==="Adres"?<AdresAlani deger={deger} />:<input readOnly value={deger} className={local.deger} style={etiket==="IBAN" ? { width: `${deger.length + 2}ch`, maxWidth: "100%" } : undefined} />}</label>)}</div>;
  }
  return <div className={styles.stack}><PartnerUyelikYetkiler key={partnerId} partnerId={partnerId}/><div className={local.duzen}>
    <section className={styles.card} aria-label="Şirket Bilgileri">
      <header className={`${styles.cardHeader} ${local.baslik}`}><h2><Building2 aria-hidden="true"/>Şirket Bilgileri</h2><Image unoptimized src={`/admin/api/partnerler/${partnerId}/logo?v=${f.surum}`} alt={`${f.sirket_adi} Logosu`} width={150} height={50} className={local.logo}/></header>
      <div className={`${styles.cardBody} ${local.govde}`}>{alanlar(konum)}</div>
    </section>
    <section className={styles.card} aria-label="Yetkili Bilgileri">
      <header className={`${styles.cardHeader} ${local.baslik}`}><h2><UserRound aria-hidden="true"/>Yetkili Bilgileri</h2></header>
      <div className={`${styles.cardBody} ${local.govde}`}>{alanlar([["Ad Soyad",firma.ad_soyad],["E-Posta",firma.eposta],["Cep Telefonu",firma.cep_telefonu]])}</div>
    </section>
  </div></div>;
}
