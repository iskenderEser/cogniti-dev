"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import type { EclubBanner } from "@/lib/eclub/banner";
import styles from "./eclub-kisi-banner.module.css";

const KAYMA_SURESI_MS = 5000;

function BannerRafi({ bannerlar }: { bannerlar: EclubBanner[] }) {
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

  return <section className={styles.raf} aria-label="E-Club banner alanı" aria-roledescription="Görsel galerisi"
    onMouseEnter={() => setDuraklat(true)} onMouseLeave={(event) => setDuraklat(event.currentTarget.contains(document.activeElement))}
    onFocusCapture={() => setDuraklat(true)} onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setDuraklat(event.currentTarget.matches(":hover"));
    }}>
    <div className={styles.banner}>
      <div className={styles.serit} style={{ transform: `translateX(-${aktif * 100}%)` }}>
        {bannerlar.map((banner, index) => <div key={banner.sira} className={styles.gorsel}
          role="group" aria-roledescription="Banner" aria-label={`${index + 1} / ${adet}`} aria-hidden={aktif !== index}>
          {/* eslint-disable-next-line @next/next/no-img-element -- İstemcide optimize edilen firma bannerı. */}
          <img src={banner.url} alt={`${index + 1}. firma bannerı`} />
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

function FirmaBannerlari({ firmaId }: { firmaId: string | null }) {
  const [bannerlar, setBannerlar] = useState<EclubBanner[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/eclub/api/bannerlar${firmaId ? `?firma_id=${encodeURIComponent(firmaId)}` : ""}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const veri = await res.json();
        if (!res.ok) throw new Error(veri.hata ?? veri.error ?? "Firma bannerları okunamadı.");
        if (!controller.signal.aborted) setBannerlar(veri.bannerlar);
      }).catch((error) => {
        if (!controller.signal.aborted) console.error("E-Club firma bannerları:", error);
      });
    return () => controller.abort();
  }, [firmaId]);
  if (!bannerlar.length) return null;
  return <BannerRafi key={bannerlar.map((b) => b.url).join("|")} bannerlar={bannerlar} />;
}

/** Ana sayfa Hapbilgi'nin, firma sayfası yalnız ilgili firmanın yayınlanmış görsellerini okur. */
export default function EclubKisiBanner() {
  const { firma_id: firmaId } = useParams<{ firma_id?: string }>();
  const yol = usePathname();
  if (firmaId) return <FirmaBannerlari key={firmaId} firmaId={firmaId} />;
  return yol === "/eclub/ana-sayfa" || yol === "/eclub/panel" ? <FirmaBannerlari key="ana-sayfa" firmaId={null} /> : null;
}
