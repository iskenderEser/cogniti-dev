"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Map, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import styles from "./temsilci-is-akisi.module.css";

const HARITALAR = {
  eczanemGonderim: {
    baslik: "Eczanem Yayın Gönderme Yol Haritası",
    gorsel: "/rehber/temsilci/eczanem-yayin-gonderme.svg",
    aciklama: "Yayınları incele, eczanelere gönder ve gönderimlerini takip et.",
    genislik: 1400,
    yukseklik: 1340,
    alt: "Eczanem yayınlarını inceleme, eczane seçimi, gönderim uygunluğu ve gönderim takibi yol haritası",
  },
  eczanemMutabakat: {
    baslik: "Eczanem İndirim Mutabakatı Yol Haritası",
    gorsel: "/rehber/temsilci/eczanem-indirim-mutabakati.svg",
    aciklama: "İndirimleri incele, mutabakat kararını ver ve onay sürecini takip et.",
    genislik: 1400,
    yukseklik: 1340,
    alt: "Eczanem indirimlerini inceleme, bekletme, onaylama veya reddetme ve BM onayına gönderme yol haritası",
  },
  eclubTakim: {
    baslik: "E-Club Takımı ve Yayın Gönderme Yol Haritası",
    gorsel: "/rehber/temsilci/eclub-takim-yayin-gonderme.svg",
    aciklama: "Takımını kur, yayınları incele ve üyelerine gönder.",
    genislik: 1400,
    yukseklik: 1710,
    alt: "E-Club takımını kurma, yayın gönderimi uygunluğu, anlık ve planlı gönderim yol haritası",
  },
  eclubPuan: {
    baslik: "E-Club Puan Kazanma Yol Haritası",
    gorsel: "/rehber/temsilci/eclub-puan-kazanma.svg",
    aciklama: "Üyelerinin yayınları tamamlamasıyla puan kazan, takımının performansını takip et.",
    genislik: 1400,
    yukseklik: 1710,
    alt: "E-Club üyelerinin yayın tamamlamasıyla temsilcinin ve üyenin puan kazanma yol haritası",
  },
  extra: {
    baslik: "Extra Yayın Tamamlama Yol Haritası",
    gorsel: "/rehber/temsilci/extra-yayin-tamamlama.svg",
    aciklama: "Tamamladığın yayınları yeniden izle, Extra puan kazan.",
    genislik: 1536,
    yukseklik: 1460,
    alt: "Tamamlanmış yayınları yeniden izleyerek Extra puan kazanma, tam tekrar sayısı ve ileri sarma iş akışı",
  },
  genel: {
    baslik: "Genel Yayın Tamamlama Yol Haritası",
    gorsel: "/rehber/temsilci/merkez-yayinlari.svg?v=cogniti-2",
    aciklama: "Merkezden gelen yayınları tamamla, soruları cevapla ve puan kazan.",
    genislik: 1536,
    yukseklik: 1120,
    alt: "Merkez yayınlarını tamamlama, soru hakkı ve puan kazanma veya kaybetme iş akışı",
  },
  oneri: {
    baslik: "Önerilen Yayınları Tamamlama Yol Haritası",
    gorsel: "/rehber/temsilci/onerilen-yayinlar.svg",
    aciklama: "Bölge Müdürünün önerdiği yayınları zamanında tamamla ve öneri puanı kazan.",
    genislik: 1536,
    yukseklik: 1380,
    alt: "Bölge Müdürü önerilerinde tarih aralığı, tamamlama ve öneri puanı, soru hakkı ve puan kaybı iş akışı",
  },
};

export default function TemsilciIsAkisiKarti({ kompakt = false, tetikleyici, harita = "genel" }: { kompakt?: boolean; tetikleyici?: ReactNode; harita?: keyof typeof HARITALAR }) {
  const { baslik, gorsel, aciklama, genislik, yukseklik, alt } = HARITALAR[harita];
  const [buyuk, setBuyuk] = useState(false);
  const mobilGorsel = harita === "genel"
    ? "/rehber/temsilci/merkez-yayinlari-mobil.webp"
    : harita === "extra"
      ? "/rehber/temsilci/extra-yayin-tamamlama-mobil.webp"
      : undefined;

  return <Dialog.Root onOpenChange={() => setBuyuk(false)}>
    {tetikleyici ? <Dialog.Trigger asChild>{tetikleyici}</Dialog.Trigger> : <section className={`${styles.kart} ${kompakt ? styles.kompakt : ""}`} aria-label={baslik}>
      <Dialog.Trigger asChild>
        <button type="button" className={styles.onizleme} aria-label={`${baslik} iş akışını aç`}>
          <picture>
            {mobilGorsel && <source media="(max-width: 600px)" srcSet={mobilGorsel} width={1024} height={1536} />}
            <Image src={gorsel} alt={alt} width={genislik} height={yukseklik} unoptimized />
          </picture>
          <span className={styles.buyutIsareti}><Maximize2 size={16} aria-hidden="true" /></span>
        </button>
      </Dialog.Trigger>
      <div className={styles.kartMetni}>
        <h2>{baslik}</h2>
        <p>{aciklama}</p>
      </div>
    </section>}
    <Dialog.Portal>
      <Dialog.Overlay className={styles.perde} />
      <Dialog.Content className={styles.pencere} aria-describedby={undefined}>
        <header className={styles.pencereBasligi}>
          <Dialog.Title>{baslik}</Dialog.Title>
          <Dialog.Close asChild><button type="button" className={styles.simgeButon} aria-label="İş akışını kapat"><X size={22} aria-hidden="true" /></button></Dialog.Close>
        </header>
        <div className={styles.araclar} aria-label="Görsel boyutu">
          {tetikleyici && <Dialog.Close asChild><Link href="/rehber/temsilci" className={styles.tumAkislar} aria-label="Tüm Haritalar"><Map size={18} aria-hidden="true" /><span>Tüm Haritalar</span></Link></Dialog.Close>}
          <button type="button" aria-label={buyuk ? "Görseli küçült" : "Görseli büyüt"} title={buyuk ? "Küçült" : "Büyüt"} aria-pressed={buyuk} onClick={() => setBuyuk(!buyuk)}>
            {buyuk ? <ZoomOut size={18} aria-hidden="true" /> : <ZoomIn size={18} aria-hidden="true" />}
          </button>
        </div>
        <div className={styles.gorselAlani} tabIndex={0} role="region" aria-label="İş akışı şeması; büyütüldüğünde kaydırılabilir">
          <div className={`${styles.gorselTuvali} ${mobilGorsel ? styles.mobilHarita : ""} ${buyuk ? styles.buyuk : ""}`}>
            <picture>
            {mobilGorsel && <source media="(max-width: 600px)" srcSet={mobilGorsel} width={1024} height={1536} />}
            <Image src={gorsel} alt={alt} width={genislik} height={yukseklik} unoptimized draggable={false} />
          </picture>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
