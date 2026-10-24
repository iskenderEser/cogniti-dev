"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import { URETICI_KILAVUZU, type KilavuzParcasi } from "@/lib/rehber/ureticiKilavuzu";
import styles from "./uretici-kullanim-kilavuzu.module.css";

function VurguluMetin({ metin }: { metin: string }) {
  return <>{metin.split(/(\*\*.*?\*\*)/g).map((parca, i) => parca.startsWith("**")
    ? <strong key={i}>{parca.slice(2, -2)}</strong> : parca)}</>;
}

function MetinParcasi({ parca }: { parca: KilavuzParcasi }) {
  if (parca.tip === "liste") {
    const Liste = parca.sirali ? "ol" : "ul";
    return <Liste>{parca.maddeler.map((madde, i) => <li key={i}><VurguluMetin metin={madde} /></li>)}</Liste>;
  }
  return parca.tip === "baslik" ? <h4>{parca.metin}</h4> : <p><VurguluMetin metin={parca.metin} /></p>;
}

export default function UreticiKullanimKilavuzu({ kilavuz = URETICI_KILAVUZU, rolBasligi = "Üretici Roller", ekKontroller }: { kilavuz?: typeof URETICI_KILAVUZU; rolBasligi?: string; ekKontroller?: ReactNode }) {
  const [yerTutucu, setYerTutucu] = useState<HTMLSpanElement | null>(null);
  const [acik, setAcik] = useState(false);
  const [seciliBolum, setSeciliBolum] = useState<number | null>(null);
  const panelId = useId();
  const baslikId = useId();
  const kulakcik = useRef<HTMLButtonElement>(null);
  const kapat = useRef<HTMLButtonElement>(null);
  const metin = useRef<HTMLDivElement>(null);
  const konumlar = useRef<Record<string, number>>({});
  const konumAnahtari = seciliBolum === null ? "fihrist" : String(seciliBolum);
  const bolum = seciliBolum === null ? null : kilavuz.bolumler[seciliBolum];
  const paneliKapat = useCallback(() => setAcik(false), []);
  const bolumSec = (index: number | null) => setSeciliBolum(index);
  const kilavuzuAc = () => setAcik(true);

  useEffect(() => {
    if (!acik) return;
    const tetikleyici = kulakcik.current;
    kapat.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); paneliKapat(); }
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); tetikleyici?.focus(); };
  }, [acik, paneliKapat]);

  useLayoutEffect(() => {
    if (metin.current) metin.current.scrollTop = konumlar.current[konumAnahtari] ?? 0;
  }, [konumAnahtari, yerTutucu]);

  return <>
    <span hidden ref={setYerTutucu} />
    {yerTutucu && createPortal(<>
      <aside className={`${styles.panel} ${acik ? styles.acik : ""}`} aria-label="Cogniti Kullanım Kılavuzu">
        <button ref={kulakcik} type="button" className={styles.kulakcik} aria-expanded={acik} aria-controls={panelId}
          aria-label={acik ? "Kullanım kılavuzunu kapat" : "Kullanım kılavuzunu aç"} onClick={() => { if (acik) paneliKapat(); else kilavuzuAc(); }}>
          <BookOpen size={17} aria-hidden="true" />
          <span className={styles.etiket}>Kullanım Kılavuzu</span>
          {acik ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
        </button>
        <div id={panelId} className={styles.icerik} inert={!acik} aria-hidden={!acik}>
          <header className={styles.baslik}>
            <div><h2>Cogniti Kullanım Kılavuzu</h2><p>{rolBasligi}</p></div>
            <button ref={kapat} type="button" className={styles.kapat} aria-label="Kılavuz panelini kapat" onClick={paneliKapat}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          {ekKontroller && <div className={styles.gezinti}>{ekKontroller}</div>}
          {bolum && <div className={styles.gezinti}>
            <button type="button" onClick={() => bolumSec(null)}><ArrowLeft size={14} aria-hidden="true" /> Bölümler</button>
            <span>{(seciliBolum ?? 0) + 1} / {kilavuz.bolumler.length}</span>
          </div>}
          <div ref={metin} className={styles.metin} onScroll={event => { konumlar.current[konumAnahtari] = event.currentTarget.scrollTop; }}>
            {bolum ? <article aria-labelledby={baslikId} className={styles.yazi}>
              <h3 id={baslikId}>{bolum.baslik}</h3>
              {bolum.parcalar.map((parca, i) => <MetinParcasi key={`${seciliBolum}-${i}`} parca={parca} />)}
            </article> : <>
              <div className={styles.giris}>{kilavuz.giris.map((paragraf, i) => <p key={i}>{paragraf}</p>)}</div>
              <nav className={styles.fihrist} aria-label="Kılavuz bölümleri">
                <h3>Bölümler</h3>
                {kilavuz.bolumler.map((oge, i) => <button type="button" key={oge.baslik} onClick={() => bolumSec(i)}>
                  <span className={styles.numara}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{oge.baslik}</span><ChevronRight size={15} aria-hidden="true" />
                </button>)}
              </nav>
            </>}
          </div>
          {seciliBolum !== null && <footer className={styles.altGezinti}>
            <button type="button" disabled={seciliBolum === 0} onClick={() => bolumSec(seciliBolum - 1)}>
              <ChevronLeft size={15} aria-hidden="true" /> Önceki bölüm
            </button>
            <button type="button" disabled={seciliBolum === kilavuz.bolumler.length - 1} onClick={() => bolumSec(seciliBolum + 1)}>
              Sonraki bölüm <ChevronRight size={15} aria-hidden="true" />
            </button>
          </footer>}
        </div>
      </aside>
      </>, yerTutucu.ownerDocument.body
    )}
  </>;
}
