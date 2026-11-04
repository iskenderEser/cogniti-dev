"use client";

import { Map } from "lucide-react";
import { usePathname } from "next/navigation";
import TemsilciIsAkisiKarti from "./TemsilciIsAkisiKarti";
import styles from "./temsilci-is-akisi.module.css";

export default function TmIsAkisiHaritasi() {
  const pathname = usePathname();
  return <TemsilciIsAkisiKarti key={pathname} harita={pathname === "/eczanem/tm/mutabakat-takip" ? "tmMutabakat" : "tmCekOnay"} tetikleyici={
    <button type="button" className={styles.haritaButonu} aria-label="Harita" data-ipucu="Harita">
      <Map size={14.45} strokeWidth={1} absoluteStrokeWidth aria-hidden="true" />
    </button>
  } />;
}
