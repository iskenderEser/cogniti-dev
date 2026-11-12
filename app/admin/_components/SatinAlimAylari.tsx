"use client";
import {useState} from 'react';
import {SadeKapsulFiltre} from '@/components/kontrol/SadeKontroller';
import {SATIN_ALIM_AYLARI,satinAlimAyi} from '@/lib/satinAlma/aylikSiparisler';
import styles from '../admin.module.css';
export default function SatinAlimAylari({baslik}:{baslik:string}) {
 const [ay,setAy]=useState(satinAlimAyi);
 return <section className={styles.card} aria-label={baslik}>
 <div className={styles.cardHeader}><h2>{baslik}</h2></div>
 <div className={styles.cardBody}><SadeKapsulFiltre etiket="Satın alım ayları" deger={ay} onDegistir={setAy}
 secenekler={SATIN_ALIM_AYLARI.map((etiket,i)=>({deger:`${ay.slice(0,4)}-${String(i+1).padStart(2,'0')}`,etiket}))}/></div>
 </section>;
}
