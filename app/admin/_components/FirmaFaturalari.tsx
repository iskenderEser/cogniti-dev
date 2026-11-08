"use client";

import { useId, useState } from "react";
import styles from "../admin.module.css";
import local from "./firma-faturalari.module.css";

const KALEMLER = [
 { grup:"Gönderi", ad:"Kullandığın Kadar Öde Bedeli", birim:"Token" },
 { grup:"Gönderi", ad:"Esnek Paket Bedeli", birim:"Aylık fatura" },
 { grup:"Gönderi", ad:"Paket 1 Aylık Abonelik Bedeli", birim:"Ay" },
 { grup:"Gönderi", ad:"Paket 2 Aylık Abonelik Bedeli", birim:"Ay" },
 { grup:"Gönderi", ad:"Paket 3 Aylık Abonelik Bedeli", birim:"Ay" },
 { grup:"Hizmet", ad:"Video Üretimi", birim:"Adet" },
 { grup:"Hizmet", ad:"Podcast Üretimi", birim:"Adet" },
 { grup:"Hizmet", ad:"Dijital Broşür Üretimi", birim:"Adet" },
 { grup:"Hizmet", ad:"Literatür Üretimi", birim:"Adet" },
 { grup:"Hizmet", ad:"Banner Kiralama", birim:"Hafta" },
 { grup:"Canlı Yayın", ad:"Viva Canlı Yayın Bedeli", birim:"Kişi-dakika" },
 { grup:"Agora", ad:"Agora Yayın Satın Alma Bedeli", birim:"Adet" },
];

const PROFORMA_SEKMELERI = [
 {id:"abonelik",ad:"Abonelik Proforma Fatura"},
 {id:"hizmet",ad:"Hizmet Proforma Fatura"},
 {id:"cpf",ad:"Çek Proforma Fatura"},
] as const;
type ProformaSekmesi = typeof PROFORMA_SEKMELERI[number]["id"];

export default function FirmaFaturalari({ proforma = false }: { proforma?: boolean }) {
 const [sekme,setSekme]=useState<ProformaSekmesi>("abonelik");
 if(!proforma)return <section className={styles.card} aria-label="Giden Faturalar">
  <div className={styles.cardHeader}><div><h2>Giden Faturalar</h2><p>Seçili firmanın faturaları ve ödeme bilgileri.</p></div></div>
  <div className={styles.cardBody}>
   <div className={styles.tableWrap}><table className={`${local.tablo} ${local.liste}`} aria-label="Fatura listesi">
    <colgroup><col style={{width:"20%"}} /><col style={{width:"14%"}} /><col style={{width:"15%"}} /><col style={{width:"8%"}} /><col style={{width:"18%"}} /><col style={{width:"15%"}} /><col style={{width:"10%"}} /></colgroup>
    <thead><tr><th scope="col">Fatura No</th><th scope="col">Tarih</th><th scope="col">Dönem</th><th scope="col">Tür</th><th scope="col">Toplam Tutar</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>
    <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td><button type="button" className={local.listeButonu} disabled title="Henüz fatura PDF'i yüklenmedi">PDF</button></td></tr></tbody>
   </table></div>
  </div>
 </section>;
 return <section className={styles.card} aria-label="Proforma Fatura">
  <div className={styles.cardHeader}><div><h2>Proforma Fatura</h2><p>Seçili firmanın proforma fatura kalemleri.</p></div></div>
  <div className={styles.cardBody}>
   <div className={local.sekmeler} role="tablist" aria-label="Proforma fatura türü">
    {PROFORMA_SEKMELERI.map(s=><button key={s.id} type="button" id={`${s.id}-sekme`} role="tab" aria-selected={sekme===s.id} aria-controls={`${s.id}-panel`} onClick={()=>setSekme(s.id)}>{s.ad}</button>)}
   </div>
   <div role="tabpanel" id={`${sekme}-panel`} aria-labelledby={`${sekme}-sekme`}>
    <p className={local.aciklama}>Tablo taslağı · {sekme==="abonelik" ? "Abonelik kalemleri gösteriliyor." : sekme==="hizmet" ? "Hizmet kalemleri gösteriliyor." : "Hediye çeklerine ait faturalama kalemleri gösteriliyor."}</p>
    <div className={`${styles.tableWrap} ${local.ustTabloAlani}`}><table className={`${local.tablo} ${local.liste}`} aria-label="Proforma fatura özeti">
     <colgroup><col style={{width:"20%"}} /><col style={{width:"14%"}} /><col style={{width:"15%"}} /><col style={{width:"8%"}} /><col style={{width:"18%"}} /><col style={{width:"15%"}} /><col style={{width:"10%"}} /></colgroup>
     <thead><tr><th scope="col">Proforma No</th><th scope="col">Tarih</th><th scope="col">Dönem</th><th scope="col">Tür</th><th scope="col">Toplam Tutar</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>
     <tbody><ProformaSatiri key={sekme} sekme={sekme} /></tbody>
    </table></div>

   </div>
  </div>
 </section>;
}

function ProformaSatiri({sekme}:{sekme:ProformaSekmesi}) {
 const [detayAcik,setDetayAcik]=useState(false);
 const detayId=useId();
 return <>
  <tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td><button type="button" className={local.listeButonu} aria-expanded={detayAcik} aria-controls={detayId} onClick={()=>setDetayAcik(v=>!v)}>Detay</button></td></tr>
  {detayAcik && <tr className={local.detaySatiri}><td colSpan={7}>
    <div id={detayId} className={styles.tableWrap}><table className={local.tablo} aria-label={`${PROFORMA_SEKMELERI.find(s=>s.id===sekme)?.ad} kalemleri`}>
     <thead><tr><th scope="col">Kalem</th><th scope="col">Fatura Kalemi</th><th scope="col">Miktar</th><th scope="col">Birim</th><th scope="col">Birim Bedel (KDV hariç)</th><th scope="col">Tutar (KDV hariç)</th></tr></thead>
     <tbody>{sekme!=="cpf" ? KALEMLER.filter(k=>sekme==="abonelik" ? k.grup==="Gönderi" : k.grup!=="Gönderi").map(k=><tr key={k.ad}><td>{k.grup}</td><th scope="row">{k.ad}</th><td>—</td><td>{k.birim}</td><td>—</td><td>—</td></tr>)
      : <tr><td>Hediye Çeki</td><th scope="row">Hediye Çeki Bedeli</th><td>—</td><td>Adet</td><td>—</td><td>—</td></tr>}</tbody>
     <tfoot><tr><th scope="row" colSpan={5}>Ara Toplam</th><td>—</td></tr><tr><th scope="row" colSpan={5}>KDV</th><td>—</td></tr><tr><th scope="row" colSpan={5}>Genel Toplam</th><td>—</td></tr></tfoot>
    </table></div>
  </td></tr>}
 </>;
}
