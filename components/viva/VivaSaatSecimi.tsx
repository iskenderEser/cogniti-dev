"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { Popover } from "radix-ui";
import { Input } from "@/components/ui/input";
import { SadeSecimMenusu } from "@/components/kontrol/SadeKontroller";
import styles from "./viva-saat.module.css";

const saatler = Array.from({ length: 96 }, (_, i) =>
  `${String(Math.floor(i / 4)).padStart(2, "0")}:${String(i % 4 * 15).padStart(2, "0")}`);
const saatDeseni = "([01][0-9]|2[0-3]):[0-5][0-9]";
const gecerliSaat = new RegExp(`^${saatDeseni}$`);

export default function VivaSaatSecimi({ id, value, onChange, disabled = false }: {
  id: string; value: string; onChange: (saat: string) => void; disabled?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const [arama, setArama] = useState("");
  const [aktif, setAktif] = useState(0);
  const alan = useRef<HTMLInputElement>(null);
  const cerceve = useRef<HTMLDivElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const sorgu = arama.trim();
  const adaylar = gecerliSaat.test(sorgu) && !saatler.includes(sorgu) ? [...saatler, sorgu].sort() : saatler;
  const secenekler = adaylar.filter(s => s.includes(sorgu));
  const listeId = `${id}-secenekler`;

  useEffect(() => {
    if (acik) liste.current?.querySelector('[data-aktif="true"]')?.scrollIntoView?.({ block: "nearest" });
  }, [acik, aktif, arama]);

  function ac(open: boolean) {
    setAcik(open);
    if (open) {
      setArama("");
      const secili = saatler.indexOf(value);
      setAktif(secili >= 0 ? secili : 36);
    }
  }
  function sec(saat: string) {
    onChange(saat);
    setAcik(false);
    setArama("");
    alan.current?.focus();
  }

  return <Popover.Root open={acik && !disabled} onOpenChange={ac}>
    <Popover.Anchor asChild><div ref={cerceve} className={styles.field}>
      <Input ref={alan} id={id} value={value} required disabled={disabled} type="text" inputMode="decimal"
        placeholder="Saat ara veya yaz…" pattern={saatDeseni} title="Saati 00:00–23:59 aralığında SS:DD biçiminde yazın."
        autoComplete="off" role="combobox" aria-label="Başlangıç saati" aria-autocomplete="list"
        aria-expanded={acik && !disabled} aria-controls={acik ? listeId : undefined}
        aria-activedescendant={acik && secenekler[aktif] ? `${listeId}-${secenekler[aktif].replace(":", "-")}` : undefined}
        onClick={() => { if (!acik) ac(true); }}
        onChange={event => { onChange(event.target.value); setArama(event.target.value); setAktif(0); setAcik(true); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setAcik(false); return; }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            if (!acik && ["Home", "End"].includes(event.key)) return;
            event.preventDefault();
            if (!acik) { ac(true); return; }
            if (!secenekler.length) return;
            setAktif(n => event.key === "Home" ? 0 : event.key === "End" ? secenekler.length - 1 :
              (n + (event.key === "ArrowDown" ? 1 : -1) + secenekler.length) % secenekler.length);
          }
          if (event.key === "Enter" && acik) { event.preventDefault(); if (secenekler[aktif]) sec(secenekler[aktif]); }
        }} />
      <Popover.Trigger asChild><button type="button" disabled={disabled} aria-label="Saat listesini aç"><Clock3 aria-hidden="true" /></button></Popover.Trigger>
    </div></Popover.Anchor>
    <Popover.Portal><SadeSecimMenusu className={styles.menu} align="start" aria-label="Başlangıç saati seçimi"
      onOpenAutoFocus={event => {
        event.preventDefault(); alan.current?.focus();
        liste.current?.querySelector('[data-aktif="true"]')?.scrollIntoView?.({ block: "nearest" });
      }}
      onCloseAutoFocus={event => event.preventDefault()}
      onInteractOutside={event => { if (cerceve.current?.contains(event.target as Node)) event.preventDefault(); }}>
      <div ref={liste} id={listeId} role="listbox" aria-label="Başlangıç saatleri" className={styles.options}>
        {secenekler.map((saat, i) => <button key={saat} id={`${listeId}-${saat.replace(":", "-")}`} type="button"
          role="option" aria-selected={saat === value} data-aktif={i === aktif} tabIndex={-1}
          className={styles.option} onPointerDown={event => event.preventDefault()} onClick={() => sec(saat)}>
          {saat}{saat === value && <Check size={16} aria-hidden="true" />}
        </button>)}
        {!secenekler.length && <p role="status" className={styles.empty}>Uygun saat bulunamadı.</p>}
      </div>
    </SadeSecimMenusu></Popover.Portal>
  </Popover.Root>;
}
