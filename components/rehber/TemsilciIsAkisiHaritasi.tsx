"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, X } from "lucide-react";
import { Dialog } from "radix-ui";
import TemsilciIsAkisiKarti from "./TemsilciIsAkisiKarti";
import styles from "./temsilci-is-akisi.module.css";

export default function TemsilciIsAkisiHaritasi() {
  const pathname = usePathname();
  const oneriSayfasi = pathname === "/oneriler" || pathname.startsWith("/oneriler/");
  const eclubSayfasi = pathname === "/eclub" || pathname.startsWith("/eclub/") || pathname === "/e-club-ligi";
  const eczanemSayfasi = pathname === "/eczanem" || pathname.startsWith("/eczanem/");
  const ilgiliAkis = oneriSayfasi || eclubSayfasi || eczanemSayfasi || pathname === "/ana-sayfa" || pathname.startsWith("/egitim-yayinlari/");
  const simge = <Map size={14.45} strokeWidth={1} absoluteStrokeWidth aria-hidden="true" />;

  const dugme = <button type="button" className={styles.haritaButonu} aria-label="Harita" data-ipucu="Harita">{simge}</button>;

  if (oneriSayfasi) return <TemsilciIsAkisiKarti key={pathname} harita="oneri" tetikleyici={dugme} />;
  if (!ilgiliAkis) return <Link href="/rehber/temsilci" className={styles.haritaButonu} aria-label="Harita" data-ipucu="Harita">{simge}</Link>;

  return <Dialog.Root key={pathname}>
    <Dialog.Trigger asChild>{dugme}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.perde} />
      <Dialog.Content className={styles.pencere} aria-describedby={undefined}>
        <header className={styles.pencereBasligi}>
          <Dialog.Title>{eczanemSayfasi ? "Eczanem Yol Haritaları" : eclubSayfasi ? "E-Club Yol Haritaları" : "Yayın Tamamlama Yol Haritaları"}</Dialog.Title>
          <Dialog.Close asChild><button type="button" className={styles.simgeButon} aria-label="Haritaları kapat"><X size={22} aria-hidden="true" /></button></Dialog.Close>
        </header>
        <div className={styles.araclar}>
          <Dialog.Close asChild><Link href="/rehber/temsilci" className={styles.tumAkislar}><Map size={18} aria-hidden="true" /><span>Tüm Haritalar</span></Link></Dialog.Close>
        </div>
        <div className={styles.haritaSecimi}>
          <TemsilciIsAkisiKarti harita={eczanemSayfasi ? "eczanemGonderim" : eclubSayfasi ? "eclubTakim" : "genel"} />
          <TemsilciIsAkisiKarti harita={eczanemSayfasi ? "eczanemMutabakat" : eclubSayfasi ? "eclubPuan" : "extra"} />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
