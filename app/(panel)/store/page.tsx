// app/(panel)/store/page.tsx
//
// FirmaStore vitrin sayfası. UTT/KD_UTT/BM görür.
// Genel site dokusuna (1480px, Nunito, kurumsal stat kartları, modern filtreler) uygun olarak modernize edilmiştir.

"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import { SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";

import { useAuth } from "@/app/providers/AuthProvider";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import SayfaRehberi from "@/components/rehber/SayfaRehberi";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { useHbstoreTakvim } from "@/hooks/useHbstoreTakvim";
import { STOK_AZ_ESIK } from "@/lib/tclub/store/sabitler";
import type { Kategori, Urun } from "@/lib/tclub/store/tipler";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import {
    Coins,
    Inbox,
    Layers3,
    MapPin,
    Package,
    Search,
    ShoppingBag,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

function StatKarti({
  ikon: Icon,
  etiket,
  deger,
  detay,
  renk = "var(--tema-yerel-magaza-eylem-metin-01)",
  zemin = "var(--tema-yerel-magaza-secim-zemin-04)",
}: {
  ikon: React.ComponentType<{ className?: string; size?: number }>;
  etiket: string;
  deger: string | number;
  detay: string;
  renk?: string;
  zemin?: string;
}) {
  return (
    <article
      className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-4 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]"
      style={{ borderLeft: `4px solid ${renk}` }}
    >
      <div className="min-w-0">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--tema-yerel-magaza-yardimci-metin-14)]">{etiket}</span>
        <strong className="mt-1 block text-2xl font-black tracking-tight text-[var(--tema-yerel-magaza-ana-metin-05)]">{deger}</strong>
        <span className="mt-1 block truncate text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-15)]">{detay}</span>
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
  bakiye,
  storeAcik,
  onTikla,
}: {
  urun: Urun;
  bakiye: number | null;
  storeAcik: boolean;
  onTikla: () => void;
}) {
  const stokYok = urun.stok === 0;
  const stokAz = urun.stok > 0 && urun.stok <= STOK_AZ_ESIK;
  const yetersizBakiye = bakiye !== null && bakiye < urun.puan_fiyati;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] text-left shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--tema-yerel-magaza-cizgi-10)] hover:shadow-[0_12px_28px_var(--tema-yerel-magaza-golge-02)]"
    >
      {/* Görsel Alanı */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[var(--tema-yerel-magaza-cizgi-09)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] p-3">
        {urun.gorsel_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urun.gorsel_url}
            alt={urun.ad}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[var(--tema-yerel-magaza-yardimci-metin-05)]">
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
              Son {urun.stok} Ürün
            </span>
          ) : (
            <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-03)] px-2.5 py-0.5 text-[9px] font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-02)] shadow-sm">
              Stokta
            </span>
          )}
        </div>
      </div>

      {/* İçerik Alanı */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)]" title={urun.ad}>
            {urun.ad}
          </h3>
          {urun.aciklama && (
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-[var(--tema-yerel-magaza-yardimci-metin-16)]">
              {urun.aciklama}
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-[var(--tema-yerel-magaza-cizgi-09)] pt-3">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--tema-yerel-magaza-yardimci-metin-15)]">Puan Değeri</span>
            <strong className={`text-base font-black ${yetersizBakiye ? "text-[var(--tema-yerel-magaza-yardimci-metin-01)]" : "text-[var(--tema-yerel-magaza-islevsel-metin-03)]"}`}>
              {urun.puan_fiyati.toLocaleString("tr-TR")} Puan
            </strong>
          </div>

          <button
            type="button"
            onClick={onTikla}
            disabled={stokYok}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-colors ${
              stokYok
                ? "cursor-not-allowed bg-[var(--tema-yerel-magaza-secim-zemin-03)] text-[var(--tema-yerel-magaza-yardimci-metin-09)]"
                : yetersizBakiye
                ? "bg-[var(--tema-yerel-magaza-secim-zemin-05)] text-[var(--tema-yerel-magaza-eylem-metin-01)] hover:bg-[var(--tema-yerel-magaza-secim-zemin-06)]"
                : "bg-[var(--tema-yerel-magaza-eylem-zemin-01)] text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
            }`}
          >
            {stokYok ? "Tükendi" : storeAcik ? "İncele & Sipariş Ver" : "İncele"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function StorePage() {
  const router = useRouter();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();

  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [seciliKategori, setSeciliKategori] = useState<string | null>(null);
  const [arama, setArama] = useState("");
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [bakiye, setBakiye] = useState<number | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

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

  const baslangicYukle = useCallback(async () => {
    try {
      const [katRes, bakRes] = await Promise.all([
        fetch("/store/api?tip=kategoriler"),
        fetch("/store/api?tip=bakiye"),
      ]);

      if (katRes.ok) {
        const d = await katRes.json();
        setKategoriler(d.kategoriler ?? []);
      } else {
        const d = await katRes.json();
        hata(d.hata ?? "Kategoriler yüklenemedi.", d.adim, d.detay);
      }

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
        let url = "/store/api?tip=urunler";
        if (seciliKategori) url += `&kategori_id=${seciliKategori}`;

        const res = await fetch(url);
        const d = await res.json();
        if (!res.ok) {
          hata(d.hata ?? "Ürünler yüklenemedi.", d.adim, d.detay);
          return;
        }
        setUrunler(d.urunler ?? []);
      } catch (err) {
        hata("Ürünler yüklenirken hata oluştu.", "fetch", String(err));
      } finally {
        if (ilkYukleme) setYukleniyor(false);
      }
    },
    [seciliKategori, hata]
  );

  useEffect(() => {
    if (yetkili) void urunleriYukle(true);
  }, [yetkili, urunleriYukle]);

  const tumunuYenile = async () => {
    setYenileniyor(true);
    try {
      await Promise.all([baslangicYukle(), urunleriYukle(), takvimYenile()]);
    } finally {
      setYenileniyor(false);
    }
  };

  const filtrelenmisUrunler = useMemo(() => {
    if (!arama.trim()) return urunler;
    const query = arama.trim().toLocaleLowerCase("tr-TR");
    return urunler.filter((u) => u.ad.toLocaleLowerCase("tr-TR").includes(query));
  }, [urunler, arama]);

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
            Kazandığınız puanlarla siparişlerinizi ücretsiz olarak verebilirsiniz
          </p></>}
          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={tumunuYenile} />}
          ekKontroller={<><div className="flex flex-wrap items-center gap-2">

            <Link
              href="/store/siparislerim"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <Package size={14} /> Siparişlerim
            </Link>
            <Link
              href="/store/adreslerim"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <MapPin size={14} /> Adreslerim
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
            deger={bakiye !== null ? `${bakiye.toLocaleString("tr-TR")} P` : "—"}
            detay={takvim?.bakiyeDonemEtiketi ?? (storeAcik ? "Sipariş için harcanabilir bakiye" : "Sonraki dönem için biriken puan")}
            renk="var(--tema-yerel-magaza-islevsel-metin-03)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-15)"
          />
          <StatKarti
            ikon={ShoppingBag}
            etiket="FirmaStore Ürünleri"
            deger={urunler.length}
            detay="Aktif siparişe açık ürün çeşidi"
            renk="var(--tema-yerel-magaza-eylem-metin-01)"
            zemin="var(--tema-yerel-magaza-secim-zemin-04)"
          />
          <StatKarti
            ikon={Layers3}
            etiket="Kategori Çeşitliliği"
            deger={kategoriler.length}
            detay="Farklı ürün grubu"
            renk="var(--tema-yerel-magaza-islevsel-metin-11)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-16)"
          />
        </section>

        {/* Arama ve Kategori Filtre Alanı */}
        <section className="flex flex-col gap-3 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-4 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Arama Çubuğu */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--tema-yerel-magaza-yardimci-metin-17)]" />
              <input
                type="text"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Ürün adı ara..."
                className="w-full rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] py-2 pl-9 pr-3.5 text-xs font-bold text-[var(--tema-yerel-magaza-ana-metin-04)] placeholder-[var(--tema-yerel-magaza-yardimci-metin-17)] transition-colors focus:border-[var(--tema-yerel-magaza-cizgi-04)] focus:bg-[var(--tema-yerel-magaza-kart-01)] focus:outline-none"
              />
            </div>

            <span className="text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
              {filtrelenmisUrunler.length} ürün listeleniyor
            </span>
          </div>

          {/* Kategori Pilleri */}
          <SadeKontrolGrubu tur="kapsul">
            <SadeKontrolButonu type="button" onClick={() => setSeciliKategori(null)} aria-pressed={seciliKategori === null}>
              Tümü
            </SadeKontrolButonu>
            {kategoriler.map((k) => (
              <SadeKontrolButonu type="button" key={k.kategori_id} onClick={() => setSeciliKategori(k.kategori_id)} aria-pressed={seciliKategori === k.kategori_id}>
                {k.ad}
              </SadeKontrolButonu>
            ))}
          </SadeKontrolGrubu>
        </section>

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
            <h3 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Ürün bulunamadı</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
              {arama.trim()
                ? `"${arama}" aramasına uygun ürün bulunamadı.`
                : "Seçtiğiniz kategoride şu an aktif ürün bulunmuyor."}
            </p>
          </div>
        ) : (
          <section aria-label="FirmaStore Ürün Listesi" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtrelenmisUrunler.map((u) => (
              <UrunKarti
                key={u.urun_id}
                urun={u}
                bakiye={bakiye}
                storeAcik={storeAcik}
                onTikla={() => router.push(`/store/${u.urun_id}`)}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
