"use client";

import type { ReactNode } from "react";
import { AracVarsayilanKapak } from "@/components/ogrenme-araci/AracVarsayilanKapak";
import { yayinThumbnailIstemciCoz, type IstemciThumbnailGirdisi } from "@/lib/ogrenmeAraci/thumbnailIstemci";

interface DagitimIcerigi extends IstemciThumbnailGirdisi {
  urun_adi: string;
  teknik_adi?: string | null;
}

interface Props {
  icerik: DagitimIcerigi;
  onOnizle?: () => void;
  onizlemeDevreDisi?: boolean;
  teknikAdiYedegi?: string;
  baslikEki?: ReactNode;
  altIcerik?: ReactNode;
}

export function DagitimIcerikOzeti({
  icerik,
  onOnizle,
  onizlemeDevreDisi = false,
  teknikAdiYedegi = "Teknik belirtilmedi",
  baslikEki,
  altIcerik,
}: Props) {
  const thumbnail = yayinThumbnailIstemciCoz(icerik);
  const kapak = thumbnail ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbnail} alt="" className="h-full w-full object-cover" />
  ) : (
    <AracVarsayilanKapak aracTuru={icerik.arac_turu} urunAdi={icerik.urun_adi} kucuk />
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      {onOnizle ? (
        <button
          type="button"
          onClick={onOnizle}
          disabled={onizlemeDevreDisi}
          className="group relative flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border-0 bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-01)] p-0 text-[var(--tema-yerel-ortak-sayfa-eylem-metin-06)] transition hover:ring-2 hover:ring-[var(--tema-yerel-ortak-sayfa-odak-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tema-yerel-ortak-sayfa-odak-03)] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={`${icerik.urun_adi} öğrenme içeriğini önizle`}
        >
          {kapak}
          <span className="pointer-events-none absolute inset-0 bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-03)]/0 transition group-hover:bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-08)]/10" />
        </button>
      ) : (
        <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-01)] text-[var(--tema-yerel-ortak-sayfa-eylem-metin-06)]">
          {kapak}
        </div>
      )}

      <div className="min-w-0 self-center">
        <div className="flex flex-wrap items-center gap-1.5">
          <strong className="block truncate text-sm text-[var(--tema-yerel-ortak-sayfa-ana-metin-04)]">{icerik.urun_adi}</strong>
          {baslikEki}
        </div>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-08)]">
          {icerik.teknik_adi || teknikAdiYedegi}
        </span>
        {altIcerik}
      </div>
    </div>
  );
}
