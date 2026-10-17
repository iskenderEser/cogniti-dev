// components/SenaryoMetniGoster.tsx
//
// Senaryo metnini gösterir — `onceki` verilmişse (G-2/G-3 —
// docs/senaryo_tek_metin_diff_gelistirme_is_plani.md) kelime bazlı farkı
// hesaplayıp çıkarılan kısmı üstü çizili (silinmez), eklenen kısmı kırmızı
// vurgulu render eder. `onceki` yoksa (ilk gönderim, onaylı/iptal metni) düz
// metin gösterir.

"use client";

import { senaryoDiffHesapla } from "@/lib/utils/senaryo/diffHesapla";

interface Props {
  mevcut: string;
  onceki?: string;
}

export function SenaryoMetniGoster({ mevcut, onceki }: Props) {
  if (!onceki) {
    return <p className="text-sm text-[var(--tema-yerel-uretim-ana-metin-03)] leading-relaxed whitespace-pre-wrap m-0">{mevcut}</p>;
  }

  const parcalar = senaryoDiffHesapla(onceki, mevcut);

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap m-0">
      {parcalar.map((parca, i) => {
        if (parca.tur === "ekle") {
          return (
            <span key={i} style={{ background: "var(--tema-yerel-uretim-islevsel-zemin-30)", color: "var(--tema-yerel-uretim-islevsel-metin-40)", borderRadius: 3, padding: "0 2px" }}>
              {parca.metin}
            </span>
          );
        }
        if (parca.tur === "cikar") {
          return (
            <span key={i} style={{ textDecoration: "line-through", color: "var(--tema-yerel-uretim-yardimci-metin-03)" }}>
              {parca.metin}
            </span>
          );
        }
        return <span key={i} className="text-[var(--tema-yerel-uretim-ana-metin-03)]">{parca.metin}</span>;
      })}
    </p>
  );
}
