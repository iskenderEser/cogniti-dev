"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { rehberMerkezi, yuruyusSuresi, type Nokta } from "./konum";
import styles from "./rehber.module.css";

type Props = {
  baslangic: Nokta;
  baslangicYukseklik: number;
  onBitti: () => void;
};
type Asama = "veda-yuruyor" | "veda-el" | "veda-kayboluyor";
const EL_KARELERI = [0, 1, 2, 3, 2, 3, 2, 3];
const EL_SURESI = 1400;
const KAYBOLMA_SURESI = 750;

/** Bitir: mevcut konumdan merkeze yürüyüş → el kaldırma → saydamlaşma. */
export default function KityVeda({ baslangic, baslangicYukseklik, onBitti }: Props) {
  const [gorunum, setGorunum] = useState({
    konum: baslangic, yukseklik: baslangicYukseklik, kare: 0,
    asama: "veda-yuruyor" as Asama, opaklik: 1, sagaBakiyor: true, elGorseli: false,
  });
  const gorselRef = useRef<"bekliyor" | "hazir" | "hata">("bekliyor");
  const bittiRef = useRef(onBitti);
  const atlaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { bittiRef.current = onBitti; }, [onBitti]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { gorselRef.current = "hazir"; };
    img.onerror = () => { gorselRef.current = "hata"; };
    img.src = "/rehber/kity-veda.png";
    return () => { img.onload = null; img.onerror = null; };
  }, []);

  useEffect(() => {
    const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const merkez = rehberMerkezi({ width: window.innerWidth, height: window.innerHeight });
    const yurumeSuresi = azHareket ? 0 : yuruyusSuresi(baslangic, merkez);
    const elSuresi = azHareket ? 650 : EL_SURESI;
    const kaybolmaSuresi = azHareket ? 0 : KAYBOLMA_SURESI;
    let oncekiZaman: number | null = null;
    let gecen = 0;
    let elBaslangici: number | null = null;
    let kare = 0;
    let durduruldu = false;

    const ilerle = (zaman: number) => {
      if (durduruldu) return;
      if (oncekiZaman !== null) gecen += Math.min(zaman - oncekiZaman, 100);
      else atlaRef.current?.focus({ preventScroll: true });
      oncekiZaman = zaman;
      const hedef = rehberMerkezi({ width: window.innerWidth, height: window.innerHeight });
      const oran = yurumeSuresi === 0 ? 1 : Math.min(1, gecen / yurumeSuresi);
      const konum = {
        x: baslangic.x + (hedef.x - baslangic.x) * oran,
        y: baslangic.y + (hedef.y - baslangic.y) * oran,
      };
      let asama: Asama = "veda-yuruyor";
      let kareNo = Math.floor(gecen / 105) % 6;
      let opaklik = 1;
      let elGorseli = false;

      if (oran === 1) {
        // Veda görseli gecikirse merkezde bekler; ağ hatası kapanışı kilitlemez.
        if (gorselRef.current !== "bekliyor" || gecen >= yurumeSuresi + 5000) elBaslangici ??= gecen;
        const elGecen = elBaslangici === null ? 0 : gecen - elBaslangici;
        elGorseli = gorselRef.current === "hazir";
        asama = elBaslangici !== null && elGecen >= elSuresi ? "veda-kayboluyor" : "veda-el";
        kareNo = elGorseli ? azHareket ? 3 : EL_KARELERI[Math.min(EL_KARELERI.length - 1, Math.floor(elGecen / (EL_SURESI / EL_KARELERI.length)))] : 6;
        if (asama === "veda-kayboluyor") {
          opaklik = kaybolmaSuresi === 0 ? 0 : Math.max(0, 1 - (elGecen - elSuresi) / kaybolmaSuresi);
          if (opaklik === 0) { bittiRef.current(); return; }
        }
      }

      setGorunum({ konum, yukseklik: hedef.yukseklik, kare: kareNo, asama, opaklik, sagaBakiyor: oran === 1 || hedef.x >= baslangic.x, elGorseli });
      kare = requestAnimationFrame(ilerle);
    };
    kare = requestAnimationFrame(ilerle);
    return () => { durduruldu = true; cancelAnimationFrame(kare); };
  }, [baslangic]);

  const genislik = gorunum.yukseklik / 2;
  return <div className={`${styles.katman} ${styles.vedaKatmani}`} data-rehber-asama={gorunum.asama}>
    <button ref={atlaRef} type="button" className={styles.vedaAtla} aria-label="Vedayı atla" onClick={onBitti}><X size={16} /></button>
    <div aria-hidden="true" className={styles.karakterKonum} style={{ width: genislik, height: gorunum.yukseklik, opacity: gorunum.opaklik, transform: `translate3d(${gorunum.konum.x}px, ${gorunum.konum.y}px, 0)` }}>
      <div className={`${styles.karakter} ${gorunum.elGorseli ? styles.vedaKarakteri : ""}`} style={{
        backgroundPosition: `${(gorunum.kare % 4) * 100 / 3}% ${gorunum.elGorseli ? 0 : Math.floor(gorunum.kare / 4) * 100}%`,
        transform: `scaleX(${gorunum.sagaBakiyor ? 1 : -1})`,
      }} />
      <div className={styles.golge} />
    </div>
    <p className={styles.vedaMesaji} role="status" style={{ opacity: gorunum.asama === "veda-yuruyor" ? 0 : gorunum.opaklik, left: gorunum.konum.x + genislik / 2, top: gorunum.konum.y + gorunum.yukseklik + 15 }}>
      Görüşmek üzere! <span>Kity</span>
    </p>
  </div>;
}
