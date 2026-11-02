"use client";
import {useState} from "react";
import {SadeSecim} from "@/components/kontrol/SadeKontroller";
import {PLATFORM_FIRMA_ID, platformBannerFirmasi, type BannerAlani} from "@/lib/eclub/banner";
import EclubBannerYonetimi from "../eclub/_components/EclubBannerYonetimi";
import type {Firma} from "../_types";
import styles from "../admin.module.css";
const ALANLAR: BannerAlani[] = ["firma","uye-ana-sayfa","uyeler","uye-yayinlari","indirim-onayi"];
export default function CognitiBannerlari({firmalar}:{firmalar:Firma[]}) {
 const [firmaId,setFirmaId]=useState("");
 const firmalarListesi=firmalar.filter(f=>!platformBannerFirmasi(f.firma_id));
 const firma=firmalarListesi.find(f=>f.firma_id===firmaId);
 return <div className={styles.stack}>
  <EclubBannerYonetimi firmaId={PLATFORM_FIRMA_ID} firmaAdi="Cogniti" kaynak="cogniti" modern konumGoster />
  <EclubBannerYonetimi firmaId={PLATFORM_FIRMA_ID} firmaAdi="Cogniti" alan="uye-ana-sayfa" kaynak="cogniti" modern konumGoster />
  <section className={styles.card}>
   <div className={styles.cardHeader}><div><h2>Firma Sayfalarındaki Cogniti Bannerları</h2><p>Banner yerleştirilecek firmayı seçin. Cogniti ve firma bannerları sayfanın ortak limitini paylaşır.</p></div></div>
   <div className={styles.cardBody}><SadeSecim etiket="Hedef firma" placeholder="Firma seçin" deger={firmaId} onDegistir={setFirmaId} secenekler={firmalarListesi.map(f=>({deger:f.firma_id,etiket:f.firma_adi}))} /></div>
  </section>
  {firma && ALANLAR.map(alan=><EclubBannerYonetimi key={`${firma.firma_id}-${alan}`} firmaId={firma.firma_id} firmaAdi={firma.firma_adi} alan={alan} kaynak="cogniti" modern konumGoster />)}
 </div>;
}
