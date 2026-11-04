"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, X } from "lucide-react";
import { Dialog } from "radix-ui";
import TemsilciIsAkisiKarti from "./TemsilciIsAkisiKarti";
import styles from "./temsilci-is-akisi.module.css";

export default function BmIsAkisiHaritasi() {
  const pathname = usePathname();
  const dugme = <button type="button" className={styles.haritaButonu} aria-label="Harita" data-ipucu="Harita">
    <Map size={14.45} strokeWidth={1} absoluteStrokeWidth aria-hidden="true" />
  </button>;

  if (pathname !== "/ana-sayfa") return <TemsilciIsAkisiKarti key={pathname} harita="bmOneri" tetikleyici={dugme} />;

  return <Dialog.Root key={pathname}>
    <Dialog.Trigger asChild>{dugme}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.perde} />
      <Dialog.Content className={styles.pencere} aria-describedby={undefined}>
        <header className={styles.pencereBasligi}>
          <Dialog.Title>Yayın Tamamlama Yol Haritaları</Dialog.Title>
          <Dialog.Close asChild><button type="button" className={styles.simgeButon} aria-label="Haritaları kapat"><X size={22} aria-hidden="true" /></button></Dialog.Close>
        </header>
        <div className={styles.araclar}>
          <Dialog.Close asChild><Link href="/rehber/bm" className={styles.tumAkislar}><Map size={18} aria-hidden="true" /><span>Tüm Haritalar</span></Link></Dialog.Close>
        </div>
        <div className={styles.haritaSecimi}>
          <TemsilciIsAkisiKarti harita="bmGenel" />
          <TemsilciIsAkisiKarti harita="bmExtra" />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
