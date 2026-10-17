import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

export function EczanemEczaneSayfa({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--tema-yerel-eczanem-sayfa-zemini-06)] pb-20 md:pb-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        {children}
      </main>
    </div>
  );
}

export function EczanemEczaneBaslik({ ikon: Icon, baslik, aciklama, aksiyon, rehberAnahtar, ustBilgiGoster = true }: {
  ikon: LucideIcon;
  baslik: string;
  aciklama: string;
  aksiyon?: ReactNode;
  rehberAnahtar?: string;
  ustBilgiGoster?: boolean;
}) {
  return (
    <SayfaYenileBasligi
      ustBilgi={ustBilgiGoster ? <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--tema-yerel-eczanem-eylem-metin-03)]">
        <Icon className="size-3.5" /> Eczanem
      </p> : undefined}
      baslik={<div className="inline-flex items-center">
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-eczanem-ana-metin-04)] md:text-[28px]">{baslik}</h1>
        {rehberAnahtar && <SayfaRehberi anahtar={rehberAnahtar} className="ml-1.5 -translate-y-1.5" />}
      </div>}
      aciklama={<p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-08)] md:text-sm">{aciklama}</p>}
      aksiyon={aksiyon}
    />
  );
}

export function EczanemOzetKarti({ ikon: Icon, etiket, deger, detay, renk = "var(--tema-yerel-eczanem-eylem-metin-01)", zemin = "var(--tema-yerel-eczanem-secim-zemin-01)" }: {
  ikon: LucideIcon;
  etiket: string;
  deger: string | number;
  detay: string;
  renk?: string;
  zemin?: string;
}) {
  return (
    <Card className="gap-0 border border-[var(--tema-yerel-eczanem-cizgi-06)] border-l-[3px] py-0 shadow-sm" style={{ borderLeftColor: renk }}>
      <CardContent className="flex items-start justify-between gap-3 p-4 md:p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--tema-yerel-eczanem-yardimci-metin-09)]">{etiket}</p>
          <p className="mt-2 text-2xl font-black leading-none tabular-nums text-[var(--tema-yerel-eczanem-ana-metin-04)] md:text-3xl">{deger}</p>
          <p className="mt-1.5 truncate text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-10)]">{detay}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ color: renk, background: zemin }}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}

export function EczanemPanel({ baslik, aciklama, aksiyon, children, className }: {
  baslik?: string;
  aciklama?: string;
  aksiyon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden border-[var(--tema-yerel-eczanem-cizgi-06)] py-0 shadow-sm", className)}>
      {(baslik || aciklama || aksiyon) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--tema-yerel-eczanem-cizgi-07)] px-4 py-4 md:px-5">
          <div>
            {baslik && <h2 className="text-sm font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-05)] md:text-base">{baslik}</h2>}
            {aciklama && <p className="mt-1 max-w-3xl text-[11px] font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-11)] md:text-xs">{aciklama}</p>}
          </div>
          {aksiyon}
        </div>
      )}
      {children}
    </Card>
  );
}

export function EczanemYukleniyor({ metin = "Veriler yükleniyor…" }: { metin?: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center gap-2 px-5 py-14 text-sm font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-12)]">
      <span className="size-5 animate-spin rounded-full border-2 border-[var(--tema-yerel-eczanem-cizgi-08)] border-t-[var(--tema-yerel-eczanem-cizgi-09)]" /> {metin}
    </div>
  );
}

export function EczanemBosDurum({ ikon: Icon = Inbox, baslik, aciklama }: {
  ikon?: LucideIcon;
  baslik: string;
  aciklama: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-eczanem-secim-zemin-04)] text-[var(--tema-yerel-eczanem-yardimci-metin-13)]"><Icon className="size-5" /></span>
      <h3 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-06)]">{baslik}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-14)]">{aciklama}</p>
    </div>
  );
}

export function EczanemSayfalama({ sayfa, toplamSayfa, onDegistir, disabled = false }: {
  sayfa: number;
  toplamSayfa: number;
  onDegistir: (sayfa: number) => void;
  disabled?: boolean;
}) {
  if (toplamSayfa <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-[var(--tema-yerel-eczanem-cizgi-07)] px-4 py-3 text-xs font-bold text-[var(--tema-yerel-eczanem-yardimci-metin-12)] md:px-5">
      <Button type="button" size="sm" variant="outline" disabled={disabled || sayfa <= 1} onClick={() => onDegistir(sayfa - 1)} className="h-8 border-[var(--tema-yerel-eczanem-cizgi-10)]">
        <ChevronLeft /> Önceki
      </Button>
      <span>{sayfa} / {toplamSayfa}</span>
      <Button type="button" size="sm" variant="outline" disabled={disabled || sayfa >= toplamSayfa} onClick={() => onDegistir(sayfa + 1)} className="h-8 border-[var(--tema-yerel-eczanem-cizgi-10)]">
        Sonraki <ChevronRight />
      </Button>
    </div>
  );
}
