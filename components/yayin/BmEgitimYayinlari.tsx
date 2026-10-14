"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import VideoOynatici from "@/components/izle/VideoOynatici";
import { ListeArama, useListe, type AramaAlani } from "@/components/liste";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import BmOneriGonderimPaneli, { type BmOneriAlici, type BmOneriLimitler } from "@/components/yayin/BmOneriGonderimPaneli";
import { useBmOneriSecimi } from "@/components/yayin/BmOneriSecimi";
import { UttYayinKartIskeletleri, UttYayinListeAkisi, UttYayinTuruToggle } from "@/components/yayin/UttYayinListeOrtaklari";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import { oneriTarihKurali } from "@/lib/tclub/oneri/tarihKurali";
import { talepIdGoster } from "@/lib/utils/talepId";
import type { UttVideoKategorisi } from "@/lib/video/uttVideoKategorileri";
import type { YayindakiVideo } from "@/lib/video/yayindakiVideolar";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

const ARAMA_ALANLARI: AramaAlani<YayindakiVideo>[] = [
  { anahtar: "tumu", etiket: "Tümü", deger: (v) => `${v.urun_adi} ${v.teknik_adi ?? ""}` },
  { anahtar: "urun", etiket: "Ürün / Eğitim", deger: (v) => v.urun_adi },
  { anahtar: "teknik", etiket: "Teknik Adı", deger: (v) => v.teknik_adi ?? "" },
];

const tarihGoster = (gun: string) => {
  const [yil, ay, tarih] = gun.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(yil, ay - 1, tarih));
};

export default function BmEgitimYayinlari({ kategoriBilgisi }: { kategoriBilgisi: UttVideoKategorisi }) {
  const { kullanici } = useAuth();
  const bmMi = kullanici?.rol.trim().toLowerCase() === "bm";
  const { mesajlar, hata } = useHataMesaji();
  const hataRef = useRef(hata);
  const [yayinlar, setYayinlar] = useState<YayindakiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [yenileTetik, setYenileTetik] = useState(0);
  const [aktifTur, setAktifTur] = useState<YayinTuruFiltreDegeri>("tumu");
  const [aktifYayin, setAktifYayin] = useState<YayindakiVideo | null>(null);
  const [alicilar, setAlicilar] = useState<BmOneriAlici[]>([]);
  const [limitler, setLimitler] = useState<BmOneriLimitler | null>(null);
  const [alicilarYukleniyor, setAlicilarYukleniyor] = useState(true);
  const { seciliYayinIdleri, setSeciliYayinIdleri, aliciId, setAliciId, baslangic, setBaslangic, bitis, setBitis } = useBmOneriSecimi();
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [panelAcik, setPanelAcik] = useState(false);
  const [panelHatasi, setPanelHatasi] = useState("");
  const [sonucBelirsiz, setSonucBelirsiz] = useState(false);
  const [sonuc, setSonuc] = useState<{ baslik: string; detay: string; kismi: boolean } | null>(null);

  useEffect(() => {
    setAktifYayin(null);
    setAktifTur("tumu");
  }, [kategoriBilgisi.slug]);

  useEffect(() => { hataRef.current = hata; }, [hata]);

  useEffect(() => {
    let acik = true;
    const ilkYukleme = yenileTetik === 0;
    if (ilkYukleme) setLoading(true);
    else setYenileniyor(true);
    void fetch("/yayin-katalogu/api", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.hata ?? "Yayınlar yüklenemedi.");
        if (acik) {
          const guncelYayinlar = (data.videolar ?? []) as YayindakiVideo[];
          setYayinlar(guncelYayinlar);
          if (bmMi) {
            const secilebilirIdler = new Set(guncelYayinlar.filter((yayin) => yayin.hedef_roller.includes("utt")).map((yayin) => yayin.yayin_id));
            setSeciliYayinIdleri((mevcut) => mevcut.filter((id) => secilebilirIdler.has(id)));
          }
        }
      })
      .catch((error) => { if (acik) hataRef.current("Yayınlar yüklenemedi.", "Eğitim Yayınları", error instanceof Error ? error.message : undefined); })
      .finally(() => { if (acik) { setLoading(false); setYenileniyor(false); } });
    return () => { acik = false; };
  }, [bmMi, setSeciliYayinIdleri, yenileTetik]);

  useEffect(() => {
    if (!bmMi) return;
    let acik = true;
    setAlicilarYukleniyor(true);
    void fetch("/oneriler/api/kullanicilar", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.hata ?? "UTT listesi yüklenemedi.");
        if (acik) { setAlicilar(data.kullanicilar ?? []); setLimitler(data.limitler ?? null); }
      })
      .catch((error) => { if (acik) { setLimitler(null); hataRef.current("UTT listesi yüklenemedi.", "Öneri alıcıları", error instanceof Error ? error.message : undefined); } })
      .finally(() => { if (acik) setAlicilarYukleniyor(false); });
    return () => { acik = false; };
  }, [bmMi, yenileTetik]);

  const kategoriYayinlari = useMemo(() => yayinlar.filter((yayin) =>
    yayin.icerik_turu === kategoriBilgisi.icerikTuru && (!bmMi || yayin.hedef_roller.includes("utt"))
  ), [yayinlar, kategoriBilgisi.icerikTuru, bmMi]);
  const turFiltreli = useMemo(() => aktifTur === "tumu"
    ? kategoriYayinlari
    : kategoriYayinlari.filter((yayin) => yayin.arac_turu === aktifTur), [kategoriYayinlari, aktifTur]);
  const liste = useListe({ veri: turFiltreli, adim: Infinity, aramaAlanlari: ARAMA_ALANLARI });
  const seciliYayinlar = yayinlar.filter((yayin) => seciliYayinIdleri.includes(yayin.yayin_id));
  const seciliAlici = alicilar.find((alici) => alici.kullanici_id === aliciId);
  const limitUygun = seciliYayinlar.length <= (seciliAlici?.haftalik_kalan ?? 0)
    && seciliYayinlar.length <= (limitler?.aylik.kalan ?? 0);
  const gonderilebilir = bmMi && seciliYayinlar.length > 0 && seciliYayinlar.length === seciliYayinIdleri.length
    && Boolean(aliciId) && oneriTarihKurali(baslangic, bitis).gecerli && limitUygun && !gonderiliyor && !sonucBelirsiz;
  const yayinSec = (yayinId: string) => {
    setSeciliYayinIdleri((mevcut) => {
      if (mevcut.includes(yayinId)) return mevcut.filter((id) => id !== yayinId);
      if (mevcut.length >= 3) { hata("Tek seferde en fazla 3 yayın önerilebilir."); return mevcut; }
      return [...mevcut, yayinId];
    });
  };
  const gonder = async () => {
    if (!gonderilebilir) return;
    setGonderiliyor(true);
    setPanelHatasi("");
    try {
      const yanit = await fetch("/oneriler/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oneriler: seciliYayinlar.map((yayin) => ({
          yayin_id: yayin.yayin_id,
          kullanici_id: aliciId,
          oneri_baslangic: baslangic,
          oneri_bitis: bitis,
        })) }),
      });
      const veri = await yanit.json();
      if (!Array.isArray(veri.oneriler)) { setPanelHatasi(veri.hata ?? "Öneri gönderilemedi."); return; }
      const basariliIdler = new Set<string>(veri.oneriler.map((kayit: { yayin_id: string }) => kayit.yayin_id));
      const basarisizSayisi = seciliYayinlar.length - basariliIdler.size;
      if (basariliIdler.size === 0) { setPanelHatasi(veri.hata ?? "Önerilerin hiçbiri gönderilemedi. Seçimleriniz korundu."); return; }
      setSeciliYayinIdleri((mevcut) => mevcut.filter((id) => !basariliIdler.has(id)));
      const alici = alicilar.find((kisi) => kisi.kullanici_id === aliciId);
      setSonuc({
        baslik: basarisizSayisi > 0 ? `${basariliIdler.size} öneri gönderildi, ${basarisizSayisi} öneri gönderilemedi.` : `${basariliIdler.size} öneri gönderildi.`,
        detay: `${alici ? `${alici.ad} ${alici.soyad}` : "Temsilci"} · ${tarihGoster(baslangic)} – ${tarihGoster(bitis)}${basarisizSayisi > 0 ? " · Gönderilemeyen yayınlar seçili kaldı." : ""}`,
        kismi: basarisizSayisi > 0,
      });
      setPanelAcik(false);
      setAliciId("");
      setBaslangic("");
      setBitis("");
      setYenileTetik((deger) => deger + 1);
    } catch {
      setSonucBelirsiz(true);
      setPanelHatasi("Gönderim sonucu doğrulanamadı. Yeniden göndermeden önce Öneri Takibi'ni kontrol edin.");
    } finally {
      setGonderiliyor(false);
    }
  };
  const bosMesaj = liste.arama.aranan
    ? "Arama kriterlerinize uygun öğrenme içeriği bulunamadı."
    : aktifTur !== "tumu"
      ? "Seçtiğiniz yayın türünde henüz yayın bulunmuyor."
      : "Bu kategoride henüz yayın bulunmuyor.";

  if (aktifYayin) return (
    <div className="mx-auto max-w-6xl px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
      <button type="button" onClick={() => setAktifYayin(null)} className="mb-4 text-sm font-bold text-[#2f7fc7] hover:underline">
        ← {kategoriBilgisi.etiket}
      </button>
      <VideoOynatici key={aktifYayin.yayin_id} video={aktifYayin} tuketici={false} onizlemeYuzeyi aktifYayinDogrula onKapat={() => setAktifYayin(null)} onVeriYenile={() => {}} hata={hata} basari={() => {}} uyari={() => {}} />
      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 pb-20 md:px-6 md:py-5 md:pb-5 lg:px-8 lg:py-7">
      {bmMi && <Link href="/oneriler" className="mb-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#347eb9] hover:underline"><ArrowLeft className="size-3.5" /> Öneri Takibi</Link>}
      {bmMi && <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#8395aa]"><span>Eğitim Yayınları</span><span aria-hidden="true">›</span><strong className="text-[#39749f]">{kategoriBilgisi.etiket}</strong></div>}
      <SayfaYenileBasligi className="mb-5 flex items-start justify-between gap-3"
        baslik={<div className="inline-flex items-center">
          <h1 className="m-0 text-xl font-extrabold text-gray-900 md:text-2xl">{kategoriBilgisi.etiket}</h1>
          <SayfaRehberi anahtar="yayindaki-videolar" className="ml-1.5 -translate-y-0.5" />
        </div>}

        aciklama={<><p className="mt-1 text-xs font-semibold text-gray-500">Yayındaki eğitim içeriklerini inceleyebilirsiniz.</p></>}
        aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={() => setYenileTetik((deger) => deger + 1)} />}

      />

      {bmMi && <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#7c8da1]">
        <span>{kategoriBilgisi.etiket} içindeki yayınlar</span>
      </div>}

      {sonuc && <div role="status" className={`mb-5 flex items-start gap-3 rounded-xl border border-l-4 px-4 py-3 ${sonuc.kismi ? "border-amber-200 border-l-amber-600 bg-amber-50 text-amber-800" : "border-emerald-200 border-l-emerald-600 bg-emerald-50 text-emerald-800"}`}>
        <Check className="mt-0.5 size-4 shrink-0" /><div className="min-w-0 flex-1"><strong className="block text-xs">{sonuc.baslik}</strong><p className="mt-1 text-[11px]">{sonuc.detay}</p></div>
        <button type="button" onClick={() => setSonuc(null)} aria-label="Bilgi notunu kapat" className="shrink-0 rounded p-1 hover:bg-black/5"><X className="size-4" /></button>
      </div>}

      <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <UttYayinTuruToggle yayinlar={kategoriYayinlari} deger={aktifTur} onDegistir={setAktifTur} className="min-w-0" />
        <div className="ml-auto flex min-w-0 max-w-full items-center justify-end">
          <ListeArama arama={liste.arama} ipucu="Bu kategoride ara..." genislik="w-48 sm:w-60" yukseklik="secim" />
        </div>
      </div>

      {loading ? (
        <UttYayinKartIskeletleri izgaraClassName="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" />
      ) : (
        <UttYayinListeAkisi<YayindakiVideo>
          kayitlar={liste.gorunen}
          kayitAnahtari={(yayin) => yayin.yayin_id}
          renderKart={(yayin) => <YayinKarti
            yayin={yayin}
            onClick={() => setAktifYayin(yayin)}
            etkilesimAktif={false}
            etkilesimGoster={false}
            durumGoster={false}
            talepNoGoster={bmMi}
            baslikSagAksiyon={!bmMi && yayin.talep_no != null ? <span className="shrink-0 font-mono text-xs text-[#bc2d0d] sm:text-[10px]">{talepIdGoster(yayin.firma_adi, yayin.talep_no)}</span> : undefined}
            className={seciliYayinIdleri.includes(yayin.yayin_id) ? "ring-2 ring-[#237ac8]/30" : ""}
            altEkIcerik={bmMi ? <div onClick={(event) => event.stopPropagation()} className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#eef2f6] pt-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-extrabold text-[#526780]">
                <input type="checkbox" checked={seciliYayinIdleri.includes(yayin.yayin_id)} onChange={() => yayinSec(yayin.yayin_id)} aria-label={`${yayin.urun_adi} yayınını öneri için seç`} className="size-3.5 accent-[#2f7fc7]" />
                Öneri için seç
              </label>
              <button type="button" onClick={() => setAktifYayin(yayin)} className="text-[10px] font-extrabold text-[#7d8ba0] hover:text-[#2f7fc7]">Önizle ↗</button>
            </div> : undefined}
          />}
          sifirlamaAnahtari={`${kategoriBilgisi.slug}-${aktifTur}-${liste.arama.alanAnahtari}-${liste.arama.aranan}`}
          bosMesaj={bosMesaj}
          masaustuIzgaraClassName="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        />
      )}
      {bmMi && seciliYayinIdleri.length > 0 && <div role="status" className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-[650px] flex-wrap items-center gap-2.5 rounded-2xl bg-[#172b4d] px-3.5 py-3 text-white shadow-[0_16px_40px_rgba(23,43,77,0.3)] max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-b-none">
        <strong className="min-w-0 flex-1 text-[13px]">{seciliYayinIdleri.length} yayın seçildi</strong>
        <span className="text-[10px] text-[#b8cade] max-sm:order-3 max-sm:w-full">En fazla 3 yayın · tek temsilci</span>
        <button type="button" onClick={() => setSeciliYayinIdleri([])} className="rounded-lg px-2 py-2.5 text-[11px] font-extrabold text-[#d9e6f3] hover:bg-white/10">Seçimi temizle</button>
        <button type="button" onClick={() => { setPanelHatasi(""); setPanelAcik(true); }} className="rounded-lg bg-white px-3 py-2.5 text-[11px] font-extrabold text-[#237ac8] hover:bg-[#edf6ff]">Gönderim oluştur →</button>
      </div>}
      {bmMi && panelAcik && <BmOneriGonderimPaneli
        yayinlar={seciliYayinlar} alicilar={alicilar} limitler={limitler} alicilarYukleniyor={alicilarYukleniyor}
        aliciId={aliciId} onAliciDegistir={setAliciId}
        baslangic={baslangic} onBaslangicDegistir={(gun) => { setBaslangic(gun); if (bitis && gun >= bitis) setBitis(""); }}
        bitis={bitis} onBitisDegistir={setBitis}
        gonderiliyor={gonderiliyor} gonderilebilir={gonderilebilir} hataMesaji={panelHatasi}
        onGonder={() => void gonder()} onKapat={() => { if (!gonderiliyor) setPanelAcik(false); }}
      />}
      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}
