"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { EczanemSidebarAgaci } from "../_types";

const agaclar = new Map<string, EczanemSidebarAgaci>();
const dinleyiciler = new Set<() => void>();
const aboneOl = (dinleyici: () => void) => { dinleyiciler.add(dinleyici); return () => { dinleyiciler.delete(dinleyici); }; };
const sunucuKaydi = () => null;
const bosAgac: EczanemSidebarAgaci = [];

export function eczanemGezinmeAgaciniOku(kullaniciId?: string) {
  return kullaniciId ? agaclar.get(kullaniciId) ?? null : null;
}

export function eczanemGezinmeAgaciniYaz(kullaniciId: string, agac: EczanemSidebarAgaci | null) {
  if (agac) agaclar.set(kullaniciId, agac); else agaclar.delete(kullaniciId);
  dinleyiciler.forEach(dinleyici => dinleyici());
}

/** Menü sayfa değişiminde korunur; ikincil sayfalarda mevcut üye API'sinden yeniden doğrulanır. */
export default function useEczanemGezinme(kullaniciId?: string, sayfaAgaci?: EczanemSidebarAgaci) {
  const kayit = useSyncExternalStore(aboneOl, useCallback(() => eczanemGezinmeAgaciniOku(kullaniciId), [kullaniciId]), sunucuKaydi);
  useEffect(() => {
    if (!kullaniciId || sayfaAgaci !== undefined) return;
    const controller = new AbortController();
    void fetch("/eczanem/api/videolar", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Eczane gezintisi yüklenemedi.");
        const veri: { agac: EczanemSidebarAgaci } = await response.json();
        if (!Array.isArray(veri.agac)) throw new Error("Eczane gezintisi yüklenemedi.");
        if (!controller.signal.aborted) eczanemGezinmeAgaciniYaz(kullaniciId, veri.agac);
      })
      .catch(() => { if (!controller.signal.aborted) eczanemGezinmeAgaciniYaz(kullaniciId, null); });
    return () => controller.abort();
  }, [kullaniciId, sayfaAgaci]);
  return sayfaAgaci ?? kayit ?? bosAgac;
}
