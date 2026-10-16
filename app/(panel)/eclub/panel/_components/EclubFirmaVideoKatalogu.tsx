"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Gift, Play, ShoppingCart, Ticket, Trophy } from "lucide-react";
import type { PanelOneri } from "../_hooks/useEclubPanel";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { tohumaGoreYayinSirala } from "@/lib/eclub/yayinRafiSirasi";
import { eclubHoykSureDurumu, sonrakiTurkiyeGeceYarisi } from "@/lib/eclub/hoykSureCercevesi";

interface Props {
  ilkKapakOncelikli?: boolean;
  playButonuGoster?: boolean;
  firmaRozetiGoster?: boolean;
  ilkRafRastgele?: boolean;
  filtreBasligi?: string;
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

export function EclubVideoKarti({
  oneri,
  onSec,
  onBegeni,
  onFavori,
  etkilesimAktif,
  mobilMi = false,
  kapakOncelikli = false,
  playButonuGoster = true,
  firmaRozetiGoster = false,
  simdi,
}: {
  oneri: PanelOneri;
  onSec: () => void;
  onBegeni: () => void;
  onFavori: () => void;
  etkilesimAktif: boolean;
  mobilMi?: boolean;
  kapakOncelikli?: boolean;
  playButonuGoster?: boolean;
  firmaRozetiGoster?: boolean;
  simdi?: number;
}) {
  const sureDurumu = simdi === undefined ? null : eclubHoykSureDurumu(oneri.oneri_baslangic, oneri.oneri_bitis, simdi);
  const suresiGecti = oneri.oneri_durumu === "suresi_gecmis" || sureDurumu?.suresiGecti === true;
  const cekli = oneri.cek_karsiligi_var_mi === true;
  const siparisSarti = oneri.satis_sarti_tipi === "satis_sartli"
    ? "Sipariş zorunlu"
    : oneri.satis_sarti_tipi === "serbest_siparis"
      ? "Siparişle çek tutarı artar"
      : oneri.satis_sarti_tipi === "siparissiz_cek"
        ? "Sipariş yok"
        : "Sipariş koşulu belirtilmemiş";

  const kartJSX = (
    <YayinKarti
      className="w-full"
      kapakOncelikli={kapakOncelikli}
      pillMetniNormal={firmaRozetiGoster}
      yayin={{
        ...oneri,
        gorunen_urun_id: firmaRozetiGoster ? null : oneri.gorunen_urun_id,
        yayin_tarihi: oneri.created_at || oneri.oneri_baslangic,
      }}
      onClick={onSec}
      onBegeni={onBegeni}
      onFavori={onFavori}
      etkilesimAktif={etkilesimAktif}
      donguGoster={false}
      icerikTuruGoster={false}
      kapsulZeminiGoster={false}
      durumGoster={false}
      uyariCercevesi={!oneri.izlendi_mi && suresiGecti}
      tamamlandiCercevesi={oneri.izlendi_mi}
      eclubGecenGun={!suresiGecti && !oneri.izlendi_mi ? sureDurumu?.gecenGun : undefined}
      thumbnailSolUstRozet={firmaRozetiGoster && oneri.firma_adi ? (
        <span title={oneri.firma_adi} className="block truncate rounded-full border border-white/40 bg-[#1e3a8a] px-2 py-0.5 text-xs font-normal text-white shadow-sm backdrop-blur-sm sm:text-[9px]">
          {oneri.firma_adi}
        </span>
      ) : undefined}
      hoverOverlay={playButonuGoster ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-[#10233a]/65 text-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
            <Play size={14} fill="currentColor" />
          </span>
        </span>
      ) : null}
      altEkIcerik={
        <div className="mt-2 border-t border-[#e8eef5] pt-2" aria-label="Yayın bilgileri ve koşulları">
          {cekli ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#e2edff] text-[#0759e9]">
                    <Gift className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-bold leading-tight text-[#111b2f] sm:text-[10px]">Çekli Puan</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdeaea] px-1.5 py-1 text-[9px] leading-none text-[#cf261c] sm:text-[8px]">
                  {oneri.satis_sarti_tipi === "satis_sartli" && <ShoppingCart className="h-3 w-3 shrink-0" strokeWidth={2.2} aria-hidden="true" />}
                  {siparisSarti}
                </span>
              </div>
              {oneri.satis_sarti_tipi === "serbest_siparis" && oneri.gizli_sart_katlama_orani != null && (
                <span className="mt-1 block text-[8px] leading-tight text-[#627694] sm:text-[7px]">Siparişle çek tutarı +%{oneri.gizli_sart_katlama_orani}</span>
              )}
              {Array.isArray(oneri.barem_tablosu) && oneri.barem_tablosu.length > 0 && (
                <div className="mt-1.5 grid grid-cols-3 gap-1">
                  {oneri.barem_tablosu.map((barem, index) => (
                    <span key={index} className="flex min-w-0 flex-col rounded-lg border border-[#dce9fa] bg-white p-0.5 text-center" title={`${barem.min_puan.toLocaleString("tr-TR")}–${barem.max_puan.toLocaleString("tr-TR")} puan${oneri.satis_sarti_tipi === "siparissiz_cek" ? "" : `: ${barem.adet}+${barem.mal_fazlasi}`}`}>
                      <span className="flex min-h-3 items-center justify-center gap-0.5 whitespace-nowrap text-[7px] font-medium leading-tight text-[#627997] sm:text-[6px]">
                        <Box className="h-2.5 w-2.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                        <span>{barem.min_puan.toLocaleString("tr-TR")}–{barem.max_puan.toLocaleString("tr-TR")}p</span>
                      </span>
                      {oneri.satis_sarti_tipi !== "siparissiz_cek" && (
                        <span className="mt-0.5 rounded-md bg-[#eaf4ff] py-1 text-[11px] font-extrabold leading-none sm:text-[10px]" aria-label={`${barem.adet}+${barem.mal_fazlasi}`}>
                          <span className="text-[#071a3b]">{barem.adet}</span><span className="text-[#1263ef]">+{barem.mal_fazlasi}</span>
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : oneri.cek_karsiligi_var_mi === false ? (
            <div className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#f0f6ff] to-[#f7faff] p-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#dceaff] text-[#1764e8]">
                <Ticket className="h-4 w-4 -rotate-45" strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold leading-tight text-[#111b2f] sm:text-[10px]">Çeksiz Puan</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-[#deecff] px-1.5 py-1 text-[9px] font-medium leading-none text-[#1764e8] sm:text-[8px]">
                <Trophy className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                Yalnız lig
              </span>
            </div>
          ) : (
            <span className={bilgi}>Puan türü belirtilmemiş</span>
          )}
        </div>
      }
    />
  );

  if (mobilMi) {
    return <div data-eclub-hoyk-kart className="flex w-full min-w-0" style={{ minHeight: "var(--eclub-hoyk-kart-yuksekligi)" }}>{kartJSX}</div>;
  }

  return <div data-eclub-hoyk-kart className="flex w-40 shrink-0 snap-start sm:w-44 md:w-52" style={{ minHeight: "var(--eclub-hoyk-kart-yuksekligi)" }}>{kartJSX}</div>;
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
  firmaRozetiGoster = false,
  simdi,
  bosMesaji = "Bu rafta henüz öğrenme içeriği bulunmuyor.",
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
  firmaRozetiGoster?: boolean;
  simdi?: number;
  bosMesaji?: string;
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
      <div ref={raf} className="flex snap-x gap-2.5 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videolar.map((oneri, index) => (
          <EclubVideoKarti
            key={oneri.oneri_id}
            oneri={oneri}
            kapakOncelikli={ilkKapakOncelikli && index === 0}
            playButonuGoster={playButonuGoster}
            firmaRozetiGoster={firmaRozetiGoster}
            simdi={simdi}
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
          firmaRozetiGoster={firmaRozetiGoster}
          simdi={simdi}
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
          {bosMesaji}
        </div>
      }
      masaustuIcerik={masaustuIcerik}
    />
  );
}

export default function EclubFirmaVideoKatalogu({ oneriler, seciliFirmaId, seciliFirmaAdi, seciliUrunAdi, onVideoSec, onBegeni, onFavori, ilkKapakOncelikli = false, playButonuGoster = true, firmaRozetiGoster = false, ilkRafRastgele = false, filtreBasligi }: Props) {
  const katalogRef = useRef<HTMLDivElement>(null);
  const [karistirmaTohumu] = useState(() => Math.random().toString(36).slice(2));
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => {
    const sonrakiBitis = oneriler.reduce((enYakin, oneri) => {
      const bitis = Date.parse(oneri.oneri_bitis);
      return bitis > simdi && bitis < enYakin ? bitis : enYakin;
    }, Number.POSITIVE_INFINITY);
    const sonrakiDegisim = Math.min(sonrakiTurkiyeGeceYarisi(simdi), sonrakiBitis);
    const zamanlayici = window.setTimeout(() => setSimdi(Date.now()), Math.max(50, sonrakiDegisim - Date.now() + 50));
    const gorunurlukDegisti = () => { if (!document.hidden) setSimdi(Date.now()); };
    document.addEventListener("visibilitychange", gorunurlukDegisti);
    return () => {
      window.clearTimeout(zamanlayici);
      document.removeEventListener("visibilitychange", gorunurlukDegisti);
    };
  }, [oneriler, simdi]);
  useEffect(() => {
    const katalog = katalogRef.current;
    if (!katalog) return;

    let kare = 0;
    let genislik = katalog.clientWidth;
    const olc = () => {
      katalog.style.removeProperty("--eclub-hoyk-kart-yuksekligi");
      const kartlar = Array.from(katalog.querySelectorAll<HTMLElement>("[data-eclub-hoyk-kart]"))
        .filter((kart) => kart.getClientRects().length > 0);
      const enUzun = Math.ceil(Math.max(0, ...kartlar.map((kart) => kart.getBoundingClientRect().height)));
      if (enUzun > 0) katalog.style.setProperty("--eclub-hoyk-kart-yuksekligi", `${enUzun}px`);
    };
    const yenidenOlc = () => {
      cancelAnimationFrame(kare);
      kare = requestAnimationFrame(olc);
    };
    const boyutGozlemcisi = new ResizeObserver(() => {
      const yeniGenislik = katalog.clientWidth;
      if (yeniGenislik !== genislik) {
        genislik = yeniGenislik;
        yenidenOlc();
      }
    });
    const icerikGozlemcisi = new MutationObserver(yenidenOlc);
    boyutGozlemcisi.observe(katalog);
    icerikGozlemcisi.observe(katalog, { childList: true, characterData: true, attributes: true, attributeFilter: ["class"], subtree: true });
    window.addEventListener("resize", yenidenOlc);
    yenidenOlc();

    return () => {
      cancelAnimationFrame(kare);
      boyutGozlemcisi.disconnect();
      icerikGozlemcisi.disconnect();
      window.removeEventListener("resize", yenidenOlc);
    };
  }, []);
  const firmaVideolari = useMemo(
    () => seciliFirmaId ? oneriler.filter((oneri) => oneri.firma_id === seciliFirmaId) : oneriler,
    [oneriler, seciliFirmaId],
  );
  const ilkRafVideolari = useMemo(
    () => ilkRafRastgele ? tohumaGoreYayinSirala(firmaVideolari, karistirmaTohumu) : firmaVideolari,
    [firmaVideolari, ilkRafRastgele, karistirmaTohumu],
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
    <div ref={katalogRef} className="flex flex-col gap-6">
      {filtreBasligi ? <VideoRafi
        key={filtreBasligi}
        simdi={simdi}
        ilkKapakOncelikli={ilkKapakOncelikli}
        playButonuGoster={playButonuGoster}
        firmaRozetiGoster={firmaRozetiGoster}
        baslik={filtreBasligi}
        bosMesaji={`${filtreBasligi} için yayın bulunmuyor.`}
        videolar={ilkRafVideolari}
        onVideoSec={onVideoSec}
        onBegeni={onBegeni}
        onFavori={onFavori}
        etkilesimAktif
        sifirlamaAnahtari={`${sifirlamaKapsami}-${filtreBasligi}`}
      /> : <>
      <VideoRafi
        simdi={simdi}
        ilkKapakOncelikli={ilkKapakOncelikli}
        playButonuGoster={playButonuGoster}
        firmaRozetiGoster={firmaRozetiGoster}
        baslik={seciliUrunAdi ? `${seciliUrunAdi} Yayınları` : firmaBasligi ? `${firmaBasligi} Tüm İçerikleri` : "Tüm Firmaların Yayınları"}
        videolar={ilkRafVideolari}
        onVideoSec={onVideoSec}
        onBegeni={onBegeni}
        onFavori={onFavori}
        etkilesimAktif
        sifirlamaAnahtari={`${sifirlamaKapsami}-tumu`}
      />
      <VideoRafi
        simdi={simdi}
        playButonuGoster={playButonuGoster}
        firmaRozetiGoster={firmaRozetiGoster}
        baslik={seciliUrunAdi ? `${seciliUrunAdi} En Çok Beğenilenler` : firmaBasligi ? `${firmaBasligi} En Çok Beğenilenleri` : "En Çok Beğenilenler"}
        videolar={enCokBegenilen}
        onVideoSec={onVideoSec}
        onBegeni={onBegeni}
        onFavori={onFavori}
        etkilesimAktif={false}
        sifirlamaAnahtari={`${sifirlamaKapsami}-begenilen`}
      />
      <VideoRafi
        simdi={simdi}
        playButonuGoster={playButonuGoster}
        firmaRozetiGoster={firmaRozetiGoster}
        baslik={seciliUrunAdi ? `${seciliUrunAdi} En Çok Favorilenenler` : firmaBasligi ? `${firmaBasligi} En Çok Favorilenenleri` : "En Çok Favorilenenler"}
        videolar={enCokFavorilenen}
        onVideoSec={onVideoSec}
        onBegeni={onBegeni}
        onFavori={onFavori}
        etkilesimAktif={false}
        sifirlamaAnahtari={`${sifirlamaKapsami}-favorilenen`}
      />
      </>}
    </div>
  );
}
