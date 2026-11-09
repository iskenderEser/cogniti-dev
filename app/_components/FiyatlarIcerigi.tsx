"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { taahhutluPaketlerGecerli, type TaahhutluPaket } from "@/lib/fiyat/taahhut";
import EsnekPaketHesaplayici from "./EsnekPaketHesaplayici";
import styles from "./fiyatlar.module.css";
import KkoSecimModali from "@/components/satinAlma/KkoSecimModali";
import AbonelikPaketSecimi from "./AbonelikPaketSecimi";
export default function FiyatlarIcerigi({rol="",kullaniciId=""}:{rol?:string;kullaniciId?:string}){
 const pathname=usePathname();
 const planlamaYolu=pathname.startsWith("/partner/")?"/partner/planlama-araci":"/planlama-araci";
 const planlamaBaglantisi=()=><div className={styles.planlamaBaglantisiAlani}><a className={styles.planlamaBaglantisi} href={planlamaYolu}>Planlama Aracı <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg></a></div>;
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
    <div><h2 id="kullandigin-kadar">Kullandığın Kadar Öde</h2><ul className={styles.esnekMaddeler}>
     <li><span aria-hidden="true">→</span> Dilediğiniz kadar kullanın.</li>
     <li><span aria-hidden="true">→</span> Kullandığınız kadar faturalanacaktır, unutmayın.</li>
    </ul></div>
    <div className={styles.kkoSagAlan}>
     <div className={styles.price}><strong>9,90 TL</strong> <small>/ token</small></div>
     <KkoSecimModali key={`${kullaniciId}:${rol}`} rol={rol} kullaniciId={kullaniciId} />
    </div>
   </section>
   <section className={styles.flex} aria-labelledby="esnek-baslik">
    <div><h2 id="esnek-baslik">Esnek Paket</h2><ul className={styles.esnekMaddeler}>
     <li><span aria-hidden="true">→</span> İhtiyacınız kadar satın alın.</li>
     <li><span aria-hidden="true">→</span> 31 Aralık&apos;a kadar dilediğiniz zaman kullanın.</li>
     <li><span aria-hidden="true">→</span> Satın aldığınız tokenların her ay yüklenmeyeceğini, unutmayın.</li>
    </ul></div>
    <div className={styles.paketSagAlan}><EsnekPaketHesaplayici rol={rol} kullaniciId={kullaniciId} />{planlamaBaglantisi()}</div>
   </section>
   <section className={styles.packages} aria-labelledby="paketler">
    <div><h2 id="paketler">Abonelik Paketleri</h2><ul className={styles.esnekMaddeler}>
     <li><span aria-hidden="true">→</span> Tüketiminize uygun paketi seçin.</li>
     <li><span aria-hidden="true">→</span> Sabit fiyat garantisi ile aylık ödeyin.</li>
     <li><span aria-hidden="true">→</span> Kullanmadığınız tokenların bir sonraki aya devrolacağını, unutmayın.</li>
    </ul></div>
    <div className={styles.paketSagAlan}><div className={styles.abonelikTabloKarti}>
    {hata ? <p role="alert">Paket fiyatları okunamadı. Sayfayı yenileyin.</p> : !paketler ? <p role="status">Paket fiyatları yükleniyor…</p> :
     <AbonelikPaketSecimi key={`${kullaniciId}:${rol}`} paketler={paketler} rol={rol} kullaniciId={kullaniciId} />}
    </div>{planlamaBaglantisi()}</div>
   </section>
  </div>
 </div>;
}
