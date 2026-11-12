"use client";

import { PeriyotButonlari } from "@/components/ui/periyot-butonlari";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import type { UyeGonderimOzeti, UyeGonderimRafi } from "@/lib/eczanem/uyeGonderimOzeti";
import { Building2, Send, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EczanemYayinDonemiSecimi, yayinDonemi } from "../../_components/EczanemYayinDonemiSecimi";
import { EczanemYayinSayfasi, OzetKarti, OzetKartlari } from "../../_components/EczanemYayinSayfasi";
import { UyeYayinKarti } from "../../_components/UyeYayinKarti";

type GonderimFiltresi = "tumu" | "gonderilebilir" | "gonderilen";
const rafBasliklari: Record<GonderimFiltresi, string> = {
  tumu: "Tüm Yayınlar",
  gonderilebilir: "Gönderime Hazır Yayınlar",
  gonderilen: "Üyelere Gönderilen Yayınlar",
};

const ozetYolu = "/eczanem/utt/api/uye-gonderim-ozeti";

export default function UyelereGonderilenYayinlarPage() {
  const [donem, setDonem] = useState(() => yayinDonemi(new Date()));
  const [gonderimFiltresi, setGonderimFiltresi] = useState<GonderimFiltresi>("tumu");
  const [yayinTuru, setYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [ozet, setOzet] = useState<UyeGonderimOzeti | null>(null);
  const [yenileniyor, setYenileniyor] = useState(true);
  const [ozetHatasi, setOzetHatasi] = useState(false);
  const [raf, setRaf] = useState<(UyeGonderimRafi & { donem: string }) | null>(null);
  const [rafHatasi, setRafHatasi] = useState<string | null>(null);
  const [rafYukleniyor, setRafYukleniyor] = useState(true);
  const [yenileme, setYenileme] = useState(0);
  const donemAnahtari = `${donem.yil}-${donem.ay}`;

  const ozetYenile = useCallback(async (signal?: AbortSignal) => {
    setYenileniyor(true);
    setOzetHatasi(false);
    try {
      const yanit = await fetch(ozetYolu, { cache: "no-store", signal });
      if (!yanit.ok) throw new Error("Üye gönderi özeti yüklenemedi.");
      const veri: UyeGonderimOzeti = await yanit.json();
      if (!signal?.aborted) setOzet(veri);
    } catch {
      if (!signal?.aborted) {
        setOzet(null);
        setOzetHatasi(true);
      }
    } finally {
      if (!signal?.aborted) setYenileniyor(false);
    }
  }, []);

  useEffect(() => {
    const denetleyici = new AbortController();
    void ozetYenile(denetleyici.signal);
    return () => denetleyici.abort();
  }, [ozetYenile, yenileme]);

  useEffect(() => {
    const denetleyici = new AbortController();
    const { signal } = denetleyici;
    async function rafiGetir() {
      setRafYukleniyor(true);
      setRafHatasi(null);
      try {
        const params = new URLSearchParams({ yil: donem.yil, ay: donem.ay });
        const yanit = await fetch(`${ozetYolu}?${params}`, { cache: "no-store", signal });
        if (!yanit.ok) throw new Error("Yayın listesi yüklenemedi.");
        const veri: UyeGonderimRafi = await yanit.json();
        if (!signal.aborted) setRaf({ ...veri, donem: donemAnahtari });
      } catch {
        if (!signal.aborted) setRafHatasi(donemAnahtari);
      } finally {
        if (!signal.aborted) setRafYukleniyor(false);
      }
    }
    void rafiGetir();
    return () => denetleyici.abort();
  }, [donem.ay, donem.yil, donemAnahtari, yenileme]);

  const seciliRaf = raf?.donem === donemAnahtari ? raf : null;
  const yayinlar = seciliRaf?.yayinlar ?? [];
  const hazir = yayinlar.filter((yayin) => yayin.gonderimeHazir);
  const gonderilen = yayinlar.filter((yayin) => yayin.gonderenEczaneSayisi > 0);
  const durumFiltreli = { tumu: yayinlar, gonderilebilir: hazir, gonderilen }[gonderimFiltresi];
  const gorunenYayinlar = yayinTuru === "tumu" ? durumFiltreli : durumFiltreli.filter((yayin) => yayin.arac_turu === yayinTuru);
  const yilSecenekleri = [...new Set([...(raf?.yillar ?? []), donem.yil])].map((yil) => ({ deger: yil, etiket: yil }));
  const rafHataVar = rafHatasi === donemAnahtari;

  return (
    <EczanemYayinSayfasi
      baslik="Üyelere Gönderilen Yayınlar"
      aksiyon={<YenileButonu yenileniyor={yenileniyor || rafYukleniyor} onYenile={() => setYenileme((sira) => sira + 1)} />}
    >
      <OzetKartlari>
        <OzetKarti ikon={Building2} etiket="Gönderim Yapan Eczane Sayısı" deger={ozet?.eczaneSayisi ?? null}
          detay="Bu ay Eczanem üyelerine yayın gönderen farklı eczaneler."
          renk="var(--tema-yerel-eczanem-eylem-metin-01)" zemin="var(--tema-yerel-eczanem-secim-zemin-01)" />
        <OzetKarti ikon={UsersRound} etiket="Gönderilen Üye Sayısı" deger={ozet?.uyeSayisi ?? null}
          detay="Bu ay en az bir yayın gönderilen farklı Eczanem üyeleri."
          renk="var(--tema-yerel-eczanem-islevsel-metin-02)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-01)" />
        <OzetKarti ikon={Send} etiket="Gönderi Sayısı" deger={ozet?.gonderiSayisi ?? null}
          detay="Bu ay Eczanem üyelerine yapılan toplam yayın gönderisi."
          renk="var(--tema-yerel-eczanem-islevsel-metin-03)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-02)" />
      </OzetKartlari>
      {ozetHatasi && <p role="alert" className="text-sm text-[var(--tema-yerel-eczanem-islevsel-metin-04)]">Üye gönderi özeti yüklenemedi. Yenile düğmesiyle tekrar deneyin.</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriyotButonlari<GonderimFiltresi>
          secenekler={[
            { key: "tumu", label: seciliRaf ? `Tümü ${yayinlar.length}` : "Tümü" },
            { key: "gonderilebilir", label: seciliRaf ? `Gönderime Hazır ${hazir.length}` : "Gönderime Hazır" },
            { key: "gonderilen", label: seciliRaf ? `Gönderilenler ${gonderilen.length}` : "Gönderilenler" },
          ]}
          deger={gonderimFiltresi}
          onDegistir={setGonderimFiltresi}
          ariaLabel="Gönderim durumu"
          className="w-fit flex-none"
        />
      </div>

      <section aria-busy={rafYukleniyor}>
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <UttYayinTuruToggle yayinlar={durumFiltreli} deger={yayinTuru} onDegistir={setYayinTuru}
            sayilariGoster={!!seciliRaf} className="h-10 min-w-0 [scrollbar-width:none]" />
          <EczanemYayinDonemiSecimi donem={donem}
            yilSecenekleri={yilSecenekleri}
            onDegistir={(degisiklik) => setDonem((onceki) => ({ ...onceki, ...degisiklik }))} />
        </div>
        <div className="mb-3">
          <h2 className="text-base font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-03)]">{rafBasliklari[gonderimFiltresi]}</h2>
          {seciliRaf && !rafHataVar && <p className="mt-0.5 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-01)]">{gorunenYayinlar.length} yayın gösteriliyor</p>}
        </div>
        {rafHataVar || !seciliRaf || !gorunenYayinlar.length ? (
          <div role={rafHataVar ? "alert" : "status"} className="rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-05)] bg-[var(--tema-yerel-eczanem-kart-01)] px-4 py-14 text-center text-sm font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">
            {rafHataVar ? "Yayın listesi yüklenemedi. Yenile düğmesiyle tekrar deneyin." : seciliRaf ? "Bu seçimde yayın bulunmuyor." : "Yayınlar yükleniyor…"}
          </div>
        ) : (
          <MobilYayinAkisi
            kayitlar={gorunenYayinlar}
            kayitAnahtari={(yayin) => yayin.yayin_id}
            renderKart={(yayin) => <UyeYayinKarti yayin={yayin} />}
            sayacGoster={false}
            sifirlamaAnahtari={`${donemAnahtari}-${gonderimFiltresi}-${yayinTuru}`}
            masaustuIcerik={<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {gorunenYayinlar.map((yayin) => <UyeYayinKarti key={yayin.yayin_id} yayin={yayin} />)}
            </div>}
          />
        )}
      </section>
    </EczanemYayinSayfasi>
  );
}
