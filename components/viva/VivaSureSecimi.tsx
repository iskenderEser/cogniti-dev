"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { Popover } from "radix-ui";
import { SadeAsagiOk, SadeSecimMenusu } from "@/components/kontrol/SadeKontroller";
import { VIVA_AZAMI_SURE, VIVA_SURE_ADIMI } from "@/lib/viva/sozlesme";
import styles from "./viva-saat.module.css";

const sureler = Array.from({ length: VIVA_AZAMI_SURE / VIVA_SURE_ADIMI }, (_, i) => String((i + 1) * VIVA_SURE_ADIMI));

export default function VivaSureSecimi({ id, value, onChange, disabled = false }: {
  id: string; value: string; onChange: (sure: string) => void; disabled?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const liste = useRef<HTMLDivElement>(null);
  const listeId = `${id}-secenekler`;
  return <Popover.Root open={acik && !disabled} onOpenChange={setAcik}>
    <Popover.Trigger asChild><button id={id} type="button" className={styles.durationTrigger} disabled={disabled}
      role="combobox" aria-label="Süre (dakika)" aria-haspopup="listbox" aria-expanded={acik && !disabled}
      aria-controls={acik ? listeId : undefined}
      onKeyDown={event => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setAcik(true); } }}>
      <span>{sureler.includes(value) ? value : "Süre seçin"}</span><SadeAsagiOk />
    </button></Popover.Trigger>
    <Popover.Portal><SadeSecimMenusu className={styles.menu} align="start" aria-label="Yayın süresi seçimi"
      onOpenAutoFocus={event => {
        event.preventDefault();
        (liste.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? liste.current?.querySelector<HTMLButtonElement>('button'))?.focus();
      }}>
      <div ref={liste} id={listeId} role="listbox" aria-label="Yayın süreleri" className={styles.options}
        onKeyDown={event => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const buttons = Array.from(liste.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
          const index = buttons.indexOf(event.target as HTMLButtonElement);
          const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
            (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }}>
        {sureler.map(sure => <button key={sure} type="button" role="option" aria-selected={sure === value}
          className={styles.option} onClick={() => { onChange(sure); setAcik(false); }}>
          {sure}{sure === value && <Check size={16} aria-hidden="true" />}
        </button>)}
      </div>
    </SadeSecimMenusu></Popover.Portal>
  </Popover.Root>;
}
