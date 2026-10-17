"use client";

import { useRef } from "react";
import {
  BookOpen,
  Clock3,
  FileText,
  Headphones,
  Image as ImageIcon,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EczanemAracTuru, EczanemMusteriVideo } from "../_types";
import { YayinKarti } from "@/components/yayin/YayinKarti";

interface Props {
  baslik: string;
  videolar: EczanemMusteriVideo[];
  bosMesaj: string;
  onVideoSec: (video: EczanemMusteriVideo) => void;
  onBegeni: (video: EczanemMusteriVideo) => void | Promise<void>;
  onFavori: (video: EczanemMusteriVideo) => void | Promise<void>;
  etkilesimIsliyor?: string | null;
  sifirlamaAnahtari?: string | number;
}

import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";

const sureYaz = (saniye: number) =>
  `${Math.floor(saniye / 60)}:${String(Math.floor(saniye % 60)).padStart(2, "0")}`;

export function AracMerkezIkonu({ tur }: { tur: EczanemAracTuru }) {
  switch (tur) {
    case "video":
      return <Play className="ml-0.5 size-4 fill-current" />;
    case "podcast":
      return <Headphones className="size-4" />;
    case "gorsel":
      return <ImageIcon className="size-4" />;
    case "flip_pdf":
      return <BookOpen className="size-4" />;
    default:
      return <FileText className="size-4" />;
  }
}

export function IcerikDurumRozeti({ video }: { video: EczanemMusteriVideo }) {
  if (video.izlendi) {
    return (
      <Badge className="absolute left-2 top-2 border border-[var(--tema-yerel-eczanem-cizgi-35)]/40 bg-[var(--tema-yerel-eczanem-islevsel-zemin-36)]/90 text-[11px] font-black text-[var(--tema-yerel-eczanem-ters-metin-01)] shadow-sm backdrop-blur-sm sm:text-[9px]">
        ✓ Tamamlandı
      </Badge>
    );
  }
  if (video.izleme_basladi) {
    const sureMetni =
      video.son_konum_saniye > 0
        ? ` · ${sureYaz(video.son_konum_saniye)}`
        : "";
    return (
      <Badge className="absolute left-2 top-2 flex items-center gap-1 border border-[var(--tema-yerel-eczanem-islevsel-cizgi-16)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-05)]/95 text-[11px] font-extrabold text-[var(--tema-yerel-eczanem-islevsel-metin-32)] shadow-sm sm:text-[9px]">
        <Clock3 className="size-3 sm:size-2.5" />
        <span>Devam Et{sureMetni}</span>
      </Badge>
    );
  }
  return (
    <Badge className="absolute left-2 top-2 border border-[var(--tema-yerel-eczanem-cizgi-36)] bg-[var(--tema-yerel-eczanem-secim-zemin-01)]/95 text-[11px] font-black text-[var(--tema-yerel-eczanem-eylem-metin-02)] shadow-sm sm:text-[9px]">
      Yeni
    </Badge>
  );
}

export default function EczanemVideoRafi({
  baslik,
  videolar,
  bosMesaj,
  onVideoSec,
  onBegeni,
  onFavori,
  etkilesimIsliyor,
  sifirlamaAnahtari,
}: Props) {
  const rafRef = useRef<HTMLDivElement>(null);
  const kaydir = (yon: number) =>
    rafRef.current?.scrollBy({
      left: yon * rafRef.current.clientWidth * 0.85,
      behavior: "smooth",
    });

  const bolumId = `raf-${baslik.replaceAll(" ", "-").replaceAll("’", "").toLocaleLowerCase("tr-TR")}`;

  const renderKartIcerigi = (video: EczanemMusteriVideo, mobilMi: boolean) => {
    const isliyor = etkilesimIsliyor === video.yayin_id;

    return (
      <YayinKarti
        key={`${baslik}-${video.gonderim_id}`}
        yayin={{
          yayin_id: video.yayin_id,
          urun_adi: video.urun_adi,
          gorunen_urun_id: video.gorunen_urun_id,
          teknik_adi: video.teknik_adi,
          video_url: video.video_url,
          thumbnail_url: video.thumbnail_url,
          arac_id: video.arac_id,
          arac_turu: video.arac_turu,
          yayin_tarihi: video.gelis_tarihi,
          talep_no: video.talep_no,
          firma_adi: video.firma_adi,
          begeni_sayisi: video.begeni_sayisi,
          favori_sayisi: video.favori_sayisi,
          begeni_mi: video.begeni_mi,
          favori_mi: video.favori_mi,
        }}
        onClick={() => onVideoSec(video)}
        ariaLabel={`${video.urun_adi} içeriğini sayfaya yerleştir`}
        onBegeni={() => void onBegeni(video)}
        onFavori={() => void onFavori(video)}
        etkilesimAktif={!isliyor}
        puanGoster={false}
        donguGoster={false}
        solUstRozet={<IcerikDurumRozeti video={video} />}
        hoverOverlay={
          <span className="pointer-events-none absolute inset-0 bg-[var(--tema-hoyk-eczanem-ortu)]">
            <span className="absolute bottom-2.5 left-2.5 flex size-8 items-center justify-center rounded-full bg-[var(--tema-hoyk-eczanem-play-zemin)] text-[var(--tema-hoyk-talep-metni)] shadow-md transition-transform group-hover:scale-110">
              <AracMerkezIkonu tur={video.arac_turu} />
            </span>
          </span>
        }
        altEkIcerik={
          <div className="mt-2 space-y-1.5">
            {video.eczane_adi && (
              <p className="truncate text-xs font-semibold text-[var(--tema-hoyk-eczanem-eczane)] sm:text-[10px]" title={video.eczane_adi}>
                {video.eczane_adi}
              </p>
            )}
            <div className="grid grid-cols-3 divide-x divide-[var(--tema-hoyk-eczanem-ayirici)] rounded-lg border border-[var(--tema-hoyk-eczanem-ozet-cizgi)] bg-[var(--tema-hoyk-eczanem-ozet-zemin)] px-1 py-1 text-center">
              <div className="px-0.5">
                <span className="block text-[11px] font-extrabold uppercase tracking-wide text-[var(--tema-hoyk-eczanem-ozet-etiket)] sm:text-[7px]">Tamamlama</span>
                <strong className="mt-0.5 block text-xs font-black tabular-nums text-[var(--tema-hoyk-eczanem-tamamlama)] sm:text-[10px]">
                  {Number(video.video_puani ?? 0).toLocaleString("tr-TR")} p
                </strong>
              </div>
              <div className="px-0.5">
                <span className="block text-[11px] font-extrabold uppercase tracking-wide text-[var(--tema-hoyk-eczanem-ozet-etiket)] sm:text-[7px]">Soru</span>
                <strong className="mt-0.5 block text-xs font-black tabular-nums text-[var(--tema-hoyk-eczanem-soru)] sm:text-[10px]">
                  {Number(video.soru_sayisi ?? 0).toLocaleString("tr-TR")} ad
                </strong>
              </div>
              <div className="px-0.5">
                <span className="block text-[11px] font-extrabold uppercase tracking-wide text-[var(--tema-hoyk-eczanem-ozet-etiket)] sm:text-[7px]">Her Doğru</span>
                <strong className="mt-0.5 block text-xs font-black tabular-nums text-[var(--tema-hoyk-eczanem-dogru)] sm:text-[10px]">
                  {Number(video.soru_puani ?? 0).toLocaleString("tr-TR")} p
                </strong>
              </div>
            </div>
          </div>
        }
        className={mobilMi ? "w-full" : "w-[210px] shrink-0 snap-start sm:w-[230px] md:w-[250px]"}
      />
    );
  };

  const masaustuIcerik = videolar.length === 0 ? null : (
    <div className="group relative">
      <button
        type="button"
        aria-label="Sola kaydır"
        onClick={() => kaydir(-1)}
        className="absolute inset-y-0 left-0 z-10 hidden sm:flex w-16 cursor-pointer items-center justify-start bg-gradient-to-r from-[var(--tema-yerel-eczanem-sayfa-zemini-05)] via-[var(--tema-yerel-eczanem-sayfa-zemini-05)]/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      >
        <svg
          className="h-7 w-7 text-[var(--tema-yerel-eczanem-ana-metin-21)] drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <div
        ref={rafRef}
        className="-mx-1 flex snap-x items-stretch gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videolar.map((video) => renderKartIcerigi(video, false))}
      </div>
      <button
        type="button"
        aria-label="Sağa kaydır"
        onClick={() => kaydir(1)}
        className="absolute inset-y-0 right-0 z-10 hidden sm:flex w-16 cursor-pointer items-center justify-end bg-gradient-to-l from-[var(--tema-yerel-eczanem-sayfa-zemini-05)] via-[var(--tema-yerel-eczanem-sayfa-zemini-05)]/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      >
        <svg
          className="h-7 w-7 text-[var(--tema-yerel-eczanem-ana-metin-21)] drop-shadow-sm"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );

  return (
    <MobilYayinAkisi<EczanemMusteriVideo>
      bolumId={bolumId}
      kayitlar={videolar}
      kayitAnahtari={(video) => `${baslik}-${video.gonderim_id}`}
      renderKart={(video) => (
        <div className="w-full min-w-0">
          {renderKartIcerigi(video, true)}
        </div>
      )}
      baslik={
        <h2 className="truncate text-base font-black tracking-[-0.015em] text-[var(--tema-yerel-eczanem-ana-metin-20)] md:text-lg">
          {baslik}
        </h2>
      }
      sayacGoster={true}
      sifirlamaAnahtari={sifirlamaAnahtari}
      bosDurum={
        <div className="flex min-h-24 items-center rounded-2xl border border-dashed border-[var(--tema-yerel-eczanem-cizgi-37)] bg-[var(--tema-yerel-eczanem-kart-01)]/70 px-5 text-xs font-bold text-[var(--tema-yerel-eczanem-yardimci-metin-10)]">
          {bosMesaj}
        </div>
      }
      masaustuIcerik={masaustuIcerik}
    />
  );
}
