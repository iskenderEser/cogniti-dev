// components/hbligi/league/LeadershipInsight.tsx
// Kapanış mesajı — motive edici not. STUB (motor — Faz 2).

"use client";

import { Star } from "lucide-react";

export default function LeadershipInsight({ mesaj }: { mesaj: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[var(--tema-yerel-lig-islevsel-zemin-23)] to-[var(--tema-yerel-lig-sayfa-zemini-03)] px-3 py-2 text-[11px] font-semibold text-[var(--tema-yerel-lig-yardimci-metin-25)]">
      <Star className="h-4 w-4 shrink-0 text-[var(--tema-yerel-lig-islevsel-metin-22)]" fill="currentColor" />
      <span><strong className="text-[var(--tema-yerel-lig-ana-metin-15)]">Liderlik notun:</strong> {mesaj}</span>
    </div>
  );
}
