import { Check } from "lucide-react";

const ADIMLAR = [
  { no: 1, etiket: "Üyelik Başvurusu" },
  { no: 2, etiket: "Onay ve Davet" },
  { no: 3, etiket: "Kurumsal Üyelik" },
] as const;

export default function SurecAdimlari({
  aktifAdim,
  className = "mb-6",
}: {
  aktifAdim: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <ol className={`flex items-center gap-2 text-xs ${className}`} aria-label="Kurumsal üyelik adımları">
      {ADIMLAR.map((adim, indeks) => {
        const tamamlandi = adim.no < aktifAdim;
        const aktif = adim.no === aktifAdim;
        return (
          <li key={adim.no} className="contents">
            {indeks > 0 && (
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${adim.no <= aktifAdim ? "bg-[#0072ad]/45" : "bg-(--tema-cizgi)"}`}
              />
            )}
            <span
              className={`flex items-center gap-1.5 ${
                aktif
                  ? "font-semibold text-[#0072ad]"
                  : tamamlandi
                    ? "font-medium text-emerald-700"
                    : "text-(--tema-ikincil-metin)"
              }`}
              aria-current={aktif ? "step" : undefined}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                  aktif
                    ? "bg-[#0072ad] text-white"
                    : tamamlandi
                      ? "bg-emerald-600 text-white"
                      : "border border-(--tema-cizgi)"
                }`}
              >
                {tamamlandi ? <Check size={13} strokeWidth={2.5} aria-hidden="true" /> : adim.no}
              </span>
              <span>{adim.etiket}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
