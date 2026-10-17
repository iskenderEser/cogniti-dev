"use client";

import { useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react";

export interface TanburBolum {
  id: string;
  etiket: string;
  sayi?: number;
}

interface Props {
  bolumler: TanburBolum[];
  seciliId: string;
  onSec: (id: string) => void;
}

export default function HayaletTanburSecici({ bolumler, seciliId, onSec }: Props) {
  const [acik, setAcik] = useState(false);
  const varsayilanIndex = Math.max(0, bolumler.findIndex((b) => b.id === seciliId));
  const [kaydirilmisIndex, setKaydirilmisIndex] = useState<number | null>(null);
  const odakIndex = kaydirilmisIndex ?? varsayilanIndex;

  const dokunmaBaslangicY = useRef<number | null>(null);
  const sonSuruklemeZamani = useRef<number>(0);
  const suruklendiRef = useRef(false);

  // Tanbur açıkken arka plan sayfasının kaymasını (scroll) tamamen kilitle
  useEffect(() => {
    if (!acik) return;
    const eskiOverflow = document.body.style.overflow;
    const eskiTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = eskiOverflow;
      document.body.style.touchAction = eskiTouchAction;
    };
  }, [acik]);

  const secimeGit = (yeniIndex: number) => {
    const hedef = Math.max(0, Math.min(bolumler.length - 1, yeniIndex));
    setKaydirilmisIndex(hedef);
  };

  const onayla = (index = odakIndex) => {
    const secilen = bolumler[index];
    if (secilen) {
      onSec(secilen.id);
    }
    setKaydirilmisIndex(null);
    setAcik(false);
  };

  // Dokunmatik kaydırma (Touch Swipe / Drag)
  const handleTouchStart = (e: TouchEvent) => {
    dokunmaBaslangicY.current = e.touches[0].clientY;
    suruklendiRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (dokunmaBaslangicY.current === null) return;
    const deltaY = e.touches[0].clientY - dokunmaBaslangicY.current;

    if (Math.abs(deltaY) > 6) {
      suruklendiRef.current = true;
    }

    const simdi = Date.now();
    if (simdi - sonSuruklemeZamani.current < 70) return;

    if (Math.abs(deltaY) > 22) {
      if (deltaY < 0) {
        // Yukarı kaydırma -> sonraki bölüm
        secimeGit(odakIndex + 1);
      } else {
        // Aşağı kaydırma -> önceki bölüm
        secimeGit(odakIndex - 1);
      }
      dokunmaBaslangicY.current = e.touches[0].clientY;
      sonSuruklemeZamani.current = simdi;
    }
  };

  const handleTouchEnd = () => {
    dokunmaBaslangicY.current = null;
    setTimeout(() => {
      suruklendiRef.current = false;
    }, 120);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      secimeGit(odakIndex + 1);
    } else {
      secimeGit(odakIndex - 1);
    }
  };

  return (
    <>
      {/* 1. SAĞ KENARDA YÜZEN OK AYRACI (Trigger Arrowhead - no text) */}
      <aside aria-label="Bölüm gezintisi">
        <button
          type="button"
          onClick={() => setAcik((prev) => !prev)}
          aria-label={acik ? "Bölüm tanburunu kapat" : "Bölüm tanburunu aç"}
          className={`fixed right-0 top-1/2 z-50 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-xl border-y border-l border-[var(--tema-yerel-ortak-sayfa-cizgi-09)]/25 bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-05)]/85 px-1.5 py-3 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] shadow-xl backdrop-blur-md transition-all active:scale-90 hover:bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-06)] sm:hidden ${
            acik ? "translate-x-0 bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-07)]" : ""
          }`}
        >
          <svg
            className={`h-4 w-4 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)]/90 transition-transform duration-200 ${
              acik ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* 2. DIŞ ALANA DOKUNUNCA KAPATMA (Tam ekranı karartmaz/bulandırmaz, sadece dış dokunmayı yakalar) */}
      {acik && (
        <div
          onClick={() => setAcik(false)}
          className="fixed inset-0 z-40 bg-transparent sm:hidden touch-none"
          aria-hidden="true"
        />
      )}

      {/* 3. SADECE TANBUR BÖLGESİ (Sol ekran tamamen net ve aydınlık kalır, yalnızca sağ kenarda yumuşak buğu) */}
      {acik && (
        <div
          className="pointer-events-none fixed inset-y-0 right-0 z-40 w-64 max-w-[75vw] bg-gradient-to-l from-[var(--tema-yerel-ortak-sayfa-ortu-01)]/20 via-[var(--tema-yerel-ortak-sayfa-ortu-01)]/10 to-transparent backdrop-blur-[3px] transition-opacity duration-200 sm:hidden"
          aria-hidden="true"
        />
      )}

      {/* 3. HAVADA ASILI 3D HAYALET TANBUR (Sıfır Kutu, Gerçek 3D Silindir) */}
      {acik && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bölüm Tanburu"
          className="fixed right-7 top-1/2 z-50 flex h-[240px] w-60 max-w-[70vw] -translate-y-1/2 items-center justify-center select-none touch-none overscroll-contain sm:hidden"
          style={{
            perspective: "800px",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Ortadaki Aktif Alana İnce Kılavuz Çizgiler (Kutu Yok, Sadece Odak Kılavuzu) */}
          <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-[22px] h-[1px] bg-gradient-to-r from-transparent via-[var(--tema-yerel-ortak-sayfa-ortu-01)]/25 to-transparent" />
          <div className="pointer-events-none absolute inset-x-2 top-1/2 translate-y-[22px] h-[1px] bg-gradient-to-r from-transparent via-[var(--tema-yerel-ortak-sayfa-ortu-01)]/25 to-transparent" />

          {/* 3D Silindirik Çark */}
          <div
            className="relative flex h-[240px] w-full items-center justify-center"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {bolumler.map((bolum, i) => {
              const uzaklik = i - odakIndex;
              const mutlakUzaklik = Math.abs(uzaklik);

              // 3D Silindir Konumlandırması:
              // translateY: Dikey kaydırma
              // rotateX: Tambur yüzeyinde kavislenme (üsttekiler geriye, alttakiler geriye bükülür)
              // translateZ: Merkezden uzaklaştıkça derinliğe doğru gömülme
              // scale: Silindir perspektifi
              const y = uzaklik * 36;
              const rotX = uzaklik * 24;
              const z = -mutlakUzaklik * 22;
              const olcek = Math.max(0.7, 1 - mutlakUzaklik * 0.08);

              // Görünürlük ve Tipografi
              let stil = "text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-15)] opacity-0 pointer-events-none";
              let yaziGolgesi = "";
              if (mutlakUzaklik === 0) {
                // Ortadaki aktif sekme: Simsiyah, ekstra kalın, her fonda (açık/koyu) parlayan çok katmanlı beyaz ışık aurası
                stil = "text-[var(--tema-yerel-ortak-sayfa-metin-01)] font-black text-[15px] opacity-100 cursor-pointer";
                yaziGolgesi =
                  "var(--tema-tanbur-yazi-golge-secili)";
              } else if (mutlakUzaklik === 1) {
                // Bir üst / alt sekmeler: Yarı saydam, yumuşak ışık aurası
                stil = "text-[var(--tema-yerel-ortak-sayfa-ana-metin-14)] font-bold text-[12px] opacity-55 cursor-pointer";
                yaziGolgesi = "var(--tema-tanbur-yazi-golge-yakin)";
              } else if (mutlakUzaklik === 2) {
                // İki üst / alt sekmeler: Hayalet gibi soluk
                stil = "text-[var(--tema-yerel-ortak-sayfa-ana-metin-15)] font-medium text-[11px] opacity-25 cursor-pointer";
                yaziGolgesi = "var(--tema-tanbur-yazi-golge-uzak)";
              }

              return (
                <button
                  key={bolum.id}
                  type="button"
                  onClick={() => {
                    if (suruklendiRef.current) return;
                    onayla(i);
                  }}
                  style={{
                    transform: `translateY(${y}px) rotateX(${rotX}deg) translateZ(${z}px) scale(${olcek})`,
                    textShadow: yaziGolgesi,
                    transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
                  }}
                  className={`absolute flex h-10 w-full items-center justify-center px-2 text-center bg-transparent border-0 shadow-none outline-none ${stil}`}
                >
                  <span className="truncate tracking-tight">{bolum.etiket}</span>
                  {bolum.sayi !== undefined && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
                        mutlakUzaklik === 0
                          ? "bg-[var(--tema-yerel-ortak-sayfa-ortu-01)] text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] shadow-[0_0_8px_var(--tema-yerel-ortak-sayfa-golge-03)] border border-[var(--tema-yerel-ortak-sayfa-cizgi-09)]/50"
                          : "bg-[var(--tema-yerel-ortak-sayfa-ortu-01)]/20 text-[var(--tema-yerel-ortak-sayfa-metin-01)] border border-[var(--tema-yerel-ortak-sayfa-cizgi-09)]/30"
                      }`}
                    >
                      {bolum.sayi}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
