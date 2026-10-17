// app/talepler/_components/UreticiRolGorunum.tsx
//
// TALEP MERKEZLİ ÜRETİM GÖRÜNÜMÜ — üretici rolleri için (eski talepler-v2).
//
// Temel ilke: aşama ayrı bir YER değil, talebin içindeki ADIM. Kullanıcı talepten
// çıkmadan tüm üretim sürecini yönetir; Senaryolar / Videolar / Soru Setleri
// sayfalarına gitmez.
//
// /talepler route'u yalnız üretici rollerde bu görünümü render eder. IU üretim
// görevlerini Senaryolar / Videolar / Soru Setleri sayfalarında yürütür.

"use client";

import { useRef, useMemo } from "react";
import { HataMesajiContainer } from "@/components/HataMesaji";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { useAuth } from "@/app/providers/AuthProvider";
import { ureticiDurumMesaji } from "@/lib/utils/durum/mesaj";
import { useTalepMerkezi } from "../_hooks/useTalepMerkezi";
import { IsListesi } from "./IsListesi";
import { TalepDetayi } from "./TalepDetayi";
import { YeniTalepAkordiyonu } from "./YeniTalepAkordiyonu";
import { IptalAkordiyonu } from "./IptalAkordiyonu";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

export function UreticiRolGorunum() {
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const merkez = useTalepMerkezi();
  const ilkYuklemeTamamlandiRef = useRef(false);

  if (!merkez.loading && !authYukleniyor && kullanici) {
    ilkYuklemeTamamlandiRef.current = true;
  }

  // Yalnız auth bekleme durumunda tam sayfa yükleme gösterilir.
  if (authYukleniyor || !kullanici) {
    return (
      <div className="min-h-screen bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-[var(--tema-yerel-uretim-cizgi-01)] border-t-[var(--tema-yerel-uretim-cizgi-04)] rounded-full animate-spin" />
          <div className="h-2 w-24 bg-[var(--tema-yerel-uretim-sayfa-zemini-08)] rounded" />
        </div>
      </div>
    );
  }

  const operasyonOzeti = useMemo(() => {
    return merkez.devamEdenler.reduce(
      (ozet, talep) => {
        const top = ureticiDurumMesaji(talep.durum_kodu, talep.created_at).top;
        if (top === "uretici") ozet.aksiyonBekleyen += 1;
        if (top === "icerik_ureticisi") ozet.uretimde += 1;
        if (top === "sistem") ozet.planlanan += 1;
        return ozet;
      },
      { aksiyonBekleyen: 0, uretimde: 0, planlanan: 0 },
    );
  }, [merkez.devamEdenler]);

  // Canlı liste veya önbellek özeti: kartlar ilk kareden (0.00 sn) stabil çizilir, zıplama olmaz
  const canliVeriHazir = merkez.talepler.length > 0 || !merkez.loading;
  const degerDevamEden = canliVeriHazir ? merkez.devamEdenler.length : (merkez.ozetSayilari?.devamEden ?? 0);
  const degerAksiyonBekleyen = canliVeriHazir ? operasyonOzeti.aksiyonBekleyen : (merkez.ozetSayilari?.aksiyonBekleyen ?? 0);
  const degerUretimde = canliVeriHazir ? operasyonOzeti.uretimde : (merkez.ozetSayilari?.uretimde ?? 0);
  const degerPlanlanan = canliVeriHazir ? operasyonOzeti.planlanan : (merkez.ozetSayilari?.planlanan ?? 0);

  const ozetKartlari = [
    {
      etiket: "Devam eden",
      deger: degerDevamEden,
      aciklama: "Aktif üretim akışı",
      vurgu: "var(--tema-uretim-ozet-devam-vurgu)",
      zemin: "var(--tema-yerel-uretim-islevsel-zemin-14)",
    },
    {
      etiket: "Sizi bekleyen",
      deger: degerAksiyonBekleyen,
      aciklama: "Karar veya içerik gerekli",
      vurgu: "var(--tema-uretim-ozet-bekleyen-vurgu)",
      zemin: "var(--tema-yerel-uretim-islevsel-zemin-15)",
    },
    {
      etiket: "Üreticide",
      deger: degerUretimde,
      aciklama: "İçerik üretimi sürüyor",
      vurgu: "var(--tema-uretim-ozet-ureticide-vurgu)",
      zemin: "var(--tema-yerel-uretim-islevsel-zemin-16)",
    },
    {
      etiket: "Planlanan",
      deger: degerPlanlanan,
      aciklama: "Yayın zamanı bekleyenler",
      vurgu: "var(--tema-uretim-ozet-planlanan-vurgu)",
      zemin: "var(--tema-yerel-uretim-islevsel-zemin-17)",
    },
  ];

  return (
    <>
      <div className="min-h-full bg-[var(--tema-yerel-uretim-sayfa-zemini-11)]">
      <div className="max-w-[1480px] mx-auto px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7 flex flex-col gap-5">
        <section aria-labelledby="talep-merkezi-baslik" className="flex flex-col gap-4">
            <SayfaYenileBasligi className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
              baslik={<div className="inline-flex items-center">
                <h1 id="talep-merkezi-baslik" className="text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-uretim-ana-metin-17)] md:text-[28px]">
                  Yayın Oluşturma ve Takip
                </h1>
                <SayfaRehberi anahtar="talep-merkezi" className="ml-1.5 -translate-y-2" />
              </div>}

              aciklama={<><p className="mt-1 text-xs text-[var(--tema-yerel-uretim-yardimci-metin-20)]">
                Yeni yayınlar açabilir ve yayınlarınızı takip edebilirsiniz.
              </p></>}
              aksiyon={<YenileButonu
                yenileniyor={merkez.yenileniyor}
                onYenile={() => merkez.veriCek({ manuel: true })}
                disabled={merkez.kararYukleniyor || merkez.videoYuzdesi !== null}
              />}

            />

          <div aria-label="Talep operasyon özeti" className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
            {ozetKartlari.map((kart) => (
              <div
                key={kart.etiket}
                className="min-w-0 rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-24)] bg-[var(--tema-yerel-uretim-kart-01)] px-3.5 py-3 shadow-[0_8px_24px_var(--tema-yerel-uretim-golge-01)] md:px-4 md:py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold"
                    style={{ color: kart.vurgu, backgroundColor: kart.zemin }}
                  >
                    {merkez.loading && !merkez.ozetSayilari && merkez.talepler.length === 0 ? (
                      <span className="inline-block h-5 w-5 animate-pulse rounded bg-current/20" />
                    ) : (
                      kart.deger
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold text-[var(--tema-yerel-uretim-ana-metin-18)]">{kart.etiket}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--tema-yerel-uretim-yardimci-metin-20)]">{kart.aciklama}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <YeniTalepAkordiyonu onTalepOlusturuldu={merkez.talepOlusturuldu} />

        {/* İki kolon yalnız geniş masaüstünde açılır. Daha dar pencerelerde iş
            kuyruğu ile takip paneli tam genişlikte üst üste kalır. */}
        <div className="grid grid-cols-1 gap-5 items-start xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* SOL — iş listesi */}
          <div className="flex flex-col gap-5">
            <IsListesi
              talepler={merkez.devamEdenler}
              seciliTalepId={merkez.seciliTalepId}
              rol={kullanici.rol}
              onSec={merkez.setSeciliTalepId}
            />
            <IptalAkordiyonu
              talepler={merkez.iptalEdilenler}
              formatTarih={merkez.formatTarih}
            />
          </div>

          {/* SAĞ — talep künyesi + üretim şeridi (adım kutuları A-7, aksiyonlar A-8) */}
          <div>
            <TalepDetayi
              talep={merkez.seciliTalep}
              detay={merkez.detay}
              detayYukleniyor={merkez.detayYukleniyor}
              rol={kullanici.rol}
              kullaniciId={kullanici.id}
              kararYukleniyor={merkez.kararYukleniyor}
              videoYuzdesi={merkez.videoYuzdesi}
              formatTarih={merkez.formatTarih}
              onHata={merkez.hata}
              onKarar={merkez.kararVer}
              onVideoYukle={merkez.hazirVideoYukle}
            />
          </div>
        </div>
      </div>
      </div>

      <HataMesajiContainer mesajlar={merkez.mesajlar} />
    </>
  );
}
