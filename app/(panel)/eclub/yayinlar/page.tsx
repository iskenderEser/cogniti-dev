"use client";

import EclubGonderimPaneli from "./_components/EclubGonderimPaneli";
import EclubPlanlananlar from "./_components/EclubPlanlananlar";

import { HEDEF_ROL_TASARIM } from "@/app/(panel)/talepler/_types";
import { useAuth } from "@/app/providers/AuthProvider";
import UttGonderimIncelemesi from "@/components/eclub/UttGonderimIncelemesi";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { PeriyotButonlari } from "@/components/ui/periyot-butonlari";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import { yayinAlicisiUygun, yayinGonderimListeleri, type GonderimFiltresi } from "@/lib/eclub/yayinGonderimFiltreleri";
import { ECLUB_GOREN_ROLLER } from "@/lib/utils/roller";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useEclubOneriler } from "../oneriler/_hooks/useEclubOneriler";
import type { OneriGecmisKaydi, OneriYayin } from "../oneriler/_types";
import BmEclubYayinlari from "./_components/BmEclubYayinlari";
import { EclubYayinGonderimKarti } from "./_components/EclubYayinGonderimKarti";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

type HedefGrubu = "eczaci" | "eczane_teknisyeni" | "ortak";

const HEDEF_GRUPLARI: { anahtar: HedefGrubu; etiket: string; aciklama: string; renk: string }[] = [
  { anahtar: "eczaci", etiket: "Eczacılar", aciklama: "Yalnız eczacılara uygun", renk: HEDEF_ROL_TASARIM.eczaci.renk },
  { anahtar: "eczane_teknisyeni", etiket: "Eczane Teknisyenleri", aciklama: "Yalnız teknisyenlere uygun", renk: HEDEF_ROL_TASARIM.eczane_teknisyeni.renk },
  { anahtar: "ortak", etiket: "Eczacı ve Eczane Teknisyeni", aciklama: "Her iki hedef kitleye uygun", renk: "#5367c7" },
];

const hedefGrubu = (video: Pick<OneriYayin, "hedef_roller">): HedefGrubu => {
  const eczaci = video.hedef_roller.includes("eczaci");
  const teknisyen = video.hedef_roller.includes("eczane_teknisyeni");
  if (eczaci && teknisyen) return "ortak";
  return teknisyen ? "eczane_teknisyeni" : "eczaci";
};

export default function EclubVideolarimPage() {
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor) return <div className="flex min-h-full items-center justify-center bg-gray-50"><svg className="size-6 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  if ((kullanici?.rol ?? "").toLowerCase() === "bm") return <BmEclubYayinlari />;
  if ((kullanici?.rol ?? "").toLowerCase() === "tm") return <BmEclubYayinlari rol="tm" />;
  return <UttEclubVideolarimPage />;
}

function UttEclubVideolarimPage() {
  const router = useRouter();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const { mesajlar, hata, basari } = useHataMesaji();
  const rolUygun = !!kullanici && ECLUB_GOREN_ROLLER.includes((kullanici.rol ?? "").toLowerCase());
  const hazir = !authYukleniyor && rolUygun;
  const { yayinlar, kisiler, planlar, veriSurumu, gonderilenYayinIdleri, gonderilenKisiler, gonderimGecmisi, loading, yenileniyor, gonderLoading, veriCek, uygunluguKontrolEt, topluKaydet } = useEclubOneriler({ hazir, hata, basari });
  const [aktifHedef, setAktifHedef] = useState<HedefGrubu>("eczaci");
  const [gonderimFiltresi, setGonderimFiltresi] = useState<GonderimFiltresi>("tumu");
  const [aktifYayinTuru, setAktifYayinTuru] = useState<YayinTuruFiltreDegeri>("tumu");
  const [aktifVideo, setAktifVideo] = useState<OneriYayin | null>(null);
  const [seciliYayinIdleri, setSeciliYayinIdleri] = useState<string[]>([]);
  const [gonderimDurumZamani, setGonderimDurumZamani] = useState(() => Date.now());
  const [acikDetayYayinId, setAcikDetayYayinId] = useState<string | null>(null);

  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) { router.push("/login"); return; }
    if (!rolUygun) router.push("/ana-sayfa");
  }, [kullanici, authYukleniyor, rolUygun, router]);

  const gruplar = useMemo(() => ({
    eczaci: yayinlar.filter((video) => hedefGrubu(video) === "eczaci"),
    eczane_teknisyeni: yayinlar.filter((video) => hedefGrubu(video) === "eczane_teknisyeni"),
    ortak: yayinlar.filter((video) => hedefGrubu(video) === "ortak"),
  }), [yayinlar]);
  const gonderilenYayinlar = useMemo(() => new Set(gonderilenYayinIdleri), [gonderilenYayinIdleri]);
  useEffect(() => {
    const simdi = Date.now();
    const siradakiBitis = gonderimGecmisi
      .filter((kayit) => !kayit.izlendi_mi)
      .map((kayit) => new Date(kayit.oneri_bitis).getTime())
      .filter((bitis) => Number.isFinite(bitis) && bitis > simdi)
      .sort((a, b) => a - b)[0];
    if (siradakiBitis === undefined) return;
    const zamanlayici = window.setTimeout(() => setGonderimDurumZamani(Date.now()), Math.min(siradakiBitis - simdi + 100, 2_147_483_647));
    return () => window.clearTimeout(zamanlayici);
  }, [gonderimGecmisi, gonderimDurumZamani]);

  const hedefPlanlar = planlar.filter(p => hedefGrubu(p) === aktifHedef);
  const bekleyenPlanlar = hedefPlanlar.filter(p => p.durum === "bekliyor" || p.durum === "isleniyor");
  const planYayinlari = [...new Map(bekleyenPlanlar.map(p => [p.yayin_id, p])).values()];
  const gorunenPlanlar = hedefPlanlar.filter(p => p.durum !== "gerceklesti" && (aktifYayinTuru === "tumu" || p.arac_turu === aktifYayinTuru));
  const listeler = useMemo(() => yayinGonderimListeleri(gruplar[aktifHedef], kisiler, gonderilenKisiler),
    [gruplar, aktifHedef, kisiler, gonderilenKisiler]);
  const durumFiltreliYayinlar = listeler[gonderimFiltresi];
  const gonderimGecmisiMap = useMemo(() => {
    const map = new Map<string, OneriGecmisKaydi[]>();
    for (const kayit of gonderimGecmisi) map.set(kayit.yayin_id, [...(map.get(kayit.yayin_id) ?? []), kayit]);
    return map;
  }, [gonderimGecmisi]);
  const gorunenYayinlar = aktifYayinTuru === "tumu"
    ? durumFiltreliYayinlar
    : durumFiltreliYayinlar.filter((yayin) => yayin.arac_turu === aktifYayinTuru);
  const gonderilebilirIdler = new Set(listeler.gonderilebilir.map(y => y.yayin_id));
  const seciliYayinlar = gruplar[aktifHedef].filter(y => seciliYayinIdleri.includes(y.yayin_id) && gonderilebilirIdler.has(y.yayin_id));
  const secimSifirla = () => {
    setSeciliYayinIdleri([]);
    setAcikDetayYayinId(null);
  };

  const yayinSecimiDegistir = (yayinId: string) => {
    if (!seciliYayinIdleri.includes(yayinId) && seciliYayinIdleri.length >= 20) { hata("Tek işlemde en fazla 20 yayın seçebilirsiniz."); return; }
    setSeciliYayinIdleri((onceki) => onceki.includes(yayinId) ? onceki.filter((id) => id !== yayinId) : [...onceki, yayinId]);
  };

  const yayinKarti = (video: OneriYayin) => {
    const hedefKisiler = kisiler.filter((kisi) => yayinAlicisiUygun(kisi, video));
    const gonderilenler = new Set(gonderilenKisiler[video.yayin_id] ?? []);
    const gonderilenSayisi = hedefKisiler.filter((kisi) => gonderilenler.has(kisi.kisi_id)).length;
    return <EclubYayinGonderimKarti key={video.yayin_id} yayin={video} yeni={!gonderilenYayinlar.has(video.yayin_id)} secili={seciliYayinIdleri.includes(video.yayin_id)} secilebilir={gonderilebilirIdler.has(video.yayin_id) && !gonderLoading && !yenileniyor} gonderilenSayisi={gonderilenSayisi} hedefKisiSayisi={hedefKisiler.length} gonderilecekGoster={false} gonderimDetayiGoster={gonderimFiltresi === "gonderilen"} gonderimDetayiAcik={acikDetayYayinId === video.yayin_id} gonderimKayitlari={gonderimGecmisiMap.get(video.yayin_id) ?? []} simdi={gonderimDurumZamani} onSecim={() => { if (!gonderLoading) yayinSecimiDegistir(video.yayin_id); }} onOnizle={() => setAktifVideo(video)} onGonderimDetayiAc={() => setAcikDetayYayinId(video.yayin_id)} onGonderimDetayiKapat={() => setAcikDetayYayinId(null)} />;
  };

  if (authYukleniyor || !kullanici || loading) {
    return <div className="flex min-h-full items-center justify-center bg-gray-50"><svg className="size-6 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  if (aktifVideo) {
    return (
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <button type="button" onClick={() => setAktifVideo(null)} className="flex w-fit items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-gray-500 hover:text-gray-700">
          <ChevronLeft className="size-4" /> Öğrenme içerikleri
        </button>
        <UttGonderimIncelemesi
          key={aktifVideo.yayin_id}
          yayinId={aktifVideo.yayin_id}
          aracId={aktifVideo.arac_id}
          aracTuru={aktifVideo.arac_turu}
          videoUrl={aktifVideo.video_url}
          urunAdi={aktifVideo.urun_adi}
          hata={hata}
          onTamamlandi={async () => { setAktifVideo(null); await veriCek(); }}
        />
        <HataMesajiContainer mesajlar={mesajlar} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 pb-20" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <SayfaYenileBasligi className="flex flex-wrap items-end justify-between gap-4"
          baslik={<div className="inline-flex items-center">
            <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[#172b4d] md:text-[28px]">E-Club Yayınları</h1>
            <SayfaRehberi anahtar="eclub-yayinlar" className="ml-1.5 -translate-y-1.5" />
          </div>}

          aciklama={<><p className="mt-1 max-w-3xl text-sm leading-5 text-[#6b7f9b]">Uygun öğrenme içeriğini seçerek, eczacılara ve eczane teknisyenlerine gönderebilirsiniz.</p></>}
          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => { if (!gonderLoading) void veriCek(); }} />}

        />

        <section aria-label="E-Club öğrenme içeriği hedefleri" className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {HEDEF_GRUPLARI.map((grup) => {
            const secili = aktifHedef === grup.anahtar;
            const gonderilen = gruplar[grup.anahtar].filter((video) => gonderilenYayinlar.has(video.yayin_id)).length;
            const ortakSinif = "bg-white border border-gray-200 border-l-[3px] [border-left-color:var(--stat-renk)] rounded-xl p-3 text-left md:p-5 transition-all";
            const stil = { "--stat-renk": grup.renk, boxShadow: secili ? `0 0 0 2px ${grup.renk}22` : "none" } as CSSProperties;
            return (
              <button type="button" key={grup.anahtar} disabled={gonderLoading} onClick={() => { setAktifHedef(grup.anahtar); secimSifirla(); }} aria-pressed={secili} className={`${ortakSinif} cursor-pointer hover:-translate-y-0.5 hover:shadow-md`} style={stil}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{grup.etiket}</div>
                <div className="text-2xl font-extrabold leading-none text-gray-900 md:text-3xl">{gruplar[grup.anahtar].length.toLocaleString("tr-TR")}</div>
                <div className="mt-1.5 hidden text-xs text-gray-500 md:block">Yayındaki toplam yayın · {gonderilen} yayın gönderdiniz</div>
              </button>
            );
          })}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriyotButonlari<GonderimFiltresi>
          secenekler={[
            { key: "tumu", label: `Tümü ${listeler.tumu.length}` },
            { key: "gonderilebilir", label: `Gönderime Hazır ${listeler.gonderilebilir.length}` },
            { key: "planlanan", label: `Planlananlar ${planYayinlari.length}` },
            { key: "gonderilen", label: `Gönderilenler ${listeler.gonderilen.length}` },
          ]}
          deger={gonderimFiltresi}
          onDegistir={(filtre) => { if (!gonderLoading) setGonderimFiltresi(filtre); }}
          ariaLabel="Gönderim durumu"
          className="w-fit flex-none"
        />
        </div>
        <EclubGonderimPaneli
          yayinlar={seciliYayinlar} kisiler={kisiler} veriSurumu={veriSurumu}
          disabled={yenileniyor} kaydediliyor={gonderLoading}
          kontrolEt={uygunluguKontrolEt} kaydet={topluKaydet} onBasarili={secimSifirla}
          onSecimTemizle={secimSifirla} bantGoster={gonderimFiltresi !== "planlanan"}
        />

        <section>
          <div className="mb-3">
            <UttYayinTuruToggle<{ arac_turu?: string | null }>
              yayinlar={gonderimFiltresi === "planlanan" ? planYayinlari : durumFiltreliYayinlar}
              deger={aktifYayinTuru}
              onDegistir={(tur) => { if (!gonderLoading) setAktifYayinTuru(tur); }}
              className="w-fit flex-none"
            />
          </div>
          <div className="mb-3">
            <h2 className="text-base font-extrabold text-[#203653]">{HEDEF_GRUPLARI.find((grup) => grup.anahtar === aktifHedef)?.etiket} İçin Öğrenme İçerikleri</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-[#7b8da5]">{gonderimFiltresi === "planlanan" ? new Set(gorunenPlanlar.map(p => p.yayin_id)).size : gorunenYayinlar.length} yayın gösteriliyor</p>
          </div>
          {gonderimFiltresi === "planlanan" ? <EclubPlanlananlar planlar={gorunenPlanlar} kisiler={kisiler} /> : gorunenYayinlar.length === 0 ? (
            <div className="rounded-2xl border border-[#dfe7f1] bg-white px-4 py-14 text-center text-sm font-semibold text-[#8090a4]">{aktifYayinTuru !== "tumu" ? "Seçilen yayın türünde bu listede yayın bulunmuyor." : gonderimFiltresi === "gonderilebilir" ? "İncelemesini tamamladığınız yayın bulunmuyor." : gonderimFiltresi === "gonderilen" ? "Henüz gönderilmiş yayın bulunmuyor." : "Bu hedef kitle için yayında öğrenme içeriği bulunmuyor."}</div>
          ) : <MobilYayinAkisi
            kayitlar={[...gorunenYayinlar].sort((a, b) => new Date(b.yayin_tarihi).getTime() - new Date(a.yayin_tarihi).getTime())}
            kayitAnahtari={(video) => video.yayin_id}
            renderKart={yayinKarti}
            sayacGoster={false}
            sifirlamaAnahtari={`${aktifHedef}-${gonderimFiltresi}-${aktifYayinTuru}`}
            masaustuIcerik={<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{[...gorunenYayinlar].sort((a, b) => new Date(b.yayin_tarihi).getTime() - new Date(a.yayin_tarihi).getTime()).map((video) => <div key={video.yayin_id} className="min-w-0">{yayinKarti(video)}</div>)}</div>}
          />}
        </section>
      </div>
      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}
