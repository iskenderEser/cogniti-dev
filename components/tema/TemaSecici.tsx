"use client";

import type { Tema } from "@/lib/tema/temalar";
import styles from "./tema-secici.module.css";

const KENAR = "M0 1H10C16 1 18 4 21 14L24 23C27 31 31 35 38 35H82C89 35 93 31 96 23L99 14C102 4 104 1 110 1H120";

export default function TemaSecici({
  tema,
  onTemaDegistir,
  yerlesim = "navbar",
}: {
  tema: Tema;
  yerlesim?: "navbar" | "satir";
  onTemaDegistir: (tema: Tema) => void;
}) {
  const sonrakiTema: Tema = tema === "mavi" ? "yesil" : "mavi";

  return (
    <div className={yerlesim === "satir" ? styles.satir : styles.dil}>
      {yerlesim === "satir" && <span className={styles.baslik}>Görünüm değişimi</span>}
      {yerlesim === "navbar" && <svg className={styles.yuzey} viewBox="0 0 120 37" preserveAspectRatio="none" aria-hidden="true">
        <path d={`${KENAR}V-2H0Z`} className={styles.dolgu} />
      </svg>}
      <div className={styles.secici}>
        <button
          type="button"
          role="switch"
          aria-label="Renk görünümünü değiştir"
          aria-checked={tema === "mavi"}
          className={styles[tema]}
          onClick={() => onTemaDegistir(sonrakiTema)}
        >
          <span className={styles.anahtar} aria-hidden="true"><span className={styles.topuz} /></span>
        </button>
      </div>
    </div>
  );
}
