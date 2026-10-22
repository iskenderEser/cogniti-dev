// Eczanem müşteri ana sayfası: dijital kanal rafları, sayfa içi oynatıcı ve
// hesap güvenliği. Puan/indirim işlemleri sol menüdeki ayrı Puanlarım sayfasıdır.
"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import { adSoyadBicimle } from "@/lib/utils/adSoyadBicimle";
import EclubGecisKarti from "./_components/EclubGecisKarti";
import EczanemAnaSayfaSkeleton, { EczanemRaflarSkeleton } from "./_components/EczanemAnaSayfaSkeleton";
import EczanemAnaSayfaUstBolum from "./_components/EczanemAnaSayfaUstBolum";
import EczanemPanelBaglantisi from "./_components/EczanemPanelBaglantisi";
import { eczanemGezinmeAgaciniOku, eczanemGezinmeAgaciniYaz } from "./_components/eczanemGezinme";
import { eczanemUyeMenusuOlustur } from "./_components/eczanemUyeMenusu";
import EczanemVideoOynatici from "./_components/EczanemVideoOynatici";
import EczanemVideoRafi from "./_components/EczanemVideoRafi";
import EczanemUrunFiltresi from "./_components/EczanemUrunFiltresi";
import type {
  EczanemMusteriVideo,
  EczanemSidebarAgaci,
  EczanemSidebarSecim,
  EczanemVideoRaflari,
  EczanemVideolarYaniti,
} from "./_types";
import { YayinTuruFiltresi, type YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import { YAYIN_TURLERI } from "@/lib/ogrenmeAraci/turSunumu";

const bosRaflar: EczanemVideoRaflari = {
  yeni_videolarim: [], yarim_biraktiklarim: [], en_son_izlediklerim: [],
  en_cok_begenilenler: [], en_cok_favorilenenler: [],
};

const tariheGoreAzalan = (alan: "gelis_tarihi" | "izleme_baslangic" | "izleme_bitis") => (a: EczanemMusteriVideo, b: EczanemMusteriVideo) => (
  new Date(b[alan] ?? 0).getTime() - new Date(a[alan] ?? 0).getTime()
);

function EczanemPanelIcerik() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { kullanici, yukleniyor, cikisYap } = useAuth();
  const { mesajlar, hata, basari } = useHataMesaji();
  const musteri = !!kullanici && kullanici.kimlik_turu === MUSTERI_ROLU;
  const [videolar, setVideolar] = useState<EczanemMusteriVideo[]>([]);
  const [agac, setAgac] = useState<EczanemSidebarAgaci>(() => eczanemGezinmeAgaciniOku(kullanici?.id) ?? []);
  const [secim, setSecim] = useState<EczanemSidebarSecim>({ tip: "tum" });
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [videoYukleniyor, setVideoYukleniyor] = useState(true);
  const [videoYenileniyor, setVideoYenileniyor] = useState(false);
  const [ustBolumYenileme, setUstBolumYenileme] = useState(0);
  const [videoHazir, setVideoHazir] = useState(false);
  const [videoHatasi, setVideoHatasi] = useState<string | null>(null);
  const [etkilesimIsliyor, setEtkilesimIsliyor] = useState<string | null>(null);
  const [seciliVideo, setSeciliVideo] = useState<EczanemMusteriVideo | null>(null);
  const [silmeModalAcik, setSilmeModalAcik] = useState(false);
  const [silmeSifresi, setSilmeSifresi] = useState("");
  const [silmeHatasi, setSilmeHatasi] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);
  const videoIstegiRef = useRef<AbortController | null>(null);
  const [tumIceriklerSecili, setTumIceriklerSecili] = useState(false);
  const anaSayfayiAc = useCallback(() => {
    setTumIceriklerSecili(false);
    setSecim({ tip: "tum" });
    setAktifYayinTuru("tumu");
    setSeciliVideo(null);
    router.push("/eczanem", { scroll: false });
  }, [router]);
  const menuGruplari = useMemo(() => eczanemUyeMenusuOlustur({ agac, secim, tumIceriklerSecili, onSecim: yeniSecim => {
    if (yeniSecim.tip === "tum") { anaSayfayiAc(); setTumIceriklerSecili(true); }
    else { setTumIceriklerSecili(false); setSecim(yeniSecim); }
  } }), [agac, secim, tumIceriklerSecili, anaSayfayiAc]);

  const videolariCek = useCallback(async (elle = false) => {
    videoIstegiRef.current?.abort();
    const controller = new AbortController();
    videoIstegiRef.current = controller;
    if (elle) setVideoYenileniyor(true);
    try {
      const res = await fetch("/eczanem/api/videolar", { cache: "no-store", signal: controller.signal });
      const data: EczanemVideolarYaniti = await res.json();
      if (controller.signal.aborted || videoIstegiRef.current !== controller) return;
      if (!res.ok) {
        const errData = data as unknown as { hata?: string; adim?: string };
        const mesaj = errData.hata ?? "Öğrenme içerikleri yüklenemedi.";
        setVideoHatasi(mesaj); hata(mesaj, errData.adim ?? "öğrenme içerikleri"); return;
      }
      if (kullanici?.id) eczanemGezinmeAgaciniYaz(kullanici.id, data.agac ?? []);
      setVideolar(data.videolar ?? []); setAgac(data.agac ?? []); setVideoHazir(true); setVideoHatasi(null);
    } catch (error) {
      if (!controller.signal.aborted && videoIstegiRef.current === controller && !(error instanceof DOMException && error.name === "AbortError")) { setVideoHatasi("Öğrenme içerikleri yüklenemedi."); hata("Öğrenme içerikleri yüklenemedi.", "öğrenme içerikleri");
      }
    } finally {
      if (videoIstegiRef.current === controller) { setVideoYukleniyor(false); setVideoYenileniyor(false); }
    }
  }, [hata, kullanici?.id]);

  useEffect(() => {
    if (yukleniyor) return;
    if (!kullanici) { router.replace("/login"); return; }
    if (!musteri) { router.replace(panelBaslangici(kullanici.rol).yol); return; }
    void videolariCek();
    return () => videoIstegiRef.current?.abort();
  }, [kullanici, musteri, router, videolariCek, yukleniyor]);

  const rotaEczaneId = searchParams.get("eczane_id");
  const rotaFirmaId = searchParams.get("firma_id");
  const uygulananRota = useRef<string | null>(null);
  useEffect(() => {
    if (!rotaEczaneId) { uygulananRota.current = null; return; }
    if (!videoHazir) return;
    const anahtar = JSON.stringify([rotaEczaneId, rotaFirmaId]);
    if (uygulananRota.current === anahtar) return;
    const eczane = agac.find(item => item.eczane_id === rotaEczaneId);
    if (!eczane || (rotaFirmaId && !eczane.firmalar.some(firma => firma.firma_id === rotaFirmaId))) return;
    uygulananRota.current = anahtar;
    setSecim(rotaFirmaId ? { tip: "firma", eczane_id: rotaEczaneId, firma_id: rotaFirmaId } : { tip: "eczane", eczane_id: rotaEczaneId });
  }, [agac, rotaEczaneId, rotaFirmaId, videoHazir]);

  const kapsamVideolari = useMemo<EczanemMusteriVideo[]>(() => {
    switch (secim.tip) {
      case "tum":
        return videolar;
      case "eczane":
        return videolar.filter((v) => v.eczane_id === secim.eczane_id);
      case "firma":
        return videolar.filter(
          (v) => v.eczane_id === secim.eczane_id && v.firma_id === secim.firma_id
        );
      case "urun":
        return videolar.filter(
          (v) =>
            v.eczane_id === secim.eczane_id &&
            v.firma_id === secim.firma_id &&
            v.urun_id === secim.urun_id
        );
      case "arac":
        return videolar.filter(
          (v) =>
            v.eczane_id === secim.eczane_id &&
            v.firma_id === secim.firma_id &&
            v.urun_id === secim.urun_id &&
            v.yayin_id === secim.yayin_id &&
            v.arac_id === secim.arac_id
        );
      default:
        return videolar;
    }
  }, [secim, videolar]);
  const turSayilari = Object.fromEntries(YAYIN_TURLERI.map((tur) => [tur, kapsamVideolari.filter((video) => video.arac_turu === tur).length])) as Record<EczanemMusteriVideo["arac_turu"], number>;
  const filtrelenmisVideolar = useMemo(() => kapsamVideolari.filter((video) => aktifYayinTuru === "tumu" || video.arac_turu === aktifYayinTuru), [kapsamVideolari, aktifYayinTuru]);

  const raflar = useMemo<EczanemVideoRaflari>(() => {
    if (!videoHazir) return bosRaflar;
    const puanaGore = (alan: "begeni_sayisi" | "favori_sayisi") => [...filtrelenmisVideolar]
      .filter((video) => video[alan] > 0)
      .sort((a, b) => b[alan] - a[alan] || tariheGoreAzalan("gelis_tarihi")(a, b));
    return {
      yeni_videolarim: filtrelenmisVideolar.filter((video) => !video.izleme_basladi).sort(tariheGoreAzalan("gelis_tarihi")),
      yarim_biraktiklarim: filtrelenmisVideolar.filter((video) => video.izleme_basladi && !video.izlendi).sort(tariheGoreAzalan("izleme_baslangic")),
      en_son_izlediklerim: filtrelenmisVideolar.filter((video) => video.izlendi).sort(tariheGoreAzalan("izleme_bitis")),
      en_cok_begenilenler: puanaGore("begeni_sayisi"),
      en_cok_favorilenenler: puanaGore("favori_sayisi"),
    };
  }, [filtrelenmisVideolar, videoHazir]);

  useEffect(() => {
    const gonderimId = searchParams.get("gonderim_id");
    const yayinId = searchParams.get("yayin_id");
    if ((!gonderimId && !yayinId) || !videoHazir) return;
    const hedef = gonderimId
      ? videolar.find((video) => video.gonderim_id === gonderimId)
      : videolar.find((video) => video.yayin_id === yayinId);
    if (hedef) setSeciliVideo(hedef);
  }, [searchParams, videoHazir, videolar]);

  const etkilesimDegistir = async (video: EczanemMusteriVideo, tur: "begeni" | "favori") => {
    if (etkilesimIsliyor) return;
    setEtkilesimIsliyor(video.yayin_id);
    try {
      const res = await fetch("/eczanem/api/etkilesim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ yayin_id: video.yayin_id, tur }) });
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "İçerik etkileşimi kaydedilemedi.", data.adim ?? "içerik etkileşimi"); return; }
      setVideolar((mevcut) => mevcut.map((satir) => satir.yayin_id !== video.yayin_id ? satir : {
        ...satir,
        ...(tur === "begeni" ? { begeni_mi: Boolean(data.aktif), begeni_sayisi: Number(data.sayi ?? 0) } : { favori_mi: Boolean(data.aktif), favori_sayisi: Number(data.sayi ?? 0) }),
      }));
    } catch { hata("İçerik etkileşimi kaydedilemedi.", "içerik etkileşimi"); }
    finally { setEtkilesimIsliyor(null); }
  };

  const silmeModaliniKapat = () => {
    if (siliniyor) return;
    setSilmeModalAcik(false); setSilmeSifresi(""); setSilmeHatasi(null);
  };

  const hesabimiSil = async (event: React.FormEvent) => {
    event.preventDefault(); setSilmeHatasi(null); setSiliniyor(true);
    try {
      const res = await fetch("/eczanem/api/hesabimi-sil", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sifre: silmeSifresi }) });
      const data = await res.json();
      if (!res.ok) { setSilmeHatasi(data.hata ?? "Hesabınız silinemedi."); return; }
      await cikisYap();
    } catch { setSilmeHatasi("Hesabınız silinemedi; yeniden deneyin."); }
    finally { setSiliniyor(false); }
  };

  if (yukleniyor || !kullanici || !musteri) return <EczanemAnaSayfaSkeleton />;

  const secimAnahtari =
    secim.tip === "tum"
      ? "tum"
      : secim.tip === "eczane"
        ? `eczane-${secim.eczane_id}`
        : secim.tip === "firma"
          ? `firma-${secim.eczane_id}-${secim.firma_id}`
          : secim.tip === "urun"
            ? `urun-${secim.eczane_id}-${secim.firma_id}-${secim.urun_id ?? ""}`
            : `arac-${secim.eczane_id}-${secim.firma_id}-${secim.urun_id ?? ""}-${secim.yayin_id}-${secim.arac_id}`;

  const sifirlamaKapsami = `${secimAnahtari}-${aktifYayinTuru}`;

  const rafOrtak = {
    onVideoSec: setSeciliVideo,
    onBegeni: (video: EczanemMusteriVideo) => etkilesimDegistir(video, "begeni"),
    onFavori: (video: EczanemMusteriVideo) => etkilesimDegistir(video, "favori"),
    etkilesimIsliyor,
    sifirlamaAnahtari: sifirlamaKapsami,
  };

  const musteriAd = kullanici.ad ? adSoyadBicimle(kullanici.ad) : "";
  const seciliEczane = secim.tip === "tum" ? undefined : agac.find(eczane => eczane.eczane_id === secim.eczane_id);
  const seciliFirma = secim.tip === "tum" || secim.tip === "eczane" ? undefined : seciliEczane?.firmalar.find(firma => firma.firma_id === secim.firma_id);

  return (
    <EczanemPanelBaglantisi gruplar={menuGruplari} gezinmeAgaci={agac} onAnaSayfa={anaSayfayiAc} anaSayfaSecili={secim.tip === "tum" && !tumIceriklerSecili} onHesapSil={() => setSilmeModalAcik(true)}>
      <HataMesajiContainer mesajlar={mesajlar} />
      <div className="min-h-full bg-[var(--tema-yerel-eclub-sayfa-zemini-03)] pb-20 md:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:gap-5 md:px-6 md:py-6">
        <EczanemAnaSayfaUstBolum
          key={kullanici.id}
          kullaniciId={kullanici.id}
          ad={musteriAd}
          firmaAdi={seciliFirma?.firma_adi}
          firmaId={seciliFirma?.firma_id}
          eczaneId={seciliEczane?.eczane_id}
          eczaneAdi={seciliEczane?.eczane_adi}
          yeniIcerikler={videolar.filter(video => !video.izleme_basladi).length}
          tamamlananlar={videolar.filter(video => video.izlendi).length}
          iceriklerHazir={videoHazir}
          yenileniyor={videoYukleniyor || videoYenileniyor}
          yenilemeAnahtari={ustBolumYenileme}
          onYenile={() => { setUstBolumYenileme(deger => deger + 1); return videolariCek(true); }}
        />
        <EclubGecisKarti hata={hata} basari={basari} />
        {videoHatasi && <div role="alert" className="rounded-2xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-17)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-10)] px-4 py-3 text-xs font-bold text-[var(--tema-yerel-eczanem-islevsel-metin-08)]">{videoHatasi}{videoHazir ? " · Son başarılı içerik akışı gösteriliyor." : ""}<button type="button" disabled={videoYenileniyor} onClick={() => { void videolariCek(true); }} className="ml-3 underline underline-offset-2 disabled:opacity-50">{videoYenileniyor ? "Yenileniyor…" : "Tekrar dene"}</button></div>}
        {videoYukleniyor && !videoHazir ? (
          <EczanemRaflarSkeleton />
        ) : !videoHazir ? null : seciliVideo ? (
          <EczanemVideoOynatici video={seciliVideo} onKapat={() => { setSeciliVideo(null); router.push("/eczanem", { scroll: false }); void videolariCek(); }} onTamamlandi={() => { setUstBolumYenileme(deger => deger + 1); return videolariCek(); }} hata={hata} basari={basari} />
        ) : (
          <div className="flex flex-col gap-6">
            {seciliFirma && seciliEczane && <EczanemUrunFiltresi key={JSON.stringify([seciliEczane.eczane_id, seciliFirma.firma_id])} eczaneId={seciliEczane.eczane_id} firma={seciliFirma} secim={secim} onSecim={setSecim} />}
            <YayinTuruFiltresi secili={aktifYayinTuru} onSec={setAktifYayinTuru} sayilar={turSayilari} />
            {filtrelenmisVideolar.length === 0 && secim.tip !== "tum" ? (
              <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-dashed border-[var(--tema-yerel-eczanem-cizgi-40)] bg-[var(--tema-yerel-eczanem-kart-01)] p-8 text-center shadow-sm">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-eczanem-islevsel-zemin-32)] text-[var(--tema-yerel-eczanem-vurgu-metin-01)]">
                  <Layers className="size-5" />
                </div>
                <p className="text-sm font-bold text-[var(--tema-yerel-eczanem-ana-metin-24)]">
                  Bu kapsamda öğrenme içeriği bulunmuyor.
                </p>
                <button
                  type="button"
                  onClick={() => setSecim({ tip: "tum" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--tema-yerel-eczanem-vurgu-zemin-01)] px-4 py-2 text-xs font-black text-[var(--tema-yerel-eczanem-ters-metin-01)] shadow-sm transition hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-37)] active:bg-[var(--tema-yerel-eczanem-islevsel-zemin-38)]"
                >
                  <Layers className="size-3.5" />
                  <span>Tüm İçerikler</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <EczanemVideoRafi baslik="Yeni Yayınlar" videolar={raflar.yeni_videolarim} bosMesaj="Yeni öğrenme içeriğiniz bulunmuyor." {...rafOrtak} />
                <EczanemVideoRafi baslik="Yarım Kalanlar" videolar={raflar.yarim_biraktiklarim} bosMesaj="Yarım bıraktığınız öğrenme içeriği bulunmuyor." {...rafOrtak} />
                <EczanemVideoRafi baslik="Tamamlananlar" videolar={raflar.en_son_izlediklerim} bosMesaj="Henüz tamamladığınız bir öğrenme içeriği bulunmuyor." {...rafOrtak} />
                <EczanemVideoRafi baslik="En Çok Beğenilenler" videolar={raflar.en_cok_begenilenler} bosMesaj="Henüz müşteriler tarafından beğenilmiş bir öğrenme yayını bulunmuyor." {...rafOrtak} />
                <EczanemVideoRafi baslik="En Çok Favorilenenler" videolar={raflar.en_cok_favorilenenler} bosMesaj="Henüz müşteriler tarafından favorilenmiş bir öğrenme yayını bulunmuyor." {...rafOrtak} />
              </div>
            )}
          </div>
        )}
      </div>
      </div>
      <AlertDialog open={silmeModalAcik} onOpenChange={(acik) => { if (!acik) silmeModaliniKapat(); }}><AlertDialogContent><form onSubmit={hesabimiSil}><AlertDialogHeader><AlertDialogTitle className="text-[var(--tema-yerel-eczanem-islevsel-metin-39)]">Hesabınızı silmek istediğinize emin misiniz?</AlertDialogTitle><AlertDialogDescription className="leading-6">Bu işlem geri alınamaz. Hesabınız, puanlarınız, siparişleriniz ve Cogniti’deki tüm kayıtlarınız kalıcı olarak silinir.</AlertDialogDescription></AlertDialogHeader><label className="mt-5 block text-xs font-extrabold text-[var(--tema-yerel-eczanem-yardimci-metin-42)]" htmlFor="hesap-silme-sifre">Mevcut şifreniz</label><Input id="hesap-silme-sifre" type="password" value={silmeSifresi} onChange={(event) => setSilmeSifresi(event.target.value)} autoComplete="current-password" required disabled={siliniyor} className="mt-2 h-10 focus-visible:border-[var(--tema-yerel-eczanem-islevsel-cizgi-22)] focus-visible:ring-[var(--tema-yerel-eczanem-islevsel-odak-02)]/20" placeholder="Şifrenizi girin" />{silmeHatasi && <div className="mt-3 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-23)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-39)] px-3 py-2 text-xs font-bold text-[var(--tema-yerel-eczanem-islevsel-metin-40)]">{silmeHatasi}</div>}<AlertDialogFooter className="mt-6"><AlertDialogCancel type="button" onClick={silmeModaliniKapat} disabled={siliniyor}>Vazgeç</AlertDialogCancel><Button type="submit" disabled={siliniyor || !silmeSifresi} className="bg-[var(--tema-yerel-eczanem-islevsel-zemin-16)] font-extrabold hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-17)]">{siliniyor ? "Siliniyor…" : "Evet, hesabımı sil"}</Button></AlertDialogFooter></form></AlertDialogContent></AlertDialog>
    </EczanemPanelBaglantisi>
  );
}

export default function EczanemPanelPage() {
  return (
    <Suspense fallback={<EczanemAnaSayfaSkeleton />}>
      <EczanemPanelIcerik />
    </Suspense>
  );
}
