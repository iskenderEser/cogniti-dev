"use client";

import { useRef, useState } from "react";
import { Check, Clock } from "lucide-react";
import { Popover } from "radix-ui";
import { SadeSecimMenusu } from "@/components/kontrol/SadeKontroller";
import type { CanliSaatSecenegi } from "@/lib/agora/partnerCanliYayin";

export function CanliYayinSaatSecimi({
  id,
  value,
  secenekler,
  onChange,
  disabled = false,
}: {
  id: string;
  value: string;
  secenekler: readonly CanliSaatSecenegi[];
  onChange: (saat: string) => void;
  disabled?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const liste = useRef<HTMLDivElement>(null);
  const listeId = `${id}-secenekler`;
  const musaitSayisi = secenekler.filter((s) => s.musait).length;
  const kapali = disabled || musaitSayisi === 0;

  return (
    <Popover.Root open={acik && !kapali} onOpenChange={setAcik}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={kapali}
          role="combobox"
          aria-label="Başlangıç saati (TR)"
          aria-haspopup="listbox"
          aria-expanded={acik && !kapali}
          aria-controls={acik ? listeId : undefined}
          onKeyDown={(event) => {
            if (["ArrowDown", "ArrowUp"].includes(event.key)) {
              event.preventDefault();
              setAcik(true);
            }
          }}
          className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-[var(--tema-yuzey)] px-3 py-1 text-sm font-medium text-[var(--tema-baslik)] shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{value || "Saat yok"}</span>
          <Clock size={15} className="shrink-0 text-[var(--tema-ikincil-metin)]" aria-hidden="true" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <SadeSecimMenusu
          align="start"
          aria-label="Başlangıç saati seçimi"
          style={{ width: "max(var(--radix-popover-trigger-width, 180px), 180px)", padding: "6px" }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const hedef =
              liste.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)') ??
              liste.current?.querySelector<HTMLButtonElement>("button:not(:disabled)");
            hedef?.scrollIntoView?.({ block: "center" });
            hedef?.focus();
          }}
        >
          <div
            ref={liste}
            id={listeId}
            role="listbox"
            aria-label="Başlangıç saatleri"
            className="max-h-60 overflow-y-auto pr-0.5"
            onKeyDown={(event) => {
              if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
              const buttons = Array.from(
                liste.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
              );
              if (!buttons.length) return;
              event.preventDefault();
              const index = buttons.indexOf(event.target as HTMLButtonElement);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? buttons.length - 1
                    : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) %
                      buttons.length;
              buttons[next]?.focus();
            }}
          >
            {secenekler.map((s) => {
              const secili = s.saat === value && s.musait;
              return (
                <button
                  key={s.saat}
                  type="button"
                  role="option"
                  aria-selected={secili}
                  disabled={!s.musait}
                  onClick={() => {
                    onChange(s.saat);
                    setAcik(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                    secili
                      ? "bg-[var(--tema-kontrol-hover)] text-[var(--tema-kontrol-eylem)]"
                      : s.musait
                        ? "text-[var(--tema-metin)] hover:bg-[var(--tema-kontrol-hover)] hover:text-[var(--tema-kontrol-eylem)]"
                        : "cursor-not-allowed text-[var(--tema-ikincil-metin)] opacity-45"
                  }`}
                >
                  <span>{s.saat}</span>
                  {secili ? (
                    <Check size={14} className="text-[var(--tema-kontrol-eylem)]" aria-hidden="true" />
                  ) : !s.musait ? (
                    <span className="text-[11px] font-medium">
                      {s.gecmis ? "Geçmiş" : "Dolu"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </SadeSecimMenusu>
      </Popover.Portal>
    </Popover.Root>
  );
}
