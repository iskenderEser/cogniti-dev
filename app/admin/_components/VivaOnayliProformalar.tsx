"use client";
import {useState} from 'react';
import {SadeKapsulFiltre} from '@/components/kontrol/SadeKontroller';
import {SATIN_ALIM_AYLARI,satinAlimAyi} from '@/lib/satinAlma/aylikSiparisler';
import VivaProformaAlani from './VivaProformaAlani';
import styles from '../admin.module.css';
export default function VivaOnayliProformalar({firmaId}:{firmaId:string}){
 const [ay,setAy]=useState(satinAlimAyi);
 return <section className={styles.card} aria-label="Viva Kullanımı · Onaylı Proforma Faturalar"><div className={styles.cardHeader}><div><h2>Viva Kullanımı · Onaylı Proforma Faturalar</h2><p>Firma veya admin tarafından onaylanan aylık proformalar.</p></div></div>
 <div className={styles.cardBody}><SadeKapsulFiltre etiket="Onaylı proforma ayları" deger={ay} onDegistir={setAy} secenekler={SATIN_ALIM_AYLARI.map((etiket,i)=>({deger:`${ay.slice(0,4)}-${String(i+1).padStart(2,'0')}`,etiket}))}/></div>
 <VivaProformaAlani key={`${firmaId}:${ay}`} firmaId={firmaId} ay={ay} sadeceOnayli/></section>;
}
