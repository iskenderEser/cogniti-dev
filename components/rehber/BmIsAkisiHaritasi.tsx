"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, X } from "lucide-react";
import { Dialog } from "radix-ui";
import TemsilciIsAkisiKarti from "./TemsilciIsAkisiKarti";
import styles from "./temsilci-is-akisi.module.css";

export default function BmIsAkisiHaritasi() {
  const pathname = usePathname();
  const challengeSayfasi = pathname === "/challenge-club" || pathname.startsWith("/challenge-club/");
  const dugme = <button type="button" className={styles.haritaButonu} aria-label="Harita" data-ipucu="Harita">
    <Map size={14.45} strokeWidth={1} absoluteStrokeWidth aria-hidden="true" />
  </button>;

  if (pathname === "/eczanem/bm/mutabakat-takip") return <TemsilciIsAkisiKarti key={pathname} harita="bmMutabakat" tetikleyici={dugme} />;

  if (pathname === "/eclub/eczaneler-takimim") return <TemsilciIsAkisiKarti key={pathname} harita="bmCekOnay" tetikleyici={dugme} />;

  if (pathname !== "/ana-sayfa" && !challengeSayfasi) return <TemsilciIsAkisiKarti key={pathname} harita="bmOneri" tetikleyici={dugme} />;

  return <Dialog.Root key={pathname}>
    <Dialog.Trigger asChild>{dugme}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.perde} />
      <Dialog.Content className={styles.pencere} aria-describedby={undefined}>
        <header className={styles.pencereBasligi}>
          <Dialog.Title>{challengeSayfasi ? "Challenge Yol Haritaları" : "Yayın Tamamlama Yol Haritaları"}</Dialog.Title>
          <Dialog.Close asChild><button type="button" className={styles.simgeButon} aria-label="Haritaları kapat"><X size={22} aria-hidden="true" /></button></Dialog.Close>
        </header>
        <div className={styles.araclar}>
          <Dialog.Close asChild><Link href="/rehber/bm" className={styles.tumAkislar}><Map size={18} aria-hidden="true" /><span>Tüm Haritalar</span></Link></Dialog.Close>
        </div>
        <div className={styles.haritaSecimi}>
          <TemsilciIsAkisiKarti harita={challengeSayfasi ? "bmChallengeGonder" : "bmGenel"} />
          <TemsilciIsAkisiKarti harita={challengeSayfasi ? "bmChallengeTamamla" : "bmExtra"} />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
