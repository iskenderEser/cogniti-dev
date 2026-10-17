// components/hbligi/league/LeadershipPath.tsx
// "Liderliğe Giden Yolun" — öncelikli hedefler (başlık + etki + öncelik). STUB (motor — Faz 2).

"use client";

import { Badge } from "@/components/ui/badge";
import { Target, CircleX, FastForward, ChevronRight } from "lucide-react";
import type { LiderlikHedefi } from "./types";
import styles from "./league.module.css";

const IKON = [Target, CircleX, FastForward];
const ONCELIK_STIL: Record<LiderlikHedefi["oncelik"], string> = {
  "Öncelikli": "bg-primary/10 text-primary",
  "Odaklan": "bg-[var(--tema-yerel-lig-islevsel-zemin-24)] text-[var(--tema-yerel-lig-islevsel-metin-23)]",
  "İyileştir": "bg-[var(--tema-yerel-lig-islevsel-zemin-25)] text-[var(--tema-yerel-lig-islevsel-metin-01)]",
};

export default function LeadershipPath({ hedefler }: { hedefler: LiderlikHedefi[] }) {
  return (
    <section className={`${styles.panel} flex h-full min-h-0 flex-col p-4`}>
        <div className="mb-2"><h2 className={styles.sectionHeading}>Liderliğe Giden Yolun</h2></div>
        <div className={`${styles.scrollArea} flex flex-1 flex-col gap-1.5`}>
          {hedefler.map((h, i) => {
            const Icon = IKON[i % IKON.length];
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-xl bg-[var(--tema-yerel-lig-sayfa-zemini-03)] px-2.5 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tema-yerel-lig-kart-01)] shadow-sm">
                  <Icon className="h-4 w-4 text-[var(--tema-yerel-lig-yardimci-metin-26)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-extrabold text-[var(--tema-yerel-lig-ana-metin-16)]">{h.baslik}</span>
                    <Badge className={`shrink-0 text-[10px] font-semibold ${ONCELIK_STIL[h.oncelik]}`} variant="secondary">
                      {h.oncelik}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium text-[var(--tema-yerel-lig-yardimci-metin-27)]">
                    Tahmini Etki: <span className="font-semibold" style={{ color: "var(--tema-yerel-lig-islevsel-metin-09)" }}>+{h.etki} puan</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            );
          })}
        </div>
        <button className="mt-2 flex items-center justify-center gap-1 text-xs font-extrabold text-[var(--tema-yerel-lig-eylem-metin-11)]">
          Tüm Önerilere Git <ChevronRight className="h-4 w-4" />
        </button>
    </section>
  );
}
