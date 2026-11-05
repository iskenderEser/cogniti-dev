"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import styles from "../partner.module.css";

function grupla(rakamlar: string) {
  let baslangic = 0;
  return [2, 4, 4, 4, 4, 4, 2].map(uzunluk => {
    const grup = rakamlar.slice(baslangic, baslangic + uzunluk);
    baslangic += uzunluk;
    return grup;
  }).filter(Boolean).join(" ");
}

export default function PartnerIbanAlani({ value, onChange, hatali = false }: { value: string; onChange: (iban: string) => void; hatali?: boolean }) {
  const rakamlar = value.replace(/\D/g, "").slice(0, 24);
  const gorunum = grupla(rakamlar);
  function guncelle(input: HTMLInputElement, sayilar: string, rakamKonumu: number) {
    const yeni = sayilar.slice(0, 24);
    onChange("TR" + yeni);
    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      const metin = grupla(yeni);
      let konum = 0, adet = 0;
      while (konum < metin.length && adet < rakamKonumu) {
        if (/\d/.test(metin[konum])) adet++;
        konum++;
      }
      input.setSelectionRange(konum, konum);
    });
  }
  function degistir(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const oncekiRakamSayisi = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, "").length;
    guncelle(input, input.value.replace(/\D/g, ""), oncekiRakamSayisi);
  }
  function tus(e: KeyboardEvent<HTMLInputElement>) {
    const input = e.currentTarget, bas = input.selectionStart ?? 0;
    if (input.selectionEnd !== bas) return;
    const onceki = gorunum.slice(0, bas).replace(/\D/g, "").length;
    if (e.key === "Backspace" && bas > 0 && gorunum[bas - 1] === " ") {
      e.preventDefault();
      guncelle(input, rakamlar.slice(0, onceki - 1) + rakamlar.slice(onceki), onceki - 1);
    } else if (e.key === "Delete" && gorunum[bas] === " ") {
      e.preventDefault();
      guncelle(input, rakamlar.slice(0, onceki) + rakamlar.slice(onceki + 1), onceki);
    }
  }
  return <div className={styles.ibanAlani} data-hatali={hatali || undefined}>
    <span className={styles.ibanOnEk} aria-hidden="true">TR</span>
    <Input id="profil-iban" aria-invalid={hatali || undefined} aria-describedby={hatali ? "profil-iban-hata" : undefined} required inputMode="numeric" pattern="[0-9]{2}( [0-9]{4}){5} [0-9]{2}" aria-label="IBAN, TR sonrası 24 rakam" autoComplete="off" spellCheck={false} value={gorunum} onChange={degistir} onKeyDown={tus} />
  </div>;
}
