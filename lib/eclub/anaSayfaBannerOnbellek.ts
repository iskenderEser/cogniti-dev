"use client";

import { preload } from "react-dom";
import type { EclubBanner } from "./banner";

const kayitlar = new Map<string, { istek: Promise<EclubBanner[]>; zaman: number; veri?: EclubBanner[]; bekliyor: boolean }>();
const ONBELLEK_SURESI = 60_000;

/** Dönüşte en fazla beş dakikalık banner gösterilir; zaman yalnız ağ yanıtında yenilenir. */
export function anaSayfaBannerOnbelleginiOku(kullaniciId: string): EclubBanner[] | null {
  const kayit = kayitlar.get(kullaniciId);
  const yas = kayit ? Date.now() - kayit.zaman : -1;
  return kayit?.veri && yas >= 0 && yas < 300_000 ? kayit.veri : null;
}

/** Panel verisi beklenirken başlatılır; sonuç yalnız aynı oturum kullanıcısında paylaşılır. */
export function anaSayfaBannerlariniIste(kullaniciId: string, zorla = false): Promise<EclubBanner[]> {
  const mevcut = kayitlar.get(kullaniciId);
  if (mevcut && (mevcut.bekliyor || (!zorla && Date.now() - mevcut.zaman < ONBELLEK_SURESI))) return mevcut.istek;

  const kayit = { istek: Promise.resolve([] as EclubBanner[]), zaman: mevcut?.zaman ?? Date.now(), veri: mevcut?.veri, bekliyor: true };
  kayit.istek = fetch("/eclub/api/bannerlar", { cache: "no-store" })
    .then(async (res) => {
      const veri = await res.json();
      if (!res.ok) throw new Error(veri.hata ?? veri.error ?? "Ana sayfa bannerları okunamadı.");
      const bannerlar = veri.bannerlar as EclubBanner[];
      if (bannerlar[0]?.url) preload(bannerlar[0].url, { as: "image", fetchPriority: "high" });
      kayit.veri = bannerlar;
      kayit.bekliyor = false;
      kayit.zaman = Date.now();
      return bannerlar;
    })
    .catch((error) => {
      if (kayitlar.get(kullaniciId) === kayit) kayitlar.delete(kullaniciId);
      throw error;
    });
  kayitlar.set(kullaniciId, kayit);
  return kayit.istek;
}
