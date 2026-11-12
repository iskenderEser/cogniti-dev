"use client";

import { useId, useState, type ReactNode } from "react";

export function YayinGonderimDetayKarti({ urunAdi, detay, children }: {
  urunAdi: string;
  detay: ReactNode;
  children: ReactNode;
}) {
  const panelId = useId();
  const [acik, setAcik] = useState(false);

  return (
    <div className="relative isolate h-full pb-4">
      <div inert={acik} className={`relative h-full transition-transform duration-300 motion-reduce:transition-none ${acik ? "z-0 translate-x-1.5 translate-y-1.5" : "z-10"}`}>
        {children}
      </div>
      <div id={panelId} role="region" aria-label={`${urunAdi} gönderim detayları`} inert={!acik}
        className={`absolute inset-x-0 bottom-4 top-0 flex flex-col overflow-hidden rounded-xl border border-[var(--tema-gonderim-detay-panel-cizgi)] bg-[var(--tema-gonderim-detay-zemin)] shadow-[0_12px_28px_var(--tema-gonderim-detay-golge)] transition-transform duration-300 motion-reduce:transition-none ${acik ? "z-30" : "z-0 translate-x-1.5 translate-y-1.5"}`}>
        <div className="border-b border-[var(--tema-gonderim-detay-baslik-cizgi)] px-3 py-2 text-[10px] font-extrabold text-[var(--tema-gonderim-detay-baslik)]">
          {urunAdi}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {detay}
        </div>
      </div>
      <button type="button" aria-expanded={acik} aria-controls={panelId}
        onClick={() => setAcik((onceki) => !onceki)}
        className={`absolute bottom-0 left-2 right-[-6px] z-[5] flex h-7 translate-y-1/4 items-end justify-center rounded-b-xl border border-t-0 px-3 pb-1 text-[9px] font-extrabold shadow-sm ${acik ? "border-[var(--tema-gonderim-detay-acik-sekme-cizgi)] bg-[var(--tema-gonderim-detay-yuzey)] text-[var(--tema-gonderim-detay-baslik-yardimci)]" : "border-[var(--tema-gonderim-detay-kapali-sekme-cizgi)] bg-[var(--tema-gonderim-detay-kapali-sekme-zemin)] text-[var(--tema-gonderim-detay-kapali-sekme-metin)]"}`}>
        {acik ? "Yayın kartına dön" : "Gönderim detayları"}
      </button>
    </div>
  );
}
