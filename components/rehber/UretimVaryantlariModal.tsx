// components/rehber/UretimVaryantlariModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { VARYANT_ALT_MODAL } from "@/lib/rehber/sayfaRehberi";

interface Props {
  acik: boolean;
  onKapat: () => void;
}

export default function UretimVaryantlariModal({ acik, onKapat }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!acik) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [acik, onKapat]);

  if (!acik || !mounted) return null;

  return createPortal(
    <div
      onClick={onKapat}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--tema-yerel-ortak-sayfa-ortu-01)]/45 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={VARYANT_ALT_MODAL.baslik}
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-2xl bg-[var(--tema-rehber-yuzey)] p-5 shadow-2xl border border-[var(--tema-rehber-cizgi)] animate-in zoom-in-95 duration-150 text-left"
        style={{
          boxShadow: "var(--tema-rehber-golge)",
        }}
      >
        {/* Başlık ve Kapat Butonu */}
        <div className="flex items-start justify-between pb-3 border-b border-[var(--tema-rehber-ic-cizgi)]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--tema-rehber-eylem)] bg-[var(--tema-rehber-vurgu-zemin)] px-2 py-0.5 rounded-md">
              Detay Rehberi
            </span>
            <h3 className="text-sm font-extrabold text-[var(--tema-rehber-baslik)] leading-tight mt-1">
              {VARYANT_ALT_MODAL.baslik}
            </h3>
            {VARYANT_ALT_MODAL.altBaslik && (
              <p className="text-xs text-[var(--tema-rehber-ikincil-metin)] mt-1 leading-relaxed">
                {VARYANT_ALT_MODAL.altBaslik}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            className="text-[var(--tema-rehber-soluk-metin)] hover:text-[var(--tema-rehber-kontrol-metin)] hover:bg-[var(--tema-rehber-notr-hover)] p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Varyant Kartları Listesi */}
        <div className="mt-3.5 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {VARYANT_ALT_MODAL.kartlar.map((k) => (
            <div
              key={k.kod}
              className="p-3 rounded-xl bg-[var(--tema-rehber-notr-zemin)]/80 border border-[var(--tema-rehber-ic-cizgi)] hover:bg-[var(--tema-rehber-notr-zemin)] transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-extrabold text-[var(--tema-rehber-baslik)]">
                  {k.baslik}
                </span>
                {k.rozet && (
                  <span className="text-[10px] font-semibold bg-[var(--tema-rehber-yuzey)] text-[var(--tema-rehber-metin)] border border-[var(--tema-rehber-cizgi)] px-2 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
                    {k.rozet}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--tema-rehber-metin)] leading-relaxed m-0">
                {k.aciklama}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
