"use client";

export type HaftalikPuanBirikimi = {
  donemAdi: string;
  aktifHafta: number;
  puanlar: number[];
};

export default function EclubHaftalikPuanBirikimi({ birikim }: { birikim?: HaftalikPuanBirikimi }) {
  if (!birikim) return null;

  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--tema-yerel-eclub-cizgi-40)] pt-2 text-[11px] text-[var(--tema-yerel-eclub-yardimci-metin-45)]" aria-label="Haftalık net puan birikimi">
      <span className="shrink-0 font-bold">Güncel dönem ({birikim.donemAdi}) · Haftalık birikim</span>
      <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto whitespace-nowrap">
        {birikim.puanlar.map((puan, indeks) => (
          <span key={indeks} className="shrink-0">
            {indeks + 1}. hafta <strong className="text-[var(--tema-yerel-eclub-ana-metin-06)]">{indeks < birikim.aktifHafta ? puan.toLocaleString("tr-TR") : "—"}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
