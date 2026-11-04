"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { Map, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import styles from "./temsilci-is-akisi.module.css";

const HARITALAR = {
  ureticiYayinFull: {
    baslik: "Yayına Açma Yol Haritası", gorsel: "/rehber/uretici/yayina-acma-full.svg",
    aciklama: "Yayın ayarlarını tamamlayın ve yayına açın.", genislik: 1800, yukseklik: 1620,
    alt: "Üretici rolüne uygun yayın ayarları ve yayına açma akışı",
  },
  ureticiYayinEgitim: {
    baslik: "Yayına Açma Yol Haritası", gorsel: "/rehber/uretici/yayina-acma-egitim.svg",
    aciklama: "Yayın ayarlarını tamamlayın ve yayına açın.", genislik: 1800, yukseklik: 1620,
    alt: "Üretici rolüne uygun yayın ayarları ve yayına açma akışı",
  },
  ureticiYayinIk: {
    baslik: "Yayına Açma Yol Haritası", gorsel: "/rehber/uretici/yayina-acma-ik.svg",
    aciklama: "Yayın ayarlarını tamamlayın ve yayına açın.", genislik: 1800, yukseklik: 1620,
    alt: "Üretici rolüne uygun yayın ayarları ve yayına açma akışı",
  },

  ureticiPm: {
    baslik: "Yayın Oluşturma Yol Haritası",
    gorsel: "/rehber/uretici/yayin-olusturma-pm.svg",
    aciklama: "Yayın konusunu ve üretim yöntemini belirleyin, içeriğinizi yayına hazır hâle getirin.",
    genislik: 1800,
    yukseklik: 1590,
    alt: "Üretici rolüne uygun konu seçimi, yayın oluşturma, inceleme ve onay akışı",
  },
  ureticiMedikal: {
    baslik: "Yayın Oluşturma Yol Haritası",
    gorsel: "/rehber/uretici/yayin-olusturma-medikal.svg",
    aciklama: "Yayın konusunu ve üretim yöntemini belirleyin, içeriğinizi yayına hazır hâle getirin.",
    genislik: 1800,
    yukseklik: 1590,
    alt: "Üretici rolüne uygun konu seçimi, yayın oluşturma, inceleme ve onay akışı",
  },
  ureticiEgitim: {
    baslik: "Yayın Oluşturma Yol Haritası",
    gorsel: "/rehber/uretici/yayin-olusturma-egitim.svg",
    aciklama: "Yayın konusunu ve üretim yöntemini belirleyin, içeriğinizi yayına hazır hâle getirin.",
    genislik: 1800,
    yukseklik: 1590,
    alt: "Üretici rolüne uygun konu seçimi, yayın oluşturma, inceleme ve onay akışı",
  },
  ureticiIk: {
    baslik: "Yayın Oluşturma Yol Haritası",
    gorsel: "/rehber/uretici/yayin-olusturma-ik.svg",
    aciklama: "Yayın konusunu ve üretim yöntemini belirleyin, içeriğinizi yayına hazır hâle getirin.",
    genislik: 1800,
    yukseklik: 1590,
    alt: "Üretici rolüne uygun konu seçimi, yayın oluşturma, inceleme ve onay akışı",
  },
  tmMutabakat: {
    baslik: "Eczanem İndirim Mutabakatı Yol Haritası",
    gorsel: "/rehber/tm/eczanem-mutabakat-son-karar.svg",
    aciklama: "Mutabakatları inceleyin, onay, bekletme veya ret kararınızı verin ve sonucu takip edin.",
    genislik: 1536,
    yukseklik: 1250,
    alt: "Tanıtım Müdürünün Eczanem mutabakatlarını inceleme, nihai onay, bekletme veya ret kararı verme akışı",
  },
  tmCekOnay: {
    baslik: "E-Club Çek Taleplerini İnceleme ve Onaylama Yol Haritası",
    gorsel: "/rehber/tm/eclub-cek-son-onay.svg",
    aciklama: "Çek taleplerini inceleyin, son onayınızı verin ve teslimatı takip edin.",
    genislik: 1536,
    yukseklik: 1570,
    alt: "Tanıtım Müdürünün E-Club çek taleplerine ulaşma, inceleme, son onay ve teslimat takibi akışı",
  },
  bmMutabakat: {
    baslik: "Eczanem İndirim Mutabakatı Yol Haritası",
    gorsel: "/rehber/bm/eczanem-indirim-mutabakati.svg",
    aciklama: "İndirim mutabakatlarını inceleyin, kararınızı verin ve TM onayına iletin.",
    genislik: 1536,
    yukseklik: 1560,
    alt: "Bölge Müdürünün Eczanem mutabakatını inceleme, onaylama, bekletme veya reddetme ve TM onayına iletme akışı",
  },
  bmCekOnay: {
    baslik: "E-Club Çek Taleplerini İnceleme ve Onaylama Yol Haritası",
    gorsel: "/rehber/bm/eclub-cek-talebi-onaylama.svg",
    aciklama: "Hediye Takip alanına ulaş, çek taleplerini incele ve TM onayına ilet.",
    genislik: 1536,
    yukseklik: 1680,
    alt: "Bölge Müdürünün E-Club Takımım üzerinden çek takibine ulaşma, talebi inceleme ve TM onayına iletme akışı",
  },
  bmChallengeGonder: {
    baslik: "Challenge Gönderme ve Takip Etme Yol Haritası",
    gorsel: "/rehber/bm/challenge-gonderme-takip.svg",
    aciklama: "Challenge gönder, gönderimlerini ve kazanımlarını takip et.",
    genislik: 1536,
    yukseklik: 1490,
    alt: "Bölge Müdürünün challenge gönderme, uygunluk ve puan takibi akışı",
  },
  bmChallengeTamamla: {
    baslik: "Gelen Challenge Tamamlama Yol Haritası",
    gorsel: "/rehber/bm/gelen-challenge-tamamlama.svg",
    aciklama: "Gelen challenge yayınlarını tamamla, soruları cevapla ve puan kazan.",
    genislik: 1536,
    yukseklik: 1440,
    alt: "Bölge Müdürünün gelen challenge tamamlama ve soru cevaplama akışı",
  },
  bmGenel: {
    baslik: "Genel Yayın Tamamlama Yol Haritası",
    gorsel: "/rehber/bm/genel-yayin-tamamlama.svg?v=2",
    aciklama: "Yayınları tamamla, soruları cevapla ve puan kazan.",
    genislik: 1536,
    yukseklik: 1520,
    alt: "Bölge Müdürünün C-Club yayınlarını tamamlama, soru cevaplama ve puan kazanma yol haritası",
  },
  bmExtra: {
    baslik: "Extra Yayın Tamamlama Yol Haritası",
    gorsel: "/rehber/bm/extra-yayin-tamamlama.svg?v=2",
    aciklama: "Tamamladığın yayınları yeniden izle, Extra puan kazan.",
    genislik: 1536,
    yukseklik: 1480,
    alt: "Bölge Müdürünün yayın tekrarı, ileri sarma ve Extra puan kazanma yol haritası",
  },
  bmOneri: {
    baslik: "Temsilciye Yayın Önerme ve Takip Etme Yol Haritası",
    gorsel: "/rehber/bm/temsilciye-yayin-onerme.svg",
    aciklama: "Temsilciyi ve yayınları seç, önerilerini gönder ve tamamlanma durumlarını takip et.",
    genislik: 1536,
    yukseklik: 1120,
    alt: "Bölge Müdürünün temsilci ve yayın seçimi, öneri tarihleri, gönderim uygunluğu ve öneri takibi yol haritası",
  },
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
  const mobilGorseller: Record<keyof typeof HARITALAR, string> = {
    ureticiYayinFull: "/rehber/uretici/yayina-acma-full-mobil.webp",
    ureticiYayinEgitim: "/rehber/uretici/yayina-acma-egitim-mobil.webp",
    ureticiYayinIk: "/rehber/uretici/yayina-acma-ik-mobil.webp",

    ureticiPm: "/rehber/uretici/yayin-olusturma-pm-mobil.webp",
    ureticiMedikal: "/rehber/uretici/yayin-olusturma-medikal-mobil.webp",
    ureticiEgitim: "/rehber/uretici/yayin-olusturma-egitim-mobil.webp",
    ureticiIk: "/rehber/uretici/yayin-olusturma-ik-mobil.webp",
    tmMutabakat: "/rehber/tm/eczanem-mutabakat-son-karar-mobil.webp",
    tmCekOnay: "/rehber/tm/eclub-cek-son-onay-mobil.webp",
    bmMutabakat: "/rehber/bm/eczanem-indirim-mutabakati-mobil.webp",
    bmCekOnay: "/rehber/bm/eclub-cek-talebi-onaylama-mobil.webp",
    bmChallengeGonder: "/rehber/bm/challenge-gonderme-takip-mobil.webp",
    bmChallengeTamamla: "/rehber/bm/gelen-challenge-tamamlama-mobil.webp",
    bmGenel: "/rehber/bm/genel-yayin-tamamlama-mobil.webp",
    bmExtra: "/rehber/bm/extra-yayin-tamamlama-mobil.webp",
    bmOneri: "/rehber/bm/temsilciye-yayin-onerme-mobil.webp",
    genel: "/rehber/temsilci/merkez-yayinlari-mobil.webp",
    extra: "/rehber/temsilci/extra-yayin-tamamlama-mobil.webp",
    oneri: "/rehber/temsilci/onerilen-yayinlar-mobil.webp",
    eclubTakim: "/rehber/temsilci/eclub-takim-yayin-gonderme-mobil.webp",
    eclubPuan: "/rehber/temsilci/eclub-puan-kazanma-mobil.webp",
    eczanemGonderim: "/rehber/temsilci/eczanem-yayin-gonderme-mobil.webp",
    eczanemMutabakat: "/rehber/temsilci/eczanem-indirim-mutabakati-mobil.webp",
  };
  const mobilGorsel = mobilGorseller[harita];
  const mobilYukseklik = harita === "ureticiYayinEgitim" ? 1286 : harita === "ureticiYayinIk" ? 1032 : harita === "ureticiYayinFull" ? 1536 : harita.startsWith("uretici") ? 1940 : 1536;

  return <Dialog.Root onOpenChange={() => setBuyuk(false)}>
    {tetikleyici ? <Dialog.Trigger asChild>{tetikleyici}</Dialog.Trigger> : <section className={`${styles.kart} ${kompakt ? styles.kompakt : ""}`} aria-label={baslik}>
      <Dialog.Trigger asChild>
        <button type="button" className={styles.onizleme} aria-label={`${baslik} iş akışını aç`}>
          <picture>
            {mobilGorsel && <source media="(max-width: 600px)" srcSet={mobilGorsel} width={1024} height={mobilYukseklik} />}
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
          {(tetikleyici || harita.startsWith("bm") || harita.startsWith("tm") || harita.startsWith("uretici")) && <Dialog.Close asChild><Link href={harita.startsWith("uretici") ? "/rehber/uretici" : harita.startsWith("tm") ? "/rehber/tm" : harita.startsWith("bm") ? "/rehber/bm" : "/rehber/temsilci"} className={styles.tumAkislar} aria-label="Tüm Haritalar"><Map size={18} aria-hidden="true" /><span>Tüm Haritalar</span></Link></Dialog.Close>}
          <button type="button" aria-label={buyuk ? "Görseli küçült" : "Görseli büyüt"} title={buyuk ? "Küçült" : "Büyüt"} aria-pressed={buyuk} onClick={() => setBuyuk(!buyuk)}>
            {buyuk ? <ZoomOut size={18} aria-hidden="true" /> : <ZoomIn size={18} aria-hidden="true" />}
          </button>
        </div>
        <div className={styles.gorselAlani} tabIndex={0} role="region" aria-label="İş akışı şeması; büyütüldüğünde kaydırılabilir">
          <div className={`${styles.gorselTuvali} ${mobilGorsel ? styles.mobilHarita : ""} ${buyuk ? styles.buyuk : ""}`}>
            <picture>
            {mobilGorsel && <source media="(max-width: 600px)" srcSet={mobilGorsel} width={1024} height={mobilYukseklik} />}
            <Image src={gorsel} alt={alt} width={genislik} height={yukseklik} unoptimized draggable={false} />
          </picture>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
