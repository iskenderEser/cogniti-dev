"use client";

import { useId, useState } from "react";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { SATIN_ALIM_AYLARI, satinAlimAyi } from "@/lib/satinAlma/aylikSiparisler";
import { FATURA_KALEMLERI, type FaturaKalemi } from "@/lib/admin/faturaSayfalari";
import styles from "../admin.module.css";
import local from "./firma-faturalari.module.css";
import AgoraYayinAlimlari from "./AgoraYayinAlimlari";
import BannerOnayliProformalar from "./BannerOnayliProformalar";
import VivaOnayliProformalar from "./VivaOnayliProformalar";
import KkoPaketAlimlari from "./KkoPaketAlimlari";
import AbonelikPaketAlimlari from "./AbonelikPaketAlimlari";
import EczaneCekAlimlari from "./EczaneCekAlimlari";
import FirmaStoreCekAlimlari from "./FirmaStoreCekAlimlari";
import IcerikUretimiAlimlari from "./IcerikUretimiAlimlari";
import EsnekPaketAlimlari from "./EsnekPaketAlimlari";

const KALEMLER: Record<FaturaKalemi, { ad: string; birim: string }[]> = {
 kko: [{ ad: "Kullandığın Kadar Öde Bedeli", birim: "Token" }],
 esnek: [{ ad: "Esnek Paket Bedeli", birim: "Token" }],
 abonelik: [{ ad: "Abonelik Başlangıç Bedeli", birim: "Token" }, { ad: "Abonelik Devam Bedeli", birim: "Ay" }],
 viva: [{ ad: "Viva Canlı Yayın Bedeli", birim: "Kişi-dakika" }],
 banner: [{ ad: "Banner Kiralama", birim: "Hafta" }],
 agora: [{ ad: "Agora Yayın Satın Alma Bedeli", birim: "Adet" }],
 icerik: ["Video Üretimi", "Podcast Üretimi", "Dijital Broşür Üretimi", "Literatür Üretimi"].map(ad => ({ ad, birim: "Adet" })),
 firmstore: [{ ad: "FirmStore Hediye Çeki Bedeli", birim: "Adet" }],
 eczane: [{ ad: "Eczane Hediye Çeki Bedeli", birim: "Adet" }],
};

export default function FirmaFaturalari({ firmaId, proforma = false, kalem }: { firmaId: string; proforma?: boolean; kalem?: FaturaKalemi }) {
 const [seciliAy,setSeciliAy]=useState(satinAlimAyi);
 const kalemAdi = FATURA_KALEMLERI.find(k => k.id === kalem)?.baslik;
 const bolumAdi = proforma ? "Onaylı Proforma Faturalar" : "Giden Faturalar";
 if (!kalem) return <section className={styles.card} aria-label={bolumAdi}>
  <div className={styles.cardHeader}><h2>{bolumAdi}</h2></div>
  <div className={styles.cardBody}><p>Soldaki menüden ilgili alım kalemini seçin.</p></div>
 </section>;
 const baslik = `${kalemAdi} · ${bolumAdi}`;
 if (proforma && kalem === "eczane") return <EczaneCekAlimlari key={firmaId} firmaId={firmaId} sadeceOnayli />;
 if (proforma && kalem === "firmstore") return <FirmaStoreCekAlimlari key={firmaId} firmaId={firmaId} sadeceOnayli />;
 if (proforma && kalem === "icerik") return <IcerikUretimiAlimlari key={`${firmaId}:icerik`} firmaId={firmaId} sadeceOnayli />;
 if (proforma && kalem === "agora") return <AgoraYayinAlimlari firmaId={firmaId} sadeceOnayli/>;
 if (proforma && kalem === "banner") return <BannerOnayliProformalar firmaId={firmaId}/>;
 if (proforma && kalem === "viva") return <VivaOnayliProformalar key={`${firmaId}:viva`} firmaId={firmaId}/>;
 if (proforma && kalem === "kko") return <KkoPaketAlimlari key={`${firmaId}:kko`} firmaId={firmaId} sadeceOnayli />;
 if (proforma && kalem === "esnek") return <EsnekPaketAlimlari key={`${firmaId}:esnek`} firmaId={firmaId} sadeceOnayli />;
 if (proforma && kalem === "abonelik") return <AbonelikPaketAlimlari key={`${firmaId}:abonelik`} firmaId={firmaId} sadeceOnayli />;
 if(!proforma)return <section className={styles.card} aria-label={baslik}>
  <div className={styles.cardHeader}><div><h2>{baslik}</h2><p>Seçili firmanın faturaları ve ödeme bilgileri.</p></div></div>
  <div className={styles.cardBody}>
   <div className={styles.tableWrap}><table className={`${local.tablo} ${local.liste}`} aria-label="Fatura listesi">
    <colgroup><col style={{width:"20%"}} /><col style={{width:"14%"}} /><col style={{width:"15%"}} /><col style={{width:"8%"}} /><col style={{width:"18%"}} /><col style={{width:"15%"}} /><col style={{width:"10%"}} /></colgroup>
    <thead><tr><th scope="col">Fatura No</th><th scope="col">Tarih</th><th scope="col">Dönem</th><th scope="col">Tür</th><th scope="col">Toplam Tutar</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>
    <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td><button type="button" className={local.listeButonu} disabled title="Henüz fatura PDF'i yüklenmedi">PDF</button></td></tr></tbody>
   </table></div>
  </div>
 </section>;
 return <section className={styles.card} aria-label={baslik}>
  <div className={styles.cardHeader}><div><h2>{baslik}</h2><p>Seçili firmanın proforma fatura kalemleri.</p></div></div>
  <div className={styles.cardBody}><SadeKapsulFiltre etiket="Onaylı proforma ayları" deger={seciliAy} onDegistir={setSeciliAy}
    secenekler={SATIN_ALIM_AYLARI.map((etiket,i)=>({deger:`${seciliAy.slice(0,4)}-${String(i+1).padStart(2,'0')}`,etiket}))}/></div>
  <div className={styles.cardBody}>
   <div>
    <p className={local.aciklama}>{kalemAdi} alımına ait proforma fatura bilgileri.</p>
    <div className={`${styles.tableWrap} ${local.ustTabloAlani}`}><table className={`${local.tablo} ${local.liste}`} aria-label="Proforma fatura özeti">
     <colgroup><col style={{width:"20%"}} /><col style={{width:"14%"}} /><col style={{width:"15%"}} /><col style={{width:"8%"}} /><col style={{width:"18%"}} /><col style={{width:"15%"}} /><col style={{width:"10%"}} /></colgroup>
     <thead><tr><th scope="col">Proforma No</th><th scope="col">Tarih</th><th scope="col">Dönem</th><th scope="col">Tür</th><th scope="col">Toplam Tutar</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>
     <tbody><ProformaSatiri key={`${kalem}:${seciliAy}`} kalem={kalem} /></tbody>
    </table></div>

   </div>
  </div>
 </section>;
}

function ProformaSatiri({kalem}:{kalem:FaturaKalemi}) {
 const [detayAcik,setDetayAcik]=useState(false);
 const detayId=useId();
 return <>
  <tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td><button type="button" className={local.listeButonu} aria-expanded={detayAcik} aria-controls={detayId} onClick={()=>setDetayAcik(v=>!v)}>Detay</button></td></tr>
  {detayAcik && <tr className={local.detaySatiri}><td colSpan={7}>
    <div id={detayId} className={styles.tableWrap}><table className={local.tablo} aria-label="Proforma fatura kalemleri">
     <thead><tr><th scope="col">Kalem</th><th scope="col">Fatura Kalemi</th><th scope="col">Miktar</th><th scope="col">Birim</th><th scope="col">Birim Bedel (KDV hariç)</th><th scope="col">Tutar (KDV hariç)</th></tr></thead>
     <tbody>{KALEMLER[kalem].map(k => <tr key={k.ad}><td>{FATURA_KALEMLERI.find(f => f.id === kalem)?.baslik}</td><th scope="row">{k.ad}</th><td>—</td><td>{k.birim}</td><td>—</td><td>—</td></tr>)}</tbody>
     <tfoot><tr><th scope="row" colSpan={5}>Ara Toplam</th><td>—</td></tr><tr><th scope="row" colSpan={5}>KDV</th><td>—</td></tr><tr><th scope="row" colSpan={5}>Genel Toplam</th><td>—</td></tr></tfoot>
    </table></div>
  </td></tr>}
 </>;
}
