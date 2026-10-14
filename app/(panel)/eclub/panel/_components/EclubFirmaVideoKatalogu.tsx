"use client";

import { useMemo, useRef } from "react";
import { Play } from "lucide-react";
import type { PanelOneri } from "../_hooks/useEclubPanel";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";

interface Props {
  ilkKapakOncelikli?: boolean;
  playButonuGoster?: boolean;
  oneriler: PanelOneri[];
  seciliFirmaId: string | null;
  seciliFirmaAdi: string | null;
  seciliUrunAdi?: string | null;
  onVideoSec: (oneri: PanelOneri) => void;
  onBegeni: (yayinId: string) => void;
  onFavori: (yayinId: string) => void;
}

function firmaIyelik(firmaAdi: string): string {
  const sonUnlu = [...firmaAdi.toLocaleLowerCase("tr-TR")].reverse().find((harf) => "aeıioöuü".includes(harf));
  const ek = sonUnlu && "aı".includes(sonUnlu)
    ? "ın"
    : sonUnlu && "ou".includes(sonUnlu)
      ? "un"
      : sonUnlu && "öü".includes(sonUnlu)
        ? "ün"
        : "in";
  const kaynastirma = "aeıioöuü".includes(firmaAdi.toLocaleLowerCase("tr-TR").at(-1) ?? "") ? "n" : "";
  return `${firmaAdi}'${kaynastirma}${ek}`;
}

const bilgi = "max-w-full rounded-md border border-[#e1e9f3] bg-[#f5f8fc] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[#405976] sm:text-[8px]";
const satisSartiBilgi = "max-w-full rounded-md border border-[#e1e9f3] bg-[#f5f8fc] px-1.5 py-0.5 text-[9px] font-normal leading-tight text-[#405976] sm:text-[7px]";

export function EclubVideoKarti({
  oneri,
  onSec,
  onBegeni,
  onFavori,
  etkilesimAktif,
  mobilMi = false,
  kapakOncelikli = false,
  playButonuGoster = true,
}: {
  oneri: PanelOneri;
  onSec: () => void;
  onBegeni: () => void;
  onFavori: () => void;
  etkilesimAktif: boolean;
  mobilMi?: boolean;
  kapakOncelikli?: boolean;
  playButonuGoster?: boolean;
}) {
  const durumMetni = oneri.izlendi_mi
    ? "Tamamlandı"
    : oneri.oneri_durumu === "suresi_gecmis"
      ? "Süresi Geçti"
      : `${oneri.kalan_gun} gün`;
  const cekli = oneri.cek_karsiligi_var_mi === true;

  const kartJSX = (
    <YayinKarti
      kapakOncelikli={kapakOncelikli}
      yayin={{
        ...oneri,
        yayin_tarihi: oneri.created_at || oneri.oneri_baslangic,
      }}
      onClick={onSec}
      onBegeni={onBegeni}
      onFavori={onFavori}
      etkilesimAktif={etkilesimAktif}
      donguGoster={false}
      solUstRozet={
        <span className="rounded-full border border-white/30 bg-[#10233a]/70 px-2 py-0.5 text-[11px] font-extrabold text-white backdrop-blur-sm sm:text-[9px]">
          {durumMetni}
        </span>
      }
      hoverOverlay={playButonuGoster ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-[#10233a]/65 text-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
            <Play size={14} fill="currentColor" />
          </span>
        </span>
      ) : null}
      altEkIcerik={
        <div className="mt-2 border-t border-[#e8eef5] pt-2" aria-label="Yayın bilgileri ve koşulları">
          <div className="flex flex-wrap items-start justify-between gap-1">
            {oneri.cek_karsiligi_var_mi === false ? (
              <span className={bilgi}>Çeksiz Puan · Yalnız lig</span>
            ) : cekli ? (
              <>
                <span className={bilgi}>Çekli Puan</span>
                {oneri.satis_sarti_tipi === "satis_sartli" ? <span className={bilgi}>Sipariş zorunlu</span> : oneri.satis_sarti_tipi === "serbest_siparis" ? <span className={bilgi}>Siparişle çek tutarı artar</span> : oneri.satis_sarti_tipi === "siparissiz_cek" ? <span className={bilgi}>Sipariş yok</span> : <span className={bilgi}>Sipariş koşulu belirtilmemiş</span>}
                {oneri.satis_sarti_tipi === "serbest_siparis" && oneri.gizli_sart_katlama_orani != null && <span className={bilgi}>Siparişle çek tutarı +%{oneri.gizli_sart_katlama_orani}</span>}
              </>
            ) : <span className={bilgi}>Puan türü belirtilmemiş</span>}
          </div>
          {cekli && Array.isArray(oneri.barem_tablosu) && oneri.barem_tablosu.length > 0 && (
            <div className="mt-1 grid grid-cols-3 gap-1">
              {oneri.barem_tablosu.map((barem, index) => (
                <span key={index} className={`${satisSartiBilgi} flex min-w-0 flex-col items-center text-center`} title={`${barem.min_puan.toLocaleString("tr-TR")}–${barem.max_puan.toLocaleString("tr-TR")} puan${oneri.satis_sarti_tipi === "siparissiz_cek" ? "" : `: ${barem.adet}+${barem.mal_fazlasi}`}`}>
                  <span>{barem.min_puan.toLocaleString("tr-TR")}–{barem.max_puan.toLocaleString("tr-TR")}p</span>
                  {oneri.satis_sarti_tipi !== "siparissiz_cek" && <span>{barem.adet}+{barem.mal_fazlasi}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      }
    />
  );

  if (mobilMi) {
    return <div className="w-full min-w-0">{kartJSX}</div>;
  }

  return <div className="w-40 shrink-0 snap-start sm:w-44 md:w-52">{kartJSX}</div>;
}

export function VideoRafi({
  baslik,
  videolar,
  onVideoSec,
  onBegeni,
  onFavori,
  etkilesimAktif,
  sifirlamaAnahtari,
  ilkKapakOncelikli = false,
  playButonuGoster = true,
}: {
  baslik: string;
  videolar: PanelOneri[];
  onVideoSec: (oneri: PanelOneri) => void;
  onBegeni: (yayinId: string) => void;
  onFavori: (yayinId: string) => void;
  etkilesimAktif: boolean;
  sifirlamaAnahtari?: string | number;
  ilkKapakOncelikli?: boolean;
  playButonuGoster?: boolean;
}) {
  const raf = useRef<HTMLDivElement>(null);
  const kaydir = (yon: number) => raf.current?.scrollBy({ left: yon * raf.current.clientWidth * 0.85, behavior: "smooth" });

  const masaustuIcerik = videolar.length === 0 ? null : (
    <div className="group relative">
      <button
        type="button"
        aria-label={`${baslik} rafını sola kaydır`}
        onClick={() => kaydir(-1)}
        className="absolute inset-y-0 left-0 z-10 hidden sm:flex w-16 cursor-pointer items-center justify-start bg-gradient-to-r from-gray-50 via-gray-50/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      >
        <svg className="h-7 w-7 text-gray-800 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div ref={raf} className="flex snap-x gap-2.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videolar.map((oneri, index) => (
          <EclubVideoKarti
            key={oneri.oneri_id}
            oneri={oneri}
            kapakOncelikli={ilkKapakOncelikli && index === 0}
            playButonuGoster={playButonuGoster}
            onSec={() => onVideoSec(oneri)}
            onBegeni={() => onBegeni(oneri.yayin_id)}
            onFavori={() => onFavori(oneri.yayin_id)}
            etkilesimAktif={etkilesimAktif}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label={`${baslik} rafını sağa kaydır`}
        onClick={() => kaydir(1)}
        className="absolute inset-y-0 right-0 z-10 hidden sm:flex w-16 cursor-pointer items-center justify-end bg-gradient-to-l from-gray-50 via-gray-50/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      >
        <svg className="h-7 w-7 text-gray-800 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );

  return (
    <MobilYayinAkisi<PanelOneri>
      kayitlar={videolar}
      kayitAnahtari={(oneri) => oneri.oneri_id}
      renderKart={(oneri, index) => (
        <EclubVideoKarti
          oneri={oneri}
          kapakOncelikli={ilkKapakOncelikli && index === 0}
          playButonuGoster={playButonuGoster}
          onSec={() => onVideoSec(oneri)}
          onBegeni={() => onBegeni(oneri.yayin_id)}
          onFavori={() => onFavori(oneri.yayin_id)}
          etkilesimAktif={etkilesimAktif}
          mobilMi
        />
      )}
      baslik={<h2 className="text-base font-extrabold text-[#243957] md:text-lg">{baslik}</h2>}
      sayacGoster={true}
      sifirlamaAnahtari={sifirlamaAnahtari}
      bosDurum={
        <div className="rounded-2xl border border-dashed border-[#d8e2ec] bg-white px-4 py-7 text-center text-xs font-semibold text-[#8a99aa]">
          Bu rafta henüz öğrenme içeriği bulunmuyor.
        </div>
      }
      masaustuIcerik={masaustuIcerik}
    />
  );
}

export default function EclubFirmaVideoKatalogu({ oneriler, seciliFirmaId, seciliFirmaAdi, seciliUrunAdi, onVideoSec, onBegeni, onFavori, ilkKapakOncelikli = false, playButonuGoster = true }: Props) {
  const firmaVideolari = useMemo(
    () => seciliFirmaId ? oneriler.filter((oneri) => oneri.firma_id === seciliFirmaId) : oneriler,
    [oneriler, seciliFirmaId],
  );
  const enCokBegenilen = useMemo(() => [...firmaVideolari]
    .filter((oneri) => oneri.begeni_sayisi > 0)
    .sort((a, b) => b.begeni_sayisi - a.begeni_sayisi || a.urun_adi.localeCompare(b.urun_adi, "tr"))
    .slice(0, 10), [firmaVideolari]);
  const enCokFavorilenen = useMemo(() => [...firmaVideolari]
    .filter((oneri) => oneri.favori_sayisi > 0)
    .sort((a, b) => b.favori_sayisi - a.favori_sayisi || a.urun_adi.localeCompare(b.urun_adi, "tr"))
    .slice(0, 10), [firmaVideolari]);
  const firmaBasligi = seciliFirmaAdi ? firmaIyelik(seciliFirmaAdi) : null;
  const sifirlamaKapsami = `${seciliFirmaId ?? "tumu"}:${seciliUrunAdi ?? "tumu"}`;

  return (
    <div className="flex flex-col gap-6">
      <VideoRafi
        ilkKapakOncelikli={ilkKapakOncelikli}
        playButonuGoster={playButonuGoster}
        baslik={seciliUrunAdi ? `${seciliUrunAdi} Yayınları` : firmaBasligi ? `${firmaBasligi} Tüm İçerikleri` : "Tüm Firmaların İçerikleri"}
        videolar={firmaVideolari}
        onVideoSec={onVideoSec}
        onBegeni={onBegeni}
        onFavori={onFavori}
        etkilesimAktif
        sifirlamaAnahtari={`${sifirlamaKapsami}-tumu`}
      />
      <VideoRafi
        playButonuGoster={playButonuGoster}
        baslik={seciliUrunAdi ? `${seciliUrunAdi} En Çok Beğenilenler` : firmaBasligi ? `${firmaBasligi} En Çok Beğenilenleri` : "En Çok Beğenilenler"}
        videolar={enCokBegenilen}
        onVideoSec={onVideoSec}
        onBegeni={onBegeni}
        onFavori={onFavori}
        etkilesimAktif={false}
        sifirlamaAnahtari={`${sifirlamaKapsami}-begenilen`}
      />
      <VideoRafi
        playButonuGoster={playButonuGoster}
        baslik={seciliUrunAdi ? `${seciliUrunAdi} En Çok Favorilenenler` : firmaBasligi ? `${firmaBasligi} En Çok Favorilenenleri` : "En Çok Favorilenenler"}
        videolar={enCokFavorilenen}
        onVideoSec={onVideoSec}
        onBegeni={onBegeni}
        onFavori={onFavori}
        etkilesimAktif={false}
        sifirlamaAnahtari={`${sifirlamaKapsami}-favorilenen`}
      />
    </div>
  );
}
