"use client";

import { useState } from "react";

export function SifreBelirlemeFormu({ baslik, buton, onKaydet }: {
  baslik: string; buton: string;
  onKaydet: (sifre: string, tekrar: string) => Promise<void>;
}) {
  const [sifre, setSifre] = useState("");
  const [tekrar, setTekrar] = useState("");
  const [islem, setIslem] = useState(false);
  const [hata, setHata] = useState("");
  return <form className="flex flex-col gap-4" onSubmit={async (e) => {
    e.preventDefault(); if (islem) return;
    setHata("");
    if (sifre.length < 6 || sifre.length > 128) { setHata("Şifre 6–128 karakter olmalıdır."); return; }
    if (sifre !== tekrar) { setHata("Şifreler eşleşmiyor."); return; }
    setIslem(true);
    try { await onKaydet(sifre, tekrar); }
    catch (e) { setHata(e instanceof Error ? e.message : "Şifre kaydedilemedi."); }
    finally { setIslem(false); }
  }}>
    <div><h2 className="mb-1 text-base font-bold text-[var(--tema-yerel-giris-ana-metin-03)]">{baslik}</h2><p className="text-xs leading-relaxed text-[var(--tema-yerel-giris-yardimci-metin-01)]">Hesabınız için en az 6 karakterlik bir şifre belirleyin.</p></div>
    {[{ label: "Yeni şifre", value: sifre, setter: setSifre }, { label: "Yeni şifre (tekrar)", value: tekrar, setter: setTekrar }].map(({ label, value, setter }) => <label key={label} className="block text-xs font-semibold text-[var(--tema-yerel-giris-yardimci-metin-01)]">{label}<input type="password" autoComplete="new-password" required minLength={6} maxLength={128} disabled={islem} value={value} onChange={(e) => setter(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[var(--tema-yerel-giris-cizgi-03)] bg-[var(--tema-yerel-giris-kart-01)] px-3.5 py-2.5 text-sm text-[var(--tema-yerel-giris-ana-metin-03)] outline-none focus:border-[var(--tema-yerel-giris-vurgu-cizgi-01)]" /></label>)}
    {hata && <p role="alert" className="rounded-xl border border-[var(--tema-yerel-giris-islevsel-cizgi-01)] bg-[var(--tema-yerel-giris-islevsel-zemin-01)] px-3 py-2 text-xs text-[var(--tema-yerel-giris-islevsel-metin-02)]">{hata}</p>}
    <button type="submit" disabled={islem} className="w-full rounded-xl bg-[var(--tema-yerel-giris-vurgu-zemin-01)] py-3 text-sm font-bold text-[var(--tema-yerel-giris-ters-metin-01)] disabled:opacity-60">{islem ? "Kaydediliyor…" : buton}</button>
  </form>;
}
