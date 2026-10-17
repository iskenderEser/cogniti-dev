// components/ana-sayfa/UttAnaSayfa.tsx
"use client";

import { TarihPill } from "@/components/ui/tarih-pill";

import { ROL_ADLARI } from "@/lib/utils/roller";
import type { AuthKullanici } from "@/types/auth";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HataMesajiContainer, useHataMesaji, type HataMesajiProps } from "@/components/HataMesaji";
import VideoOynatici from "@/components/izle/VideoOynatici";
import { hbstoreBakiyesiDegistiBildir } from "@/lib/tclub/store/olay";
import {
  UttKayanVideoRafi as KayanRaf,
  UttVideoKarti as VideoKart,
  type UttVideo as Video,
  type UttVideoDurumu as VideoDurumu,
  type UttVideoVeri as UttVeri,
} from "@/components/video/UttVideoKarti";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import { useHbstoreTakvim } from "@/hooks/useHbstoreTakvim";
import { useListe, ListeArama, type AramaAlani } from "@/components/liste";
import HayaletTanburSecici, { type TanburBolum } from "@/components/navigasyon/HayaletTanburSecici";
import {
  UttYayinKartIskeletleri,
  UttYayinListeAkisi,
  UttYayinTuruToggle,
} from "@/components/yayin/UttYayinListeOrtaklari";
import type { UttVideoKategorisi } from "@/lib/video/uttVideoKategorileri";

interface Props {
  user: AuthKullanici;
  rol: string;
  adSoyad: string;
  kategoriBilgisi?: UttVideoKategorisi;
  temelYol?: string;
}

export function UttKategoriIskeleti() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-3 py-4 pb-20 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">
      <div className="mb-5 space-y-2">
        <div className="h-7 w-48 rounded-lg bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
        <div className="h-4 w-72 max-w-full rounded bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
      </div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((oge) => (
            <div key={oge} className="h-8 w-24 shrink-0 rounded-full bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
          ))}
        </div>
        <div className="h-8 w-full rounded-lg bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)] sm:w-72" />
      </div>
      <UttYayinKartIskeletleri izgaraClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
    </div>
  );
}

function UttAnaSayfaIskeleti() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-3 py-4 pb-20 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
          <div className="h-4 w-28 rounded bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
        </div>
        <div className="h-7 w-36 rounded-full bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-03)]" />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[0, 1, 2, 3].map((kart) => (
          <div key={kart} className="h-28 rounded-xl border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] bg-[var(--tema-yerel-ana-sayfa-kart-01)]" />
        ))}
      </div>
      <div className="mb-5 h-10 max-w-full rounded-[14px] bg-[var(--tema-yerel-ana-sayfa-kart-01)] shadow-sm sm:w-[32rem]" />
      <UttYayinKartIskeletleri izgaraClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
    </div>
  );
}

function KategoriYayinlariGoster({
  kategoriBilgisi,
  kategoriVideolari,
  onVideoClick,
  onBegeni,
  onFavori,
  mesajlar,
}: {
  kategoriBilgisi: UttVideoKategorisi;
  kategoriVideolari: Video[];
  onVideoClick: (video: Video) => void;
  onBegeni: (e: React.MouseEvent, yayinId: string) => void;
  onFavori: (e: React.MouseEvent, yayinId: string) => void;
  mesajlar: HataMesajiProps[];
}) {
  const [aktifTur, setAktifTur] = useState<YayinTuruFiltreDegeri>("tumu");

  const turFiltreli = useMemo(() => {
    if (aktifTur === "tumu") return kategoriVideolari;
    return kategoriVideolari.filter((v) => v.arac_turu === aktifTur);
  }, [kategoriVideolari, aktifTur]);

  const ARAMA_ALANLARI: AramaAlani<Video>[] = useMemo(
    () => [
      { anahtar: "tumu", etiket: "Tümü", deger: (v) => `${v.urun_adi} ${v.teknik_adi ?? ""}` },
      { anahtar: "urun", etiket: "Ürün / Eğitim", deger: (v) => v.urun_adi },
      { anahtar: "teknik", etiket: "Teknik Adı", deger: (v) => v.teknik_adi ?? "" },
    ],
    []
  );

  const liste = useListe({
    veri: turFiltreli,
    adim: Infinity,
    aramaAlanlari: ARAMA_ALANLARI,
  });
  const bosDurumMetni = liste.arama.aranan
    ? "Arama kriterlerinize uygun öğrenme içeriği bulunamadı."
    : aktifTur !== "tumu"
      ? "Seçtiğiniz yayın türünde henüz sizin için atanmış bir yayın bulunmuyor."
      : "Bu kategoride henüz sizin için atanmış bir yayın bulunmuyor.";

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 pb-20 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">
      <header className="mb-5">
        <div className="inline-flex items-center">
          <h1 className="m-0 text-xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-2xl">{kategoriBilgisi.etiket}</h1>
          <SayfaRehberi
            anahtar={`videolarim-${kategoriBilgisi.slug}`}
            className="ml-1.5 -translate-y-0.5"
          />
        </div>
        <p className="mt-1 text-xs font-semibold text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)]">
          {kategoriBilgisi.sayfaAciklamasi}
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UttYayinTuruToggle
          yayinlar={kategoriVideolari}
          deger={aktifTur}
          onDegistir={setAktifTur}
          className="min-w-0"
        />
        <div className="flex shrink-0 items-center justify-end">
          <ListeArama
            arama={liste.arama}
            ipucu="Bu kategoride ara..."
            yukseklik="secim"
            genislik="w-48 sm:w-60"
          />
        </div>
      </div>

      <UttYayinListeAkisi<Video>
        kayitlar={liste.gorunen}
        kayitAnahtari={(v) => v.yayin_id}
        renderKart={(video) => (
          <VideoKart
            video={video}
            onVideoClick={onVideoClick}
            onBegeni={onBegeni}
            onFavori={onFavori}
          />
        )}
        sifirlamaAnahtari={`${kategoriBilgisi.slug}-${aktifTur}-${liste.arama.alanAnahtari}-${liste.arama.aranan}`}
        bosMesaj={bosDurumMetni}
        masaustuIzgaraClassName="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      />
      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}

export default function UttAnaSayfa({ user, rol, adSoyad, kategoriBilgisi, temelYol = "/ana-sayfa" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uttVeri, setUttVeri] = useState<UttVeri | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const onbellek = sessionStorage.getItem(`utt_anasayfa_veri_${user.id}`);
      if (onbellek) return JSON.parse(onbellek);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(() => !uttVeri);
  const [aktifVideo, setAktifVideo] = useState<Video | null>(null);
  const [aktifOneriId, setAktifOneriId] = useState<string | null>(null);
  const [aktifDurumFiltresi, setAktifDurumFiltresi] = useState<VideoDurumu | null>(null);
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [aktifTanburBolumu, setAktifTanburBolumu] = useState<string>("tumu");
  const etkilesimKilidi = useRef(new Set<string>());
  const { mesajlar, hata, basari, uyari } = useHataMesaji();
  const { takvim } = useHbstoreTakvim();

  const veriCek = async (sessiz = false) => {
    if (!sessiz && !uttVeri) setLoading(true);
    try {
      const res = await fetch("/ana-sayfa/api");
      const data = await res.json();
      if (!res.ok) { 
        hata(data.hata ?? "Veriler yüklenemedi.", data.adim, data.detay); 
      } else { 
        setUttVeri(data);
        try {
          sessionStorage.setItem(`utt_anasayfa_veri_${user.id}`, JSON.stringify(data));
        } catch {}
      }
    } catch {
      hata("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    veriCek();
    // Bildirim yardımcıları her render'da yenilendiği için yalnız kullanıcı değişimini izle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Açık video adresin kendisinde taşınır (?yayin_id=...). Böylece navbar'daki
  // "Ana Sayfa" parametresiz adrese gittiğinde bu etki videoyu kapatır — aynı
  // rotada takılı kalma sorunu (kullanıcı listeye dönemiyordu) böyle çözülür.
  useEffect(() => {
    const yayinId = searchParams.get("yayin_id");
    const oneriId = searchParams.get("oneri_id");
    if (!yayinId) {
      setAktifVideo(null);
      setAktifOneriId(null);
      return;
    }
    setAktifOneriId(oneriId);
    if (!uttVeri) return;
    const tumu = [
      ...uttVeri.yeni_videolar,
      ...uttVeri.devam_edenler,
      ...uttVeri.tamamlananlar,
    ];
    const bulunan = tumu.find((v) => v.yayin_id === yayinId);
    if (bulunan) setAktifVideo(bulunan);
  }, [searchParams, uttVeri]);

  const etkilesimYap = async (tur: "begeni" | "favori", e: React.MouseEvent, yayin_id: string) => {
    e.stopPropagation();
    const kilit = `${tur}:${yayin_id}`;
    if (etkilesimKilidi.current.has(kilit)) return;
    etkilesimKilidi.current.add(kilit);
    try {
      const res = await fetch(`/izle/api/${tur}`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ yayin_id }) 
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.hata ?? "İşlem tamamlanamadı.");
      const bayrak = tur === "begeni" ? "begeni_mi" : "favori_mi";
      const sayac = tur === "begeni" ? "begeni_sayisi" : "favori_sayisi";
      if (typeof d[bayrak] !== "boolean") throw new Error("İşlem sonucu alınamadı.");
      setUttVeri(prev => {
        if (!prev) return prev;
        const guncelle = <T extends Video>(liste: T[]): T[] => liste.map(v => v.yayin_id === yayin_id
          ? { ...v, [bayrak]: d[bayrak], [sayac]: Math.max(0, v[sayac] + (d[bayrak] === v[bayrak] ? 0 : d[bayrak] ? 1 : -1)) }
          : v);
        return { ...prev, yeni_videolar: guncelle(prev.yeni_videolar), devam_edenler: guncelle(prev.devam_edenler), tamamlananlar: guncelle(prev.tamamlananlar), son_izlediklerim: prev.son_izlediklerim ? guncelle(prev.son_izlediklerim) : prev.son_izlediklerim, ekstra_izlediklerim: prev.ekstra_izlediklerim ? guncelle(prev.ekstra_izlediklerim) : prev.ekstra_izlediklerim };
      });
    } catch (err) {
      hata(err instanceof Error ? err.message : "Beğeni veya favori işlemi başarısız.");
    } finally {
      etkilesimKilidi.current.delete(kilit);
    }
  };

  const handleBegeni = (e: React.MouseEvent, yayin_id: string) => { void etkilesimYap("begeni", e, yayin_id); };
  const handleFavori = (e: React.MouseEvent, yayin_id: string) => { void etkilesimYap("favori", e, yayin_id); };

  const handleVideoClick = (video: Video) => {
    setAktifVideo(video);
    setAktifOneriId(null);
    // Adrese yaz — "Ana Sayfa" parametresiz adrese gidince video kapansın.
    router.push(`${temelYol}?yayin_id=${video.yayin_id}`, { scroll: false });
  };

  const handleVideoKapat = () => {
    setAktifVideo(null);
    setAktifOneriId(null);
    router.push(temelYol, { scroll: false });
  };


  if (loading) {
    if (kategoriBilgisi) return <UttKategoriIskeleti />;
    return <UttAnaSayfaIskeleti />;
  }

  if (aktifVideo) {
    return (
      <div className="max-w-6xl mx-auto px-3 pr-10 py-4 pb-20 sm:pr-3 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">
        <VideoOynatici
          key={aktifVideo.yayin_id}
          video={aktifVideo}
          tuketici={true}
          oneri_id={aktifOneriId}
          onKapat={handleVideoKapat}
          onVeriYenile={() => { void veriCek(true); hbstoreBakiyesiDegistiBildir(); }}
          hata={hata}
          basari={basari}
          uyari={uyari}
        />
        <HataMesajiContainer mesajlar={mesajlar} />
      </div>
    );
  }

  const istat = uttVeri?.istatistikler ?? { yeni: 0, devam: 0, tamamlanan: 0, hafta_puani: 0, toplam_puan: 0 };
  const ad = adSoyad.split(" ")[0] || "Temsilci";

  const tumHamVideolar = [...(uttVeri?.yeni_videolar ?? []), ...(uttVeri?.devam_edenler ?? []), ...(uttVeri?.tamamlananlar ?? [])];
  const tureGoreSuz = <T extends Video>(liste: T[]) => liste.filter((video) => aktifYayinTuru === "tumu" || video.arac_turu === aktifYayinTuru);
  const yeniVideolar = tureGoreSuz(uttVeri?.yeni_videolar ?? []);
  const devamEdenler = tureGoreSuz(uttVeri?.devam_edenler ?? []);
  const tamamlananlar = tureGoreSuz(uttVeri?.tamamlananlar ?? []);
  const durumListeleri: Record<VideoDurumu, Video[]> = { yeni: yeniVideolar, devam: devamEdenler, tamamlanan: tamamlananlar };
  const aktifDurumVideolari = aktifDurumFiltresi ? durumListeleri[aktifDurumFiltresi] : [];
  const durumBasliklari: Record<VideoDurumu, string> = {
    yeni: "Yeni Öğrenme İçerikleri",
    devam: "Yarım Kalan Öğrenme İçerikleri",
    tamamlanan: "Tamamlanan Öğrenme İçerikleri",
  };

  const tumVideolar = [...yeniVideolar, ...devamEdenler, ...tamamlananlar];

  // Özel sıralama: En Çok İzlenen, En Çok Beğenilen, sonra TUR_SIRA sırasıyla müdürlükler
  const enCokIzlenen = [...tumVideolar]
    .filter(v => v.izlenme_sayisi > 0)
    .sort((a, b) => b.izlenme_sayisi - a.izlenme_sayisi)
    .slice(0, 5);
    
  const enCokBegenilen = [...tumVideolar]
    .filter(v => v.begeni_sayisi > 0)
    .sort((a, b) => b.begeni_sayisi - a.begeni_sayisi)
    .slice(0, 5);

  const enCokFavorilenen = [...tumVideolar]
    .filter(v => v.favori_sayisi > 0)
    .sort((a, b) => b.favori_sayisi - a.favori_sayisi)
    .slice(0, 5);

  const tanburBolumleri: TanburBolum[] = [
    { id: "tumu", etiket: "Tüm Bölümler" },
  ];
  if (devamEdenler.length > 0) tanburBolumleri.push({ id: "devam_edenler", etiket: "Kaldığınız Yerden Devam Edin", sayi: devamEdenler.length });
  if (yeniVideolar.length > 0) tanburBolumleri.push({ id: "yeni_videolar", etiket: "Yeni Öğrenme İçerikleri", sayi: yeniVideolar.length });
  const sonIzlenenler = tureGoreSuz(uttVeri?.son_izlediklerim ?? []);
  if (sonIzlenenler.length > 0) tanburBolumleri.push({ id: "son_izlediklerim", etiket: "En Son İzlediklerim", sayi: sonIzlenenler.length });
  const ekstraIzlenenler = tureGoreSuz(uttVeri?.ekstra_izlediklerim ?? []);
  if (ekstraIzlenenler.length > 0) tanburBolumleri.push({ id: "ekstra_izlediklerim", etiket: "Ekstra İzlediklerim", sayi: ekstraIzlenenler.length });
  if (enCokBegenilen.length > 0) tanburBolumleri.push({ id: "en_cok_begenilen", etiket: "En Çok Beğenilenler", sayi: enCokBegenilen.length });
  if (enCokFavorilenen.length > 0) tanburBolumleri.push({ id: "en_cok_favorilenen", etiket: "En Çok Favorilenenler", sayi: enCokFavorilenen.length });
  if (enCokIzlenen.length > 0) tanburBolumleri.push({ id: "en_cok_izlenen", etiket: "En Çok İzlenenler", sayi: enCokIzlenen.length });

  if (kategoriBilgisi) {
    const kategoriVideolari = tumVideolar
      .filter((video) => video.icerik_turu === kategoriBilgisi.icerikTuru)
      .sort((a, b) => new Date(b.yayin_tarihi).getTime() - new Date(a.yayin_tarihi).getTime());

    return (
      <KategoriYayinlariGoster
        kategoriBilgisi={kategoriBilgisi}
        kategoriVideolari={kategoriVideolari}
        onVideoClick={handleVideoClick}
        onBegeni={handleBegeni}
        onFavori={handleFavori}
        mesajlar={mesajlar}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 pr-10 py-4 pb-20 sm:pr-3 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">

      {/* Karşılama */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] m-0">Merhaba {ad}, 👋</h1>
          <p className="text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1">{ROL_ADLARI[rol.toLowerCase()] ?? rol.toUpperCase()}</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {[
          { label: "Yeni İçerikler", value: istat.yeni, sub: "Henüz tamamlanmadı", renk: "var(--tema-yerel-ana-sayfa-vurgu-metin-01)", filtre: "yeni" as VideoDurumu },
          { label: "Devam Eden", value: istat.devam, sub: "Yarıda bırakılan", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-07)", filtre: "devam" as VideoDurumu },
          { label: "Tamamlanan", value: istat.tamamlanan, sub: "İzlendi ve tamamlandı", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-06)", filtre: "tamamlanan" as VideoDurumu },
          { label: "Bu Haftaki Puan", value: istat.hafta_puani, sub: `Toplam: ${istat.toplam_puan.toLocaleString("tr-TR")} p`, renk: "var(--tema-yerel-ana-sayfa-eylem-metin-03)", filtre: null },
        ].map((k, idx) => {
          const secili = k.filtre ? aktifDurumFiltresi === k.filtre : false;
          const ortakSinif = "bg-[var(--tema-yerel-ana-sayfa-kart-01)] border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] border-l-[3px] [border-left-color:var(--stat-renk)] rounded-xl p-3 text-left md:p-5 transition-all";
          const ortakStil = {
            "--stat-renk": k.renk,
            boxShadow: secili ? `0 0 0 2px color-mix(in srgb, ${k.renk} 13.333333333333334%, transparent)` : "none",
          } as React.CSSProperties;
          const icerik = (
            <>
              <div className="text-xs font-bold text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] uppercase tracking-wide mb-2">{k.label}</div>
              <div className="text-2xl md:text-3xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] leading-none">{k.value.toLocaleString("tr-TR")}</div>
              <div className="hidden md:block text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1.5">{k.sub}</div>
            </>
          );

          return k.filtre ? (
            <button
              type="button"
              key={idx}
              onClick={() => setAktifDurumFiltresi(secili ? null : k.filtre)}
              aria-pressed={secili}
              className={`${ortakSinif} cursor-pointer hover:-translate-y-0.5 hover:shadow-md`}
              style={ortakStil}
            >
              {icerik}
            </button>
          ) : (
            <div key={idx} className={`${ortakSinif} cursor-default`} style={ortakStil}>
              {icerik}
            </div>
          );
        })}
      </div>

      <div className="mb-5">
        <UttYayinTuruToggle
          yayinlar={tumHamVideolar}
          deger={aktifYayinTuru}
          onDegistir={setAktifYayinTuru}
          className="min-w-0"
        />
      </div>

      {/* Dinamik keşif rafları; sabit eğitim kategorileri Videolarım menüsündedir. */}

      {aktifDurumFiltresi ? (
        <UttYayinListeAkisi<Video>
          kayitlar={aktifDurumVideolari}
          kayitAnahtari={(v) => v.yayin_id}
          renderKart={(video) => (
            <VideoKart
              video={video}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
            />
          )}
          baslik={<h2 className="m-0 text-base font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">{durumBasliklari[aktifDurumFiltresi]}</h2>}
          aciklama={
            aktifDurumFiltresi === "devam"
              ? "Yarım kalan öğrenme içerikleri yeniden açıldığında baştan başlar."
              : `${aktifDurumVideolari.length} içerik`
          }
          aksiyonlar={
            <button
              type="button"
              onClick={() => setAktifDurumFiltresi(null)}
              className="rounded-full border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] bg-[var(--tema-yerel-ana-sayfa-kart-01)] px-3 py-1.5 text-xs font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-04)] hover:border-[var(--tema-yerel-ana-sayfa-cizgi-11)] hover:text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] cursor-pointer"
            >
              Tümünü Göster
            </button>
          }
          sifirlamaAnahtari={aktifDurumFiltresi}
          bosMesaj="Bu durumda öğrenme içeriği bulunmuyor."
          masaustuIzgaraClassName="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        />
      ) : (
        <>

          {devamEdenler.length > 0 && (aktifTanburBolumu === "tumu" || aktifTanburBolumu === "devam_edenler") && (
            <KayanRaf
              key={`devam_${aktifTanburBolumu}`}
              baslik={<h2 className="text-base font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">Kaldığınız Yerden Devam Edin</h2>}
              videolar={devamEdenler}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
              sifirlamaAnahtari={`${aktifTanburBolumu}-${aktifYayinTuru}`}
            />
          )}
          {yeniVideolar.length > 0 && (aktifTanburBolumu === "tumu" || aktifTanburBolumu === "yeni_videolar") && (
            <KayanRaf
              key={`yeni_${aktifTanburBolumu}`}
              baslik={<h2 className="text-base font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">Yeni Öğrenme İçerikleri</h2>}
              videolar={yeniVideolar}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
              sifirlamaAnahtari={`${aktifTanburBolumu}-${aktifYayinTuru}`}
            />
          )}
          {tureGoreSuz(uttVeri?.son_izlediklerim ?? []).length > 0 && (aktifTanburBolumu === "tumu" || aktifTanburBolumu === "son_izlediklerim") && (
            <KayanRaf
              key={`son_${aktifTanburBolumu}`}
              baslik={<h2 className="text-base font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">En Son İzlediklerim</h2>}
              videolar={tureGoreSuz(uttVeri?.son_izlediklerim ?? [])}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
              sifirlamaAnahtari={`${aktifTanburBolumu}-${aktifYayinTuru}`}
            />
          )}
          {tureGoreSuz(uttVeri?.ekstra_izlediklerim ?? []).length > 0 && (aktifTanburBolumu === "tumu" || aktifTanburBolumu === "ekstra_izlediklerim") && (
            <KayanRaf
              key={`ekstra_${aktifTanburBolumu}`}
              baslik={<h2 className="text-base font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">Ekstra İzlediklerim</h2>}
              videolar={tureGoreSuz(uttVeri?.ekstra_izlediklerim ?? [])}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
              sifirlamaAnahtari={`${aktifTanburBolumu}-${aktifYayinTuru}`}
              kartAlti={(video) => (
                <span className="rounded-lg px-2 py-1 text-center text-xs sm:text-[10px]" style={video.bu_ay_extra_kazanildi ? { background: "var(--tema-yerel-ana-sayfa-islevsel-zemin-04)", color: "var(--tema-yerel-ana-sayfa-islevsel-metin-14)", border: "0.5px solid var(--tema-yerel-ana-sayfa-islevsel-cizgi-01)" } : { background: "var(--tema-yerel-ana-sayfa-secim-zemin-02)", color: "var(--tema-yerel-ana-sayfa-eylem-metin-02)", border: "0.5px solid var(--tema-yerel-ana-sayfa-cizgi-12)" }}>
                  Bu turda: {video.bu_turda_izleme} izleme · {video.bu_ay_extra_kazanildi ? "Bu ay extra kazanıldı ✓" : `Extra'ya ${video.extra_kalan} tam tekrar kaldı`}
                </span>
              )}
            />
          )}
          {enCokBegenilen.length > 0 && (aktifTanburBolumu === "tumu" || aktifTanburBolumu === "en_cok_begenilen") && (
            <KayanRaf
              key={`begenilen_${aktifTanburBolumu}`}
              baslik={<h2 className="text-base font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">En Çok Beğenilenler</h2>}
              videolar={enCokBegenilen}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
              sifirlamaAnahtari={`${aktifTanburBolumu}-${aktifYayinTuru}`}
            />
          )}
          {enCokFavorilenen.length > 0 && (aktifTanburBolumu === "tumu" || aktifTanburBolumu === "en_cok_favorilenen") && (
            <KayanRaf
              key={`favori_${aktifTanburBolumu}`}
              baslik={<h2 className="text-base font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">En Çok Favorilenenler</h2>}
              videolar={enCokFavorilenen}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
              sifirlamaAnahtari={`${aktifTanburBolumu}-${aktifYayinTuru}`}
            />
          )}
          {enCokIzlenen.length > 0 && (aktifTanburBolumu === "tumu" || aktifTanburBolumu === "en_cok_izlenen") && (
            <KayanRaf
              key={`izlenen_${aktifTanburBolumu}`}
              baslik={<h2 className="text-base font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] md:text-lg">En Çok İzlenenler</h2>}
              videolar={enCokIzlenen}
              onVideoClick={handleVideoClick}
              onBegeni={handleBegeni}
              onFavori={handleFavori}
              sifirlamaAnahtari={`${aktifTanburBolumu}-${aktifYayinTuru}`}
            />
          )}
        </>
      )}

      {/* Mobilde Hayalet Tanbur Bölüm Seçici */}
      {!aktifDurumFiltresi && (
        <HayaletTanburSecici
          bolumler={tanburBolumleri}
          seciliId={aktifTanburBolumu}
          onSec={setAktifTanburBolumu}
        />
      )}

      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}
