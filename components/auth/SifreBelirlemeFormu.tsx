"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { SIFRE_KURAL_ACIKLAMASI, sifreKuralHatasi } from "@/lib/auth/sifreKurali";

export function SifreBelirlemeFormu({ baslik, buton, onKaydet }: {
  baslik: string; buton: string;
  onKaydet: (sifre: string, tekrar: string) => Promise<void>;
}) {
  const [sifre, setSifre] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [sifreGoster, setSifreGoster] = useState(false);
  const [tekrarGoster, setTekrarGoster] = useState(false);
  const [islem, setIslem] = useState(false);
  const [hata, setHata] = useState("");
  return <form className="flex flex-col gap-4" onSubmit={async (e) => {
    e.preventDefault(); if (islem) return;
    setHata("");
    const kuralHatasi = sifreKuralHatasi(sifre);
    if (kuralHatasi) { setHata(kuralHatasi); return; }
    if (sifre !== tekrar) { setHata("Şifreler eşleşmiyor."); return; }
    setIslem(true);
    try { await onKaydet(sifre, tekrar); }
    catch (e) { setHata(e instanceof Error ? e.message : "Şifre kaydedilemedi."); }
    finally { setIslem(false); }
  }}>
    <div><h2 className="mb-1 text-base font-bold text-[var(--tema-yerel-giris-ana-metin-03)]">{baslik}</h2><p className="text-xs leading-relaxed text-[var(--tema-yerel-giris-yardimci-metin-01)]">{SIFRE_KURAL_ACIKLAMASI}</p></div>
    {[
      { label: "Yeni şifre", value: sifre, setter: setSifre, goster: sifreGoster, setGoster: setSifreGoster },
      { label: "Yeni şifre (tekrar)", value: tekrar, setter: setTekrar, goster: tekrarGoster, setGoster: setTekrarGoster },
    ].map(({ label, value, setter, goster, setGoster }) => (
      <label key={label} className="block text-xs font-semibold text-[var(--tema-yerel-giris-yardimci-metin-01)]">
        {label}
        <div className="relative mt-1.5">
          <input type={goster ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} disabled={islem} value={value} onChange={(e) => setter(e.target.value)} className="w-full rounded-xl border border-[var(--tema-yerel-giris-cizgi-03)] bg-[var(--tema-yerel-giris-kart-01)] py-2.5 pl-3.5 pr-11 text-sm text-[var(--tema-yerel-giris-ana-metin-03)] outline-none focus:border-[var(--tema-kontrol-odak)]" />
          <button type="button" onClick={() => setGoster(!goster)} aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={goster} className="absolute top-0 right-1.5 grid h-full w-9 place-items-center border-0 bg-transparent p-0 text-[var(--tema-ikincil-metin)] cursor-pointer">
            {goster ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        </div>
      </label>
    ))}
    {hata && <p role="alert" className="rounded-xl border border-[var(--tema-yerel-giris-islevsel-cizgi-01)] bg-[var(--tema-yerel-giris-islevsel-zemin-01)] px-3 py-2 text-xs text-[var(--tema-yerel-giris-islevsel-metin-02)]">{hata}</p>}
    <button type="submit" disabled={islem} className="w-full rounded-xl bg-[var(--tema-kontrol-eylem)] py-3 text-sm font-bold text-[var(--tema-kontrol-eylem-metin)] cursor-pointer disabled:opacity-60">{islem ? "Kaydediliyor…" : buton}</button>
  </form>;
}
