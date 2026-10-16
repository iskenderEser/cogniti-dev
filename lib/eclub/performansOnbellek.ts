"use client";

import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import { eclubPerformansDonemi, type PerformansVerisi } from "./performans";

const cache = sayfaOkumaOnbellegiOlustur<PerformansVerisi>("performans");
const anahtar = (kullaniciId: string, firmaId: string, urunId: string, donemKodu: string) => `${kullaniciId}:${firmaId}:${urunId}:${donemKodu}`;

export function performansOnbelleginiOku(kullaniciId: string, firmaId: string, urunId: string, donemKodu = eclubPerformansDonemi().kod) {
  return cache.oku(anahtar(kullaniciId, firmaId, urunId, donemKodu), 300_000);
}

export function performansVerisiniIste(kullaniciId: string, firmaId: string, urunId: string, donemKodu?: string) {
  const kod = donemKodu ?? eclubPerformansDonemi().kod;
  return cache.iste(anahtar(kullaniciId, firmaId, urunId, kod), async () => {
    const donemSorgusu = donemKodu ? `&donem=${encodeURIComponent(donemKodu)}` : "";
    const res = await fetch(`/eclub/api/performans?firma_id=${encodeURIComponent(firmaId)}&urun_id=${encodeURIComponent(urunId)}${donemSorgusu}`, { cache: "no-store" });
    const veri = await res.json();
    if (!res.ok) throw new Error(veri.hata ?? veri.error ?? "Performans bilgileri yüklenemedi.");
    if (!veri.donem || !Array.isArray(veri.satirlar) || !veri.ozet) throw new Error("Performans verisi geçersiz.");
    if (veri.donem.kod !== kod) throw new Error("Seçilen dönemin performans verisi alınamadı.");
    return veri as PerformansVerisi;
  });
}
