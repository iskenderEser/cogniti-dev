"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { taahhutluPaketlerGecerli, type TaahhutluPaket } from "@/lib/fiyat/taahhut";
import EsnekPaketHesaplayici from "./EsnekPaketHesaplayici";
import styles from "./fiyatlar.module.css";
const fiyat = new Intl.NumberFormat("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
export default function FiyatlarIcerigi(){
 const pathname=usePathname();
 const [paketler,setPaketler]=useState<TaahhutluPaket[]|null>(null);
 const [hata,setHata]=useState(false);
 useEffect(()=>{
  const kontrol=new AbortController();
  async function oku(){
   setPaketler(null);setHata(false);
   try{
    const yanit=await fetch(pathname.startsWith("/partner/")?"/partner/api/fiyatlar":"/fiyatlar/api",{cache:"no-store",signal:kontrol.signal});
    const veri=await yanit.json();
    if(!yanit.ok||!taahhutluPaketlerGecerli(veri.paketler))throw new Error("Fiyatlar okunamadı");
    if(!kontrol.signal.aborted)setPaketler(veri.paketler);
   }catch{if(!kontrol.signal.aborted)setHata(true);}
  }
  void oku();return()=>kontrol.abort();
 },[pathname]);
 return <div className={styles.page}>
  <h1>PAKETLER VE FİYATLAR</h1>
  <div className={styles.sheet}>
   <section className={styles.pay} aria-labelledby="kullandigin-kadar">
    <div><h2 id="kullandigin-kadar">Kullandığın Kadar Öde</h2><p>Ayda 1.500 tokena kadar taahhütsüz kullanım. Kullandığınız tokenlar ay sonunda faturalanır.</p></div>
    <div className={styles.price}><strong>9,90 TL</strong> <small>/ token</small></div>
   </section>
   <section className={styles.flex} aria-labelledby="esnek-baslik">
    <div><h2 id="esnek-baslik">Esnek Paket</h2><p>Tokenlarınızın tamamı başta yüklenir. Token adedini ve ödeme süresini seçerek aylık ödemenizi hesaplayın.</p></div>
    <EsnekPaketHesaplayici />
   </section>
   <section className={styles.packages} aria-labelledby="paketler">
    <h2 id="paketler">Taahhütlü Paketler</h2>
    <p>Tüm tokenler baştan yüklenir. Fatura, 6 ay boyunca aylık olarak düzenlenir.</p>
    {hata ? <p role="alert">Paket fiyatları okunamadı. Sayfayı yenileyin.</p> : !paketler ? <p role="status">Paket fiyatları yükleniyor…</p> : <table className={styles.paketTablosu} aria-label="Taahhütlü paket fiyatları">
     <thead><tr><th scope="col">Paket</th><th scope="col">Toplam yüklenecek token</th><th scope="col">TL / token</th><th scope="col">Aylık Fatura tutarı</th></tr></thead>
     <tbody>{paketler.map(p=><tr key={p.ad}><th scope="row">{p.ad}</th><td>{p.token.toLocaleString("tr-TR")}</td><td>{fiyat.format(p.birim)}</td><td>{p.aylik.toLocaleString("tr-TR",{maximumFractionDigits:2})} TL</td></tr>)}</tbody>
    </table>}
   </section>
  </div>
 </div>;
}
