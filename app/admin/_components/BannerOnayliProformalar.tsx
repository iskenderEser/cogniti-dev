"use client";
import {useState} from 'react';
import {SadeKapsulFiltre} from '@/components/kontrol/SadeKontroller';
import {SATIN_ALIM_AYLARI,satinAlimAyi} from '@/lib/satinAlma/aylikSiparisler';
import BannerProformaAlani from './BannerProformaAlani';
import styles from '../admin.module.css';
export default function BannerOnayliProformalar({firmaId}:{firmaId:string}){
 const [ay,setAy]=useState(satinAlimAyi);
 return <section className={styles.card} aria-label="Banner Alımı · Onaylı Proforma Faturalar"><div className={styles.cardHeader}><div><h2>Banner Alımı · Onaylı Proforma Faturalar</h2><p>Firma veya admin tarafından onaylanan aylık proformalar.</p></div></div>
 <div className={styles.cardBody}><SadeKapsulFiltre etiket="Onaylı proforma ayları" deger={ay} onDegistir={setAy} secenekler={SATIN_ALIM_AYLARI.map((etiket,i)=>({deger:`${ay.slice(0,4)}-${String(i+1).padStart(2,'0')}`,etiket}))}/></div>
 <BannerProformaAlani key={`${firmaId}:${ay}`} firmaId={firmaId} ay={ay} sadeceOnayli/></section>;
}
