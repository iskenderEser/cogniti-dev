"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { satinAlmaBakiyeOzetiGecerli, type BakiyeOzeti, type SatinAlmaBakiyeOzeti } from "@/lib/satinAlma/bakiyeOzeti";
import styles from "./token-bakiye-ozeti.module.css";

/** Satın alma/gönderim tamamlandığında bu olay ile özet yeniden okunabilir. */
export const TOKEN_BAKIYE_YENILE_OLAYI = "cogniti-token-bakiye-yenile";
const num = (n: number) => n.toLocaleString("tr-TR");
function Ozet({ baslik, veri }: { baslik: string; veri: BakiyeOzeti }) {
  return <div className={styles.ozet} aria-label={baslik}>
    <span className={styles.baslik}>{baslik}<span className={styles.paket}> · {veri.paket === "kko" ? "KKÖ" : veri.paket === "abonelik" ? "Abonelik" : veri.paket === "esnek" ? "Esnek Paket" : "Henüz satın alım yok"}</span></span>
    <div className={styles.degerler}>
      <span>Toplam <span className={styles.rakam}>{num(veri.toplam)}</span></span>
      <span>Kullanılan <span className={styles.rakam}>{num(veri.kullanilan)}</span></span>
      <span>Kalan <span className={styles.rakam}>{num(veri.kalan)}</span></span>
      {veri.ayrilan > 0 && <span>Blokeli / Ayrılan <span className={styles.rakam}>{num(veri.ayrilan)}</span></span>}
      {veri.suresi_dolan > 0 && <span>Süresi dolan <span className={styles.rakam}>{num(veri.suresi_dolan)}</span></span>}
    </div>
  </div>;
}
export default function TokenBakiyeOzeti({ yalnizKko = false }: { yalnizKko?: boolean } = {}) {
  const pathname = usePathname();
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri?: SatinAlmaBakiyeOzeti; hata?: string } | null>(null);
  const sonYenileme = useRef(0);
  const anahtar = `${pathname}:${yenileme}`;
  const guncel = sonuc?.anahtar === anahtar ? sonuc : null;
  useEffect(() => {
    const controller = new AbortController();
    sonYenileme.current = Date.now();
    async function oku() {
      try {
        const response = await fetch("/api/token-bakiyeleri", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Bakiye okunamadı");
        const veri: unknown = await response.json();
        if (!satinAlmaBakiyeOzetiGecerli(veri)) throw new Error("Geçersiz bakiye");
        if (!controller.signal.aborted) setSonuc({ anahtar, veri });
      } catch {
        if (!controller.signal.aborted) setSonuc({ anahtar, hata: "Token bakiyeleri alınamadı." });
      }
    }
    void oku();
    return () => controller.abort();
  }, [anahtar]);
  useEffect(() => {
    const yenile = () => setYenileme(n => n + 1);
    const geriDondu = () => {
      if (document.visibilityState === "visible" && Date.now() - sonYenileme.current >= 5000) yenile();
    };
    window.addEventListener(TOKEN_BAKIYE_YENILE_OLAYI, yenile);
    window.addEventListener("focus", geriDondu);
    document.addEventListener("visibilitychange", geriDondu);
    return () => {
      window.removeEventListener(TOKEN_BAKIYE_YENILE_OLAYI, yenile);
      window.removeEventListener("focus", geriDondu);
      document.removeEventListener("visibilitychange", geriDondu);
    };
  }, []);
  if (yalnizKko && guncel?.veri && guncel.veri.kisisel?.paket !== "kko" && guncel.veri.firma_ortak.paket !== "kko") return null;
  return <div className={styles.alan} aria-label={yalnizKko ? "KKÖ Kullanımı · Cari Ay" : "Token bakiyeleri"} aria-busy={!guncel}>
    {!guncel ? <span className={styles.durum} role="status">Token bakiyeleri yükleniyor…</span> : guncel.hata ? <span className={styles.durum} role="alert">{guncel.hata} <button type="button" className={styles.yenile} onClick={() => setYenileme(n => n + 1)}>Tekrar dene</button></span> : guncel.veri && <>
      {guncel.veri.kisisel && guncel.veri.kisisel.toplam > 0 && (!yalnizKko || guncel.veri.kisisel.paket === "kko") && <Ozet baslik="Kişisel Token Hesabı" veri={guncel.veri.kisisel} />}
      {(!yalnizKko || guncel.veri.firma_ortak.paket === "kko") && <Ozet baslik="Firma Token Hesabı" veri={guncel.veri.firma_ortak} />}
      <button type="button" className={styles.yenile} onClick={() => setYenileme(n => n + 1)}>Yenile</button>
    </>}
  </div>;
}
