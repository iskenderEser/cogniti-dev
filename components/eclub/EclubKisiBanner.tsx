"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import type { EclubBanner } from "@/lib/eclub/banner";
import { BannerRafi } from "./BannerRafi";
import { useAuth } from "@/app/providers/AuthProvider";
import { anaSayfaBannerlariniIste, anaSayfaBannerOnbelleginiOku } from "@/lib/eclub/anaSayfaBannerOnbellek";
import { firmaBannerlariniIste, firmaBannerOnbelleginiOku } from "@/lib/eclub/firmaBannerOnbellek";

function FirmaBannerlari({ firmaId }: { firmaId: string | null }) {
  const { kullanici } = useAuth();
  const kullaniciId = kullanici?.id;
  const pathname = usePathname();
  const anaSayfa = !firmaId && pathname === "/eclub/ana-sayfa";
  const firmaYayinlari = !!firmaId && pathname.endsWith("/yayinlar");
  const [bannerlar, setBannerlar] = useState<EclubBanner[]>(() => anaSayfa && kullaniciId ? anaSayfaBannerOnbelleginiOku(kullaniciId) ?? [] : firmaYayinlari && kullaniciId && firmaId ? firmaBannerOnbelleginiOku(kullaniciId, firmaId) ?? [] : []);
  useEffect(() => {
    const controller = new AbortController();
    const istek = anaSayfa && kullaniciId
      ? anaSayfaBannerlariniIste(kullaniciId)
      : firmaYayinlari && kullaniciId && firmaId ? firmaBannerlariniIste(kullaniciId, firmaId)
      : fetch(`/eclub/api/bannerlar${firmaId ? `?firma=${encodeURIComponent(firmaId)}` : ""}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const veri = await res.json();
        if (!res.ok) throw new Error(veri.hata ?? veri.error ?? "Firma bannerları okunamadı.");
        return veri.bannerlar as EclubBanner[];
      });
    void istek.then((sonuc) => {
      if (!controller.signal.aborted) setBannerlar(sonuc);
    }).catch((error) => {
        if (!controller.signal.aborted) { setBannerlar([]); console.error("E-Club firma bannerları:", error); }
      });
    return () => controller.abort();
  }, [firmaId, kullaniciId, anaSayfa, firmaYayinlari]);
  if (!bannerlar.length) return null;
  return <BannerRafi key={bannerlar.map((b) => b.url).join("|")} bannerlar={bannerlar} anaSayfa={anaSayfa || firmaYayinlari} />;
}

/** Ana sayfa Hapbilgi'nin, firma sayfası yalnız ilgili firmanın yayınlanmış görsellerini okur. */
export default function EclubKisiBanner() {
  const { firma_id: firmaId } = useParams<{ firma_id?: string }>();
  const yol = usePathname();
  if (firmaId) return <FirmaBannerlari key={firmaId} firmaId={firmaId} />;
  return yol === "/eclub/ana-sayfa" || yol === "/eclub/panel" ? <FirmaBannerlari key="ana-sayfa" firmaId={null} /> : null;
}
