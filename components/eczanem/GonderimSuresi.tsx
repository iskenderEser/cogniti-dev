"use client";
import { useEffect, useState } from "react";
import { eczanemGonderimSuresi } from "@/lib/eczanem/gonderimSuresi";

/** Kartlar ve seçim listesi aynı saati kullanır; süre dolunca açık ekran da güncellenir. */
export function useEczanemGonderimSaati(baslangiclar: readonly (string | null | undefined)[] = []) {
  const [simdi,setSimdi] = useState(() => Date.now());
  const anahtar = JSON.stringify(baslangiclar);
  useEffect(() => {
    const bitisler = (JSON.parse(anahtar) as (string | null)[]).map(b => eczanemGonderimSuresi(b).bitis).filter((b): b is number => b !== null);
    let zamanlayici: number;
    const yenile = () => {
      window.clearTimeout(zamanlayici);
      const an = Date.now();
      setSimdi(an);
      const siradaki = Math.min(...bitisler.filter(b => b > an));
      zamanlayici = window.setTimeout(yenile,Math.max(1,Math.min(60000,siradaki-an)));
    };
    zamanlayici = window.setTimeout(yenile,0);
    window.addEventListener("focus",yenile);
    document.addEventListener("visibilitychange",yenile);
    return () => { window.clearTimeout(zamanlayici);window.removeEventListener("focus",yenile);document.removeEventListener("visibilitychange",yenile); };
  },[anahtar]);
  return simdi;
}
export function GonderimSuresi({ baslangic,simdi }: { baslangic?: string | null; simdi: number }) {
  const durum = eczanemGonderimSuresi(baslangic,simdi);
  const bitis = durum.bitis ? new Date(durum.bitis).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
  return <span className="block text-[10px] font-normal leading-4 text-[var(--tema-hoyk-gonderim-metin)]" title={bitis ? `Üreticiden çıkıştan itibaren 30 gün. Son gönderim: ${bitis}` : durum.metin}>
    {durum.metin}
    {bitis && <time className="ml-1 text-[var(--tema-ikincil-metin)]" dateTime={new Date(durum.bitis!).toISOString()}> · Son: {bitis}</time>}
  </span>;
}
