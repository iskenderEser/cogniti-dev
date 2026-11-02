"use client";

import { useState } from "react";
import { TicketCheck } from "lucide-react";
import { Tooltip } from "radix-ui";

/** Bilgi, mouse yaklaşınca veya parmak temasında açılır; ayrılınca kapanır. */
export function CekPuaniBilgisi() {
  const [acik, setAcik] = useState(false);

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root open={acik} onOpenChange={setAcik} disableHoverableContent>
        <Tooltip.Trigger asChild>
          <button type="button" aria-label="Hediye çekli puan hakkında bilgi"
            onPointerEnter={(event) => { if (event.pointerType !== "touch") setAcik(true); }}
            onPointerLeave={() => setAcik(false)}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") {
                event.preventDefault();
                setAcik(true);
              }
            }}
            onPointerUp={(event) => { if (event.pointerType === "touch") setAcik(false); }}
            onPointerCancel={() => setAcik(false)}
            onLostPointerCapture={() => setAcik(false)}
            onFocus={() => setAcik(true)}
            onBlur={() => setAcik(false)}
            onClick={(event) => { event.stopPropagation(); event.preventDefault(); }}
            className="relative inline-flex min-h-5 min-w-5 items-center justify-center rounded-full text-[var(--tema-yerel-magaza-islevsel-metin-17)] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tema-kontrol-odak)] [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11">
            <TicketCheck fill="currentColor" className="h-3.5 w-3.5 [&>path:last-child]:fill-none [&>path:last-child]:stroke-[var(--tema-ters-metin)] [&>path:last-child]:[stroke-width:3]" aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" sideOffset={6} collisionPadding={12}
            onClick={(event) => event.stopPropagation()}
            className="z-50 w-72 max-w-[calc(100vw-24px)] rounded-lg border border-[var(--tema-pencere-cizgi)] bg-[var(--tema-pencere-zemini)] p-3 text-[var(--tema-hoyk-baslik)] shadow-lg">
            <span className="mb-1 block text-sm font-bold">Hediye çekli puan</span>
            <span className="block text-xs leading-relaxed text-[var(--tema-hoyk-ikincil-metin)]">
              Bu yayından kazanacağınız toplam puanı, FirmaStore’da hediye çeki siparişinde kullanılabileceksiniz. Puan karşılığı, firmanızın seçtiği hediye çekine göre belirlenir.
            </span>
            <Tooltip.Arrow className="fill-[var(--tema-pencere-zemini)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
