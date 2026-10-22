"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import VideoOynatici from "@/components/izle/VideoOynatici";
import { ANA_SEKME_ETIKETLERI } from "@/app/(panel)/yayin-yonetimi/_types";
import { URETICI_ROLLER, YAYIN_HEDEF_GRUP_SIRASI, ureticiYayinHedefGruplari, yayinHedefGrubuBelirle, type YayinHedefGrubu } from "@/lib/utils/roller";
import { SadeKontrolButonu, SadeKontrolGrubu, SadeZamanToggle } from "@/components/kontrol/SadeKontroller";
import type { Periyot } from "@/lib/utils/raporUtils";
import { anaSayfaRaflari } from "@/lib/video/anaSayfaRaflari";
import { DEPARTMAN_ETIKET, DEPARTMAN_SIRA, departmanKey, type DepartmanKey } from "@/lib/video/departman";
import type { YayindakiVideo } from "@/lib/video/yayindakiVideolar";
import YayindakiVideoBolumu from "./YayindakiVideoBolumu";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { ListeArama, useListe } from "@/components/liste";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import { YAYIN_TURLERI } from "@/lib/ogrenmeAraci/turSunumu";
import { YayinTuruFiltresi, type YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import { getKatalogOnbellek, setKatalogOnbellek } from "@/lib/video/katalogOnbellek";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

type Kapsam = "benim" | "digerleri";

const ARAMA_HEDEF_KITLE_ADLARI: Record<YayinHedefGrubu, string> = {
  utt: "Temsilciler",
  bm: "Bölge Müdürleri",
  eczaci: "Eczacılar",
  eczane_teknisyeni: "Eczane Teknisyenleri",
  eczaci_ve_eczane_teknisyeni: "Eczacılar ve Eczane Teknisyenleri",
  eczanem: "Eczanem Üyeleri",
};

interface Props {
  kapsam: Kapsam;
}

function KayanYayinRafi({ baslik, videolar, onVideoSec, uretenBilgisiGoster, sifirlamaAnahtari }: {
  baslik: string;
  videolar: YayindakiVideo[];
  onVideoSec: (video: YayindakiVideo) => void;
  uretenBilgisiGoster: boolean;
  sifirlamaAnahtari?: string;
}) {
  const raf = useRef<HTMLDivElement>(null);
  const kaydir = (yon: number) => raf.current?.scrollBy({ left: yon * raf.current.clientWidth * 0.85, behavior: "smooth" });

  if (videolar.length === 0) return null;

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-[var(--tema-yerel-ortak-sayfa-ana-metin-02)] md:text-lg">{baslik}</h2>
        <span className="text-[11px] font-bold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-05)]">{videolar.length} yayın</span>
      </div>
      <div className="group relative">
        <button
          type="button"
          aria-label={`${baslik} rafını sola kaydır`}
          onClick={() => kaydir(-1)}
          className="absolute inset-y-0 left-0 z-10 hidden sm:flex w-14 items-center justify-start bg-gradient-to-r from-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-12)] via-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-12)]/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        >
          <svg aria-hidden="true" className="h-7 w-7 text-[var(--tema-yerel-ortak-sayfa-ana-metin-02)]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" /></svg>
        </button>
        <YayindakiVideoBolumu
          videolar={videolar}
          onVideoSec={(video) => onVideoSec(video as YayindakiVideo)}
          uretenBilgisiGoster={uretenBilgisiGoster}
          yatayMi
          rafRef={raf}
          sifirlamaAnahtari={sifirlamaAnahtari}
        />
        <button
          type="button"
          aria-label={`${baslik} rafını sağa kaydır`}
          onClick={() => kaydir(1)}
          className="absolute inset-y-0 right-0 z-10 hidden sm:flex w-14 items-center justify-end bg-gradient-to-l from-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-12)] via-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-12)]/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        >
          <svg aria-hidden="true" className="h-7 w-7 text-[var(--tema-yerel-ortak-sayfa-ana-metin-02)]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>
        </button>
      </div>
    </section>
  );
}

function YayinRaflari({ videolar, onVideoSec, uretenBilgisiGoster, sifirlamaKapsami = "" }: {
  videolar: YayindakiVideo[];
  onVideoSec: (video: YayindakiVideo) => void;
  uretenBilgisiGoster: boolean;
  sifirlamaKapsami?: string;
}) {
  const [tohum] = useState(() => Date.now());
  const tumu = useMemo(() => anaSayfaRaflari(videolar, tohum).tumuRafi, [videolar, tohum]);
  const enSon = useMemo(
    () => [...videolar].sort((a, b) => new Date(b.yayin_tarihi).getTime() - new Date(a.yayin_tarihi).getTime()),
    [videolar],
  );
  const enCokIzlenen = useMemo(
    () => [...videolar].filter((video) => video.izlenme_sayisi > 0).sort((a, b) => b.izlenme_sayisi - a.izlenme_sayisi),
    [videolar],
  );
  const enCokBegenilen = useMemo(
    () => [...videolar].filter((video) => video.begeni_sayisi > 0).sort((a, b) => b.begeni_sayisi - a.begeni_sayisi),
    [videolar],
  );
  const enCokFavorilenen = useMemo(
    () => [...videolar].filter((video) => video.favori_sayisi > 0).sort((a, b) => b.favori_sayisi - a.favori_sayisi),
    [videolar],
  );

  return (
    <div className="flex flex-col gap-6">
      <KayanYayinRafi baslik="Tüm Yayınlar" videolar={tumu} onVideoSec={onVideoSec} uretenBilgisiGoster={uretenBilgisiGoster} sifirlamaAnahtari={`${sifirlamaKapsami}-tumu`} />
      <KayanYayinRafi baslik="Son Eklenenler" videolar={enSon} onVideoSec={onVideoSec} uretenBilgisiGoster={uretenBilgisiGoster} sifirlamaAnahtari={`${sifirlamaKapsami}-enSon`} />
      {enCokIzlenen.length > 0 && (
        <KayanYayinRafi baslik="En Çok İzlenenler" videolar={enCokIzlenen} onVideoSec={onVideoSec} uretenBilgisiGoster={uretenBilgisiGoster} sifirlamaAnahtari={`${sifirlamaKapsami}-enCokIzlenen`} />
      )}
      {enCokBegenilen.length > 0 && (
        <KayanYayinRafi baslik="En Çok Beğenilenler" videolar={enCokBegenilen} onVideoSec={onVideoSec} uretenBilgisiGoster={uretenBilgisiGoster} sifirlamaAnahtari={`${sifirlamaKapsami}-enCokBegenilen`} />
      )}
      {enCokFavorilenen.length > 0 && (
        <KayanYayinRafi baslik="En Çok Favorilenenler" videolar={enCokFavorilenen} onVideoSec={onVideoSec} uretenBilgisiGoster={uretenBilgisiGoster} sifirlamaAnahtari={`${sifirlamaKapsami}-enCokFavorilenen`} />
      )}
    </div>
  );
}

function YayinIstatistikleri({ videolar, yukleniyor }: { videolar: YayindakiVideo[]; yukleniyor: boolean }) {
  const kartlar = [
    {
      etiket: "Toplam Yayınlar",
      deger: videolar.length,
      aciklama: "Yayındaki içerik sayısı",
      renk: "var(--tema-yerel-ortak-sayfa-eylem-metin-01)",
    },
    {
      etiket: "Toplam İzlenme",
      deger: videolar.reduce((toplam, video) => toplam + video.izlenme_sayisi, 0),
      aciklama: "Yayınların toplam izlenmesi",
      renk: "var(--tema-yerel-uretim-islevsel-metin-37)",
    },
    {
      etiket: "Toplam Etkileşim",
      deger: videolar.reduce((toplam, video) => toplam + video.begeni_sayisi + video.favori_sayisi, 0),
      aciklama: "Beğeni ve favori toplamı",
      renk: "var(--tema-yerel-uretim-islevsel-metin-36)",
    },
  ];

  return (
    <div aria-label="Yayın istatistikleri" aria-busy={yukleniyor} className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {kartlar.map((kart) => (
        <article
          key={kart.etiket}
          className="min-w-0 rounded-xl border border-[var(--tema-yerel-uretim-cizgi-12)] bg-[var(--tema-yerel-uretim-kart-01)] p-3 text-left shadow-[0_6px_18px_var(--tema-yerel-uretim-golge-07)] md:p-5"
          style={{ borderLeft: `3px solid ${kart.renk}` }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tema-yerel-uretim-yardimci-metin-20)]">{kart.etiket}</p>
          <div className="text-2xl font-extrabold leading-none text-[var(--tema-yerel-uretim-ana-metin-18)] md:text-3xl">
            {yukleniyor ? (
              <>
                <span aria-hidden="true" className="inline-block h-8 w-12 animate-pulse rounded bg-current/10" />
                <span className="sr-only">Yükleniyor...</span>
              </>
            ) : kart.deger.toLocaleString("tr-TR")}
          </div>
          <p className="mt-1.5 text-xs text-[var(--tema-yerel-uretim-yardimci-metin-20)]">{kart.aciklama}</p>
        </article>
      ))}
    </div>
  );
}

function HedefKitleFiltreleri({ rol, aktifHedef, onSec }: {
  rol: string;
  aktifHedef: YayinHedefGrubu;
  onSec: (hedef: YayinHedefGrubu) => void;
}) {
  return (
    <SadeKontrolGrubu tur="sekme" aria-label="Yayın kitlesi">
      {ureticiYayinHedefGruplari(rol).map((hedef) => (
        <SadeKontrolButonu
          type="button"
          key={hedef}
          onClick={() => onSec(hedef)}
          aria-pressed={hedef === aktifHedef}
        >
          {ANA_SEKME_ETIKETLERI[hedef]}
        </SadeKontrolButonu>
      ))}
    </SadeKontrolGrubu>
  );
}

function DepartmanFiltreleri({ videolar, aktifDepartman, onSec }: {
  videolar: YayindakiVideo[];
  aktifDepartman: DepartmanKey | null;
  onSec: (departman: DepartmanKey) => void;
}) {
  return (
    <SadeKontrolGrubu tur="sekme" aria-label="Yayın departmanı">
      {DEPARTMAN_SIRA.map((departman) => (
        <SadeKontrolButonu
          type="button"
          key={departman}
          onClick={() => onSec(departman)}
          aria-pressed={aktifDepartman === departman}
          disabled={!videolar.some((video) => departmanKey(video.ureten_rol) === departman)}
        >
          {DEPARTMAN_ETIKET[departman]}
        </SadeKontrolButonu>
      ))}
    </SadeKontrolGrubu>
  );
}

export default function UreticiYayinKatalogu({ kapsam }: Props) {
  const router = useRouter();
  const { kullanici, yukleniyor } = useAuth();
  const { mesajlar, hata } = useHataMesaji();
  const hataRef = useRef(hata);

  const baslangicVideolar = getKatalogOnbellek(kapsam, kullanici?.id);
  const [videolar, setVideolar] = useState<YayindakiVideo[]>(() => baslangicVideolar ?? []);
  const [loading, setLoading] = useState(() => !baslangicVideolar);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [aktifVideo, setAktifVideo] = useState<YayindakiVideo | null>(null);
  const [aktifHedef, setAktifHedef] = useState<YayinHedefGrubu>(() => {
    if (kapsam === "benim" && baslangicVideolar) {
      return YAYIN_HEDEF_GRUP_SIRASI.find((hedef) => baslangicVideolar.some((v) => yayinHedefGrubuBelirle(v.hedef_roller) === hedef)) ?? "utt";
    }
    return "utt";
  });
  const [aktifDepartman, setAktifDepartman] = useState<DepartmanKey | null>(() => {
    if (kapsam === "digerleri" && baslangicVideolar) {
      return DEPARTMAN_SIRA.find((dep) => baslangicVideolar.some((v) => departmanKey(v.ureten_rol) === dep)) ?? null;
    }
    return null;
  });
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [aktifZaman, setAktifZaman] = useState<Periyot>("bu_ay");

  const katalogListesi = useListe({
    veri: videolar,
    adim: Infinity,
    aramaAlanlari: kapsam === "benim" ? [
      { anahtar: "yayin_kodu", etiket: "Yayın Kodu", deger: (video: YayindakiVideo) => yayin_kodu(video.firma_adi, video.talep_no) },
      { anahtar: "urun", etiket: "Ürün / Eğitim", deger: (video: YayindakiVideo) => video.urun_adi },
    ] : [
      { anahtar: "urun", etiket: "Ürün / Eğitim", deger: (video: YayindakiVideo) => video.urun_adi },
      { anahtar: "yayin_kodu", etiket: "Yayın Kodu", deger: (video: YayindakiVideo) => yayin_kodu(video.firma_adi, video.talep_no) },
    ],
  });

  useEffect(() => {
    hataRef.current = hata;
  }, [hata]);

  const veriCek = useCallback(async (ilkYukleme = false) => {
    if (ilkYukleme) setLoading(true);
    else setYenileniyor(true);
    try {
      const res = await fetch(`/yayin-katalogu/api?kapsam=${kapsam}`);
      const data = await res.json();
      if (!res.ok) {
        hataRef.current(data.hata ?? "Yayınlar yüklenemedi.", data.adim, data.detay);
        return;
      }
      const gelen = (data.videolar ?? []) as YayindakiVideo[];
      if (kullanici?.id) setKatalogOnbellek(kapsam, kullanici.id, gelen);
      setVideolar(gelen);
      if (kapsam === "benim") {
        setAktifHedef((mevcut) => gelen.some((video) => yayinHedefGrubuBelirle(video.hedef_roller) === mevcut)
          ? mevcut
          : YAYIN_HEDEF_GRUP_SIRASI.find((hedef) => gelen.some((video) => yayinHedefGrubuBelirle(video.hedef_roller) === hedef)) ?? "utt");
      } else {
        setAktifDepartman((mevcut) => mevcut && gelen.some((video) => departmanKey(video.ureten_rol) === mevcut)
          ? mevcut
          : DEPARTMAN_SIRA.find((departman) => gelen.some((video) => departmanKey(video.ureten_rol) === departman)) ?? null);
      }
    } catch {
      hataRef.current("Yayınlar yüklenemedi.");
    } finally {
      if (ilkYukleme) setLoading(false);
      else setYenileniyor(false);
    }
  }, [kapsam, kullanici?.id]);

  useEffect(() => {
    if (yukleniyor) return;
    const rol = (kullanici?.rol ?? "").trim().toLowerCase();
    if (!kullanici || !URETICI_ROLLER.includes(rol)) {
      router.replace(kullanici ? "/ana-sayfa" : "/login");
      return;
    }

    const onbellek = getKatalogOnbellek(kapsam, kullanici.id);
    if (onbellek) {
      setVideolar(onbellek);
      setLoading(false);
    } else {
      setVideolar([]);
      setAktifVideo(null);
      setAktifYayinTuru("tumu");
      setLoading(true);
    }
    void veriCek(!onbellek);
  }, [kullanici, yukleniyor, router, veriCek]);

  useEffect(() => {
    if (aktifVideo) window.scrollTo({ top: 0, behavior: "auto" });
  }, [aktifVideo]);

  const departmanVideolari = kapsam === "digerleri" && aktifDepartman
    ? katalogListesi.gorunen.filter((video) => departmanKey(video.ureten_rol) === aktifDepartman)
    : katalogListesi.gorunen;
  const turSayimKaynagi = kapsam === "benim"
    ? katalogListesi.gorunen.filter((video) => yayinHedefGrubuBelirle(video.hedef_roller) === aktifHedef)
    : departmanVideolari;
  const turSayilari = Object.fromEntries(YAYIN_TURLERI.map((tur) => [tur, turSayimKaynagi.filter((video) => video.arac_turu === tur).length])) as Record<NonNullable<YayindakiVideo["arac_turu"]>, number>;
  const seciliVideolar = turSayimKaynagi.filter(
    (video) => aktifYayinTuru === "tumu" || video.arac_turu === aktifYayinTuru,
  );

  if (yukleniyor || !kullanici) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-05)]">Yükleniyor…</div>;
  }

  if (aktifVideo) {
    return (
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <VideoOynatici
          key={aktifVideo.yayin_id}
          video={aktifVideo}
          tuketici={false}
          aktifYayinDogrula
          onKapat={() => setAktifVideo(null)}
          onVeriYenile={() => {}}
          hata={hata}
          basari={() => {}}
          uyari={() => {}}
        />
        <HataMesajiContainer mesajlar={mesajlar} />
      </div>
    );
  }

  const baslik = kapsam === "benim" ? "Sizin Yayınlarınız" : "Tüm Yayınlar";
  const sifirlamaKapsami = `${kapsam}-${kapsam === "benim" ? aktifHedef : (aktifDepartman ?? "tum")}-${aktifYayinTuru}-${katalogListesi.arama.alanAnahtari}-${katalogListesi.arama.aranan}`;

  return (
    <div className="min-h-full bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-12)]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <SayfaYenileBasligi className="flex flex-col items-start justify-between gap-3 sm:flex-row"
          baslik={<div className="inline-flex items-center">
            <h1 className={`${kapsam === "digerleri" ? "mt-1 " : ""}text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-ortak-sayfa-ana-metin-01)] md:text-[28px]`}>{baslik}</h1>
            <SayfaRehberi
              anahtar={kapsam === "benim" ? "sizin-yayinlariniz-katalog" : "tum-yayinlar-katalog"}
              className="ml-1.5 -translate-y-2"
            />
          </div>}
          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => veriCek()} />}
        />

        <YayinIstatistikleri videolar={videolar} yukleniyor={loading && videolar.length === 0} />

        {loading && videolar.length === 0 ? (
          <div className="flex flex-col gap-5">
            {kapsam === "benim" ? (
              <HedefKitleFiltreleri rol={kullanici.rol ?? ""} aktifHedef={aktifHedef} onSec={setAktifHedef} />
            ) : (
              <DepartmanFiltreleri videolar={videolar} aktifDepartman={aktifDepartman} onSec={setAktifDepartman} />
            )}
            <div className="flex h-48 animate-pulse items-center justify-center rounded-2xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-01)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)]">
              <span className="text-xs font-bold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-05)]">Yayınlar hazırlanıyor...</span>
            </div>
          </div>
        ) : videolar.length === 0 ? (
          <div className="rounded-2xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-01)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)] py-16 text-center text-sm text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-01)]">
            {kapsam === "benim" ? "Henüz yayında bir içeriğiniz yok." : "Diğer üretici birimlere ait yayında içerik yok."}
          </div>
        ) : kapsam === "benim" ? (
          <>
            <HedefKitleFiltreleri rol={kullanici.rol ?? ""} aktifHedef={aktifHedef} onSec={setAktifHedef} />
            <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                <YayinTuruFiltresi secili={aktifYayinTuru} onSec={setAktifYayinTuru} sayilar={turSayilari} />
              </div>
              <SadeZamanToggle
                deger={aktifZaman}
                onDegistir={setAktifZaman}
                etiket="Yayın zamanı"
                className="max-w-full sm:ml-auto sm:shrink-0"
              />
            </div>
            <div className="flex min-w-0 justify-end">
              <ListeArama
                arama={katalogListesi.arama}
                ipucu="Ürün adı veya yayın kodu ara"
                yukseklik="secim"
                genislik="w-full"
                className="w-full sm:w-[344px]"
              />
            </div>
            {seciliVideolar.length > 0 ? (
              <YayinRaflari videolar={seciliVideolar} onVideoSec={setAktifVideo} uretenBilgisiGoster={false} sifirlamaKapsami={sifirlamaKapsami} />
            ) : (
              <div className="rounded-2xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-01)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)] py-12 text-center text-sm text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-01)]">
                {katalogListesi.arama.aranan
                  ? `${ARAMA_HEDEF_KITLE_ADLARI[aktifHedef]} için yapmış olduğunuz aramada kayıt bulunmadı.`
                  : "Bu hedef kitleye ait yayında içerik yok."}
              </div>
            )}
          </>
        ) : (
          <>
            <DepartmanFiltreleri videolar={katalogListesi.gorunen} aktifDepartman={aktifDepartman} onSec={setAktifDepartman} />
            <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                <YayinTuruFiltresi secili={aktifYayinTuru} onSec={setAktifYayinTuru} sayilar={turSayilari} />
              </div>
              <SadeZamanToggle
                deger={aktifZaman}
                onDegistir={setAktifZaman}
                etiket="Yayın zamanı"
                className="max-w-full sm:ml-auto sm:shrink-0"
              />
            </div>
            <div className="flex min-w-0 justify-end">
              <ListeArama
                arama={katalogListesi.arama}
                ipucu="Ürün adı veya yayın kodu ara"
                yukseklik="secim"
                genislik="w-full"
                className="w-full sm:w-[344px]"
              />
            </div>
            {aktifDepartman && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-extrabold text-[var(--tema-yerel-ortak-sayfa-ana-metin-03)]">{DEPARTMAN_ETIKET[aktifDepartman]} Yayınları</h2>
                  <span className="text-xs font-bold text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-32)]">{departmanVideolari.length} yayın</span>
                </div>
                {seciliVideolar.length > 0 ? (
                  <YayinRaflari videolar={seciliVideolar} onVideoSec={setAktifVideo} uretenBilgisiGoster sifirlamaKapsami={sifirlamaKapsami} />
                ) : (
                  <div className="rounded-2xl border border-[var(--tema-yerel-ortak-sayfa-cizgi-01)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)] py-12 text-center text-sm text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-01)]">
                    Bu müdürlükte seçilen yayın türüne ait içerik yok.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}
