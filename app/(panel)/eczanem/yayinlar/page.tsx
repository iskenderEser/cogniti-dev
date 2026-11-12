"use client";

import { useEczanemGonderimSaati } from "@/components/eczanem/GonderimSuresi";
import { eczanemGonderimSuresi } from "@/lib/eczanem/gonderimSuresi";

import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { PeriyotButonlari } from "@/components/ui/periyot-butonlari";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import { Building2, ChevronLeft, CircleAlert, Send, UsersRound } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { EczanemGonderimPaneli, type EczanemGonderimSonucu } from "./_components/EczanemGonderimPaneli";
import { EczanemYayinGonderimKarti } from "./_components/EczanemYayinGonderimKarti";
import type { UttEczanemGonderim, UttEczanemVeri, UttEczanemYayin } from "./_types";
import { EczanemYayinDonemiSecimi, yayinDonemi } from "../_components/EczanemYayinDonemiSecimi";
import { EczanemYayinSayfasi, OzetKarti, OzetKartlari } from "../_components/EczanemYayinSayfasi";

const OgrenmeAraciOnizleme = dynamic(() => import("@/components/ogrenme-araci/OgrenmeAraciOnizleme"));
const UttGonderimIncelemesi = dynamic(() => import("@/components/eclub/UttGonderimIncelemesi"));

type GonderimFiltresi = "tumu" | "gonderilebilir" | "gonderilen";

const rafBasliklari: Record<GonderimFiltresi, string> = {
  tumu: "Tüm Eczanem Yayınları",
  gonderilebilir: "Gönderime Hazır Yayınlar",
  gonderilen: "Eczanelere Gönderilen Yayınlar",
};

export default function EczanemYayinlariPage() {
  const { mesajlar, hata, basari, uyari } = useHataMesaji();
  const [veri, setVeri] = useState<UttEczanemVeri | null>(null);
  const simdi = useEczanemGonderimSaati((veri?.yayinlar ?? []).map(y => y.gonderim_baslangic_at));
  const [ilkYukleme, setIlkYukleme] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState<string | null>(null);
  const [aktifVideo, setAktifVideo] = useState<UttEczanemYayin | null>(null);
  const [bugununDonemi] = useState(() => yayinDonemi(new Date()));
  const [secilenDonem, setSecilenDonem] = useState(bugununDonemi);
  const [gonderimFiltresi, setGonderimFiltresi] = useState<GonderimFiltresi>("tumu");
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [seciliYayinIdleri, setSeciliYayinIdleri] = useState<string[]>([]);

  const [topluGonderiliyor, setTopluGonderiliyor] = useState(false);
  const [acikDetayYayinId, setAcikDetayYayinId] = useState<string | null>(null);

  const veriCek = useCallback(async (ilk = false) => {
    if (!ilk) setYenileniyor(true);
    setVeriHatasi(null);
    try {
      const res = await fetch("/eczanem/yayinlar/api", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        const mesaj = data.hata ?? data.error ?? "Eczanem verileri yüklenemedi.";
        setVeriHatasi(mesaj);
        hata(mesaj, "Eczanem verileri");
        return;
      }
      setVeri(data);
    } catch {
      const mesaj = "Eczanem verileri yüklenemedi.";
      setVeriHatasi(mesaj);
      hata(mesaj, "Eczanem verileri");
    } finally {
      setIlkYukleme(false);
      setYenileniyor(false);
    }
  }, [hata]);

  useEffect(() => { veriCek(true); }, [veriCek]);

  const sayacCek = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/eczanem/yayinlar/api?sayac=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setVeri((onceki) => onceki && data.aylikIstatistikler
        ? { ...onceki, aylikIstatistikler: data.aylikIstatistikler }
        : onceki);
    } catch {
      // Sayaç yenilemesi sessizce sonraki denemede tekrarlanır.
    }
  }, []);

  useEffect(() => {
    const aralik = window.setInterval(() => void sayacCek(), 10_000);
    const gorunurOldu = () => { if (document.visibilityState === "visible") void sayacCek(); };
    document.addEventListener("visibilitychange", gorunurOldu);
    return () => { window.clearInterval(aralik); document.removeEventListener("visibilitychange", gorunurOldu); };
  }, [sayacCek]);

  useEffect(() => {
    const sonrakiAy = veri?.aylikIstatistikler.sonrakiAyBaslangici;
    if (!sonrakiAy) return;
    let zamanlayici: number | undefined;
    const ayBasiniBekle = () => {
      const kalanMs = new Date(sonrakiAy).getTime() - Date.now();
      if (kalanMs <= 0) { void sayacCek(); return; }
      zamanlayici = window.setTimeout(ayBasiniBekle, Math.min(kalanMs, 60 * 60 * 1000));
    };
    ayBasiniBekle();
    return () => { if (zamanlayici) window.clearTimeout(zamanlayici); };
  }, [veri?.aylikIstatistikler.sonrakiAyBaslangici, sayacCek]);

  const tarihliYayinlar = useMemo(() => (veri?.yayinlar ?? []).flatMap((yayin) => {
    const tarih = yayin.yayin_tarihi ? new Date(yayin.yayin_tarihi) : null;
    return tarih && Number.isFinite(tarih.getTime()) ? [{ yayin, ...yayinDonemi(tarih) }] : [];
  }), [veri?.yayinlar]);
  const yilSecenekleri = Array.from(new Set([
    bugununDonemi.yil, secilenDonem.yil, ...tarihliYayinlar.map(({ yil }) => yil),
  ])).sort((a, b) => Number(b) - Number(a)).map((yil) => ({ deger: yil, etiket: yil }));
  const yayinlar = tarihliYayinlar
    .filter(({ yil, ay }) => yil === secilenDonem.yil && ay === secilenDonem.ay)
    .map(({ yayin }) => yayin);
  const eczaneler = veri?.eczaneler ?? [];
  const esik = veri?.esik ?? 0;
  const hazirEczaneler = eczaneler.filter((eczane) => eczane.esik_uygun);
  const gonderimMap = useMemo<ReadonlyMap<string, UttEczanemGonderim>>(() => new Map(
    (veri?.gonderimler ?? []).map((gonderim) => [`${gonderim.yayin_id}::${gonderim.eczane_id}`, gonderim]),
  ), [veri?.gonderimler]);
  const gonderilebilirYayinlar = yayinlar.filter((yayin) => eczanemGonderimSuresi(yayin.gonderim_baslangic_at,simdi,yayin.gonderim_sure_muaf).acik && yayin.gonderim_incelemesi_tamamlandi && hazirEczaneler.some(
    (eczane) => !gonderimMap.has(`${yayin.yayin_id}::${eczane.eczane_id}`),
  ));
  const gonderilenYayinlar = yayinlar.filter((yayin) => eczaneler.some(
    (eczane) => gonderimMap.has(`${yayin.yayin_id}::${eczane.eczane_id}`),
  ));
  const durumFiltreliYayinlar = gonderimFiltresi === "gonderilebilir"
    ? gonderilebilirYayinlar
    : gonderimFiltresi === "gonderilen"
      ? gonderilenYayinlar
      : yayinlar;
  const gorunenYayinlar = [...(aktifYayinTuru === "tumu"
    ? durumFiltreliYayinlar
    : durumFiltreliYayinlar.filter((yayin) => yayin.arac_turu === aktifYayinTuru))]
    .sort((a, b) => new Date(b.yayin_tarihi ?? 0).getTime() - new Date(a.yayin_tarihi ?? 0).getTime());
  const gonderilebilirIdler = new Set(gonderilebilirYayinlar.map((yayin) => yayin.yayin_id));
  const seciliYayinlar = gorunenYayinlar.filter((yayin) => seciliYayinIdleri.includes(yayin.yayin_id) && gonderilebilirIdler.has(yayin.yayin_id));

  const secimSifirla = () => {
    setSeciliYayinIdleri([]);
    setAcikDetayYayinId(null);
  };

  const yayinSecimiDegistir = (yayinId: string) => {
    setSeciliYayinIdleri((onceki) => onceki.includes(yayinId) ? onceki.filter((id) => id !== yayinId) : [...onceki, yayinId]);
  };

  const yayinKarti = (yayin: UttEczanemYayin) => {
    const yayinGonderimleri = (veri?.gonderimler ?? []).filter((gonderim) => gonderim.yayin_id === yayin.yayin_id);
    return <EczanemYayinGonderimKarti
      key={yayin.yayin_id}
      yayin={yayin}
      simdi={simdi}
      esik={esik}
      eczaneler={eczaneler}
      gonderimler={yayinGonderimleri}
      secili={seciliYayinIdleri.includes(yayin.yayin_id)}
      secilebilir={gonderilebilirIdler.has(yayin.yayin_id) && !topluGonderiliyor}
      gonderilecekGoster={gonderimFiltresi === "gonderilebilir" || (gonderimFiltresi === "tumu" && gonderilebilirYayinlar.some((kayit) => kayit.yayin_id === yayin.yayin_id))}
      gonderimDetayiAcik={acikDetayYayinId === yayin.yayin_id}
      onSecim={() => yayinSecimiDegistir(yayin.yayin_id)}
      onOnizle={() => setAktifVideo(yayin)}
      onGonderimDetayiAc={() => setAcikDetayYayinId(yayin.yayin_id)}
      onGonderimDetayiKapat={() => setAcikDetayYayinId(null)}
    />;
  };

  const gonder = async (eczaneIdleri: string[]): Promise<EczanemGonderimSonucu> => {
    const sonuc: EczanemGonderimSonucu = { gonderilenKayit: 0, gonderilenYayin: 0, gonderilenEczane: 0, atlanan: 0, hatalar: [] };
    if (seciliYayinlar.length === 0 || eczaneIdleri.length === 0 || topluGonderiliyor) return sonuc;
    setTopluGonderiliyor(true);
    const basariliYayinlar = new Set<string>();
    const basariliEczaneler = new Set<string>();
    try {
      for (const yayin of seciliYayinlar) {
        for (const eczaneId of eczaneIdleri) {
          const eczaneAdi = eczaneler.find((eczane) => eczane.eczane_id === eczaneId)?.eczane_adi ?? "Eczane";
          try {
            const res = await fetch("/eczanem/yayinlar/api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ yayin_id: yayin.yayin_id, eczane_id: eczaneId }),
            });
            const data = await res.json();
            if (!res.ok) {
              sonuc.atlanan += 1;
              sonuc.hatalar.push(`${yayin.urun_adi} · ${eczaneAdi}: ${data.hata ?? data.error ?? "Gönderilemedi."}`);
              continue;
            }
            sonuc.gonderilenKayit += 1;
            basariliYayinlar.add(yayin.yayin_id);
            basariliEczaneler.add(eczaneId);
          } catch {
            sonuc.atlanan += 1;
            sonuc.hatalar.push(`${yayin.urun_adi} · ${eczaneAdi}: Gönderilemedi.`);
          }
        }
      }
      sonuc.gonderilenYayin = basariliYayinlar.size;
      sonuc.gonderilenEczane = basariliEczaneler.size;
      if (sonuc.atlanan > 0) {
        const ozet = `${sonuc.gonderilenKayit} gönderim tamamlandı, ${sonuc.atlanan} gönderim atlandı.`;
        const detay = sonuc.hatalar.join(" · ");
        if (sonuc.gonderilenKayit > 0) uyari(`${ozet} ${detay}`, undefined, true);
        else hata("Gönderim tamamlanamadı.", "Eczanem gönderimi", detay);
      } else if (sonuc.gonderilenKayit > 0) {
        basari(`${sonuc.gonderilenKayit} gönderim tamamlandı.`);
      }
      await veriCek();
    } catch {
      hata("Gönderim sonuçları yenilenemedi.", "Eczanem gönderimi");
    } finally {
      setTopluGonderiliyor(false);
    }
    return sonuc;
  };

  if (aktifVideo) {
    return (
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <button type="button" onClick={() => setAktifVideo(null)} className="flex w-fit items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-04)] hover:text-[var(--tema-yerel-eczanem-ana-metin-13)]">
          <ChevronLeft className="size-4" /> Öğrenme içerikleri
        </button>
        <Card className="gap-0 overflow-hidden border-[var(--tema-yerel-eczanem-cizgi-06)] py-0 shadow-sm">
          <div className="border-b border-[var(--tema-yerel-eczanem-cizgi-20)] px-4 py-4 md:px-5">
            <CardTitle className="text-base text-[var(--tema-yerel-eczanem-ana-metin-02)]">{aktifVideo.urun_adi}</CardTitle>
            <CardDescription className="mt-1">{aktifVideo.teknik_adi || "Eczanem öğrenme içeriği"}</CardDescription>
          </div>
          <Suspense fallback={<p role="status" className="p-4 text-sm">Öğrenme içeriği yükleniyor…</p>}>
            {aktifVideo.gonderim_incelemesi_tamamlandi ? <OgrenmeAraciOnizleme
              key={aktifVideo.yayin_id}
              yayinId={aktifVideo.yayin_id}
              aracId={aktifVideo.arac_id}
              aracTuru={aktifVideo.arac_turu}
              videoUrl={aktifVideo.video_url}
              urunAdi={aktifVideo.urun_adi}
              hata={hata}
              onBitti={() => setAktifVideo(null)}
            /> : <UttGonderimIncelemesi
              key={aktifVideo.yayin_id}
              yayinId={aktifVideo.yayin_id}
              aracId={aktifVideo.arac_id}
              aracTuru={aktifVideo.arac_turu}
              videoUrl={aktifVideo.video_url}
              urunAdi={aktifVideo.urun_adi}
              kanal="eczanem"
              hata={hata}
              onTamamlandi={async () => { setAktifVideo(null); await veriCek(); }}
            />}
          </Suspense>
        </Card>
        <HataMesajiContainer mesajlar={mesajlar} />
      </div>
    );
  }

  return (
    <>
      <EczanemYayinSayfasi
        baslik="Eczaneye Gönderilen Yayınlar"
        rehber={<SayfaRehberi anahtar="eczanem-yayinlar" className="ml-1.5 -translate-y-1.5" />}
        aciklama="Eczaneler tarafından Eczanem Üyelerine gönderilecek yayınları görebilir, eczanelere gönderebilirsiniz"
        aksiyon={<YenileButonu disabled={ilkYukleme} yenileniyor={yenileniyor} onYenile={() => veriCek()} />}
      >
        {ilkYukleme ? (
          <div role="status" className="flex items-center gap-2 text-sm text-[var(--tema-yerel-eczanem-yardimci-metin-07)]">
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-[var(--tema-yerel-eczanem-cizgi-08)] border-t-[var(--tema-yerel-eczanem-cizgi-09)]" />
            Eczane ve yayın bilgileri yükleniyor…
          </div>
        ) : veriHatasi && !veri ? (
          <Card className="gap-3 border-[var(--tema-yerel-eczanem-islevsel-cizgi-01)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-03)] py-8 text-center shadow-none">
            <CardContent className="flex flex-col items-center px-5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--tema-yerel-eczanem-islevsel-zemin-04)] text-[var(--tema-yerel-eczanem-islevsel-metin-01)]"><CircleAlert /></span>
              <CardTitle className="mt-3 text-base text-[var(--tema-yerel-eczanem-islevsel-metin-04)]">Veriler yüklenemedi</CardTitle>
              <CardDescription className="mt-1">{veriHatasi}</CardDescription>
              <Button className="mt-4 bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-02)]" onClick={() => veriCek()}>Tekrar dene</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <OzetKartlari>
              <OzetKarti ikon={Building2} etiket="Gönderilebilen Eczane Sayısı" deger={hazirEczaneler.length} detay="Şu anda üyelik eşiğini karşılayan eczaneler" renk="var(--tema-yerel-eczanem-eylem-metin-01)" zemin="var(--tema-yerel-eczanem-secim-zemin-01)" />
              <OzetKarti ikon={UsersRound} etiket="Gönderilen Eczane Sayısı" deger={veri?.aylikIstatistikler.gonderilenEczaneSayisi ?? 0} detay="Bu ay yayın gönderdiğiniz farklı eczaneler" renk="var(--tema-yerel-eczanem-islevsel-metin-02)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-01)" />
              <OzetKarti ikon={Send} etiket="Gönderi Sayısı" deger={veri?.aylikIstatistikler.uttGonderimSayisi ?? 0} detay="Bu ay eczanelere yaptığınız toplam gönderi" renk="var(--tema-yerel-eczanem-islevsel-metin-03)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-02)" />
            </OzetKartlari>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <PeriyotButonlari<GonderimFiltresi>
                secenekler={[
                  { key: "tumu", label: `Tümü ${yayinlar.length}` },
                  { key: "gonderilebilir", label: `Gönderime Hazır ${gonderilebilirYayinlar.length}` },
                  { key: "gonderilen", label: `Gönderilenler ${gonderilenYayinlar.length}` },
                ]}
                deger={gonderimFiltresi}
                onDegistir={(filtre) => { setGonderimFiltresi(filtre); secimSifirla(); }}
                ariaLabel="Gönderim durumu"
                className="w-fit flex-none"
              />
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <UttYayinTuruToggle
                  yayinlar={durumFiltreliYayinlar}
                  deger={aktifYayinTuru}
                  onDegistir={(tur) => { setAktifYayinTuru(tur); secimSifirla(); }}
                  className="h-10 min-w-0 [scrollbar-width:none]"
                />
                <EczanemYayinDonemiSecimi
                  donem={secilenDonem}
                  yilSecenekleri={yilSecenekleri}
                  onDegistir={(degisiklik) => { setSecilenDonem((donem) => ({ ...donem, ...degisiklik })); secimSifirla(); }}
                />
              </div>
              <div className="mb-3">
                <h2 className="text-base font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-03)]">{rafBasliklari[gonderimFiltresi]}</h2>
                <p className="mt-0.5 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-01)]">{gorunenYayinlar.length} yayın gösteriliyor</p>
              </div>
              {gorunenYayinlar.length === 0 ? (
                <div className="rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-05)] bg-[var(--tema-yerel-eczanem-kart-01)] px-4 py-14 text-center text-sm font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">
                  {yayinlar.length === 0 ? "Seçilen ayda yayın bulunmuyor." : aktifYayinTuru !== "tumu" ? "Seçilen yayın türünde bu listede yayın bulunmuyor." : gonderimFiltresi === "gonderilebilir" ? "Şu anda gönderime hazır yayın bulunmuyor." : gonderimFiltresi === "gonderilen" ? "Henüz eczaneye gönderilmiş yayın bulunmuyor." : "Dağıtıma hazır Eczanem öğrenme içeriği bulunmuyor."}
                </div>
              ) : (
                <MobilYayinAkisi
                  kayitlar={gorunenYayinlar}
                  kayitAnahtari={(yayin) => yayin.yayin_id}
                  renderKart={yayinKarti}
                  sayacGoster={false}
                  sifirlamaAnahtari={`${secilenDonem.yil}-${secilenDonem.ay}-${gonderimFiltresi}-${aktifYayinTuru}`}
                  masaustuIcerik={(
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {gorunenYayinlar.map((yayin) => <div key={yayin.yayin_id} className="min-w-0">{yayinKarti(yayin)}</div>)}
                    </div>
                  )}
                />
              )}
            </section>

          </>
        )}
      </EczanemYayinSayfasi>
      <EczanemGonderimPaneli
        yayinlar={seciliYayinlar}
        eczaneler={eczaneler}
        gonderimler={veri?.gonderimler ?? []}
        esik={esik}
        gonderiliyor={topluGonderiliyor}
        onSecimTemizle={secimSifirla}
        onGonder={gonder}
      />
      <HataMesajiContainer mesajlar={mesajlar} />

    </>
  );
}
