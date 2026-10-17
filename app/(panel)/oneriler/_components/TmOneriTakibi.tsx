"use client";

import { SadeKisiSecimi } from "@/components/kontrol/KisiKontroller";

import { AracVarsayilanKapak } from "@/components/ogrenme-araci/AracVarsayilanKapak";
import RaporPeriyotSecici from "@/components/raporlar/RaporPeriyotSecici";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import VideoOnizleme from "@/components/video/VideoOnizleme";
import { yayinThumbnailIstemciCoz } from "@/lib/ogrenmeAraci/thumbnailIstemci";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import type { Periyot } from "@/lib/utils/raporUtils";
import { UTT_VIDEO_KATEGORILERI } from "@/lib/video/uttVideoKategorileri";
import { CheckCircle2, ChevronDown, Clock3, Send, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

export type TmOneriDurumu = "planlandi" | "tamamlanan" | "bekleyen" | "suresi_gecmis";
type TmOneriSecimi = "toplam" | TmOneriDurumu;

export interface TmOneriKaydi {
  bm_id: string;
  bm_adi: string;
  bolge_id: string;
  bolge_adi: string;
  oneri_id: string;
  kullanici_id: string;
  utt_ad: string;
  utt_soyad: string;
  yayin_id: string;
  urun_adi: string | null;
  teknik_adi: string | null;
  oneri_baslangic: string;
  oneri_bitis: string;
  created_at: string;
  izleme_tarihi: string | null;
  durum: TmOneriDurumu;
  video_url: string | null;
  thumbnail_url: string | null;
  arac_id?: string | null;
  arac_turu?: string | null;
  icerik_turu?: string | null;
}

export interface TmBmKaydi {
  bm_id: string;
  bm_adi: string;
  bolge_id: string;
  bolge_adi: string;
}

interface Props {
  oneriler: TmOneriKaydi[];
  bmler: TmBmKaydi[];
  periyot: Periyot;
  onPeriyotDegistir: (periyot: Periyot) => void;
  yenileniyor?: boolean;
  onYenile?: () => void;
}

const DURUM_ETIKETI: Record<TmOneriDurumu, string> = {
  planlandi: "Planlandı",
  tamamlanan: "Tamamlandı",
  bekleyen: "Bekliyor",
  suresi_gecmis: "Süresi geçmiş",
};

const DURUM_GORUNUMU: Record<TmOneriDurumu, { renk: string; zemin: string }> = {
  planlandi: { renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-01)", zemin: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-02)" },
  tamamlanan: { renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-02)", zemin: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-03)" },
  bekleyen: { renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-07)", zemin: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-04)" },
  suresi_gecmis: { renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-04)", zemin: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-05)" },
};

const tarihMetni = (deger: string | null) => deger
  ? new Date(deger).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  : "—";

const kayitDurumu = (oneri: TmOneriKaydi): TmOneriDurumu => {
  if (oneri.durum === "tamamlanan") return "tamamlanan";
  const simdi = Date.now();
  if (new Date(oneri.oneri_bitis).getTime() < simdi) return "suresi_gecmis";
  if (new Date(oneri.oneri_baslangic).getTime() > simdi) return "planlandi";
  return "bekleyen";
};

const kategoriAdi = (icerikTuru: string | null | undefined) =>
  UTT_VIDEO_KATEGORILERI.find((kategori) => kategori.icerikTuru === icerikTuru)?.etiket ?? "—";

const ogrenmeAraciAdi = (aracTuru: string | null | undefined) =>
  YAYIN_TURU_SUNUMU[aracTuru as OgrenmeAraciTuru]?.etiket ?? "—";

interface TemsilciSecenegi {
  id: string;
  ad: string;
}

function TemsilciFiltresi({ temsilciler, deger, onDegistir }: { temsilciler: TemsilciSecenegi[]; deger: string; onDegistir: (id: string) => void }) {
 return <SadeKisiSecimi baslik="Temsilciler" bosSecenekEtiketi="Tüm Temsilciler" varyant="tablo" kisiler={temsilciler.map((t) => ({ deger: t.id, adSoyad: t.ad }))} deger={deger} onDegistir={onDegistir} />;
}

export default function TmOneriTakibi({
  oneriler,
  bmler,
  periyot,
  onPeriyotDegistir,
  yenileniyor = false,
  onYenile,
}: Props) {
  const [acikDurum, setAcikDurum] = useState<TmOneriSecimi>("toplam");
  const [acikBm, setAcikBm] = useState<string | null>(null);
  const [temsilciSecimi, setTemsilciSecimi] = useState<{ bmId: string; uttId: string } | null>(null);
  const [acikVideo, setAcikVideo] = useState<string | null>(null);

  const sayilar = useMemo(() => {
    const tamamlanan = oneriler.filter((item) => kayitDurumu(item) === "tamamlanan").length;
    const bekleyen = oneriler.filter((item) => ["planlandi", "bekleyen"].includes(kayitDurumu(item))).length;
    const suresiGecmis = oneriler.filter((item) => kayitDurumu(item) === "suresi_gecmis").length;
    return {
      toplam: oneriler.length,
      tamamlanan,
      bekleyen,
      suresiGecmis,
    };
  }, [oneriler]);

  const kartlar: {
    key: TmOneriSecimi;
    label: string;
    value: number;
    renk: string;
    icon: typeof Send;
    aciklama: string;
  }[] = [
    {
      key: "toplam",
      label: "Toplam Öneri",
      value: sayilar.toplam,
      renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-01)",
      icon: Send,
      aciklama: "Takımdaki tüm öğrenme aracı önerileri",
    },
    {
      key: "tamamlanan",
      label: "Tamamlanan",
      value: sayilar.tamamlanan,
      renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-02)",
      icon: CheckCircle2,
      aciklama: "UTT’lerin tamamladığı öneriler",
    },
    {
      key: "bekleyen",
      label: "Bekleyen",
      value: sayilar.bekleyen,
      renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-07)",
      icon: Clock3,
      aciklama: "Henüz izlenmemiş açık öneriler",
    },
    {
      key: "suresi_gecmis",
      label: "Süresi Geçmiş",
      value: sayilar.suresiGecmis,
      renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-04)",
      icon: TriangleAlert,
      aciklama: "Süre bitimine kadar tamamlanmayan",
    },
  ];

  const seciliOneriler = useMemo(() => {
    if (acikDurum === "toplam") return oneriler;
    return oneriler.filter((item) => acikDurum === "bekleyen"
      ? ["planlandi", "bekleyen"].includes(kayitDurumu(item))
      : kayitDurumu(item) === acikDurum);
  }, [acikDurum, oneriler]);

  const seciliBmOnerileri = useMemo(() => bmler
    .map((bm) => ({
      ...bm,
      oneriler: seciliOneriler.filter((item) => item.bm_id === bm.bm_id),
    }))
    .sort((a, b) => b.oneriler.length - a.oneriler.length || a.bm_adi.localeCompare(b.bm_adi, "tr")), [bmler, seciliOneriler]);

  const temsilciSecenekleri = useMemo(() => {
    const gruplar = new Map<string, Map<string, TemsilciSecenegi>>();
    for (const oneri of oneriler) {
      const temsilciler = gruplar.get(oneri.bm_id) ?? new Map<string, TemsilciSecenegi>();
      temsilciler.set(oneri.kullanici_id, { id: oneri.kullanici_id, ad: `${oneri.utt_ad} ${oneri.utt_soyad}`.trim() });
      gruplar.set(oneri.bm_id, temsilciler);
    }
    return new Map([...gruplar].map(([bmId, temsilciler]) => [bmId, [...temsilciler.values()].sort((a, b) => a.ad.localeCompare(b.ad, "tr"))]));
  }, [oneriler]);

  const seciliBaslik = kartlar.find((kart) => kart.key === acikDurum)?.label;

  return (
    <div aria-busy={yenileniyor} className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
      <SayfaYenileBasligi className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        baslik={<div className="inline-flex items-center">
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-ortak-sayfa-ana-metin-01)] md:text-[28px]">Öneri Takibi</h1>
          <SayfaRehberi anahtar="oneriler-tm" className="ml-1.5 -translate-y-1.5" />
        </div>}

        aciklama={<><p className="mt-1 max-w-3xl text-sm leading-5 text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-01)]">Takımınızdaki BM’lerin temsilcilere gönderdiği önerileri takip edebilirsiniz</p></>}
        aksiyon={onYenile && <YenileButonu yenileniyor={yenileniyor} onYenile={onYenile} />}
        ekKontroller={<><div className="flex items-center gap-2">
          <RaporPeriyotSecici deger={periyot} onDegistir={onPeriyotDegistir} />

        </div></>}
      />

      <section aria-label="Takım öneri durumu" className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {kartlar.map((kart) => {
          const acik = acikDurum === kart.key;
          return (
            <button
              key={kart.key}
              type="button"
              onClick={() => {
                setAcikDurum(kart.key);
                setAcikBm(null);
                setTemsilciSecimi(null);
              }}
              aria-pressed={acik}
              aria-controls="tm-oneri-detayi"
              className={`rounded-2xl border bg-[var(--tema-yerel-ortak-sayfa-kart-01)] p-3.5 text-left shadow-[0_6px_18px_var(--tema-yerel-ortak-sayfa-golge-01)] transition-all hover:-translate-y-0.5 ${acik ? "ring-2 ring-[var(--tema-yerel-ortak-sayfa-odak-01)]" : "border-[var(--tema-yerel-ortak-sayfa-cizgi-01)]"}`}
              style={{ borderLeft: `4px solid ${kart.renk}` }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ color: kart.renk }}>{kart.label}</span>
                <kart.icon size={16} style={{ color: kart.renk }} />
              </span>
              <strong className="mt-1 block text-2xl font-black text-[var(--tema-yerel-ortak-sayfa-ana-metin-02)]">{kart.value}</strong>
              <small className="mt-1 hidden text-[11px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-05)] sm:block">{kart.aciklama}</small>
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-01)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)] shadow-[0_6px_18px_var(--tema-yerel-ortak-sayfa-golge-01)]">
        <div className="border-b border-[var(--tema-yerel-ortak-sayfa-cizgi-04)] px-4 py-3.5">
          <h2 className="text-base font-extrabold text-[var(--tema-yerel-ortak-sayfa-ana-metin-03)]">Öneri Takip Listesi</h2>
        </div>

        <div id="tm-oneri-detayi">
            <div className="grid gap-2.5 p-3 md:hidden">
              {seciliBmOnerileri.map((bm) => {
                const bmAcik = acikBm === bm.bm_id;
                const temsilciler = temsilciSecenekleri.get(bm.bm_id) ?? [];
                const seciliTemsilciId = temsilciSecimi?.bmId === bm.bm_id && temsilciler.some((temsilci) => temsilci.id === temsilciSecimi.uttId) ? temsilciSecimi.uttId : "";
                const gorunenOneriler = seciliTemsilciId ? bm.oneriler.filter((oneri) => oneri.kullanici_id === seciliTemsilciId) : bm.oneriler;
                const basHarfler = bm.bm_adi.split(" ").filter(Boolean).slice(0, 2).map((parca) => parca.charAt(0)).join("");
                return (
                  <article key={bm.bm_id} className="overflow-hidden rounded-xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-05)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)]">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-03)]"
                      onClick={() => {
                        setAcikBm(bmAcik ? null : bm.bm_id);
                        setTemsilciSecimi(null);
                      }}
                      aria-expanded={bmAcik}
                      aria-controls={`tm-oneri-bm-mobil-${bm.bm_id}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-01)] text-xs font-black text-[var(--tema-yerel-ortak-sayfa-eylem-metin-01)]">{basHarfler}</span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm text-[var(--tema-yerel-ortak-sayfa-ana-metin-04)]">{bm.bm_adi}</strong>
                        <small className="mt-0.5 block truncate text-[10px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-06)]">{bm.bolge_adi}</small>
                      </span>
                      <span className="shrink-0 rounded-full bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-02)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--tema-yerel-ortak-sayfa-eylem-metin-01)]">{bm.oneriler.length} öneri</span>
                      <ChevronDown size={15} className={`shrink-0 text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-07)] transition-transform ${bmAcik ? "rotate-180" : ""}`} />
                    </button>

                    {bmAcik && (
                      <div id={`tm-oneri-bm-mobil-${bm.bm_id}`} className="grid gap-2.5 border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-04)] bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-04)] p-2.5">
                          <div className="rounded-lg bg-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-06)] px-2.5 py-2"><TemsilciFiltresi temsilciler={temsilciler} deger={seciliTemsilciId} onDegistir={(uttId) => setTemsilciSecimi({ bmId: bm.bm_id, uttId })} /></div>
                          {gorunenOneriler.length > 0 ? gorunenOneriler.map((oneri) => {
                          const kayitDurumuDegeri = kayitDurumu(oneri);
                          const durum = DURUM_GORUNUMU[kayitDurumuDegeri];
                          const kapak = yayinThumbnailIstemciCoz(oneri);
                          const videoOynatilabilir = (oneri.arac_turu ?? "video") === "video" && !!oneri.video_url;
                          return (
                            <article key={oneri.oneri_id} className="rounded-xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-05)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)] p-3">
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  disabled={!videoOynatilabilir}
                                  onClick={() => videoOynatilabilir && setAcikVideo(oneri.video_url!)}
                                  aria-label={videoOynatilabilir ? `${oneri.urun_adi ?? "Öneri"} videosunu aç` : `${oneri.urun_adi ?? "Öneri"} kapağı`}
                                  className="group relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-01)] disabled:cursor-default"
                                >
                                  {kapak ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${kapak})` }} /> : <AracVarsayilanKapak aracTuru={oneri.arac_turu} urunAdi={oneri.urun_adi} kucuk />}
                                  {videoOynatilabilir && <span className="absolute inset-0 flex items-center justify-center bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-03)]/25"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-03)]/70 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] transition-transform group-hover:scale-105"><svg aria-hidden="true" width="8" height="10" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z" /></svg></span></span>}
                                </button>
                                <span className="min-w-0 flex-1">
                                  <strong className="block truncate text-sm text-[var(--tema-yerel-ortak-sayfa-ana-metin-04)]">{oneri.utt_ad} {oneri.utt_soyad}</strong>
                                  <small className="mt-1 block truncate text-[11px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-08)]">{oneri.urun_adi ?? "Ürün dışı eğitim"} · {oneri.teknik_adi ?? "Teknik belirtilmemiş"}</small>
                                  <small className="mt-1 block truncate text-[11px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-08)]">{kategoriAdi(oneri.icerik_turu)}</small>
                                  <small className="mt-1 block truncate text-[11px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-08)]">{ogrenmeAraciAdi(oneri.arac_turu)}</small>
                                </span>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="col-span-2 rounded-lg bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-04)] px-2.5 py-2"><small className="block text-[9px] font-bold uppercase text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-09)]">Gönderi Tarihi</small><strong className="text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-10)]">{tarihMetni(oneri.created_at)}</strong></div>
                                <div className="rounded-lg bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-04)] px-2.5 py-2"><small className="block text-[9px] font-bold uppercase text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-09)]">Başlangıç Tarihi</small><strong className="block text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-10)]">{tarihMetni(oneri.oneri_baslangic)}</strong></div>
                                <div className="rounded-lg bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-04)] px-2.5 py-2"><small className="block text-[9px] font-bold uppercase text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-09)]">Bitiş Tarihi</small><strong className="block text-[11px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-10)]">{tarihMetni(oneri.oneri_bitis)}</strong></div>
                              </div>
                              <div className="mt-2 flex items-center gap-2"><span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold" style={{ color: durum.renk, backgroundColor: durum.zemin }}>{DURUM_ETIKETI[kayitDurumuDegeri]}</span>{kayitDurumuDegeri === "tamamlanan" && <small className="text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-08)]">{tarihMetni(oneri.izleme_tarihi)}</small>}</div>
                            </article>
                          );
                        }) : <div className="px-3 py-8 text-center text-xs font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-03)]">{seciliTemsilciId ? "Seçili temsilci" : "Bu BM"} için {seciliBaslik?.toLocaleLowerCase("tr-TR")} bulunmuyor.</div>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[760px] text-xs">
                <div className="grid grid-cols-[minmax(260px,1fr)_minmax(150px,.55fr)_120px_44px] bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-04)] text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-07)]">
                  <span className="px-4 py-3">BM</span><span className="px-4 py-3">Bölge</span><span className="px-4 py-3">Öneri</span><span className="px-4 py-3" />
                </div>
                {seciliBmOnerileri.map((bm) => {
                  const bmAcik = acikBm === bm.bm_id;
                  const temsilciler = temsilciSecenekleri.get(bm.bm_id) ?? [];
                  const seciliTemsilciId = temsilciSecimi?.bmId === bm.bm_id && temsilciler.some((temsilci) => temsilci.id === temsilciSecimi.uttId) ? temsilciSecimi.uttId : "";
                  const gorunenOneriler = seciliTemsilciId ? bm.oneriler.filter((oneri) => oneri.kullanici_id === seciliTemsilciId) : bm.oneriler;
                  const basHarfler = bm.bm_adi.split(" ").filter(Boolean).slice(0, 2).map((parca) => parca.charAt(0)).join("");
                  return (
                    <article key={bm.bm_id} className="border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-03)]">
                      <button
                        type="button"
                        className="grid w-full grid-cols-[minmax(260px,1fr)_minmax(150px,.55fr)_120px_44px] items-center text-left transition-colors hover:bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-03)]"
                        onClick={() => {
                          setAcikBm(bmAcik ? null : bm.bm_id);
                          setTemsilciSecimi(null);
                        }}
                        aria-expanded={bmAcik}
                        aria-controls={`tm-oneri-bm-masaustu-${bm.bm_id}`}
                      >
                        <span className="flex min-w-0 items-center gap-3 px-4 py-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-01)] text-xs font-black text-[var(--tema-yerel-ortak-sayfa-eylem-metin-01)]">{basHarfler}</span><strong className="truncate text-xs text-[var(--tema-yerel-ortak-sayfa-ana-metin-05)]">{bm.bm_adi}</strong></span>
                        <span className="px-4 py-3 font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]">{bm.bolge_adi}</span>
                        <span className="px-4 py-3"><span className="rounded-full bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-02)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--tema-yerel-ortak-sayfa-eylem-metin-01)]">{bm.oneriler.length}</span></span>
                        <span className="px-4 py-3"><ChevronDown size={15} className={`text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-07)] transition-transform ${bmAcik ? "rotate-180" : ""}`} /></span>
                      </button>

                      {bmAcik && (
                        <div id={`tm-oneri-bm-masaustu-${bm.bm_id}`} className="border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-04)] bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-04)] p-3">
                          {bm.oneriler.length > 0 || seciliTemsilciId ? (
                            <div className="mx-auto w-full max-w-[1280px] overflow-x-auto rounded-xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-05)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)]">
                              <div className="grid min-w-[1120px] grid-cols-[180px_200px_repeat(6,minmax(120px,1fr))] items-center bg-[var(--tema-yerel-ortak-sayfa-islevsel-zemin-07)] text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--tema-yerel-ortak-sayfa-islevsel-metin-08)]">
                                <div className="px-3 py-2.5"><TemsilciFiltresi temsilciler={temsilciler} deger={seciliTemsilciId} onDegistir={(uttId) => setTemsilciSecimi({ bmId: bm.bm_id, uttId })} /></div><span className="px-3 py-2.5">Yayın</span><span className="px-3 py-2.5">Kategori</span><span className="px-3 py-2.5">Öğrenme Aracı</span><span className="px-3 py-2.5">Gönderi Tarihi</span><span className="px-3 py-2.5">Başlangıç Tarihi</span><span className="px-3 py-2.5">Bitiş Tarihi</span><span className="px-3 py-2.5">Durum</span>
                              </div>
                              {gorunenOneriler.map((oneri) => {
                                const kayitDurumuDegeri = kayitDurumu(oneri);
                                const durum = DURUM_GORUNUMU[kayitDurumuDegeri];
                                const kapak = yayinThumbnailIstemciCoz(oneri);
                                const videoOynatilabilir = (oneri.arac_turu ?? "video") === "video" && !!oneri.video_url;
                                return (
                                  <div key={oneri.oneri_id} className="grid min-w-[1120px] grid-cols-[180px_200px_repeat(6,minmax(120px,1fr))] items-center border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-03)] hover:bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-03)]">
                                    <strong className="px-3 py-3 text-xs text-[var(--tema-yerel-ortak-sayfa-ana-metin-06)]">{oneri.utt_ad} {oneri.utt_soyad}</strong>
                                    <button
                                      type="button"
                                      disabled={!videoOynatilabilir}
                                      onClick={() => videoOynatilabilir && setAcikVideo(oneri.video_url!)}
                                      aria-label={videoOynatilabilir ? `${oneri.urun_adi ?? "Öneri"} videosunu aç` : `${oneri.urun_adi ?? "Öneri"} kapağı`}
                                      className="group flex min-w-0 items-center gap-3 px-3 py-2.5 text-left disabled:cursor-default"
                                    >
                                      <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--tema-yerel-ortak-sayfa-secim-zemin-01)]">
                                        {kapak ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${kapak})` }} /> : <AracVarsayilanKapak aracTuru={oneri.arac_turu} urunAdi={oneri.urun_adi} kucuk />}
                                        {videoOynatilabilir && <span className="absolute inset-0 flex items-center justify-center bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-03)]/25"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--tema-yerel-ortak-sayfa-eylem-zemin-03)]/70 text-[var(--tema-yerel-ortak-sayfa-ters-metin-01)] transition-transform group-hover:scale-105"><svg aria-hidden="true" width="7" height="9" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z" /></svg></span></span>}
                                      </span>
                                      <span className="min-w-0"><strong className="block truncate text-xs text-[var(--tema-yerel-ortak-sayfa-ana-metin-05)]">{oneri.urun_adi ?? "Ürün dışı eğitim"}</strong><small className="mt-0.5 block truncate text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-06)]">{oneri.teknik_adi ?? "Teknik belirtilmemiş"}</small></span>
                                    </button>
                                    <span className="px-3 py-3 text-[10px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]">{kategoriAdi(oneri.icerik_turu)}</span>
                                    <span className="px-3 py-3 text-[10px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]">{ogrenmeAraciAdi(oneri.arac_turu)}</span>
                                    <span className="px-3 py-3 text-[10px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]">{tarihMetni(oneri.created_at)}</span>
                                    <span className="px-3 py-3 text-[10px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]">{tarihMetni(oneri.oneri_baslangic)}</span>
                                    <span className="px-3 py-3 text-[10px] font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]">{tarihMetni(oneri.oneri_bitis)}</span>
                                    <span className="px-3 py-3"><span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold" style={{ color: durum.renk, backgroundColor: durum.zemin }}>{DURUM_ETIKETI[kayitDurumuDegeri]}</span>{kayitDurumuDegeri === "tamamlanan" && <small className="mt-1 block text-[10px] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]">{tarihMetni(oneri.izleme_tarihi)}</small>}</span>
                                  </div>
                                );
                              })}
                              {gorunenOneriler.length === 0 && <div className="px-3 py-8 text-center text-xs font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-03)]">Seçili temsilci için {seciliBaslik?.toLocaleLowerCase("tr-TR")} bulunmuyor.</div>}
                            </div>
                          ) : <div className="px-3 py-8 text-center text-xs font-semibold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-03)]">{seciliTemsilciId ? "Seçili temsilci" : "Bu BM"} için {seciliBaslik?.toLocaleLowerCase("tr-TR")} bulunmuyor.</div>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
        </div>
      </section>

      {acikVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--tema-yerel-ortak-sayfa-ortu-01)]/70 p-4" onClick={() => setAcikVideo(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="tm-video-onizleme-baslik" className="w-full max-w-3xl overflow-hidden rounded-2xl bg-[var(--tema-yerel-ortak-sayfa-kart-01)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--tema-yerel-ortak-sayfa-cizgi-03)] px-4 py-3">
              <strong id="tm-video-onizleme-baslik" className="text-sm font-extrabold text-[var(--tema-yerel-ortak-sayfa-ana-metin-02)]">Video Önizleme</strong>
              <button type="button" onClick={() => setAcikVideo(null)} aria-label="Video önizlemeyi kapat" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-02)] text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-04)]"><X size={16} /></button>
            </div>
            <VideoOnizleme videoUrl={acikVideo} ariaLabel="Video önizlemeyi oynat" />
          </div>
        </div>
      )}
    </div>
  );
}
