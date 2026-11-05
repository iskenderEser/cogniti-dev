"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PartnerKabugu from "./PartnerKabugu";
import styles from "./partner-ozet.module.css";

const BASLIKLAR={
  "hak-edisleri":["ID","Eğitim Adı","Sipariş Tarihi","Satın Alma Bedeli","Cogniti Hizmet Bedeli (%15)","Ödenecek Tutar","KDV","KDV’li Ödenecek Tutar","Ödeme Günü"],
  raporlar:["ID","Eğitim Adı","Satış Fiyatı","Satılan Adet","Toplam Satış Fiyatı","Beğeni Sayısı","Favori Sayısı"],
};

export default function PartnerOzetSayfasi({firmaAdi,tur}:{firmaAdi:string;tur:keyof typeof BASLIKLAR}) {
  const router=useRouter(),kilit=useRef(false);
  const [cikiliyor,setCikiliyor]=useState(false),[hata,setHata]=useState("");
  const baslik=tur==="hak-edisleri"?"Hak Edişlerim":"Raporlarım";
  async function cikis(){
    if(kilit.current)return;kilit.current=true;setCikiliyor(true);setHata("");
    try{const r=await fetch("/partner/api/cikis",{method:"POST",signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error();window.location.replace("/partner");}
    catch{setHata("Çıkış tamamlanamadı. Yeniden deneyin.");kilit.current=false;setCikiliyor(false);}
  }
  return <PartnerKabugu firmaAdi={firmaAdi} onCikis={()=>void cikis()} onAnaSayfa={()=>router.push("/partner/egitimler")} engelli={cikiliyor}>
    <div className={styles.icerik}><h1>{baslik}</h1>
      {hata&&<p role="alert">{hata}</p>}
      <div className={styles.tabloAlani}><table aria-label={baslik}>
        <thead><tr>{BASLIKLAR[tur].map(b=><th key={b} scope="col">{b}</th>)}</tr></thead>
        <tbody><tr><td colSpan={BASLIKLAR[tur].length}>Satın alma verileri henüz bağlanmadı.</td></tr></tbody>
      </table></div>
    </div>
  </PartnerKabugu>;
}
