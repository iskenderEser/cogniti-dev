"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, CircleAlert, Send, UsersRound } from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import OgrenmeAraciOnizleme from "@/components/ogrenme-araci/OgrenmeAraciOnizleme";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { PeriyotButonlari } from "@/components/ui/periyot-butonlari";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import { bildirimRozetleriniYenile } from "@/lib/bildirimler/rozet";
import { EczaneDanisanGonderimPaneli, type DanisanGonderimSonucu } from "./_components/EczaneDanisanGonderimPaneli";
import { EczaneDanisanYayinKarti } from "./_components/EczaneDanisanYayinKarti";
import type { EczaneDagitimDanisani, EczaneDagitimOzeti, EczaneDagitimVerisi, EczaneDagitimYayini } from "./_types";

type GonderimFiltresi = "tumu" | "gonderilebilir" | "gonderilen";
const API = "/eczanem/eczane/api/gonderim";

function OzetKarti({ ikon: Icon, etiket, deger, detay, renk, zemin }: {
  ikon: typeof Send;
  etiket: string;
  deger: number;
  detay: string;
  renk: string;
  zemin: string;
}) {
  return <Card className="gap-0 border border-gray-200 border-l-[3px] py-0 shadow-sm" style={{ borderLeftColor: renk }}>
    <CardContent className="flex items-start justify-between gap-3 p-4 md:p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{etiket}</p>
        <p className="mt-2 text-2xl font-extrabold leading-none text-gray-900 md:text-3xl">{deger.toLocaleString("tr-TR")}</p>
        <p className="mt-1.5 text-[11px] leading-snug text-gray-500 md:text-xs">{detay}</p>
      </div>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ color: renk, background: zemin }}><Icon className="size-4.5" /></span>
    </CardContent>
  </Card>;
}

export default function EczanemDagitimPage() {
  const { mesajlar, hata, basari } = useHataMesaji();
  const [veri, setVeri] = useState<EczaneDagitimVerisi | null>(null);
  const [ilkYukleme, setIlkYukleme] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [veriHatasi, setVeriHatasi] = useState<string | null>(null);
  const [aktifYayin, setAktifYayin] = useState<EczaneDagitimYayini | null>(null);
  const [gonderimFiltresi, setGonderimFiltresi] = useState<GonderimFiltresi>("tumu");
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [seciliYayinIdleri, setSeciliYayinIdleri] = useState<string[]>([]);
  const [topluGonderiliyor, setTopluGonderiliyor] = useState(false);
  const [gonderimSonucu, setGonderimSonucu] = useState<DanisanGonderimSonucu | null>(null);
  const [acikDetayYayinId, setAcikDetayYayinId] = useState<string | null>(null);
  const [detayDanisanlar, setDetayDanisanlar] = useState<EczaneDagitimDanisani[]>([]);
  const [detayYukleniyor, setDetayYukleniyor] = useState(false);
  const [detayHatasi, setDetayHatasi] = useState<string | null>(null);
  const detayIstekKimligi = useRef(0);

  const veriCek = useCallback(async (ilk = false) => {
    if (!ilk) setYenileniyor(true);
    setVeriHatasi(null);
    try {
      const res = await fetch(API, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.hata ?? "Gönderim verileri yüklenemedi.");
      setVeri(data as EczaneDagitimVerisi);
    } catch (err) {
      const mesaj = err instanceof Error ? err.message : "Gönderim verileri yüklenemedi.";
      setVeriHatasi(mesaj);
      hata(mesaj, "danışan gönderimi");
    } finally {
      setIlkYukleme(false);
      setYenileniyor(false);
    }
  }, [hata]);

  useEffect(() => { void veriCek(true); }, [veriCek]);

  const yayinlar = veri?.videolar ?? [];
  const danisanSayisi = veri?.ozet.aktif_uye_sayisi ?? 0;
  const ozetMap = useMemo<ReadonlyMap<string, EczaneDagitimOzeti>>(() => new Map(
    (veri?.video_ozetleri ?? []).map((ozet) => [ozet.yayin_id, ozet]),
  ), [veri?.video_ozetleri]);
  const gonderilebilirYayinlar = yayinlar.filter((yayin) => (ozetMap.get(yayin.yayin_id)?.gonderilebilir_uye_sayisi ?? 0) > 0);
  const gonderilenYayinlar = yayinlar.filter((yayin) => (ozetMap.get(yayin.yayin_id)?.gonderilen_uye_sayisi ?? 0) > 0);
  const durumFiltreliYayinlar = gonderimFiltresi === "gonderilebilir"
    ? gonderilebilirYayinlar
    : gonderimFiltresi === "gonderilen" ? gonderilenYayinlar : yayinlar;
  const gorunenYayinlar = [...(aktifYayinTuru === "tumu"
    ? durumFiltreliYayinlar
    : durumFiltreliYayinlar.filter((yayin) => yayin.arac_turu === aktifYayinTuru))]
    .sort((a, b) => new Date(b.yayin_tarihi ?? b.gelis_tarihi).getTime() - new Date(a.yayin_tarihi ?? a.gelis_tarihi).getTime());
  const gonderilebilirIdler = new Set(gonderilebilirYayinlar.map((yayin) => yayin.yayin_id));
  const seciliYayinlar = gorunenYayinlar.filter((yayin) => seciliYayinIdleri.includes(yayin.yayin_id) && gonderilebilirIdler.has(yayin.yayin_id));

  const detayKapat = () => { ++detayIstekKimligi.current; setAcikDetayYayinId(null); };
  const detayAc = async (yayinId: string) => {
    const istekKimligi = ++detayIstekKimligi.current;
    setAcikDetayYayinId(yayinId);
    setDetayDanisanlar([]);
    setDetayHatasi(null);
    setDetayYukleniyor(true);
    try {
      const params = new URLSearchParams({ sadece_uyeler: "1", yayin_id: yayinId });
      const res = await fetch(`${API}?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.hata ?? "Gönderim detayları yüklenemedi.");
      if (detayIstekKimligi.current === istekKimligi) setDetayDanisanlar(((data.uyeler ?? []) as EczaneDagitimDanisani[]).filter((danisan) => danisan.gonderildi_mi));
    } catch (err) {
      if (detayIstekKimligi.current === istekKimligi) setDetayHatasi(err instanceof Error ? err.message : "Gönderim detayları yüklenemedi.");
    } finally {
      if (detayIstekKimligi.current === istekKimligi) setDetayYukleniyor(false);
    }
  };
  const secimSifirla = () => { setSeciliYayinIdleri([]); detayKapat(); };
  const yayinSecimiDegistir = (yayinId: string) => {
    setSeciliYayinIdleri((onceki) => onceki.includes(yayinId) ? onceki.filter((id) => id !== yayinId) : [...onceki, yayinId]);
    setGonderimSonucu(null);
  };

  const yayinKarti = (yayin: EczaneDagitimYayini) => {
    const ozet = ozetMap.get(yayin.yayin_id) ?? {
      yayin_id: yayin.yayin_id,
      aktif_uye_sayisi: danisanSayisi,
      gonderilen_uye_sayisi: 0,
      gonderilebilir_uye_sayisi: danisanSayisi,
    };
    return <EczaneDanisanYayinKarti
      key={yayin.yayin_id}
      yayin={yayin}
      ozet={ozet}
      secili={seciliYayinIdleri.includes(yayin.yayin_id)}
      secilebilir={gonderilebilirIdler.has(yayin.yayin_id) && !topluGonderiliyor}
      gonderilecekGoster={gonderimFiltresi === "gonderilebilir" || (gonderimFiltresi === "tumu" && gonderilebilirIdler.has(yayin.yayin_id))}
      gonderimDetayiGoster={gonderimFiltresi === "gonderilen" && ozet.gonderilen_uye_sayisi > 0}
      gonderimDetayiAcik={acikDetayYayinId === yayin.yayin_id}
      gonderimDetayiYukleniyor={detayYukleniyor}
      gonderimDetayiHatasi={detayHatasi}
      gonderilenDanisanlar={acikDetayYayinId === yayin.yayin_id ? detayDanisanlar : []}
      onSecim={() => yayinSecimiDegistir(yayin.yayin_id)}
      onOnizle={() => setAktifYayin(yayin)}
      onGonderimDetayiAc={() => void detayAc(yayin.yayin_id)}
      onGonderimDetayiKapat={detayKapat}
    />;
  };

  const gonder = async (musteriIdler: string[]): Promise<DanisanGonderimSonucu> => {
    const sonuc: DanisanGonderimSonucu = { gonderilenKayit: 0, gonderilenYayin: 0, atlanan: 0, hatalar: [] };
    if (seciliYayinlar.length === 0 || musteriIdler.length === 0 || topluGonderiliyor) return sonuc;
    setTopluGonderiliyor(true);
    const basariliYayinlar = new Set<string>();
    try {
      for (const yayin of seciliYayinlar) {
        for (let baslangic = 0; baslangic < musteriIdler.length; baslangic += 100) {
          const parca = musteriIdler.slice(baslangic, baslangic + 100);
          try {
            const res = await fetch(API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ yayin_id: yayin.yayin_id, musteri_idler: parca }),
            });
            const data = await res.json();
            if (!res.ok) {
              sonuc.atlanan += parca.length;
              sonuc.hatalar.push(`${yayin.urun_adi}: ${data.hata ?? "Gönderilemedi."}`);
              continue;
            }
            const gonderilen = Number(data.gonderilen) || 0;
            const atlanan = Number(data.atlanan) || 0;
            sonuc.gonderilenKayit += gonderilen;
            sonuc.atlanan += atlanan;
            if (gonderilen > 0) basariliYayinlar.add(yayin.yayin_id);
            if (atlanan > 0) sonuc.hatalar.push(`${yayin.urun_adi}: ${atlanan} danışana gönderim atlandı.`);
          } catch {
            sonuc.atlanan += parca.length;
            sonuc.hatalar.push(`${yayin.urun_adi}: Gönderilemedi.`);
          }
        }
      }
      sonuc.gonderilenYayin = basariliYayinlar.size;
      setGonderimSonucu(sonuc);
      if (sonuc.gonderilenKayit > 0) basari(`${sonuc.gonderilenKayit} gönderim tamamlandı.`);
      await veriCek();
      bildirimRozetleriniYenile();
    } catch {
      hata("Gönderim sonuçları yenilenemedi.", "danışan gönderimi");
    } finally {
      setTopluGonderiliyor(false);
    }
    return sonuc;
  };

  if (ilkYukleme) return <div className="flex min-h-full items-center justify-center bg-gray-50"><span className="size-6 animate-spin rounded-full border-2 border-[#d7e4ef] border-t-[#3589d8]" /></div>;

  if (aktifYayin) return <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 pb-20 md:px-6 md:py-5 md:pb-8 lg:px-8 lg:py-7">
    <button type="button" onClick={() => setAktifYayin(null)} className="flex w-fit items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-gray-500 hover:text-gray-700"><ChevronLeft className="size-4" /> Öğrenme içerikleri</button>
    <Card className="gap-0 overflow-hidden border-gray-200 py-0 shadow-sm">
      <div className="border-b border-gray-100 px-4 py-4 md:px-5"><CardTitle className="text-base text-gray-900">{aktifYayin.urun_adi}</CardTitle><CardDescription className="mt-1">{aktifYayin.teknik_adi || "Eczanem öğrenme içeriği"}</CardDescription></div>
      <OgrenmeAraciOnizleme key={aktifYayin.yayin_id} yayinId={aktifYayin.yayin_id} aracId={aktifYayin.arac_id} aracTuru={aktifYayin.arac_turu} videoUrl={aktifYayin.video_url} urunAdi={aktifYayin.urun_adi} hata={hata} onBitti={() => setAktifYayin(null)} />
    </Card>
    <HataMesajiContainer mesajlar={mesajlar} />
  </div>;

  return <div className="min-h-full bg-gray-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
    <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
      <SayfaYenileBasligi className="flex flex-wrap items-end justify-between gap-4"
        baslik={<div className="inline-flex items-center"><h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#172b4d] md:text-[28px]">Danışan Yayınları</h1><SayfaRehberi anahtar="eczanem-eczane-dagitim" className="ml-1.5 -translate-y-1.5" /></div>}
        aciklama={<p className="mt-1 max-w-3xl text-sm leading-5 text-[#6b7f9b]">Eczanenize gelen öğrenme içeriklerini inceleyin ve danışanlarınıza gönderin.</p>}
        aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => void veriCek()} disabled={topluGonderiliyor} />}
      />

      {veriHatasi && !veri ? <Card className="gap-3 border-[#f2c9c9] bg-[#fffafa] py-8 text-center shadow-none">
        <CardContent className="flex flex-col items-center px-5"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#fdecec] text-[#b42318]"><CircleAlert /></span><CardTitle className="mt-3 text-base text-[#7f1d1d]">Veriler yüklenemedi</CardTitle><CardDescription className="mt-1">{veriHatasi}</CardDescription><Button className="mt-4 bg-[#237ac8] hover:bg-[#1d69ad]" onClick={() => void veriCek()}>Tekrar dene</Button></CardContent>
      </Card> : <>
        <section aria-label="Eczanem danışan gönderim özeti" className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          <OzetKarti ikon={Send} etiket="Gönderime Hazır Yayın" deger={gonderilebilirYayinlar.length} detay={`${yayinlar.length} yayın eczanenize ulaştı`} renk="#237ac8" zemin="#edf6fd" />
          <OzetKarti ikon={UsersRound} etiket="Aktif Danışan" deger={danisanSayisi} detay="Eczane listenizde" renk="#16865f" zemin="#eaf7f2" />
          <OzetKarti ikon={CheckCircle2} etiket="Gönderilen Yayın" deger={gonderilenYayinlar.length} detay="En az bir danışana gönderilen" renk="#b7791f" zemin="#fff7e6" />
        </section>

        <PeriyotButonlari<GonderimFiltresi>
          secenekler={[{ key: "tumu", label: `Tümü ${yayinlar.length}` }, { key: "gonderilebilir", label: `Gönderime Hazır ${gonderilebilirYayinlar.length}` }, { key: "gonderilen", label: `Gönderilenler ${gonderilenYayinlar.length}` }]}
          deger={gonderimFiltresi}
          onDegistir={(filtre) => { setGonderimFiltresi(filtre); secimSifirla(); setGonderimSonucu(null); }}
          ariaLabel="Gönderim durumu"
          className="w-fit flex-none"
        />

        {gonderimSonucu && <div role="status" className={`rounded-xl border px-4 py-3 text-xs ${gonderimSonucu.gonderilenKayit > 0 ? "border-[#c8ead7] bg-[#eff9f4] text-[#276a4d]" : "border-[#f0dbc0] bg-[#fff9ed] text-[#8c5b20]"}`}>
          <strong>{gonderimSonucu.gonderilenKayit > 0 ? `${gonderimSonucu.gonderilenYayin} yayın için ${gonderimSonucu.gonderilenKayit} danışan gönderimi tamamlandı.` : "Gönderim tamamlanamadı."}</strong>
          {gonderimSonucu.atlanan > 0 && <span className="ml-1">{gonderimSonucu.atlanan} gönderim atlandı.</span>}
          {gonderimSonucu.hatalar.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold">Atlanan gönderimlerin nedenleri</summary><ul className="mt-2 list-disc space-y-1 pl-4">{gonderimSonucu.hatalar.map((satir, index) => <li key={`${index}-${satir}`}>{satir}</li>)}</ul></details>}
        </div>}

        <section>
          <div className="mb-3"><UttYayinTuruToggle yayinlar={durumFiltreliYayinlar} deger={aktifYayinTuru} onDegistir={(tur) => { setAktifYayinTuru(tur); secimSifirla(); setGonderimSonucu(null); }} className="w-fit flex-none" /></div>
          <div className="mb-3"><h2 className="text-base font-extrabold text-[#203653]">Danışanlara Gönderilecek Öğrenme İçerikleri</h2><p className="mt-0.5 text-[11px] font-semibold text-[#7b8da5]">{gorunenYayinlar.length} yayın gösteriliyor</p></div>
          {gorunenYayinlar.length === 0 ? <div className="rounded-2xl border border-[#dfe7f1] bg-white px-4 py-14 text-center text-sm font-semibold text-[#8090a4]">{aktifYayinTuru !== "tumu" ? "Seçilen yayın türünde bu listede yayın bulunmuyor." : gonderimFiltresi === "gonderilebilir" ? "Şu anda gönderime hazır yayın bulunmuyor." : gonderimFiltresi === "gonderilen" ? "Henüz danışanlara gönderilmiş yayın bulunmuyor." : "Eczanenize ulaşmış Eczanem yayını bulunmuyor."}</div> :
            <MobilYayinAkisi kayitlar={gorunenYayinlar} kayitAnahtari={(yayin) => yayin.yayin_id} renderKart={yayinKarti} sayacGoster={false} sifirlamaAnahtari={`${gonderimFiltresi}-${aktifYayinTuru}`}
              masaustuIcerik={<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{gorunenYayinlar.map((yayin) => <div key={yayin.yayin_id} className="min-w-0">{yayinKarti(yayin)}</div>)}</div>} />}
        </section>
      </>}
    </div>
    <EczaneDanisanGonderimPaneli yayinlar={seciliYayinlar} gonderiliyor={topluGonderiliyor} onSecimTemizle={secimSifirla} onGonder={gonder} />
    <HataMesajiContainer mesajlar={mesajlar} />
  </div>;
}
