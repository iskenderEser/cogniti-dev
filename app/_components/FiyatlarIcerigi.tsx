"use client";

import { ArrowUpRight, BookOpen, Check, CirclePlay, CreditCard, FileText, Info, MessageSquareMore, Mic, ScrollText } from "lucide-react";
import { useState } from "react";
import MusteriTalepFormu from "./MusteriTalepFormu";
import styles from "./fiyatlar.module.css";
import { KKO_TOKEN_FIYATI } from "@/lib/token/fiyatlandirma";

const paketler = [
  { miktar: "10.000", fiyat: "5,90", asim: "6,90" },
  { miktar: "30.000", fiyat: "4,90", asim: "5,90" },
  { miktar: "75.000", fiyat: "3,90", asim: "4,90" },
];
const hizmetler = [
  { ad: "Video", fiyat: "25.000 TL", Ikon: CirclePlay },
  { ad: "Podcast", fiyat: "15.000 TL", Ikon: Mic },
  { ad: "Dijital Broşür", fiyat: "10.000 TL", Ikon: FileText },
  { ad: "Literatür", fiyat: "Teklif alın", Ikon: BookOpen },
];

export default function FiyatlarIcerigi() {
  const [secim, setSecim] = useState<string | null>(null);
  return <div className={styles.page}>
    <MusteriTalepFormu secim={secim} onKapat={() => setSecim(null)} />
    <h1 className={styles.eyebrow}>FİYATLANDIRMA</h1>
    <section className={styles.payg} aria-labelledby="kullandigin-kadar">
      <div className={styles.paygDescription}><h2 id="kullandigin-kadar">Kullandığın Kadar Öde</h2><span className={styles.line} /><p>Taahhüt yok, esneklik var.</p><ul><li><Check size={14} /> Ay sonu faturalama</li><li><Check size={14} /> 30 gün ödeme vadesi</li><li><Check size={14} /> Aylık 1.500 token kullanım limiti</li></ul></div>
      <div className={styles.paygPrice}><strong>{KKO_TOKEN_FIYATI.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</strong><span>/ token</span></div>
      <button type="button" className={styles.link} onClick={() => setSecim("Kullandığın Kadar Öde")}><span><ArrowUpRight size={16}/></span>Kullanmaya Başlayın</button>
    </section>
    <section className={styles.packages} aria-labelledby="paketler"><h2 className={styles.eyebrow} id="paketler">AYLIK KULLANIM SEÇENEKLERİ</h2>
      <div className={styles.packageGrid}>{paketler.map(p => <article className={styles.package} key={p.miktar}><span className={styles.line} /><div className={styles.packagePrice}><h3>{p.fiyat} TL</h3><span>/ token</span></div><div className={styles.tokenAmount}><strong className={styles.price}>{p.miktar}</strong><span className={styles.unit}>token / ay</span></div><span className={styles.line} /><p className={styles.overage}>Ek kullanım bedeli: {p.asim} TL / token</p><button type="button" className={styles.link} onClick={() => setSecim(`${p.miktar} token / ay`)}><span><ArrowUpRight size={16}/></span>Paketi Seçin</button></article>)}</div>
    </section>
    <section className={styles.terms} aria-label="Faturalama ve kullanım koşulları"><p><ScrollText/>Ay sonu faturalama</p><p><CreditCard/>30 gün ödeme vadesi</p><p><Info/>2 ay token kullanım süresi</p></section>
    <section className={styles.productionSection} aria-labelledby="uretim-baslik">
      <div className={styles.production}>
        <div className={styles.productionHeading}><p className={styles.eyebrow}>İÇERİK ÜRETİM HİZMETLERİ</p><h2 id="uretim-baslik">Siz isteyin, biz üretelim.</h2></div>
        <div className={styles.productionContent}><div className={styles.services}>{hizmetler.map(({ad, fiyat, Ikon}) => <div className={styles.service} key={ad}><Ikon aria-hidden="true"/><div><h3>{ad}</h3><strong>{fiyat}</strong></div></div>)}</div></div>
      </div>
      <div className={styles.productionInfo}>
        <div className={styles.productionInfoIcon}><MessageSquareMore aria-hidden="true" /></div>
        <div className={styles.productionInfoText}><h3>Tüm üretim süreci tek yerde.</h3><p>Yayın tipine göre tüm üretim taleplerinizi Cogniti içindeki özel iletişim kanalından iletebilir,<br className={styles.productionDesktopBreak} /> üretimin her aşamasını takip edebilirsiniz. E-posta, mesaj ve telefon trafiği olmadan, tüm süreç tek yerde.</p></div>
        <ul className={styles.productionSteps}>{["Talep oluşturun", "Üretim sürecini takip edin", "Onaylayın ve yayınlayın"].map(adim => <li key={adim}><span><Check aria-hidden="true" /></span>{adim}</li>)}</ul>
      </div>
    </section>
  </div>;
}
