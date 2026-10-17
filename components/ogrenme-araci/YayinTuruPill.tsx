import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";

export function YayinTuruPill({
  tur,
  boyut = "standart",
  className = "",
  fontNormal = false,
}: {
  tur: OgrenmeAraciTuru;
  boyut?: "standart" | "kart";
  className?: string;
  fontNormal?: boolean;
}) {
  const sunum = YAYIN_TURU_SUNUMU[tur];
  const fontKalinligi = fontNormal ? "font-normal" : "font-extrabold";
  const siniflar =
    boyut === "kart"
      ? `inline-flex items-center justify-center rounded-full border border-[var(--tema-arac-pill-cizgi)] min-h-[22px] px-2.5 py-0.5 text-xs ${fontKalinligi} shadow-sm backdrop-blur-sm sm:min-h-0 sm:px-2 sm:py-0.5 sm:text-[9px]`
      : `rounded-full border border-[var(--tema-arac-pill-cizgi)] px-2 py-0.5 text-[9px] ${fontKalinligi} shadow-sm backdrop-blur-sm`;

  return (
    <span
      className={`${siniflar}${className ? ` ${className}` : ""}`}
      style={{ color: sunum.renk, backgroundColor: sunum.zemin }}
    >
      {sunum.etiket}
    </span>
  );
}

