"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Headphones,
  Play,
} from "lucide-react";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import type { OneriKaydi } from "./BmOneriTakibi";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { oneriIzlenebilirMi, sonrakiOneriZamanSiniri } from "@/lib/tclub/oneri/gorunurluk";
import {
  UttYayinListeAkisi,
  UttYayinTuruToggle,
} from "@/components/yayin/UttYayinListeOrtaklari";

type UttOneriFiltresi = "izlenecek" | "tamamlanan" | "suresi_dolan";

interface Props {
  oneriler: OneriKaydi[];
  varsayilanSekme: "bekleyen" | "tamamlanan";
  yenileniyor: boolean;
  onYenile: () => void;
  onBegeni: (e: React.MouseEvent, yayin_id: string) => void;
  onFavori: (e: React.MouseEvent, yayin_id: string) => void;
}

export default function UyeOnerilerGorunumu({
  oneriler,
  varsayilanSekme,
  yenileniyor,
  onYenile,
  onBegeni,
  onFavori,
}: Props) {
  const router = useRouter();
  const [aktifFiltre, setAktifFiltre] = useState<UttOneriFiltresi>(
    varsayilanSekme === "tamamlanan" ? "tamamlanan" : "izlenecek"
  );
  const [aktifTur, setAktifTur] = useState<YayinTuruFiltreDegeri>("tumu");
  const [zamanTetik, setZamanTetik] = useState(0);

  useEffect(() => {
    const sonraki = sonrakiOneriZamanSiniri(oneriler, Date.now());
    const zamanlayici = sonraki === null ? null : window.setTimeout(
      () => setZamanTetik((deger) => deger + 1),
      Math.min(Math.max(sonraki - Date.now() + 20, 50), 2_147_483_647),
    );
    const gorunurluk = () => {
      if (document.visibilityState === "visible") setZamanTetik((deger) => deger + 1);
    };
    document.addEventListener("visibilitychange", gorunurluk);
    return () => {
      if (zamanlayici !== null) window.clearTimeout(zamanlayici);
      document.removeEventListener("visibilitychange", gorunurluk);
    };
  }, [oneriler, zamanTetik]);

  const formatTarihKisa = (tarih: string) => {
    const date = new Date(tarih);
    if (isNaN(date.getTime())) return "Geçersiz tarih";
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTarihNoktali = (tarihStr?: string | null) => {
    if (!tarihStr) return "-";
    const d = new Date(tarihStr);
    if (isNaN(d.getTime())) return "-";
    // eslint-disable-next-line hapbilgi-mimari/zaman-tek-kaynak
    const gun = String(d.getDate()).padStart(2, "0");
    // eslint-disable-next-line hapbilgi-mimari/zaman-tek-kaynak
    const ay = String(d.getMonth() + 1).padStart(2, "0");
    // eslint-disable-next-line hapbilgi-mimari/zaman-tek-kaynak
    const yil = d.getFullYear();
    return `${gun}.${ay}.${yil}`;
  };

  /* eslint-disable react-hooks/purity, react-hooks/exhaustive-deps */
  const simdi = Date.now();
  const isTamamlandi = (o: OneriKaydi) => o.izlendi_mi;
  const isSuresiGecti = (o: OneriKaydi) => !o.izlendi_mi && new Date(o.oneri_bitis).getTime() < simdi;
  const isHenuzBaslamadi = (o: OneriKaydi) => !o.izlendi_mi && new Date(o.oneri_baslangic).getTime() > simdi;
  const isIzlenecek = (o: OneriKaydi) => oneriIzlenebilirMi(o, simdi);

  const izlenecekSayisi = useMemo(() => oneriler.filter(isIzlenecek).length, [oneriler, zamanTetik]);
  const tamamlananSayisi = useMemo(() => oneriler.filter(isTamamlandi).length, [oneriler]);
  const suresiDolanSayisi = useMemo(() => oneriler.filter(isSuresiGecti).length, [oneriler, zamanTetik]);

  // Stat / Durum filtresi uygulanmış liste
  const durumFiltreliOneriler = useMemo(() => {
    if (aktifFiltre === "izlenecek") return oneriler.filter(isIzlenecek);
    if (aktifFiltre === "tamamlanan") return oneriler.filter(isTamamlandi);
    if (aktifFiltre === "suresi_dolan") return oneriler.filter(isSuresiGecti);
    return oneriler.filter(isSuresiGecti);
  }, [aktifFiltre, oneriler, zamanTetik]);
  /* eslint-enable react-hooks/purity, react-hooks/exhaustive-deps */

  // Tür filtresi uygulanmış liste
  const turFiltreliOneriler = useMemo(() => {
    const seciliTurOnerileri = aktifTur === "tumu"
      ? durumFiltreliOneriler
      : durumFiltreliOneriler.filter((o) => {
          const tur = (o.arac_turu as OgrenmeAraciTuru) ?? "video";
          return tur === aktifTur;
        });

    return [...seciliTurOnerileri].sort((a, b) => {
      const aTarihi = new Date(a.created_at).getTime();
      const bTarihi = new Date(b.created_at).getTime();
      if (!Number.isFinite(aTarihi) && !Number.isFinite(bTarihi)) return 0;
      if (!Number.isFinite(aTarihi)) return 1;
      if (!Number.isFinite(bTarihi)) return -1;
      return aTarihi - bTarihi;
    });
  }, [durumFiltreliOneriler, aktifTur]);

  const sonFiltrelenmisOneriler = turFiltreliOneriler;

  const kartDurumu = (o: OneriKaydi): {
    etiket: string;
    soluk: boolean;
    sinif: string;
  } => {
    if (o.izlendi_mi) {
      return { etiket: "✓ İzlendi", soluk: false, sinif: "font-bold text-[var(--tema-hoyk-durum-izlendi)]" };
    }
    if (isSuresiGecti(o)) {
      return { etiket: "Süresi Geçti", soluk: true, sinif: "font-extrabold text-[var(--tema-hoyk-oneri-sure-doldu)]" };
    }
    if (isHenuzBaslamadi(o)) {
      return {
        etiket: `${formatTarihKisa(o.oneri_baslangic)}'da Açılacak`,
        soluk: true,
        sinif: "font-extrabold text-[var(--tema-hoyk-durum-devam)]",
      };
    }
    return { etiket: "İzlenecek", soluk: false, sinif: "font-extrabold text-[var(--tema-hoyk-durum-yeni)]" };
  };

  const hoverIkonu = (aracTuru?: string | null) => {
    if (aracTuru === "podcast") {
      return <Headphones className="h-5 w-5" />;
    }
    if (aracTuru === "flip_pdf") {
      return <BookOpen className="h-5 w-5" />;
    }
    if (aracTuru === "gorsel") {
      return <FileText className="h-5 w-5" />;
    }
    return <Play className="ml-0.5 h-5 w-5 fill-current" />;
  };

  const renderOneriKarti = (o: OneriKaydi) => {
    const durumStil = kartDurumu(o);
    const hamOneren = o.oneren_adi || o.kullanici_adi || "";
    const onerenMetni = hamOneren.startsWith("BM") ? hamOneren : `BM ${hamOneren}`.trim();

    return (
      <YayinKarti
        key={o.oneri_id}
        yayin={o}
        onClick={() => {
          if (!durumStil.soluk) {
            router.push(`/ana-sayfa?yayin_id=${o.yayin_id}&oneri_id=${o.oneri_id}`);
          }
        }}
        onBegeni={(e) => onBegeni(e, o.yayin_id)}
        onFavori={(e) => onFavori(e, o.yayin_id)}
        solUstRozet={
          <span className={durumStil.sinif}>
            {durumStil.etiket}
          </span>
        }
        puanYaniRozet={
          o.izlendi_mi ? (
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-extrabold text-[var(--tema-hoyk-oneri-puan-metni)] shadow-sm sm:px-1.5 sm:text-[9px]"
              style={{
                background: "var(--tema-hoyk-oneri-puan-zemini)",
              }}
              title="Kazanılan öneri puanı: +10 Puan"
            >
              +10{" "}
              <span className="sm:hidden">P</span>
              <span className="hidden sm:inline">Puan</span>
            </span>
          ) : null
        }
        altEkIcerik={
          <div className="mt-2 border-t border-[var(--tema-hoyk-ic-cizgi)] pt-2">
            <div
              className="grid grid-cols-3 gap-1 rounded-lg px-2 py-1.5 select-none"
              style={{
                background: "var(--tema-hoyk-oneri-bilgi-zemini)",
                boxShadow: "inset 0 0 0 0.5px var(--tema-hoyk-kapsul-cizgi)",
              }}
            >
              {/* 1. Öneren */}
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[11px] font-semibold text-[var(--tema-hoyk-soluk-metin)] uppercase tracking-wider sm:text-[8px]">
                  Öneren
                </span>
                <span
                  className="truncate text-xs font-bold text-[var(--tema-hoyk-oneren-metni)] sm:text-[10px]"
                  title={onerenMetni}
                >
                  {onerenMetni}
                </span>
              </div>

              {/* 2. Başlangıç */}
              <div className="flex flex-col text-center border-x border-[var(--tema-hoyk-oneri-ayirici)] px-1 min-w-0">
                <span className="text-[11px] font-semibold text-[var(--tema-hoyk-soluk-metin)] uppercase tracking-wider sm:text-[8px]">
                  Başlangıç
                </span>
                <span className="text-xs font-bold text-[var(--tema-hoyk-oneri-tarih-metni)] whitespace-nowrap sm:text-[10px]">
                  {formatTarihNoktali(o.oneri_baslangic)}
                </span>
              </div>

              {/* 3. Bitiş */}
              <div className="flex flex-col text-right min-w-0 pl-1">
                <span className="text-[11px] font-semibold text-[var(--tema-hoyk-soluk-metin)] uppercase tracking-wider sm:text-[8px]">
                  Bitiş
                </span>
                <span className="text-xs font-bold text-[var(--tema-hoyk-oneri-tarih-metni)] whitespace-nowrap sm:text-[10px]">
                  {formatTarihNoktali(o.oneri_bitis)}
                </span>
              </div>
            </div>
          </div>
        }
        hoverOverlay={
          !durumStil.soluk ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--tema-hoyk-oneri-ortu)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tema-hoyk-zemin)] text-[var(--tema-hoyk-onizleme-simge)] shadow-lg">
                {hoverIkonu(o.arac_turu)}
              </div>
            </div>
          ) : null
        }
        className={durumStil.soluk ? "cursor-default opacity-75" : ""}
      />
    );
  };

  const bosMesaj = aktifFiltre === "tamamlanan"
    ? "Henüz tamamlanmış öneriniz bulunmuyor."
    : aktifFiltre === "suresi_dolan"
      ? "Süresi dolan öneriniz bulunmuyor."
      : "İzleme bekleyen öneriniz bulunmuyor.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ─── Başlık & Yenileme Alanı ─── */}
      <SayfaYenileBasligi className="mb-6"
        baslik={<div className="flex items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight text-[var(--tema-yerel-ortak-sayfa-ana-metin-07)] md:text-3xl">
            Önerilen Yayınlar
          </h1>
          <SayfaRehberi anahtar="oneriler" />
        </div>}
        aciklama={<p className="mt-1 text-sm font-medium text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-11)]">
          Bölge Müdürünüz tarafından önerilen yayınları görebilirsiniz.
        </p>}
        aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={onYenile} />}
      />

      {/* ─── 1. Katman: Stat Kartları ─── */}
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3 md:gap-3">
        {[
          {
            id: "izlenecek" as const,
            label: "Bekleyen",
            deger: izlenecekSayisi,
            sub: "Süresi aktif öneriler",
            renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-09)",
            zemin: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-08)",
          },
          {
            id: "tamamlanan" as const,
            label: "Tamamlanan",
            deger: tamamlananSayisi,
            sub: "Öneri puanı kazanıldı",
            renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-10)",
            zemin: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-09)",
          },
          {
            id: "suresi_dolan" as const,
            label: "Süresi Dolan",
            deger: suresiDolanSayisi,
            sub: "Tamamlanmayanlar",
            renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-11)",
            zemin: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-10)",
          },
        ].map((kart) => {
          const secili = aktifFiltre === kart.id;
          return (
            <button
              type="button"
              key={kart.id}
              onClick={() => setAktifFiltre(kart.id)}
              className={`group relative cursor-pointer rounded-2xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-01)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)] p-3 text-left shadow-[0_4px_14px_var(--tema-yerel-ortak-sayfa-golge-01)] transition-all hover:-translate-y-0.5 hover:shadow-md md:p-4`}
              style={
                {
                  borderLeftWidth: "4px",
                  borderLeftColor: kart.renk,
                  boxShadow: secili ? `0 0 0 2px color-mix(in srgb, ${kart.renk} 20%, transparent), 0 8px 20px var(--tema-yerel-ortak-sayfa-golge-02)` : undefined,
                } as CSSProperties
              }
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-12)]">
                {kart.label}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[var(--tema-yerel-ortak-sayfa-ana-metin-07)] md:text-3xl">
                {kart.deger}
              </div>
              <div className="mt-1 text-[11px] font-medium text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-11)]">{kart.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ─── 2. Katman: Yayın türü ve yenileme ─── */}
      <div className="mb-5 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
        <UttYayinTuruToggle
          yayinlar={durumFiltreliOneriler}
          deger={aktifTur}
          onDegistir={setAktifTur}
          sayilariGoster={false}
          className="w-full min-w-0 sm:w-auto sm:flex-none"
        />
      </div>
      {/* ─── 3. Katman: Yayın Kartları Izgarası ─── */}
      <UttYayinListeAkisi<OneriKaydi>
        kayitlar={sonFiltrelenmisOneriler}
        kayitAnahtari={(o) => o.oneri_id}
        renderKart={renderOneriKarti}
        sifirlamaAnahtari={`${aktifFiltre}-${aktifTur}`}
        bosMesaj={aktifTur !== "tumu" ? "Seçilen yayın türünde öneri bulunamadı." : bosMesaj}
        masaustuIzgaraClassName="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
      />
    </div>
  );
}
