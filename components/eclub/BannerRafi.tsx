"use client";

import { useEffect, useState } from "react";
import type { EclubBanner } from "@/lib/eclub/banner";
import styles from "./eclub-kisi-banner.module.css";

const KAYMA_SURESI_MS = 5000;

export function BannerRafi({ bannerlar, anaSayfa = false, etiket = "E-Club banner alanı" }: { bannerlar: EclubBanner[]; anaSayfa?: boolean; etiket?: string }) {
  const adet = bannerlar.length;
  const [aktif, setAktif] = useState(0);
  const [duraklat, setDuraklat] = useState(false);

  useEffect(() => {
    const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");
    let zamanlayici: ReturnType<typeof setInterval> | undefined;
    const baslat = () => {
      clearInterval(zamanlayici);
      if (adet < 2 || duraklat || document.visibilityState !== "visible" || azHareket.matches) return;
      zamanlayici = setInterval(() => setAktif((onceki) => (onceki + 1) % adet), KAYMA_SURESI_MS);
    };
    baslat();
    document.addEventListener("visibilitychange", baslat);
    azHareket.addEventListener("change", baslat);
    return () => {
      clearInterval(zamanlayici);
      document.removeEventListener("visibilitychange", baslat);
      azHareket.removeEventListener("change", baslat);
    };
  }, [adet, duraklat, aktif]);

  return <section className={styles.raf} aria-label={etiket} aria-roledescription="Görsel galerisi"
    onMouseEnter={() => setDuraklat(true)} onMouseLeave={(event) => setDuraklat(event.currentTarget.contains(document.activeElement))}
    onFocusCapture={() => setDuraklat(true)} onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setDuraklat(event.currentTarget.matches(":hover"));
    }}>
    <div className={styles.banner}>
      <div className={styles.serit} style={{ transform: `translateX(-${aktif * 100}%)` }}>
        {bannerlar.map((banner, index) => <div key={`${index}-${banner.sira}`} className={styles.gorsel}
          role="group" aria-roledescription="Banner" aria-label={`${index + 1} / ${adet}`} aria-hidden={aktif !== index}>
          {/* eslint-disable-next-line @next/next/no-img-element -- İstemcide optimize edilen firma bannerı. */}
          <img src={banner.url} alt={`${index + 1}. firma bannerı`}
            fetchPriority={anaSayfa ? (index === 0 ? "high" : "low") : undefined} />
        </div>)}
      </div>
    </div>
    {adet > 1 && <div className={styles.cizgiler} role="group" aria-label="Banner seçimi">
      {Array.from({ length: adet }, (_, index) => <button key={index} type="button"
        className={`${styles.secim} ${aktif === index ? styles.aktif : ""}`}
        aria-label={`${index + 1}. bannerı göster`} aria-pressed={aktif === index} onClick={() => setAktif(index)}>
        <span aria-hidden="true" />
      </button>)}
    </div>}
  </section>;
}

