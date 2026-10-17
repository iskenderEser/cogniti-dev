"use client";

import { useEclubFirmaSecimi } from "./EclubFirmaSecimi";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import EclubKisiBanner from "./EclubKisiBanner";

export function EclubKisiSayfa({ children }: { children: ReactNode }) {
  const { gomulu } = useEclubFirmaSecimi();
  if (gomulu) return <div data-eclub-sayfa className="flex min-w-0 flex-col gap-4">{children}</div>;
  return (
    <div className="min-h-full bg-[var(--tema-yerel-eclub-sayfa-zemini-03)] pb-20 md:pb-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <main data-eclub-sayfa className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
        {children}
      </main>
    </div>
  );
}

export function EclubKisiBaslik({
  ikon: Icon,
  baslik,
  aciklama,
  baslikAlti,
  aksiyon,
  altAksiyon,
  ekKontroller,
  ustEtiket = "E‑Club",
  rehberAnahtar,
  baslikClassName = "m-0 text-2xl font-extrabold tracking-[-0.03em] text-[var(--tema-yerel-eclub-ana-metin-06)]",
}: {
  ikon: LucideIcon;
  baslik: string;
  aciklama: string;
  baslikAlti?: ReactNode;
  aksiyon?: ReactNode;
  altAksiyon?: ReactNode;
  ekKontroller?: ReactNode;
  ustEtiket?: string;
  rehberAnahtar?: string;
  baslikClassName?: string;
}) {
  return (
    <>
    <SayfaYenileBasligi
      ustBilgi={ustEtiket && <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--tema-yerel-eclub-eylem-metin-13)]">
        <Icon size={14} /> {ustEtiket}
      </div>}
      baslik={<div className="inline-flex items-center">
        <h1 className={baslikClassName}>{baslik}</h1>
        {rehberAnahtar && <SayfaRehberi anahtar={rehberAnahtar} className="ml-1.5 -translate-y-1" />}
      </div>}
      aciklama={<div className="mt-1 max-w-2xl">
        {baslikAlti}
        <p className="text-xs font-semibold leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-23)]">{aciklama}</p>
      </div>}
      aksiyon={aksiyon}
      altAksiyon={altAksiyon}
      ekKontroller={ekKontroller}
    />
    <EclubKisiBanner />
    </>
  );
}

export function EclubKisiStat({
  ikon: Icon,
  etiket,
  deger,
  detay,
  detayKirilsin = false,
  onClick,
  secili = false,
  renk = "var(--tema-yerel-eclub-eylem-metin-01)",
  zemin = "var(--tema-yerel-eclub-secim-zemin-10)",
}: {
  ikon: LucideIcon;
  etiket: string;
  deger: string | number;
  detay?: string;
  detayKirilsin?: boolean;
  onClick?: () => void;
  secili?: boolean;
  renk?: string;
  zemin?: string;
}) {
  const icerik = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[var(--tema-yerel-eclub-yardimci-metin-23)]">{etiket}</div>
        <div className="mt-1 text-2xl font-black tabular-nums" style={{ color: renk }}>{deger}</div>
        {detay && <div className={`mt-0.5 text-[10px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-29)] ${detayKirilsin ? "break-words" : "truncate"}`}>{detay}</div>}
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: renk, background: zemin }}>
        <Icon size={16} />
      </span>
    </div>
  );
  const className = `w-full rounded-2xl border bg-[var(--tema-yerel-eclub-kart-01)] p-3.5 shadow-[0_5px_16px_var(--tema-yerel-eclub-golge-04)] ${secili ? "border-[var(--tema-yerel-eclub-cizgi-17)] ring-2 ring-[var(--tema-yerel-eclub-odak-03)]/20" : "border-[var(--tema-yerel-eclub-cizgi-03)]"}`;
  if (onClick) return <button type="button" onClick={onClick} aria-pressed={secili} className={`${className} cursor-pointer text-left transition hover:border-[var(--tema-yerel-eclub-cizgi-45)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tema-yerel-eclub-odak-03)]`}>{icerik}</button>;
  return <article className={className}>{icerik}</article>;
}

export function EclubKisiBosDurum({ ikon: Icon, baslik, aciklama }: {
  ikon: LucideIcon;
  baslik: string;
  aciklama: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--tema-yerel-eclub-cizgi-26)] bg-[var(--tema-yerel-eclub-kart-01)] px-5 py-12 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-eclub-sayfa-zemini-22)] text-[var(--tema-yerel-eclub-yardimci-metin-47)]"><Icon size={20} /></span>
      <h2 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-eclub-ana-metin-02)]">{baslik}</h2>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-07)]">{aciklama}</p>
    </div>
  );
}

export function EclubKisiYukleniyor() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[var(--tema-yerel-eclub-sayfa-zemini-03)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-11)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--tema-yerel-eclub-cizgi-46)] border-t-[var(--tema-yerel-eclub-cizgi-47)]" /> Yükleniyor...
      </div>
    </div>
  );
}
