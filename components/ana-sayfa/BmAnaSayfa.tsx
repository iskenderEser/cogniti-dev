// components/ana-sayfa/BmAnaSayfa.tsx
"use client";

import { TarihPill } from "@/components/ui/tarih-pill";

import { ROL_ADLARI } from "@/lib/utils/roller";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useHataMesaji } from "@/components/HataMesaji";
import SahaVideoRaflari from "@/components/ana-sayfa/SahaVideoRaflari";
import { SahaAnaSayfaVideo } from "@/lib/video/anaSayfaVideolari";
import { useHbstoreTakvim } from "@/hooks/useHbstoreTakvim";
import { PeriyotButonlari } from "@/components/ui/periyot-butonlari";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import type { BmStatIstatistikleri, BmStatSecimi } from "@/lib/utils/anaSayfa/bm";
import { PERIYOTLAR, type Periyot } from "@/lib/utils/raporUtils";

import type { AuthKullanici } from "@/types/auth";

interface BmVeri {
  istatistikler: BmStatIstatistikleri;
  secim: BmStatSecimi;
  kullaniciId: string;
  videolar?: SahaAnaSayfaVideo[];
}

interface Props {
  user: AuthKullanici;
  adSoyad: string;
}

export default function BmAnaSayfa({ user, adSoyad }: Props) {
  const router = useRouter();
  const [bmVeri, setBmVeri] = useState<BmVeri | null>(null);
  const [loading, setLoading] = useState(true);
  const [periyot, setPeriyot] = useState<Periyot>("bu_hafta");
  const [aracTuru, setAracTuru] = useState<BmStatSecimi["aracTuru"]>("tumu");
  const [veriHatasi, setVeriHatasi] = useState<string | null>(null);
  const etkilesimKilidi = useRef(new Set<string>());
  const { hata } = useHataMesaji();
  const { takvim } = useHbstoreTakvim();

  useEffect(() => {
    const controller = new AbortController();
    let aktif = true;
    const veriCek = async () => {
      setLoading(true);
      setVeriHatasi(null);
      try {
        const query = new URLSearchParams({ periyot, arac_turu: aracTuru });
        const res = await fetch(`/ana-sayfa/api?${query}`, { signal: controller.signal });
        const data = await res.json();
        if (!aktif) return;
        if (!res.ok) {
          const mesaj = data.hata ?? "Veriler yüklenemedi.";
          setVeriHatasi(mesaj);
          hata(mesaj, data.adim, data.detay);
          return;
        }
        if (!data.istatistikler || data.secim?.periyot !== periyot || data.secim?.aracTuru !== aracTuru) {
          throw new Error("Seçili dönemin istatistikleri alınamadı.");
        }
        setBmVeri((onceki) => ({
          ...data,
          kullaniciId: user.id,
          // Zaman ve tür seçimi kataloğu yenilemez; yerel etkileşimler korunur.
          videolar: onceki?.kullaniciId === user.id ? onceki.videolar : data.videolar,
        }));
      } catch (err) {
        if (!aktif || controller.signal.aborted) return;
        const mesaj = err instanceof Error ? err.message : "Veriler yüklenemedi.";
        setVeriHatasi(mesaj);
        hata(mesaj);
      } finally {
        if (aktif) setLoading(false);
      }
    };
    void veriCek();
    return () => { aktif = false; controller.abort(); };
  }, [user.id, periyot, aracTuru, hata]);


  const etkilesimYap = async (tur: "begeni" | "favori", event: MouseEvent, yayinId: string) => {
    event.stopPropagation();
    const kilit = `${tur}:${yayinId}`;
    if (etkilesimKilidi.current.has(kilit)) return;
    etkilesimKilidi.current.add(kilit);
    try {
      const yanit = await fetch(`/izle/api/${tur}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yayin_id: yayinId }),
      });
      const sonuc = await yanit.json();
      if (!yanit.ok) throw new Error(sonuc.hata ?? "İşlem tamamlanamadı.");
      const bayrak = tur === "begeni" ? "begeni_mi" : "favori_mi";
      const sayac = tur === "begeni" ? "begeni_sayisi" : "favori_sayisi";
      if (typeof sonuc[bayrak] !== "boolean") throw new Error("İşlem sonucu alınamadı.");
      setBmVeri((onceki) => onceki ? {
        ...onceki,
        videolar: onceki.videolar?.map((video) => {
          if (video.yayin_id !== yayinId || video[bayrak] === sonuc[bayrak]) return video;
          return {
            ...video,
            [bayrak]: sonuc[bayrak],
            [sayac]: Math.max(0, video[sayac] + (sonuc[bayrak] ? 1 : -1)),
          };
        }),
      } : onceki);
    } catch (err) {
      hata(err instanceof Error ? err.message : "Beğeni veya favori işlemi başarısız.");
    } finally {
      etkilesimKilidi.current.delete(kilit);
    }
  };

  const gecerliVeri = bmVeri?.kullaniciId === user.id ? bmVeri : null;
  // Yeni seçim yüklenirken son başarılı değerler ekranda kalır.
  const istat = gecerliVeri?.istatistikler ?? null;
  const sayi = (deger: number) => deger.toLocaleString("tr-TR");
  const kartlar = [
    { label: "Öğrenmeye Katılım", value: istat ? `${sayi(istat.ogrenmeye_katilan_utt)} / ${sayi(istat.toplam_utt)}` : "—", sub: istat ? `${istat.katilim_yuzdesi === null ? "Katılım oranı hesaplanamıyor" : `%${sayi(istat.katilim_yuzdesi)} katılım`} · Aktif UTT` : "", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-05)", href: "/raporlar/bm" },
    { label: "Tamamlanan Öğrenme", value: istat ? sayi(istat.tamamlanan_ogrenme) : "—", sub: istat ? "Tamamlanan oturum · Tekrarlar dahil" : "", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-06)", href: "/raporlar/bm" },
    { label: "Öneri Takibi", value: istat ? `${sayi(istat.tamamlanan_oneri)} / ${sayi(istat.toplam_oneri)}` : "—", sub: istat ? `${sayi(istat.bekleyen_oneri)} bekleyen · ${sayi(istat.suresi_gecmis_oneri)} süresi geçmiş` : "", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-07)", href: "/oneriler" },
    { label: "Net Saha Puanı", value: istat ? sayi(istat.net_saha_puani) : "—", sub: istat ? `${sayi(istat.kazanilan_puan)} kazanım · ${sayi(istat.kaybedilen_puan)} kayıp` : "", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-08)", href: "/raporlar/bm" },
  ];
  const ad = adSoyad.split(" ")[0] || "BM";

  return (
    <div className="max-w-6xl mx-auto px-3 py-4 pb-20 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">

      {/* Karşılama */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] m-0">Merhaba {ad}, 👋</h1>
          <p className="text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1">{ROL_ADLARI["bm"]}</p>
        </div>

        <div className="flex items-start gap-1.5 flex-wrap md:flex-col md:items-end">
          {takvim && (() => {
            const kalanGun = Math.floor(takvim.kalanMs / (24 * 60 * 60 * 1000));
            const onGunKala = !takvim.acik && kalanGun <= 10;
            return (
              <button
                type="button"
                onClick={() => router.push("/store")}
                className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border transition-all hover:opacity-85 shadow-xs cursor-pointer select-none whitespace-nowrap text-center"
                style={{
                  backgroundColor: takvim.acik ? "var(--tema-yerel-ana-sayfa-islevsel-zemin-04)" : onGunKala ? "var(--tema-yerel-ana-sayfa-eylem-zemin-01)" : "var(--tema-yerel-ana-sayfa-islevsel-zemin-05)",
                  borderColor: takvim.acik ? "var(--tema-yerel-ana-sayfa-islevsel-cizgi-01)" : onGunKala ? "var(--tema-yerel-ana-sayfa-cizgi-03)" : "var(--tema-yerel-ana-sayfa-islevsel-cizgi-02)",
                  color: takvim.acik ? "var(--tema-yerel-ana-sayfa-islevsel-metin-09)" : onGunKala ? "var(--tema-yerel-ana-sayfa-ters-metin-01)" : "var(--tema-yerel-ana-sayfa-islevsel-metin-10)",
                }}
                title={
                  takvim.acik
                    ? `Store Günleri açık · Kapanışa ${takvim.kalanSureMetni} kaldı`
                    : `Sonraki sipariş dönemi: ${takvim.sonrakiDonemEtiketi} (${takvim.kalanSureMetni} kaldı)`
                }
              >
                {!onGunKala && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: takvim.acik ? "var(--tema-yerel-ana-sayfa-islevsel-zemin-06)" : "var(--tema-yerel-ana-sayfa-islevsel-zemin-07)",
                      boxShadow: takvim.acik ? "0 0 6px var(--tema-yerel-ana-sayfa-islevsel-golge-01)" : "none",
                    }}
                  />
                )}
                <span>{takvim.navMetni}</span>
              </button>
            );
          })()}

          <TarihPill />
        </div>
      </div>

      {/* Stat kartlar */}
      <div role="status" aria-live="polite" className="mb-2 h-4 truncate text-xs leading-4 text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)]" title={veriHatasi ?? undefined}>
        {loading ? "İstatistikler yükleniyor…" : veriHatasi ?? ""}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5" aria-busy={loading}>
        {kartlar.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => router.push(k.href)}
            className="bg-[var(--tema-yerel-ana-sayfa-kart-01)] border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] rounded-xl p-3 md:p-5 text-left transition-shadow duration-150 hover:shadow-md"
            style={{ borderLeft: `3px solid ${k.renk}` }}
          >
            <div className="text-xs font-bold text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] uppercase tracking-wide mb-2">{k.label}</div>
            <div className="truncate text-2xl md:text-3xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] leading-none" title={k.value}>{k.value}</div>
            <div className="hidden md:block min-h-4 truncate text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1.5" title={k.sub || undefined}>{k.sub || "\u00a0"}</div>
          </button>
        ))}
      </div>

      {/* Yayın önerme yönlendirmesi */}
      <div className="mb-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/yayindaki-videolar")}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--tema-yerel-ana-sayfa-eylem-zemin-02)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-ana-sayfa-ters-metin-02)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-ana-sayfa-eylem-zemin-03)]"
        >
          <Plus size={15} strokeWidth={2.5} aria-hidden="true" /> Yayın Öneriniz
        </button>
      </div>

      {/* Videolar */}
      <div>
        <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full min-w-0 sm:w-auto">
            <UttYayinTuruToggle yayinlar={gecerliVeri?.videolar ?? []} deger={aracTuru} onDegistir={setAracTuru} />
          </div>
          <div className="flex min-w-0 sm:ml-auto sm:justify-end">
            <PeriyotButonlari secenekler={PERIYOTLAR} deger={periyot} onDegistir={setPeriyot} ariaLabel="BM istatistik dönemi" />
          </div>
        </div>
        <SahaVideoRaflari
          videolar={gecerliVeri?.videolar ?? []}
          yayinTuru={aracTuru}
          onYayinTuruDegistir={setAracTuru}
          yayinTuruFiltresiGoster={false}
          onVideoSec={(video) => {
            const query = new URLSearchParams({ donus: "ana-sayfa" });
            if (video.gelen_challenge_id) query.set("challenge_id", video.gelen_challenge_id);
            router.push(`/challenge-club/izle/${video.yayin_id}?${query}`);
          }}
          onBegeni={(event, yayinId) => { void etkilesimYap("begeni", event, yayinId); }}
          onFavori={(event, yayinId) => { void etkilesimYap("favori", event, yayinId); }}
          kapsulFiltre
          bosBasliklariGoster
          kisiselIzlemeBasliklari
          favoriRafiGoster
        />
      </div>
    </div>
  );
}
