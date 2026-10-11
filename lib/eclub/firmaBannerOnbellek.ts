"use client";

import { preload } from "react-dom";
import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import type { EclubBanner } from "./banner";

const cache = sayfaOkumaOnbellegiOlustur<EclubBanner[]>("firma_banner");
const anahtar = (kullaniciId: string, firma: string) => `${kullaniciId}:${firma}`;

export function firmaBannerOnbelleginiOku(kullaniciId: string, firma: string) {
  const veri = cache.oku(anahtar(kullaniciId, firma), 300_000);
  return Array.isArray(veri) ? veri : null;
}

export function firmaBannerlariniIste(kullaniciId: string, firma: string) {
  return cache.iste(anahtar(kullaniciId, firma), async () => {
    const res = await fetch(`/eclub/api/bannerlar?firma=${encodeURIComponent(firma)}`, { cache: "no-store" });
    const veri = await res.json();
    if (!res.ok) throw new Error(veri.hata ?? veri.error ?? "Firma bannerları okunamadı.");
    if (!Array.isArray(veri.bannerlar)) throw new Error("Firma bannerları okunamadı.");
    const bannerlar = veri.bannerlar as EclubBanner[];
    if (bannerlar[0]?.url) preload(bannerlar[0].url, { as: "image", fetchPriority: "high" });
    return bannerlar;
  });
}
