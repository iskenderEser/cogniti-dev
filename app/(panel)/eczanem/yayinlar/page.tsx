"use client";

import UttGonderimIncelemesi from "@/components/eclub/UttGonderimIncelemesi";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import OgrenmeAraciOnizleme from "@/components/ogrenme-araci/OgrenmeAraciOnizleme";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { PeriyotButonlari } from "@/components/ui/periyot-butonlari";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import { Building2, ChevronLeft, CircleAlert, Send, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EczanemGonderimPaneli, type EczanemGonderimSonucu } from "./_components/EczanemGonderimPaneli";
import { EczanemYayinGonderimKarti } from "./_components/EczanemYayinGonderimKarti";
import type { UttEczanemGonderim, UttEczanemVeri, UttEczanemYayin } from "./_types";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

type GonderimFiltresi = "tumu" | "gonderilebilir" | "gonderilen";

function OzetKarti({ ikon: Icon, etiket, deger, detay, renk, zemin }: {
  ikon: typeof Building2;
  etiket: string;
  deger: number;
  detay: string;
  renk: string;
  zemin: string;
}) {
  return (
    <Card className="gap-0 border border-[var(--tema-yerel-eczanem-cizgi-06)] border-l-[3px] py-0 shadow-sm" style={{ borderLeftColor: renk }}>
      <CardContent className="flex items-start justify-between gap-3 p-4 md:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--tema-yerel-eczanem-yardimci-metin-03)]">{etiket}</p>
          <p className="mt-2 text-2xl font-extrabold leading-none text-[var(--tema-yerel-eczanem-ana-metin-02)] md:text-3xl">{deger.toLocaleString("tr-TR")}</p>
          <p className="mt-1.5 text-[11px] leading-snug text-[var(--tema-yerel-eczanem-yardimci-metin-04)] md:text-xs">{detay}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ color: renk, background: zemin }}><Icon className="size-4.5" /></span>
      </CardContent>
    </Card>
  );
}

export default function EczanemYayinlariPage() {
  const { mesajlar, hata, basari } = useHataMesaji();
  const [veri, setVeri] = useState<UttEczanemVeri | null>(null);
  const [ilkYukleme, setIlkYukleme] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState<string | null>(null);
  const [aktifVideo, setAktifVideo] = useState<UttEczanemYayin | null>(null);
  const [gonderimFiltresi, setGonderimFiltresi] = useState<GonderimFiltresi>("tumu");
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [seciliYayinIdleri, setSeciliYayinIdleri] = useState<string[]>([]);

  const [topluGonderiliyor, setTopluGonderiliyor] = useState(false);
  const [gonderimSonucu, setGonderimSonucu] = useState<EczanemGonderimSonucu | null>(null);
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

  const yayinlar = veri?.yayinlar ?? [];
  const eczaneler = veri?.eczaneler ?? [];
  const esik = veri?.esik ?? 0;
  const hazirEczaneler = eczaneler.filter((eczane) => eczane.esik_uygun);
  const gonderimMap = useMemo<ReadonlyMap<string, UttEczanemGonderim>>(() => new Map(
    (veri?.gonderimler ?? []).map((gonderim) => [`${gonderim.yayin_id}::${gonderim.eczane_id}`, gonderim]),
  ), [veri?.gonderimler]);
  const gonderilebilirYayinlar = yayinlar.filter((yayin) => yayin.gonderim_incelemesi_tamamlandi && hazirEczaneler.some(
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
    setGonderimSonucu(null);
  };

  const yayinKarti = (yayin: UttEczanemYayin) => {
    const yayinGonderimleri = (veri?.gonderimler ?? []).filter((gonderim) => gonderim.yayin_id === yayin.yayin_id);
    return <EczanemYayinGonderimKarti
      key={yayin.yayin_id}
      yayin={yayin}
      esik={esik}
      eczaneler={eczaneler}
      gonderimler={yayinGonderimleri}
      secili={seciliYayinIdleri.includes(yayin.yayin_id)}
      secilebilir={gonderilebilirIdler.has(yayin.yayin_id) && !topluGonderiliyor}
      gonderilecekGoster={gonderimFiltresi === "gonderilebilir" || (gonderimFiltresi === "tumu" && gonderilebilirYayinlar.some((kayit) => kayit.yayin_id === yayin.yayin_id))}
      gonderimDetayiGoster={gonderimFiltresi === "gonderilen"}
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
      setGonderimSonucu(sonuc);
      if (sonuc.gonderilenKayit > 0) basari(`${sonuc.gonderilenKayit} gönderim tamamlandı.`);
      await veriCek();
    } catch {
      hata("Gönderim sonuçları yenilenemedi.", "Eczanem gönderimi");
    } finally {
      setTopluGonderiliyor(false);
    }
    return sonuc;
  };

  if (ilkYukleme) {
    return <div className="flex min-h-full items-center justify-center bg-[var(--tema-yerel-eczanem-sayfa-zemini-05)]"><span className="size-6 animate-spin rounded-full border-2 border-[var(--tema-yerel-eczanem-cizgi-08)] border-t-[var(--tema-yerel-eczanem-cizgi-09)]" /></div>;
  }

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
        </Card>
        <HataMesajiContainer mesajlar={mesajlar} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--tema-yerel-eczanem-sayfa-zemini-05)]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <SayfaYenileBasligi className="flex flex-wrap items-end justify-between gap-4"
          baslik={<div className="inline-flex items-center">
            <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-eczanem-ana-metin-04)] md:text-[28px]">Eczanem Yayınları</h1>
            <SayfaRehberi anahtar="eczanem-yayinlar" className="ml-1.5 -translate-y-1.5" />
          </div>}

          aciklama={<><p className="mt-1 max-w-3xl text-sm leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-07)]">Eczanem hedefli öğrenme içeriklerini inceleyin ve üyelik eşiğini tamamlayan eczanelerinize gönderin.</p></>}
          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => veriCek()} />}

        />

        {veriHatasi && !veri ? (
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
            <section aria-label="Eczanem öğrenme içeriği özeti" className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              <OzetKarti ikon={Building2} etiket="Gönderilebilen Eczane Sayısı" deger={hazirEczaneler.length} detay={`Eclub takımınızda olan toplam eczane sayısı ${eczaneler.length}`} renk="var(--tema-yerel-eczanem-eylem-metin-01)" zemin="var(--tema-yerel-eczanem-secim-zemin-01)" />
              <OzetKarti ikon={Send} etiket="Gönderilen Toplam Yayın" deger={veri?.aylikIstatistikler.uttGonderimSayisi ?? 0} detay="Bu ay içinde gönderdiğiniz toplam yayın adedi" renk="var(--tema-yerel-eczanem-islevsel-metin-02)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-01)" />
              <OzetKarti ikon={UsersRound} etiket="Eczanelerin Gönderdiği Toplam Yayın" deger={veri?.aylikIstatistikler.eczaneGonderimSayisi ?? 0} detay="Bu ay içinde eczanelerin gönderdiği toplam yayın adedi" renk="var(--tema-yerel-eczanem-islevsel-metin-03)" zemin="var(--tema-yerel-eczanem-islevsel-zemin-02)" />
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <PeriyotButonlari<GonderimFiltresi>
                secenekler={[
                  { key: "tumu", label: `Tümü ${yayinlar.length}` },
                  { key: "gonderilebilir", label: `Gönderime Hazır ${gonderilebilirYayinlar.length}` },
                  { key: "gonderilen", label: `Gönderilenler ${gonderilenYayinlar.length}` },
                ]}
                deger={gonderimFiltresi}
                onDegistir={(filtre) => { setGonderimFiltresi(filtre); secimSifirla(); setGonderimSonucu(null); }}
                ariaLabel="Gönderim durumu"
                className="w-fit flex-none"
              />
            </div>
            {gonderimSonucu && <div role="status" className={`rounded-xl border px-4 py-3 text-xs ${gonderimSonucu.gonderilenKayit > 0 ? "border-[var(--tema-yerel-eczanem-islevsel-cizgi-08)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-20)] text-[var(--tema-yerel-eczanem-islevsel-metin-22)]" : "border-[var(--tema-yerel-eczanem-islevsel-cizgi-09)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-21)] text-[var(--tema-yerel-eczanem-islevsel-metin-23)]"}`}>
              <strong>{gonderimSonucu.gonderilenKayit > 0 ? `${gonderimSonucu.gonderilenYayin} yayın, ${gonderimSonucu.gonderilenEczane} eczaneye gönderildi.` : "Gönderim tamamlanamadı."}</strong>
              <span className="ml-1">{gonderimSonucu.gonderilenKayit} gönderim tamamlandı{gonderimSonucu.atlanan > 0 ? ` · ${gonderimSonucu.atlanan} gönderim atlandı.` : "."}</span>
              {gonderimSonucu.hatalar.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold">Atlanan gönderimlerin nedenleri</summary><ul className="mt-2 list-disc space-y-1 pl-4">{gonderimSonucu.hatalar.map((satir, index) => <li key={`${index}-${satir}`}>{satir}</li>)}</ul></details>}
            </div>}

            <section>
              <div className="mb-3">
                <UttYayinTuruToggle
                  yayinlar={durumFiltreliYayinlar}
                  deger={aktifYayinTuru}
                  onDegistir={(tur) => { setAktifYayinTuru(tur); secimSifirla(); setGonderimSonucu(null); }}
                  className="w-fit flex-none"
                />
              </div>
              <div className="mb-3">
                <h2 className="text-base font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-03)]">Eczanelere Gönderilecek Öğrenme İçerikleri</h2>
                <p className="mt-0.5 text-[11px] font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-01)]">{gorunenYayinlar.length} yayın gösteriliyor</p>
              </div>
              {gorunenYayinlar.length === 0 ? (
                <div className="rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-05)] bg-[var(--tema-yerel-eczanem-kart-01)] px-4 py-14 text-center text-sm font-semibold text-[var(--tema-yerel-eczanem-yardimci-metin-05)]">
                  {aktifYayinTuru !== "tumu" ? "Seçilen yayın türünde bu listede yayın bulunmuyor." : gonderimFiltresi === "gonderilebilir" ? "Şu anda gönderime hazır yayın bulunmuyor." : gonderimFiltresi === "gonderilen" ? "Henüz eczaneye gönderilmiş yayın bulunmuyor." : "Dağıtıma hazır Eczanem öğrenme içeriği bulunmuyor."}
                </div>
              ) : (
                <MobilYayinAkisi
                  kayitlar={gorunenYayinlar}
                  kayitAnahtari={(yayin) => yayin.yayin_id}
                  renderKart={yayinKarti}
                  sayacGoster={false}
                  sifirlamaAnahtari={`${gonderimFiltresi}-${aktifYayinTuru}`}
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
      </div>
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

    </div>
  );
}
