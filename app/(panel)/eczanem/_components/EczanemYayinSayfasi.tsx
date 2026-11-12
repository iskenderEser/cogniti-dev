import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

export function EczanemYayinSayfasi({ baslik, rehber, aciklama, aksiyon, children }: {
  baslik: string;
  rehber?: ReactNode;
  aciklama?: string;
  aksiyon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-[var(--tema-yerel-eczanem-sayfa-zemini-05)]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <SayfaYenileBasligi
          className="flex flex-wrap items-end justify-between gap-4"
          baslik={<div className="inline-flex items-center">
            <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-eczanem-ana-metin-04)] md:text-[28px]">{baslik}</h1>
            {rehber}
          </div>}
          aciklama={aciklama && <p className="mt-1 max-w-3xl text-sm leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-07)]">{aciklama}</p>}
          aksiyon={aksiyon}
        />
        {children}
      </div>
    </div>
  );
}

export function OzetKartlari({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Eczanem öğrenme içeriği özeti" className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
      {children}
    </section>
  );
}

export function OzetKarti({ ikon: Icon, etiket, deger, detay, renk, zemin }: {
  ikon: LucideIcon;
  etiket: string;
  deger: number | null;
  detay: string;
  renk: string;
  zemin: string;
}) {
  return (
    <Card className="gap-0 border border-[var(--tema-yerel-eczanem-cizgi-06)] border-l-[3px] py-0 shadow-sm" style={{ borderLeftColor: renk }}>
      <CardContent className="flex items-start justify-between gap-3 p-4 md:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-03)]">{etiket}</p>
          <p className="mt-2 text-2xl font-extrabold leading-none text-[var(--tema-yerel-eczanem-ana-metin-02)] md:text-3xl">{deger?.toLocaleString("tr-TR") ?? "—"}</p>
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--tema-yerel-eczanem-yardimci-metin-04)] md:text-xs">{detay}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ color: renk, background: zemin }}><Icon className="size-4.5" /></span>
      </CardContent>
    </Card>
  );
}
