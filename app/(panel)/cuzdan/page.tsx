"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { SadeKontrolButonu } from "@/components/kontrol/SadeKontroller";
import { bakiyePaketleri, useTokenBakiyeOzeti } from "@/components/panel/TokenBakiyeOzeti";
import type { BakiyeOzeti } from "@/lib/satinAlma/bakiyeOzeti";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import styles from "../token/token.module.css";
import SatinAlimTablosu from "./SatinAlimTablosu";

const n = (deger: number) => new Intl.NumberFormat("tr-TR").format(deger);

function CuzdanKartlari({ hesap, baslik: cuzdanBasligi, kullanim }: {
 hesap: BakiyeOzeti | null | undefined;
 baslik: string;
 kullanim: string;
}) {
 const paketler = bakiyePaketleri(hesap);
 const kartlar = ([
  {
   tur: "abonelik",
   baslik: "Aylık Abonelik",
   aciklama: `${kullanim} ve her ay yenilenir`,
  },
  {
   tur: "esnek",
   baslik: "Esnek Paket",
   aciklama: `${kullanim} ve 31 Aralık'a kadar kullanılabilir`,
  },
 ] as const).map(kart => ({ ...kart, paket: paketler.find(ozet => ozet.paket === kart.tur) }));
 const abonelikKalan = paketler.find(paket => paket.paket === "abonelik")?.kalan ?? 0;
 const esnekKalan = paketler.find(paket => paket.paket === "esnek")?.kalan ?? 0;
 return <>
  <h2 className={styles.cuzdanBasligi}>{cuzdanBasligi}</h2>
  {kartlar.map(({ tur, baslik, aciklama, paket }) => (
   <article key={tur}>
    <h3 className={styles.cuzdanKartBasligi}>{baslik}</h3>
    {paket ? (
     <dl className={styles.cuzdanDegerleri}>
      <div><dt className="sr-only">Toplam</dt><dd>{n(paket.toplam)}</dd></div>
     </dl>
    ) : hesap !== undefined && <small>Henüz satın alım yok</small>}
    <small>{aciklama}</small>
   </article>
  ))}
  <article>
   <h3 className={styles.cuzdanKartBasligi}>Toplam Kalan</h3>
   {hesap !== undefined && <>
    <div className={styles.cuzdanToplamKalan}>{n(abonelikKalan + esnekKalan)}</div>
    <small>Aylık Abonelik {n(abonelikKalan)} · Esnek Paket {n(esnekKalan)}</small>
   </>}
  </article>
 </>;
}

export default function CuzdanSayfasi() {
 const { kullanici, yukleniyor } = useAuth();
 const bakiyeHesabi = kullanici?.kimlik_turu === "kullanici" && kullanici.firma_id && esnekPaketBakiyeTuru(kullanici.rol)
  ? `${kullanici.id}:${kullanici.firma_id}:${kullanici.rol}` : null;
 const bakiyeOzeti = useTokenBakiyeOzeti(bakiyeHesabi);
 const { guncel: bakiyeSonucu, yenile: bakiyeYenile } = bakiyeOzeti;

 if (yukleniyor) return <main className={styles.page}><p role="status">Bilgiler yükleniyor…</p></main>;
 if (!bakiyeHesabi) return <main className={styles.page}><p>Bu sayfaya erişiminiz bulunmuyor.</p></main>;

 return <main className={styles.page}>
  <div className={styles.breadcrumb}>Cogniti　›　<span>Cüzdan</span></div>
  <div className={styles.cuzdanAlani} aria-busy={!!bakiyeHesabi && !bakiyeSonucu}>
   <div className={`${styles.uttStats} ${styles.cuzdanKartlari}`}>
    <CuzdanKartlari hesap={bakiyeSonucu?.veri?.kisisel} baslik="Kişisel Token Cüzdanım" kullanim="Kişisel kullanım" />
   </div>
   <SatinAlimTablosu key={`${bakiyeHesabi}:kisisel`} hesap="kisisel" baslik="Kişisel Satın Alımlar" />
   <div className={`${styles.uttStats} ${styles.cuzdanKartlari}`}>
    <CuzdanKartlari hesap={bakiyeSonucu?.veri?.firma_ortak} baslik="Firma Token Cüzdanı" kullanim="Firma ortak kullanımı" />
   </div>
   <SatinAlimTablosu key={`${bakiyeHesabi}:firma`} hesap="firma_ortak" baslik="Firma Satın Alımları" />
  </div>
  {bakiyeHesabi && (!bakiyeSonucu ? <p role="status">Token bakiyeleri yükleniyor…</p>
   : bakiyeSonucu.hata ? <p role="alert">{bakiyeSonucu.hata} <SadeKontrolButonu onClick={bakiyeYenile}>Tekrar dene</SadeKontrolButonu></p>
   : null)}
 </main>;
}
