// app/(panel)/store/page.tsx
//
// FirmaStore vitrin sayfası. UTT/KD_UTT/BM görür.
// Genel site dokusuna (1480px, Nunito, kurumsal stat kartları, modern filtreler) uygun olarak modernize edilmiştir.

"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import { SadeSecim } from "@/components/kontrol/SadeKontroller";

import { useAuth } from "@/app/providers/AuthProvider";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { useHbstoreTakvim } from "@/hooks/useHbstoreTakvim";
import { hbstoreBakiyesiDegistiBildir } from "@/lib/tclub/store/olay";
import { STOK_AZ_ESIK } from "@/lib/tclub/store/sabitler";
import type { FirmaStoreCeki } from "@/lib/tclub/store/tipler";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import {
    Coins,
    Inbox,
    Package,
    Search,
    ShoppingBag,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

function StatKarti({
  ikon: Icon,
  etiket,
  deger,
  detay,
  renk = "var(--tema-yerel-magaza-eylem-metin-01)",
  zemin = "var(--tema-yerel-magaza-secim-zemin-04)",
  detaySarmala = false,
}: {
  ikon: React.ComponentType<{ className?: string; size?: number }>;
  etiket: string;
  deger: string | number;
  detay: string;
  renk?: string;
  zemin?: string;
  detaySarmala?: boolean;
}) {
  return (
    <article
      className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-4 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]"
      style={{ borderLeft: `4px solid ${renk}` }}
    >
      <div className="min-w-0">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--tema-yerel-magaza-yardimci-metin-14)]">{etiket}</span>
        <strong className="mt-1 block text-2xl font-black tracking-tight text-[var(--tema-yerel-magaza-ana-metin-05)]">{deger}</strong>
        <span className={`mt-1 block ${detaySarmala ? "whitespace-normal" : "truncate"} text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-15)]`}>{detay}</span>
      </div>
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ color: renk, backgroundColor: zemin }}
      >
        <Icon size={20} />
      </span>
    </article>
  );
}

function UrunKarti({
  urun,
  secili,
  islemde,
  onSecim,
}: {
  urun: FirmaStoreCeki;
  secili: boolean;
  islemde: boolean;
  onSecim: () => void;
}) {
  const stokYok = urun.stok === 0;
  const stokAz = urun.stok > 0 && urun.stok <= STOK_AZ_ESIK;

  return (
    <article
      data-selected={secili}
      className="group data-[selected=true]:ring-2 data-[selected=true]:ring-[var(--tema-yerel-magaza-eylem-metin-01)] grid grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] text-left shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--tema-yerel-magaza-cizgi-10)] hover:shadow-[0_12px_28px_var(--tema-yerel-magaza-golge-02)]"
    >
      {/* Görsel Alanı */}
      <div className="relative aspect-[2/1] min-h-0 w-full overflow-hidden border-b border-[var(--tema-yerel-magaza-cizgi-09)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)]">
        {urun.gorsel_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urun.gorsel_url}
            alt={urun.ad}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-1 text-[var(--tema-yerel-magaza-yardimci-metin-05)]">
            <Package size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Görsel Yok</span>
          </div>
        )}

        {/* Stok Rozetleri */}
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
          {stokYok ? (
            <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-01)] px-2.5 py-0.5 text-[9px] font-black text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm">
              Tükendi
            </span>
          ) : stokAz ? (
            <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-02)] px-2.5 py-0.5 text-[9px] font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-01)] shadow-sm">
              Son {urun.stok} Çek
            </span>
          ) : (
            <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-03)] px-2.5 py-0.5 text-[9px] font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-02)] shadow-sm">
              Stokta
            </span>
          )}
        </div>
      </div>

      {/* İçerik Alanı */}
      <div className="flex min-w-0 flex-col justify-between gap-1 px-2 py-1.5 md:px-3">
        {urun.aciklama && (
          <p title={urun.aciklama} className="line-clamp-1 text-[11px] font-semibold leading-4 text-[var(--tema-yerel-magaza-yardimci-metin-16)]">
            {urun.aciklama}
          </p>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-2">
          <div className="flex min-w-0 flex-col">
            <strong className="flex items-baseline gap-1 text-xs font-black leading-4 text-[var(--tema-yerel-magaza-islevsel-metin-17)]">
              <span className="text-[20.7px] leading-[23px]">{urun.baz_puan.toLocaleString("tr-TR")}</span>
              <span>Puan</span>
            </strong>
            <span className="text-[9px] font-bold leading-3 text-[var(--tema-yerel-magaza-yardimci-metin-15)]">{urun.minimum_siparis_tl.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL</span>
          </div>

          <label className={`flex min-h-10 cursor-pointer items-center justify-end gap-2 rounded-lg px-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-eylem-metin-01)] ${stokYok || islemde ? "opacity-50" : ""}`}>
            <input type="checkbox" checked={secili} disabled={stokYok || islemde}
              onChange={onSecim} aria-label={`${urun.ad} çekini seç`}
              className="size-5 shrink-0 accent-[var(--tema-yerel-magaza-eylem-metin-01)]" />
            {secili ? "Seçildi" : "Seç"}
          </label>
        </div>
      </div>
    </article>
  );
}

export default function StorePage() {
  const router = useRouter();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();

  const [seciliCek, setSeciliCek] = useState("");
  const [arama, setArama] = useState("");
  const [urunler, setUrunler] = useState<FirmaStoreCeki[]>([]);
  const [bakiye, setBakiye] = useState<number | null>(null);
  const [istatistikler, setIstatistikler] = useState<{
    cek_sayisi: number;
    toplam_cek_adedi: number;
    toplam_puan: number;
  } | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [secilenIdler, setSecilenIdler] = useState<string[]>([]);
  const [onayUrunleri, setOnayUrunleri] = useState<FirmaStoreCeki[]>([]);
  const [onayAnahtari, setOnayAnahtari] = useState<string | null>(null);
  const [hazirlaniyor, setHazirlaniyor] = useState(false);
  const [siparisVeriliyor, setSiparisVeriliyor] = useState(false);
  const [siparisHatasi, setSiparisHatasi] = useState<string | null>(null);
  const siparisKilidi = useRef(false);

  const { mesajlar, hata } = useHataMesaji();
  const rolKucu = kullanici?.rol?.toLowerCase() ?? "";
  const yetkili = Boolean(kullanici && STORE_ALABILEN_ROLLER.includes(rolKucu));
  const { takvim, acik: storeAcik, yenile: takvimYenile } = useHbstoreTakvim({ aktif: yetkili });

  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) {
      router.push("/login");
      return;
    }
    if (!STORE_ALABILEN_ROLLER.includes(rolKucu)) {
      router.push(panelBaslangici(rolKucu).yol);
      return;
    }
  }, [kullanici, authYukleniyor, rolKucu, router]);

  const statlariYukle = useCallback(async (sessiz = false) => {
    try {
      const res = await fetch("/store/api?tip=istatistikler", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        if (!sessiz) hata(data.hata ?? "Mağaza özeti yüklenemedi.", data.adim, data.detay);
        return;
      }
      setIstatistikler(data);
    } catch (err) {
      if (!sessiz) hata("Mağaza özeti yüklenemedi.", "fetch", String(err));
    }
  }, [hata]);

  useEffect(() => {
    if (!yetkili) return;
    void statlariYukle();
    // Admin katalog değişiklikleri ve yeni siparişler açık sayfaya da yansır.
    const yenile = () => {
      if (document.visibilityState === "visible") void statlariYukle(true);
    };
    const sayac = window.setInterval(yenile, 30_000);
    window.addEventListener("focus", yenile);
    document.addEventListener("visibilitychange", yenile);
    return () => {
      window.clearInterval(sayac);
      window.removeEventListener("focus", yenile);
      document.removeEventListener("visibilitychange", yenile);
    };
  }, [yetkili, statlariYukle]);

  const baslangicYukle = useCallback(async () => {
    try {
      const bakRes = await fetch("/store/api?tip=bakiye");

      if (bakRes.ok) {
        const d = await bakRes.json();
        setBakiye(d.bakiye ?? 0);
      } else {
        const d = await bakRes.json();
        hata(d.hata ?? "Bakiye yüklenemedi.", d.adim, d.detay);
      }
    } catch (err) {
      hata("Veriler yüklenirken hata oluştu.", "fetch", String(err));
    }
  }, [hata]);

  useEffect(() => {
    if (yetkili) void baslangicYukle();
  }, [yetkili, baslangicYukle]);

  const urunleriYukle = useCallback(
    async (ilkYukleme = false) => {
      if (ilkYukleme) setYukleniyor(true);
      try {
        const res = await fetch("/store/api?tip=urunler", { cache: "no-store" });
        const d = await res.json();
        if (!res.ok) {
          hata(d.hata ?? "Ürünler yüklenemedi.", d.adim, d.detay);
          return;
        }
        const guncelUrunler: FirmaStoreCeki[] = d.urunler ?? [];
        setUrunler(guncelUrunler);
        setSecilenIdler(onceki => onceki.filter(id => guncelUrunler.some(u => u.urun_id === id && u.stok > 0)));
        setSeciliCek((onceki) => guncelUrunler.some((urun) => urun.urun_id === onceki) ? onceki : "");
      } catch (err) {
        hata("Ürünler yüklenirken hata oluştu.", "fetch", String(err));
      } finally {
        if (ilkYukleme) setYukleniyor(false);
      }
    },
    [hata]
  );

  useEffect(() => {
    if (yetkili) void urunleriYukle(true);
  }, [yetkili, urunleriYukle]);

  const tumunuYenile = async () => {
    setYenileniyor(true);
    try {
      await Promise.all([baslangicYukle(), urunleriYukle(), takvimYenile(), statlariYukle()]);
    } finally {
      setYenileniyor(false);
    }
  };

  const secilenUrunler = urunler.filter(u => secilenIdler.includes(u.urun_id));
  const secimToplamPuan = secilenUrunler.reduce((toplam, u) => toplam + u.baz_puan, 0);
  const onayToplamPuan = onayUrunleri.reduce((toplam, u) => toplam + u.baz_puan, 0);
  const artanPuan = bakiye !== null ? bakiye - onayToplamPuan : 0;

  const secimiDegistir = (id: string) => {
    if (siparisKilidi.current) return;
    setSecilenIdler(onceki => onceki.includes(id) ? onceki.filter(k => k !== id) : [...onceki, id]);
  };

  const siparisOzetiniAc = async () => {
    if (siparisKilidi.current || !secilenIdler.length) return;
    if (!storeAcik) { hata("FirmaStore şu an siparişe kapalıdır.", "takvim"); return; }
    siparisKilidi.current = true; setHazirlaniyor(true); setSiparisHatasi(null);
    try {
      const [urunRes, bakiyeRes] = await Promise.all([
        fetch("/store/api?tip=urunler", { cache: "no-store" }),
        fetch("/store/api?tip=bakiye", { cache: "no-store" }),
      ]);
      const [urunVerisi, bakiyeVerisi] = await Promise.all([urunRes.json(), bakiyeRes.json()]);
      if (!urunRes.ok || !bakiyeRes.ok) { hata((!urunRes.ok ? urunVerisi.hata : bakiyeVerisi.hata) ?? "Talep özeti hazırlanamadı."); return; }
      const guncelUrunler: FirmaStoreCeki[] = urunVerisi.urunler;
      const guncelBakiye: number = bakiyeVerisi.bakiye;
      if (!Array.isArray(guncelUrunler) || !Number.isFinite(guncelBakiye)) { hata("Güncel çek ve puan bilgileri alınamadı."); return; }
      setBakiye(guncelBakiye); setUrunler(guncelUrunler);
      const secilenler = guncelUrunler.filter(u => secilenIdler.includes(u.urun_id));
      if (secilenler.length !== secilenIdler.length || secilenler.some(u => u.stok < 1)) {
        setSecilenIdler(onceki => onceki.filter(id => guncelUrunler.some(u => u.urun_id === id && u.stok > 0)));
        hata("Seçilen çeklerden biri artık talebe açık değil. Seçiminizi kontrol edin."); return;
      }
      if (guncelBakiye < secilenler.reduce((toplam, u) => toplam + u.baz_puan, 0)) { hata("Seçilen çeklerin toplamı için puanınız yeterli değil."); return; }
      setOnayAnahtari(crypto.randomUUID()); setOnayUrunleri(secilenler);
    } catch { hata("Talep özeti hazırlanamadı. Bağlantınızı kontrol edin."); }
    finally { siparisKilidi.current = false; setHazirlaniyor(false); }
  };

  const siparisiOnayla = async () => {
    if (!onayUrunleri.length || !onayAnahtari || siparisKilidi.current) return;
    siparisKilidi.current = true; setSiparisVeriliyor(true); setSiparisHatasi(null);
    try {
      const res = await fetch("/store/api/siparis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talep_anahtari: onayAnahtari, cekler: onayUrunleri.map(u => ({ urun_id: u.urun_id, adet: 1, beklenen_baz_puan: u.baz_puan, beklenen_birim_tl: u.minimum_siparis_tl })) }),
      });
      const data = await res.json();
      if (!res.ok) { setSiparisHatasi(data.hata ?? "Talepleriniz kaydedilemedi."); return; }
      hbstoreBakiyesiDegistiBildir(); setOnayUrunleri([]); setOnayAnahtari(null); setSecilenIdler([]);
      router.push("/store/siparislerim");
    } catch { setSiparisHatasi("Talepleriniz kaydedilemedi. Bağlantınızı kontrol edip yeniden deneyin."); }
    finally { siparisKilidi.current = false; setSiparisVeriliyor(false); }
  };

  const cekSecenekleri = useMemo(() => [
    { deger: "", etiket: "Tüm Çekler" },
    ...[...urunler]
      .sort((a, b) => a.ad.localeCompare(b.ad, "tr"))
      .map((urun) => ({ deger: urun.urun_id, etiket: urun.ad })),
  ], [urunler]);

  const filtrelenmisUrunler = useMemo(() => {
    const query = arama.trim().toLocaleLowerCase("tr-TR");
    return urunler.filter((urun) =>
      (!seciliCek || urun.urun_id === seciliCek)
      && urun.ad.toLocaleLowerCase("tr-TR").includes(query),
    );
  }, [urunler, arama, seciliCek]);

  if (authYukleniyor || !yetkili) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--tema-yerel-magaza-sayfa-zemini-01)]">
        <svg
          className="h-6 w-6 animate-spin text-[var(--tema-yerel-magaza-yardimci-metin-01)]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--tema-yerel-magaza-sayfa-zemini-01)] pb-20 md:pb-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <HataMesajiContainer mesajlar={mesajlar} />

      <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        {/* Header */}
        <SayfaYenileBasligi className="flex flex-wrap items-end justify-between gap-4"
          baslik={<div className="inline-flex items-center">
            <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-magaza-ana-metin-06)] md:text-[28px]">
              FirmaStore
            </h1>
            <SayfaRehberi anahtar="store-magaza" className="ml-1.5 -translate-y-1.5" />
          </div>}

          aciklama={<><p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[var(--tema-yerel-magaza-yardimci-metin-12)] md:text-sm">
            Kazandığınız puanlarla hediye çeki siparişlerinizi ücretsiz olarak verebilirsiniz
          </p></>}
          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={tumunuYenile} />}
          ekKontroller={<><div className="flex flex-wrap items-center gap-2">

            <Link
              href="/store/siparislerim"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <Package size={14} /> Taleplerim
            </Link>
          </div></>}
        />

        {/* FirmaStore Günleri Takvim Durumu Bannerı */}
        {takvim && (takvim.acik ? (
          <section aria-label="FirmaStore Günleri Durumu" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--tema-yerel-magaza-islevsel-cizgi-06)] bg-[var(--tema-yerel-magaza-islevsel-zemin-03)] px-4 py-3 shadow-[0_4px_14px_var(--tema-yerel-magaza-islevsel-golge-01)]">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--tema-yerel-magaza-islevsel-zemin-11)] text-[var(--tema-yerel-magaza-islevsel-metin-02)]">
                <Sparkles size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-black text-[var(--tema-yerel-magaza-islevsel-metin-02)]">FirmaStore Günleri Açık</strong>
                  <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-12)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm">
                    Sipariş Verilebilir
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-[var(--tema-yerel-magaza-islevsel-metin-10)]">
                  Dönem: {takvim.aktifPencere?.etiket} · Kapanışa son <strong>{takvim.kalanSureMetni}</strong> kaldı.
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] font-bold text-[var(--tema-yerel-magaza-islevsel-metin-10)]">
              Kapanış: {takvim.kapanisMetni}
            </div>
          </section>
        ) : (
          <section aria-label="FirmaStore Günleri Durumu" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--tema-yerel-magaza-islevsel-cizgi-02)] bg-[var(--tema-yerel-magaza-islevsel-zemin-04)] px-4 py-3 shadow-[0_4px_14px_var(--tema-yerel-magaza-islevsel-golge-02)]">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--tema-yerel-magaza-islevsel-zemin-13)] text-[var(--tema-yerel-magaza-islevsel-metin-06)]">
                <ShoppingBag size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-black text-[var(--tema-yerel-magaza-islevsel-metin-05)]">FirmaStore Günleri Kapalı</strong>
                  <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-14)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm">
                    Sonraki: {takvim.sonrakiDonemEtiketi}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-[var(--tema-yerel-magaza-islevsel-metin-07)]">
                  Siparişler yalnızca FirmaStore Günleri&apos;nde alınır. Açılışa <strong>{takvim.kalanSureMetni}</strong> kaldı. Ürünleri inceleyebilirsiniz.
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] font-bold text-[var(--tema-yerel-magaza-islevsel-metin-05)]">
              Açılış: {takvim.acilisMetni}
            </div>
          </section>
        ))}

        {/* 3'lü Stat Kartları */}
        <section aria-label="FirmaStore Durum Özeti" className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatKarti
            ikon={Coins}
            etiket={storeAcik ? "Kullanılabilir Puanım" : "Biriken Puanım"}
            deger={bakiye !== null ? `${bakiye.toLocaleString("tr-TR")} Puan` : "—"}
            detay={takvim ? `${["", "Birinci", "İkinci", "Üçüncü", "Dördüncü"][(takvim.aktifPencere ?? takvim.sonrakiPencere).ceyrek]} dönem sipariş puanı toplamı` : "Sipariş puanı toplamı"}
            renk="var(--tema-yerel-magaza-islevsel-metin-03)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-15)"
          />
          <StatKarti
            ikon={ShoppingBag}
            etiket="FirmaStore Çekleri"
            deger={istatistikler ? istatistikler.cek_sayisi.toLocaleString("tr-TR") : "—"}
            detay="Siparişe açık hediye çeki seçenekleri"
            renk="var(--tema-yerel-magaza-eylem-metin-01)"
            zemin="var(--tema-yerel-magaza-secim-zemin-04)"
          />
          <StatKarti
            ikon={Inbox}
            etiket="Toplam Çek Siparişi"
            deger={istatistikler ? istatistikler.toplam_cek_adedi.toLocaleString("tr-TR") : "—"}
            detay={istatistikler
              ? `Toplam ${istatistikler.toplam_puan.toLocaleString("tr-TR")} puan karşılığı talep edilen çek adedi`
              : "Sipariş toplamları yükleniyor"}
            detaySarmala
            renk="var(--tema-yerel-magaza-islevsel-metin-11)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-16)"
          />
        </section>

        {/* Çek adı arama ve seçim filtreleri */}
        <section aria-label="FirmaStore çek filtreleri" className="rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-4 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,384px)_minmax(0,240px)]">
            <div className="relative min-w-0">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--tema-yerel-magaza-yardimci-metin-17)]" />
              <input
                type="search"
                aria-label="Çek adı ara"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Çek adı ara..."
                className="h-10 w-full min-w-0 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] pl-9 pr-3.5 text-xs font-bold text-[var(--tema-yerel-magaza-ana-metin-04)] placeholder-[var(--tema-yerel-magaza-yardimci-metin-17)] transition-colors focus:border-[var(--tema-yerel-magaza-cizgi-04)] focus:bg-[var(--tema-yerel-magaza-kart-01)] focus:outline-none"
              />
            </div>
            <SadeSecim
              etiket="FirmaStore çekleri"
              deger={seciliCek}
              onDegistir={setSeciliCek}
              secenekler={cekSecenekleri}
              aranabilir={false}
              className="w-full"
            />
          </div>
        </section>

        <p className="text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-15)]">Bir veya birden fazla çek seçip birlikte talep edebilirsiniz. Her seçimden bir adet çek talep edilir.</p>
        {/* Ürünler Grid */}
        {yukleniyor ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] py-16 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <svg
              className="h-7 w-7 animate-spin text-[var(--tema-yerel-magaza-eylem-metin-01)]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-03)]">Ürünler yükleniyor...</p>
          </div>
        ) : filtrelenmisUrunler.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] py-16 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--tema-yerel-magaza-sayfa-zemini-06)] text-[var(--tema-yerel-magaza-yardimci-metin-01)]">
              <Inbox size={24} />
            </span>
            <h3 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Çek bulunamadı</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
              {arama.trim()
                ? `"${arama}" aramasına uygun çek bulunamadı.`
                : "Seçiminize uygun aktif hediye çeki bulunmuyor."}
            </p>
          </div>
        ) : (
          <section aria-label="FirmaStore Çek Listesi" className="grid grid-cols-2 gap-3 md:gap-4">
            {filtrelenmisUrunler.map((u) => (
              <UrunKarti
                key={u.urun_id}
                urun={u}
                secili={secilenIdler.includes(u.urun_id)}
                islemde={hazirlaniyor || siparisVeriliyor}
                onSecim={() => secimiDegistir(u.urun_id)}
              />
            ))}
          </section>
        )}
        {secilenUrunler.length > 0 && <section aria-label="Seçilen çekler" className="sticky bottom-3 z-20 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-4 shadow-lg">
          <div className="mb-3 flex flex-wrap gap-2">{secilenUrunler.map(u => <button key={u.urun_id} type="button" disabled={hazirlaniyor || siparisVeriliyor} onClick={() => secimiDegistir(u.urun_id)} aria-label={`${u.ad} seçimini kaldır`} className="rounded-lg border border-[var(--tema-yerel-magaza-cizgi-01)] px-2 py-1 text-xs font-bold">{u.ad} ×</button>)}</div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold"><p>{secilenUrunler.length} çek · Toplam {secimToplamPuan.toLocaleString("tr-TR")} Puan</p><p className="mt-1 text-xs font-semibold">{bakiye === null ? "Bakiye yükleniyor…" : secimToplamPuan > bakiye ? `${(secimToplamPuan - bakiye).toLocaleString("tr-TR")} Puan eksik` : `Kalan: ${(bakiye - secimToplamPuan).toLocaleString("tr-TR")} Puan`}</p></div>
            <div className="flex items-center gap-3"><button type="button" className="text-xs font-bold underline" disabled={hazirlaniyor || siparisVeriliyor} onClick={() => setSecilenIdler([])}>Seçimi temizle</button><button type="button" className="min-h-10 rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-5 py-2 text-sm font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] disabled:cursor-not-allowed disabled:opacity-50" disabled={hazirlaniyor || siparisVeriliyor || yenileniyor || bakiye === null || secimToplamPuan > bakiye || !storeAcik} onClick={() => void siparisOzetiniAc()}>{hazirlaniyor ? "Hazırlanıyor…" : "Talep Edin"}</button></div>
          </div>
        </section>}
      </main>

      <AlertDialog open={onayUrunleri.length > 0} onOpenChange={(acik) => {
        if (!acik && !siparisKilidi.current) {
          setOnayUrunleri([]); setOnayAnahtari(null);
          setSiparisHatasi(null);
        }
      }}>
        <AlertDialogContent aria-busy={siparisVeriliyor}>
          <AlertDialogHeader>
            <AlertDialogTitle>Hediye Çeki Talebi</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <ul className="max-h-52 space-y-2 overflow-y-auto">{onayUrunleri.map(u => <li key={u.urun_id} className="flex justify-between gap-3"><span>1 adet {u.ad}<small className="block">{u.minimum_siparis_tl.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL</small></span><strong className="shrink-0">{u.baz_puan.toLocaleString("tr-TR")} Puan</strong></li>)}</ul>
                <p>Toplam <strong>{onayToplamPuan.toLocaleString("tr-TR")} Puan</strong> kullanılacak.</p>
                <p>Kalan: <strong>{artanPuan.toLocaleString("tr-TR")} Puan</strong></p>
                <p>Talebiniz ilk 12 saat bekletilir. Bu süre içinde Taleplerim ekranından iptal edebilirsiniz. Süre sonunda admine aktarılır.</p>
                <p>Onaylıyor musunuz?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {siparisHatasi && <p role="alert" className="text-sm text-[var(--tema-yerel-magaza-islevsel-metin-17)]">{siparisHatasi}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={siparisVeriliyor}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction disabled={siparisVeriliyor} onClick={(event) => {
              event.preventDefault();
              void siparisiOnayla();
            }}>
              {siparisVeriliyor ? "Kaydediliyor…" : "Onaylıyorum"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
