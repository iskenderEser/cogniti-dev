"use client";

import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import { eclubPerformansDonemi, type PerformansVerisi } from "./performans";

const cache = sayfaOkumaOnbellegiOlustur<PerformansVerisi>("performans");
const anahtar = (kullaniciId: string, firmaId: string, urunId: string) => `${kullaniciId}:${firmaId}:${urunId}:${eclubPerformansDonemi().kod}`;

export function performansOnbelleginiOku(kullaniciId: string, firmaId: string, urunId: string) {
  return cache.oku(anahtar(kullaniciId, firmaId, urunId), 300_000);
}

export function performansVerisiniIste(kullaniciId: string, firmaId: string, urunId: string) {
  return cache.iste(anahtar(kullaniciId, firmaId, urunId), async () => {
    const res = await fetch(`/eclub/api/performans?firma_id=${encodeURIComponent(firmaId)}&urun_id=${encodeURIComponent(urunId)}`, { cache: "no-store" });
    const veri = await res.json();
    if (!res.ok) throw new Error(veri.hata ?? veri.error ?? "Performans bilgileri yüklenemedi.");
    if (!veri.donem || !Array.isArray(veri.satirlar) || !veri.ozet) throw new Error("Performans verisi geçersiz.");
    return veri as PerformansVerisi;
  });
}
