// components/pill/TeknikPill.tsx
//
// Künye satırında tekniğin adı. Teknik kayıtlı değilse ("-" ya da boş) hiç
// çizilmez — boş rozet bırakmaz.
//
// Taşındı (27.07): eski yeri components/TeknikPill.tsx. Ölçü artık Pill'den gelir.

"use client";

import { Pill } from "./Pill";

const TEKNIK_RENK = { bg: "var(--tema-zemin)", metin: "var(--tema-pill-notr-metin)", kenar: "var(--tema-cizgi)" };

export function TeknikPill({ teknikAdi, className }: { teknikAdi: string | null | undefined; className?: string }) {
  if (!teknikAdi || teknikAdi === "-") return null;

  return (
    <Pill renk={TEKNIK_RENK} className={className}>
      {teknikAdi}
    </Pill>
  );
}
