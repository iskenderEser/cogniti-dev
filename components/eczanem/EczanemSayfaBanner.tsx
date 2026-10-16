"use client";

import { useEffect, useState } from "react";
import { BannerRafi } from "@/components/eclub/BannerRafi";
import { ECZANEM_BANNER_ALANLARI, type EclubBanner } from "@/lib/eclub/banner";

export default function EczanemSayfaBanner({ alan }: { alan: keyof typeof ECZANEM_BANNER_ALANLARI }) {
  const [sonuc, setSonuc] = useState<{ alan: string; bannerlar: EclubBanner[] } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/eczanem/eczane/api/bannerlar?alan=${alan}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const veri = await res.json();
        if (!res.ok) throw new Error(veri.hata ?? "Sayfa bannerları okunamadı.");
        if (!controller.signal.aborted) setSonuc({ alan, bannerlar: veri.bannerlar });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setSonuc({ alan, bannerlar: [] });
          console.error("Eczanem sayfa bannerları:", error);
        }
      });
    return () => controller.abort();
  }, [alan]);

  if (!sonuc || sonuc.alan !== alan || !sonuc.bannerlar.length) return null;
  return <BannerRafi key={`${alan}-${sonuc.bannerlar.map((banner) => banner.url).join("|")}`}
    bannerlar={sonuc.bannerlar} anaSayfa etiket={`Eczanem · ${ECZANEM_BANNER_ALANLARI[alan]}`} />;
}
