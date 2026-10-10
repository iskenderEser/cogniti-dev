"use client";

import { useSyncExternalStore } from "react";
import styles from "./tarih-pill.module.css";

const bicim = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric",
});
const bugun = () => bicim.format(new Date());
const sunucuTarihi = () => "";

function aboneOl(guncelle: () => void) {
  const zamanlayici = window.setInterval(guncelle, 60_000);
  window.addEventListener("focus", guncelle);
  document.addEventListener("visibilitychange", guncelle);
  return () => {
    window.clearInterval(zamanlayici);
    window.removeEventListener("focus", guncelle);
    document.removeEventListener("visibilitychange", guncelle);
  };
}

/** Bluebook §13.8: ana sayfalarda ortak güncel tarih gösterimi. */
export function TarihPill() {
  const tarih = useSyncExternalStore(aboneOl, bugun, sunucuTarihi);
  return <time className={styles.pill} dateTime={tarih ? tarih.split(".").reverse().join("-") : undefined} aria-label={tarih ? `Bugünün tarihi: ${tarih}` : "Bugünün tarihi"}>{tarih}</time>;
}
