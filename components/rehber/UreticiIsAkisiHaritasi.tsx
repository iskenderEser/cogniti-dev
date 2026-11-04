"use client";

import { Map } from "lucide-react";
import { ureticiOlusturmaHaritasi, ureticiYayinaAcmaHaritasi } from "@/lib/rehber/ureticiHaritasi";
import TemsilciIsAkisiKarti from "./TemsilciIsAkisiKarti";
import styles from "./temsilci-is-akisi.module.css";

export default function UreticiIsAkisiHaritasi({ rol, yayinaAcma = false }: { rol: string; yayinaAcma?: boolean }) {
  const harita = yayinaAcma ? ureticiYayinaAcmaHaritasi(rol) : ureticiOlusturmaHaritasi(rol);
  if (!harita) return null;
  return <TemsilciIsAkisiKarti key={harita} harita={harita} tetikleyici={
    <button type="button" className={styles.haritaButonu} aria-label="Harita" data-ipucu="Harita">
      <Map size={14.45} strokeWidth={1} absoluteStrokeWidth aria-hidden="true" />
    </button>
  } />;
}
