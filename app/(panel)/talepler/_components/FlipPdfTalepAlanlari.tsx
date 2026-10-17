"use client";

import { useEffect, useState } from "react";
import type { BekleyenDosya } from "@/app/(panel)/talepler/_types";

export function FlipPdfTalepAlanlari({ hazir, pdf, onSec, onSil }: { hazir: boolean; pdf: BekleyenDosya | null; onSec: (e: React.ChangeEvent<HTMLInputElement>) => void; onSil: () => void }) {
  const [onizleme, setOnizleme] = useState("");
  useEffect(() => {
    if (!pdf) { setOnizleme(""); return; }
    const url = URL.createObjectURL(pdf.dosya);
    setOnizleme(url);
    return () => URL.revokeObjectURL(url);
  }, [pdf]);

  return <div className="rounded-2xl border border-[var(--tema-yerel-uretim-islevsel-cizgi-08)] bg-[var(--tema-yerel-uretim-islevsel-zemin-07)] p-4"><h3 className="text-sm font-extrabold text-[var(--tema-yerel-uretim-ana-metin-04)]">Literatür</h3><p className="mt-1 text-xs text-[var(--tema-yerel-uretim-yardimci-metin-05)]">İçerik üreticisi literatürü hazırlayacaktır.</p>{hazir && <div className="mt-3 rounded-xl border border-dashed border-[var(--tema-yerel-uretim-islevsel-cizgi-09)] bg-[var(--tema-yerel-uretim-islevsel-zemin-08)] p-3"><label className="text-xs font-extrabold text-[var(--tema-yerel-uretim-eylem-metin-04)]">Hazır Literatür dosyasını seçin<input type="file" accept=".pdf,application/pdf" className="mt-2 block w-full text-xs" onChange={onSec} /></label>{pdf && <><div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[var(--tema-yerel-uretim-islevsel-zemin-07)] px-3 py-2 text-xs"><span className="truncate">{pdf.preview.dosya_adi}</span><button type="button" onClick={onSil} className="text-[var(--tema-yerel-uretim-islevsel-metin-08)]">Sil</button></div>{onizleme && <iframe src={onizleme} title="Hazır Literatür ön izlemesi" className="mt-3 h-72 w-full rounded-lg border border-[var(--tema-yerel-uretim-cizgi-08)] bg-[var(--tema-yerel-uretim-kart-01)]" />}</>}</div>}</div>;
}
