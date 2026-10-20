"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Coins, Sparkles } from "lucide-react";
import { EclubKisiStat } from "@/components/eclub/EclubKisiSayfa";
import { BannerRafi } from "@/components/eclub/BannerRafi";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import { TarihPill } from "@/components/ui/tarih-pill";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { EczanemBannerSkeleton } from "./EczanemAnaSayfaSkeleton";
import type { EclubBanner } from "@/lib/eclub/banner";

interface Props {
  kullaniciId: string;
  ad: string;
  firmaAdi?: string;
  firmaId?: string;
  eczaneId?: string;
  eczaneAdi?: string;
  yeniIcerikler: number;
  tamamlananlar: number;
  iceriklerHazir: boolean;
  yenileniyor: boolean;
  yenilemeAnahtari: number;
  onYenile: () => void | Promise<void>;
}

interface PuanYaniti {
  eczaneler: Array<{ urunler: Array<{ kullanilabilir_puan: number }> }>;
}

interface Okuma<T> {
  kullaniciId: string;
  yenilemeAnahtari: number;
  kapsam?: string;
  veri: T | null;
  hata: string | null;
}

export default function EczanemAnaSayfaUstBolum({ kullaniciId, ad, firmaAdi, firmaId, eczaneId, eczaneAdi, yeniIcerikler, tamamlananlar, iceriklerHazir, yenileniyor, yenilemeAnahtari, onYenile }: Props) {
  const [puan, setPuan] = useState<Okuma<number> | null>(null);
  const [banner, setBanner] = useState<Okuma<EclubBanner[]> | null>(null);
  const bannerKapsami = JSON.stringify([firmaId ?? null, firmaId ? eczaneId ?? null : null]);

  useEffect(() => {
    const controller = new AbortController();
    const temel = { kullaniciId, yenilemeAnahtari };
    void fetch("/eczanem/api/puanlar", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Puan özeti yüklenemedi.");
        const veri: PuanYaniti = await response.json();
        if (!Array.isArray(veri.eczaneler)) throw new Error("Puan özeti yüklenemedi.");
        return veri.eczaneler.reduce((toplam, eczane) => toplam + eczane.urunler.reduce((altToplam, urun) => {
          if (!Number.isFinite(urun.kullanilabilir_puan) || urun.kullanilabilir_puan < 0) throw new Error("Puan özeti yüklenemedi.");
          return altToplam + urun.kullanilabilir_puan;
        }, 0), 0);
      })
      .then(veri => { if (!controller.signal.aborted) setPuan({ ...temel, veri, hata: null }); })
      .catch(() => { if (!controller.signal.aborted) setPuan({ ...temel, veri: null, hata: "Puan özeti yüklenemedi." }); });

    return () => controller.abort();
  }, [kullaniciId, yenilemeAnahtari]);

  useEffect(() => {
    const controller = new AbortController();
    const temel = { kullaniciId, yenilemeAnahtari, kapsam: bannerKapsami };
    const sorgu = firmaId ? `?${new URLSearchParams({ firma_id: firmaId, eczane_id: eczaneId ?? "" })}` : "";
    void fetch(`/eczanem/api/bannerlar${sorgu}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Ana sayfa görselleri yüklenemedi.");
        const veri: { bannerlar: EclubBanner[] } = await response.json();
        if (!Array.isArray(veri.bannerlar)) throw new Error("Ana sayfa görselleri yüklenemedi.");
        return veri.bannerlar;
      })
      .then(veri => { if (!controller.signal.aborted) setBanner({ ...temel, veri, hata: null }); })
      .catch(() => { if (!controller.signal.aborted) setBanner({ ...temel, veri: null, hata: "Ana sayfa görselleri yüklenemedi." }); });
    return () => controller.abort();
  }, [kullaniciId, yenilemeAnahtari, firmaId, eczaneId, bannerKapsami]);

  // Yenileme sürerken aynı hesabın son sonucu görünür kalır; hesaplar arasında taşınmaz.
  const gorunenPuan = puan?.kullaniciId === kullaniciId ? puan : null;
  const gorunenBanner = banner?.kullaniciId === kullaniciId && banner.kapsam === bannerKapsami ? banner : null;
  const guncelPuan = puan?.kullaniciId === kullaniciId && puan.yenilemeAnahtari === yenilemeAnahtari ? puan : null;
  const guncelBanner = banner?.kullaniciId === kullaniciId && banner.kapsam === bannerKapsami && banner.yenilemeAnahtari === yenilemeAnahtari ? banner : null;
  const yukleniyor = yenileniyor || !guncelPuan || !guncelBanner;

  return <>
    <SayfaYenileBasligi
      baslik={<h1 className={firmaAdi ? "m-0 text-2xl font-extrabold tracking-[-0.03em] text-[var(--tema-yerel-eclub-ana-metin-06)]" : "m-0 text-lg font-extrabold text-[var(--tema-yerel-ana-sayfa-islevsel-metin-01)] md:text-xl"}>{firmaAdi || eczaneAdi || (ad ? `Merhaba ${ad}, 👋` : "Merhaba, 👋")}</h1>}
      aciklama={<p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[var(--tema-yerel-eclub-yardimci-metin-23)]">{firmaAdi ? `${eczaneAdi} · Ürünü seçerek ${firmaAdi} yayınlarını görüntüleyin.` : "Eczanenizden gelen yayınları izleyin, soruları yanıtlayın ve puan kazanın."}</p>}
      aksiyon={<YenileButonu yenileniyor={yukleniyor} onYenile={onYenile} />}
      altAksiyon={<TarihPill />}
    />
    {!gorunenBanner && <EczanemBannerSkeleton />}
    {!!gorunenBanner?.veri?.length && <BannerRafi key={gorunenBanner.veri.map(item => item.url).join("|")} bannerlar={gorunenBanner.veri} anaSayfa etiket={firmaAdi ? `${firmaAdi} Eczanem görselleri` : "Eczanem ana sayfa görselleri"} />}
    <section aria-label="Eczanem özetiniz" aria-busy={!iceriklerHazir || !guncelPuan} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <EclubKisiStat ikon={Sparkles} etiket="Yeni İçerikler" deger={iceriklerHazir ? yeniIcerikler : "—"} detay="Henüz başlamadığınız içerikler" detayKirilsin renk="var(--tema-yerel-ana-sayfa-islevsel-metin-02)" zemin="var(--tema-yerel-ana-sayfa-islevsel-zemin-01)" />
      <EclubKisiStat ikon={CheckCircle2} etiket="Tamamlananlar" deger={iceriklerHazir ? tamamlananlar : "—"} detay="Tamamladığınız öğrenme içerikleri" renk="var(--tema-yerel-ana-sayfa-islevsel-metin-03)" zemin="var(--tema-yerel-ana-sayfa-islevsel-zemin-02)" />
      <EclubKisiStat ikon={Coins} etiket="Kullanılabilir Puan" deger={gorunenPuan?.veri == null ? "—" : gorunenPuan.veri.toLocaleString("tr-TR")} detay="Eczane ve ürün bazında kullanılabilir" renk="var(--tema-yerel-ana-sayfa-islevsel-metin-04)" zemin="var(--tema-yerel-ana-sayfa-islevsel-zemin-03)" />
    </section>
    {(guncelPuan?.hata || guncelBanner?.hata) && <div role="alert" className="text-xs font-semibold text-[var(--tema-hata)]">
      {guncelPuan?.hata && <p>{guncelPuan.hata}</p>}
      {guncelBanner?.hata && <p>{guncelBanner.hata}</p>}
    </div>}
  </>;
}
