"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { vivaEpostaGecerliMi, vivaEpostalariAyir } from "@/lib/viva/eposta";
import styles from "./viva-eposta.module.css";

type Props = {
  adresler: readonly string[];
  girdi: string;
  onAdresler: (adresler: string[]) => void;
  onGirdi: (girdi: string) => void;
  disabled?: boolean;
};

export default function VivaEpostaAlani({ adresler, girdi, onAdresler, onGirdi, disabled = false }: Props) {
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const [hatali, setHatali] = useState(false);
  const [mesaj, setMesaj] = useState("");
  useLayoutEffect(() => {
    const alan = input.current;
    if (alan) { alan.style.height = "auto"; alan.style.height = `${Math.max(30, alan.scrollHeight)}px`; }
  }, [girdi]);

  function tamamla(metin: string, sonuncu = false) {
    const sonuc = vivaEpostalariAyir(metin, adresler, sonuncu);
    onAdresler(sonuc.adresler);
    onGirdi(sonuc.girdi);
    setHatali(sonuc.hatali);
    setMesaj(sonuc.hatali ? "E-posta adresini kontrol edin." : sonuc.tekrarVar ? "Bu adres zaten eklendi." : "");
  }

  return <div className={styles.field}>
    <label htmlFor={id}>E-posta ile davet</label>
    <div className={`${styles.alan} ${hatali ? styles.hatali : ""}`}>
      {adresler.map(adres => <span key={adres} className={styles.pill}>
        <span>{adres}</span>
        <button type="button" disabled={disabled} aria-label={`${adres} adresini kaldır`} onClick={() => {
          onAdresler(adresler.filter(a => a !== adres));
          input.current?.focus();
        }}><X aria-hidden="true" /></button>
      </span>)}
      <textarea ref={input} id={id} aria-label="E-posta ile davet" className={styles.girdi} rows={1}
        value={girdi} disabled={disabled} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email"
        placeholder="Adresleri virgül, noktalı virgül veya enter ile ayırınız" aria-invalid={hatali || undefined} aria-describedby={`${id}-durum`}
        onChange={event => {
          if ((event.nativeEvent as InputEvent).isComposing) { onGirdi(event.target.value); return; }
          tamamla(event.target.value);
        }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing || ![",", ";", "Enter"].includes(event.key)) return;
          event.preventDefault();
          tamamla(girdi, true);
        }}
        onBlur={() => { if (!disabled) tamamla(girdi, true); }}
        onPaste={event => {
          const metin = event.clipboardData.getData("text");
          if (!/[,;\r\n]/.test(metin) && !vivaEpostaGecerliMi(metin.trim())) return;
          event.preventDefault();
          const alan = event.currentTarget;
          tamamla(girdi.slice(0, alan.selectionStart) + metin + girdi.slice(alan.selectionEnd), true);
        }} />
    </div>
    <p id={`${id}-durum`} className={styles.durum} role={hatali ? "alert" : "status"}>{mesaj}</p>
  </div>;
}
