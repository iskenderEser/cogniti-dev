// components/ana-sayfa/YoneticiAnaSayfa.tsx
"use client";

import { TarihPill } from "@/components/ui/tarih-pill";

import { ROL_ADLARI } from "@/lib/utils/roller";

import { useEffect, useMemo, useState } from "react";
import { useHataMesaji } from "@/components/HataMesaji";
import VideoOynatici from "@/components/izle/VideoOynatici";
import VideoBolumu from "@/components/ana-sayfa/VideoBolumu";
import { UttYayinKartIskeletleri } from "@/components/yayin/UttYayinListeOrtaklari";
import HayaletTanburSecici, { type TanburBolum } from "@/components/navigasyon/HayaletTanburSecici";
import { AnaSayfaVideo } from "@/lib/video/anaSayfaVideolari";
import { haftaBaslangici } from "@/lib/zaman/kontrol";

import type { AuthKullanici } from "@/types/auth";

interface HaftaninEni {
  kullanici_id: string;
  ad: string;
  soyad: string;
  fotograf_url: string | null;
  toplam_puan: number;
}

interface YoneticiVeri {
  kullaniciId: string;
  rol: string;
  haftanin_enleri: HaftaninEni[];
  istatistikler: {
    yayinda_toplam_video: number;
    toplam_izleme_sayisi: number;
    en_cok_izlenen_video: string | null;
    en_cok_izleyen_takim: string | null;
    en_cok_izleyen_bolge: string | null;
    en_cok_izleyen_utt: string | null;
  };
  videolar?: AnaSayfaVideo[];
}

interface Props {
  user: AuthKullanici;
  rol: string;
  adSoyad: string;
}

function YoneticiAnaSayfaIskeleti() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-3 py-4 pb-20 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
          <div className="h-4 w-28 rounded bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
        </div>
        <div className="h-7 w-36 rounded-full bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((kart) => (
          <div key={kart} className="h-28 rounded-xl border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] bg-[var(--tema-yerel-ana-sayfa-kart-01)]" />
        ))}
      </div>
      <div className="mb-3 h-4 w-36 rounded bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
      <div className="mb-5 space-y-3 rounded-xl border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] bg-[var(--tema-yerel-ana-sayfa-kart-01)] p-4">
        {[0, 1, 2, 3, 4].map((satir) => (
          <div key={satir} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
            <div className="h-4 w-40 max-w-full rounded bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
          </div>
        ))}
      </div>
      <UttYayinKartIskeletleri izgaraClassName="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}

export default function YoneticiAnaSayfa({ user, rol, adSoyad }: Props) {
  return <YoneticiAnaSayfaIcerigi key={`${user.id}_${rol}`} user={user} rol={rol} adSoyad={adSoyad} />;
}

function YoneticiAnaSayfaIcerigi({ user, rol, adSoyad }: Props) {
  const onbellekAnahtari = `yonetici_anasayfa_veri_${user.id}_${rol}`;
  const [veri, setVeri] = useState<YoneticiVeri | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const kayit = sessionStorage.getItem(onbellekAnahtari);
      if (kayit) {
        const data: YoneticiVeri = JSON.parse(kayit);
        if (data.kullaniciId === user.id && data.rol === rol && data.istatistikler
          && Array.isArray(data.haftanin_enleri) && Array.isArray(data.videolar)) return data;
      }
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(() => !veri);
  const [veriHatasi, setVeriHatasi] = useState<string | null>(null);
  const [aktifVideo, setAktifVideo] = useState<AnaSayfaVideo | null>(null);
  const [aktifTanburBolumu, setAktifTanburBolumu] = useState<string>("tumu");
  const { hata } = useHataMesaji();

  const videolar = veri?.videolar ?? [];
  const haftaninEnleri = veri?.haftanin_enleri ?? [];

  const tanburBolumleri = useMemo<TanburBolum[]>(() => {
    const bolumler: TanburBolum[] = [
      { id: "tumu", etiket: "Tüm Bölümler" },
      { id: "haftanin_enleri", etiket: "Haftanın En’leri", sayi: haftaninEnleri.length },
    ];
    if (videolar.length > 0) {
      bolumler.push({ id: "yayinlar", etiket: "Yayınlar", sayi: videolar.length });
    }
    return bolumler;
  }, [haftaninEnleri.length, videolar.length]);

  const seciliTanburBolumu =
    videolar.length === 0 && aktifTanburBolumu === "yayinlar" ? "tumu" : aktifTanburBolumu;

  useEffect(() => {
    const controller = new AbortController();
    let aktif = true;
    const veriCek = async () => {
      setLoading(true);
      setVeriHatasi(null);
      try {
        const res = await fetch("/ana-sayfa/api", { signal: controller.signal });
        const data = await res.json();
        if (!aktif) return;
        if (!res.ok) {
          const mesaj = data.hata ?? "Veriler yüklenemedi.";
          setVeriHatasi(mesaj);
          hata(mesaj, data.adim, data.detay);
          return;
        }
        if (!data.istatistikler || !Array.isArray(data.haftanin_enleri) || !Array.isArray(data.videolar)) {
          throw new Error("Yönetici ana sayfa verileri alınamadı.");
        }
        const guncelVeri: YoneticiVeri = { ...data, kullaniciId: user.id, rol };
        setVeri(guncelVeri);
        try {
          sessionStorage.setItem(onbellekAnahtari, JSON.stringify(guncelVeri));
        } catch {}
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
  }, [user.id, rol, hata, onbellekAnahtari]);


  const haftaTarihi = () => {
    const baslangic = haftaBaslangici(new Date());
    const bitis = new Date(baslangic.getTime() + 6 * 24 * 60 * 60 * 1000);
    return `${baslangic.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" })} — ${bitis.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" })}`;
  };

  // Önbellek yoksa ilk yanıtı iskeletle bekle; başarısızlığı sıfır veri gibi gösterme.
  if (!veri) {
    if (loading) return <YoneticiAnaSayfaIskeleti />;
    return (
      <div role="alert" className="mx-auto max-w-6xl px-3 py-4 text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] md:px-6 lg:px-8">
        {veriHatasi ?? "Ana sayfa verileri yüklenemedi."}
      </div>
    );
  }

  // Bir video seçiliyse: dashboard yerine tam sayfa oynatıcı (UTT/TM/BM deseni; navbar üstteki sarmalayıcıdan kalır).
  if (aktifVideo) {
    return (
      <div className="max-w-6xl mx-auto px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <VideoOynatici
          key={aktifVideo.yayin_id}
          video={aktifVideo}
          tuketici={false}
          onKapat={() => setAktifVideo(null)}
          onVeriYenile={() => {}}
          hata={() => {}}
          basari={() => {}}
          uyari={() => {}}
        />
      </div>
    );
  }

  const istat = veri.istatistikler;
  const ad = adSoyad.split(" ")[0] || "Yönetici";

  return (
    <div className="max-w-6xl mx-auto px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">

      {/* Karşılama */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] m-0">Merhaba {ad}, 👋</h1>
          <p className="text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1">{ROL_ADLARI[rol.toLowerCase()] ?? rol.toUpperCase()}</p>
        </div>
        <TarihPill />
      </div>

      {veriHatasi && (
        <p role="alert" className="mb-4 text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)]">{veriHatasi}</p>
      )}

      {/* Mobilde Odak Bilgi Alanı */}
      {seciliTanburBolumu !== "tumu" && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--tema-yerel-ana-sayfa-cizgi-06)]/80 bg-[var(--tema-yerel-ana-sayfa-secim-zemin-03)]/90 px-4 py-2.5 text-xs font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-03)] shadow-xs sm:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--tema-yerel-ana-sayfa-eylem-zemin-04)] animate-pulse" />
            <span className="text-xs font-black">
              Odak: {tanburBolumleri.find((b) => b.id === seciliTanburBolumu)?.etiket}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAktifTanburBolumu("tumu")}
            className="rounded-lg bg-[var(--tema-yerel-ana-sayfa-kart-01)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--tema-yerel-ana-sayfa-eylem-metin-04)] shadow-xs hover:bg-[var(--tema-yerel-ana-sayfa-secim-zemin-04)] active:scale-95 cursor-pointer"
          >
            Tümünü Göster
          </button>
        </div>
      )}

      {/* Stat kartlar — 6 stat (3+3 grid) */}
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 mb-5 ${seciliTanburBolumu !== "tumu" ? "hidden sm:grid" : ""}`}>
        {[
          { label: "Yayında Toplam Video", value: istat.yayinda_toplam_video, sub: "Tüm üretici roller", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-06)", tip: "sayisal" },
          { label: "Toplam İzleme", value: istat.toplam_izleme_sayisi, sub: "Kendi + öneri + extra", renk: "var(--tema-yerel-ana-sayfa-eylem-metin-03)", tip: "sayisal" },
          { label: "En Çok İzlenen Video", value: istat.en_cok_izlenen_video ?? "—", sub: "Video adı", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-07)", tip: "metin" },
          { label: "En Çok İzleyen Takım", value: istat.en_cok_izleyen_takim ?? "—", sub: "Tüm videolar", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-16)", tip: "metin" },
          { label: "En Çok İzleyen Bölge", value: istat.en_cok_izleyen_bolge ?? "—", sub: "Tüm videolar", renk: "var(--tema-yerel-ana-sayfa-eylem-metin-06)", tip: "metin" },
          { label: "En Çok İzleyen UTT", value: istat.en_cok_izleyen_utt ?? "—", sub: "Bölge / Takım", renk: "var(--tema-yerel-ana-sayfa-vurgu-metin-01)", tip: "metin" },
        ].map((k, idx) => (
          <div
            key={idx}
            className="bg-[var(--tema-yerel-ana-sayfa-kart-01)] border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] rounded-xl p-3 md:p-5"
            style={{ borderLeft: `3px solid ${k.renk}` }}
          >
            <div className="text-xs font-bold text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] uppercase tracking-wide mb-2">{k.label}</div>
            <div
              className={
                k.tip === "sayisal"
                  ? "text-2xl md:text-3xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] leading-none"
                  : "text-base md:text-lg font-light text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] leading-tight"
              }
            >
              {k.value}
            </div>
            <div className="hidden md:block text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Haftanın En'leri (full genişlik) */}
      <div className={seciliTanburBolumu !== "tumu" && seciliTanburBolumu !== "haftanin_enleri" ? "hidden sm:block" : ""}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)]">Haftanın En&apos;leri</span>
          <span className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)]">{haftaTarihi()}</span>
        </div>
        <div className="bg-[var(--tema-yerel-ana-sayfa-kart-01)] border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] rounded-xl overflow-hidden">
          {haftaninEnleri.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)]">
              Bu hafta henüz puan kazanılmadı.
            </div>
          ) : (
            haftaninEnleri.map((utt, i) => (
              <div
                key={utt.kullanici_id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < haftaninEnleri.length - 1 ? "1px solid var(--tema-yerel-ana-sayfa-cizgi-05)" : "none" }}
              >
                <div className="w-5 text-xs font-bold text-center" style={{ color: i === 0 ? "var(--tema-yerel-ana-sayfa-eylem-metin-03)" : "var(--tema-yerel-ana-sayfa-yardimci-metin-06)" }}>{i + 1}</div>
                {utt.fotograf_url ? (
                  <img src={utt.fotograf_url} alt={utt.ad} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: i === 0 ? "var(--tema-yerel-ana-sayfa-secim-zemin-05)" : "var(--tema-yerel-ana-sayfa-sayfa-zemini-04)",
                      color: i === 0 ? "var(--tema-yerel-ana-sayfa-eylem-metin-02)" : "var(--tema-yerel-ana-sayfa-ana-metin-05)",
                    }}
                  >
                    {utt.ad[0]}{utt.soyad[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)]">{utt.ad} {utt.soyad}</div>
                </div>
                <div className="text-sm font-bold" style={{ color: i === 0 ? "var(--tema-yerel-ana-sayfa-eylem-metin-03)" : "var(--tema-yerel-ana-sayfa-yardimci-metin-02)" }}>
                  {utt.toplam_puan.toLocaleString("tr-TR")} p
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Videolar */}
      <div className={`mt-5 ${seciliTanburBolumu !== "tumu" && seciliTanburBolumu !== "yayinlar" ? "hidden sm:block" : ""}`}>
        <VideoBolumu videolar={videolar} onVideoSec={setAktifVideo} />
      </div>

      {tanburBolumleri.length > 1 && (
        <HayaletTanburSecici
          bolumler={tanburBolumleri}
          seciliId={seciliTanburBolumu}
          onSec={setAktifTanburBolumu}
        />
      )}
    </div>
  );
}
