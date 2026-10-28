"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import VivaOdaAlani, { type VivaOdaDurumu } from "./VivaOdaAlani";
import styles from "./viva-oda.module.css";

type Oda = { etkinlikId: string; surum?: number; yonetebilir?: boolean; onizleme?: boolean; otomatikKatil?: boolean };
type Yer = { etkinlikId: string; eleman: HTMLDivElement };
type Baglam = { oda: Oda | null; ac: (oda: Oda) => void; yerlestir: (yer: Yer) => () => void };
const Gorusme = createContext<Baglam | null>(null);

// Kök layout korunur; kimlik değişimi veya çıkış ise eski görüşmeyi mutlaka kaldırır.
export function VivaGorusmeSaglayici({ children }: { children: ReactNode }) {
  const { kullanici } = useAuth();
  return <KaliciGorusme key={kullanici ? `${kullanici.kimlik_turu}:${kullanici.id}` : "oturumsuz"} yetkili={Boolean(kullanici)}>{children}</KaliciGorusme>;
}

function KaliciGorusme({ children, yetkili }: { children: ReactNode; yetkili: boolean }) {
  const [oda, setOda] = useState<Oda | null>(null);
  const [yer, setYer] = useState<Yer | null>(null);
  const [konum, setKonum] = useState<CSSProperties | null>(null);
  const mesgul = useRef(false);
  const durumDegisti = useCallback((durum: VivaOdaDurumu) => {
    mesgul.current = ["baglaniyor", "bekliyor", "hazirlaniyor", "gorusmede"].includes(durum);
  }, []);
  const ac = useCallback((yeni: Oda) => {
    if (!yetkili) return;
    setOda(eski => eski?.etkinlikId === yeni.etkinlikId || mesgul.current ? eski : yeni);
  }, [yetkili]);
  const yerlestir = useCallback((yeni: Yer) => {
    setYer(yeni);
    return () => setYer(eski => eski?.eleman === yeni.eleman ? null : eski);
  }, []);
  // Iframe asla başka DOM ebeveynine taşınmaz; yalnız görüntülendiği alan değişir.
  useLayoutEffect(() => {
    if (!yer || yer.etkinlikId !== oda?.etkinlikId) return;
    const olc = () => {
      const r = yer.eleman.getBoundingClientRect();
      setKonum({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    olc();
    const izle = new ResizeObserver(olc); izle.observe(yer.eleman);
    window.addEventListener("resize", olc);
    window.addEventListener("scroll", olc, true);
    return () => { izle.disconnect(); window.removeEventListener("resize", olc); window.removeEventListener("scroll", olc, true); };
  }, [yer, oda?.etkinlikId]);
  // Sayfadan ayrılınca da iptal/yetki kontrolleri sürer. Geçici ağ hatası görüşmeyi düşürmez.
  useEffect(() => {
    if (!oda) return;
    const kontrol = new AbortController();
    let suruyor = false;
    const dogrula = async () => {
      if (suruyor) return;
      suruyor = true;
      try {
        const r = await fetch(`/viva/api?islem=detay&etkinlik_id=${encodeURIComponent(oda.etkinlikId)}`, { cache: "no-store", signal: kontrol.signal });
        const veri = r.ok ? await r.json() : null;
        if (!kontrol.signal.aborted && ([401, 403, 404].includes(r.status) || (r.ok && veri?.etkinlik?.oda_acik === false))) {
          mesgul.current = false; setOda(null);
        }
      } catch { /* Sonraki kontrolde yeniden denenir; mevcut Daily oturumu korunur. */ }
      finally { suruyor = false; }
    };
    const timer = window.setInterval(() => void dogrula(), 30_000);
    const gorunur = () => { if (document.visibilityState === "visible") void dogrula(); };
    document.addEventListener("visibilitychange", gorunur);
    return () => { kontrol.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", gorunur); };
  }, [oda]);
  const baglam = useMemo(() => ({ oda, ac, yerlestir }), [oda, ac, yerlestir]);
  const gorunur = Boolean(yer && yer.etkinlikId === oda?.etkinlikId && konum);
  return <Gorusme.Provider value={baglam}>
    {children}
    {yetkili && oda && <div className={`${styles.screen} ${styles.persistentRoom}`} data-viva-kalici-oda={oda.etkinlikId}
      aria-hidden={!gorunur} inert={!gorunur} style={gorunur ? konum! : { top: 0, left: -10000, width: 960, height: 600, visibility: "hidden", pointerEvents: "none" }}>
      <VivaOdaAlani key={oda.etkinlikId} {...oda} onDurum={durumDegisti} />
    </div>}
  </Gorusme.Provider>;
}

export function VivaKaliciOdaYeri(props: Oda) {
  const baglam = useContext(Gorusme);
  if (!baglam) throw new Error("Viva görüşme sağlayıcısı bulunamadı.");
  const { oda, ac, yerlestir } = baglam;
  const eleman = useRef<HTMLDivElement>(null);
  const { etkinlikId, surum, yonetebilir, onizleme, otomatikKatil } = props;
  useEffect(() => { ac({ etkinlikId, surum, yonetebilir, onizleme, otomatikKatil }); }, [ac, etkinlikId, surum, yonetebilir, onizleme, otomatikKatil]);
  useLayoutEffect(() => {
    if (eleman.current) return yerlestir({ etkinlikId, eleman: eleman.current });
  }, [yerlestir, etkinlikId]);
  return <div ref={eleman} className={styles.roomSlot}>
    {oda && oda.etkinlikId !== etkinlikId && <section className={styles.closedRoom} role="status"><h2>Başka bir görüşmeniz açık</h2><p>Yeni görüşmeye katılmak için önce mevcut görüşmeden ayrılın.</p><Link href={`/viva/${oda.etkinlikId}/oda`}>Açık görüşmeye dön</Link></section>}
  </div>;
}
