// app/(panel)/store/[urun_id]/page.tsx
//
// Ürün detay + satın alma akışı sayfası.
// Genel site dokusuna (1480px, Nunito, kurumsal tasarım dili) uygun olarak modernize edilmiştir.

"use client";

import { SadeListeSecimi } from "@/components/kontrol/SadeKontroller";

import { useAuth } from "@/app/providers/AuthProvider";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { useHbstoreTakvim } from "@/hooks/useHbstoreTakvim";
import { hbstoreBakiyesiDegistiBildir } from "@/lib/tclub/store/olay";
import { STOK_AZ_ESIK } from "@/lib/tclub/store/sabitler";
import type { Adres, Urun } from "@/lib/tclub/store/tipler";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import {
    ChevronLeft,
    Minus,
    Package,
    Plus,
    ShoppingBag,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UrunDetay extends Urun {
  kategori_adi: string | null;
}

export default function UrunDetayPage() {
  const router = useRouter();
  const params = useParams();
  const urun_id = params?.urun_id as string;

  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const [yetkiKontrolEdildi, setYetkiKontrolEdildi] = useState(false);

  const [urun, setUrun] = useState<UrunDetay | null>(null);
  const [adresler, setAdresler] = useState<Adres[]>([]);
  const [bakiye, setBakiye] = useState<number>(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const { takvim, acik: storeAcik } = useHbstoreTakvim({ aktif: yetkiKontrolEdildi });

  // Satın alma state
  const [adet, setAdet] = useState<number>(1);
  const [seciliAdresId, setSeciliAdresId] = useState<string>("");
  const [onayModal, setOnayModal] = useState(false);
  const [siparisVeriliyor, setSiparisVeriliyor] = useState(false);

  const { mesajlar, hata, basari } = useHataMesaji();

  useEffect(() => {
    if (authYukleniyor) return;

    if (!kullanici) {
      router.push("/login");
      return;
    }

    const r = kullanici.rol.toLowerCase();
    if (!STORE_ALABILEN_ROLLER.includes(r)) {
      router.push("/ana-sayfa");
      return;
    }

    setYetkiKontrolEdildi(true);
  }, [kullanici, authYukleniyor, router]);

  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      const [urunRes, adresRes, bakRes] = await Promise.all([
        fetch(`/store/api?tip=urun&urun_id=${urun_id}`),
        fetch("/store/api/adres"),
        fetch("/store/api?tip=bakiye"),
      ]);

      if (urunRes.ok) {
        const d = await urunRes.json();
        setUrun(d.urun);
      } else {
        const d = await urunRes.json();
        hata(d.hata ?? "Ürün yüklenemedi.", d.adim, d.detay);
      }

      if (adresRes.ok) {
        const d = await adresRes.json();
        const adresListesi = d.adresler ?? [];
        setAdresler(adresListesi);
        const varsayilan = adresListesi.find((a: Adres) => a.varsayilan_mi);
        if (varsayilan) {
          setSeciliAdresId(varsayilan.adres_id);
        } else if (adresListesi.length > 0) {
          setSeciliAdresId(adresListesi[0].adres_id);
        }
      }

      if (bakRes.ok) {
        const d = await bakRes.json();
        setBakiye(d.bakiye ?? 0);
      }
    } catch (err) {
      hata("Veriler yüklenirken hata oluştu.", "fetch", String(err));
    }
    setYukleniyor(false);
  };

  useEffect(() => {
    if (!yetkiKontrolEdildi) return;
    verileriYukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yetkiKontrolEdildi, urun_id]);

  const toplamPuan = (urun?.puan_fiyati ?? 0) * adet;
  const seciliAdres = adresler.find((a) => a.adres_id === seciliAdresId);

  const handleSatinAl = () => {
    if (!urun) return;
    if (!storeAcik) {
      hata(
        `HBStore şu an siparişe kapalıdır. Siparişler yalnızca HBStore Günleri'nde (${takvim?.sonrakiDonemEtiketi ?? "HBStore Günleri"}) verilebilir.`,
        "takvim"
      );
      return;
    }
    if (adresler.length === 0) {
      hata("Sipariş vermeden önce teslimat adresi eklemelisin.", "adres");
      return;
    }
    if (!seciliAdresId) {
      hata("Lütfen bir teslimat adresi seçin.", "adres");
      return;
    }
    if (toplamPuan > bakiye) {
      hata("Bu sipariş için yeterli bakiyeniz bulunmuyor.", "bakiye");
      return;
    }
    if (adet > urun.stok) {
      hata(`Maksimum ${urun.stok} adet sipariş verebilirsin.`, "stok");
      return;
    }
    setOnayModal(true);
  };

  const handleOnayla = async () => {
    if (!urun || !seciliAdresId) return;
    setSiparisVeriliyor(true);

    try {
      const res = await fetch("/store/api/siparis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urun_id: urun.urun_id,
          adet,
          adres_id: seciliAdresId,
        }),
      });

      const d = await res.json();

      if (!res.ok) {
        hata(d.hata ?? "Sipariş verilemedi.", d.adim, d.detay);
        setSiparisVeriliyor(false);
        setOnayModal(false);
        return;
      }

      basari("Siparişiniz başarıyla alındı.");
      hbstoreBakiyesiDegistiBildir();
      router.push("/store/siparislerim");
    } catch (err) {
      hata("Sipariş verilirken hata oluştu.", "fetch", String(err));
      setSiparisVeriliyor(false);
      setOnayModal(false);
    }
  };

  if (authYukleniyor || !yetkiKontrolEdildi) {
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

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        {/* Geri Dönüş Linki */}
        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--tema-yerel-magaza-yardimci-metin-02)] transition-colors hover:text-[var(--tema-yerel-magaza-eylem-metin-01)]"
        >
          <ChevronLeft size={16} /> HBStore&apos;a Dön
        </Link>

        {yukleniyor ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] py-20 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <svg
              className="h-7 w-7 animate-spin text-[var(--tema-yerel-magaza-eylem-metin-01)]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-03)]">Ürün detayları yükleniyor...</p>
          </div>
        ) : !urun ? (
          <div className="rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-12 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <h3 className="text-base font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Ürün bulunamadı</h3>
            <p className="mt-1 text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-04)]">İstediğiniz ürün mevcut değil veya kaldırılmış olabilir.</p>
            <Link
              href="/store"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
            >
              HBStore&apos;a Dön
            </Link>
          </div>
        ) : !urun.aktif_mi ? (
          <div className="rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-12 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <h3 className="text-base font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Bu ürün şu an satışta değil</h3>
            <p className="mt-1 text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-04)]">Ürün geçici olarak siparişe kapatılmıştır.</p>
            <Link
              href="/store"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
            >
              Diğer Ürünlere Göz At
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Sol: Görsel */}
            <div className="flex flex-col gap-3 md:col-span-6">
              <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-6 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
                {urun.gorsel_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urun.gorsel_url}
                    alt={urun.ad}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[var(--tema-yerel-magaza-yardimci-metin-05)]">
                    <Package size={48} strokeWidth={1.5} />
                    <span className="text-xs font-bold">Görsel Yok</span>
                  </div>
                )}

                {/* Stok Rozeti */}
                <div className="absolute right-3.5 top-3.5">
                  {urun.stok === 0 ? (
                    <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-01)] px-3 py-1 text-[10px] font-black text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm">
                      Tükendi
                    </span>
                  ) : urun.stok <= STOK_AZ_ESIK ? (
                    <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-02)] px-3 py-1 text-[10px] font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-01)] shadow-sm">
                      Son {urun.stok} Ürün
                    </span>
                  ) : (
                    <span className="rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-03)] px-3 py-1 text-[10px] font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-02)] shadow-sm">
                      Stokta Var
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ: Bilgi & Satın Alma */}
            <div className="flex flex-col gap-4 md:col-span-6">
              {/* Ürün Tanım Kartı */}
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-5 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
                {urun.kategori_adi && (
                  <span className="w-fit rounded-lg bg-[var(--tema-yerel-magaza-secim-zemin-01)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-eylem-metin-01)]">
                    {urun.kategori_adi}
                  </span>
                )}
                <h1 className="text-xl font-black text-[var(--tema-yerel-magaza-ana-metin-02)] md:text-2xl">
                  {urun.ad}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[var(--tema-yerel-magaza-islevsel-metin-03)]">
                    {urun.puan_fiyati.toLocaleString("tr-TR")}
                  </span>
                  <span className="text-sm font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-03)]">HapPuan</span>
                </div>

                {urun.aciklama && (
                  <div className="border-t border-[var(--tema-yerel-magaza-cizgi-02)] pt-3 text-xs font-semibold leading-relaxed text-[var(--tema-yerel-magaza-yardimci-metin-06)] whitespace-pre-line">
                    {urun.aciklama}
                  </div>
                )}
              </div>

              {/* Satın Alma Form Kartı */}
              {urun.stok > 0 && (
                <div className="flex flex-col gap-4 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-5 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
                  {/* Adet Seçici */}
                  <div>
                    <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-yardimci-metin-01)]">
                      Sipariş Adedi
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdet((a) => Math.max(1, a - 1))}
                        disabled={adet <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] text-sm font-bold text-[var(--tema-yerel-magaza-ana-metin-03)] hover:bg-[var(--tema-yerel-magaza-secim-zemin-02)] disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={urun.stok}
                        value={adet}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isInteger(v) && v >= 1 && v <= urun.stok) {
                            setAdet(v);
                          }
                        }}
                        className="h-9 w-16 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-kart-01)] text-center text-sm font-black text-[var(--tema-yerel-magaza-ana-metin-04)] focus:border-[var(--tema-yerel-magaza-cizgi-04)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setAdet((a) => Math.min(urun.stok, a + 1))}
                        disabled={adet >= urun.stok}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] text-sm font-bold text-[var(--tema-yerel-magaza-ana-metin-03)] hover:bg-[var(--tema-yerel-magaza-secim-zemin-02)] disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="ml-2 text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-07)]">
                        (Maks. {urun.stok} stok)
                      </span>
                    </div>
                  </div>

                  {/* Adres Seçici */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-yardimci-metin-01)]">
                        Teslimat Adresi
                      </label>
                      <Link
                        href="/store/adreslerim"
                        className="text-xs font-bold text-[var(--tema-yerel-magaza-eylem-metin-01)] hover:underline"
                      >
                        Adresleri Yönet
                      </Link>
                    </div>

                    {adresler.length === 0 ? (
                      <div className="rounded-xl border border-[var(--tema-yerel-magaza-islevsel-cizgi-01)] bg-[var(--tema-yerel-magaza-sayfa-zemini-03)] p-3 text-xs font-semibold text-[var(--tema-yerel-magaza-islevsel-metin-01)]">
                        Kayıtlı teslimat adresiniz bulunmuyor.{" "}
                        <Link href="/store/adreslerim" className="font-extrabold underline">
                          Adres ekleyin
                        </Link>
                      </div>
                    ) : (
                      <SadeListeSecimi value={seciliAdresId} onChange={(e) => setSeciliAdresId(e.target.value)} aria-label="Teslimat adresi" className="w-full">
                        {adresler.map((a) => (
                          <option key={a.adres_id} value={a.adres_id}>
                            {a.baslik} — {a.ilce} / {a.il} {a.varsayilan_mi ? "★ (Varsayılan)" : ""}
                          </option>
                        ))}
                      </SadeListeSecimi>
                    )}
                  </div>

                  {/* Özet Şerit */}
                  <div className="flex flex-col gap-2 rounded-xl bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] p-3.5 text-xs">
                    <div className="flex items-center justify-between text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
                      <span className="font-semibold">Toplam Tutar:</span>
                      <strong className="text-sm font-black text-[var(--tema-yerel-magaza-ana-metin-02)]">
                        {toplamPuan.toLocaleString("tr-TR")} Puan
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
                      <span className="font-semibold">Mevcut Bakiyeniz:</span>
                      <strong className={`font-black ${toplamPuan > bakiye ? "text-[var(--tema-yerel-magaza-islevsel-metin-04)]" : "text-[var(--tema-yerel-magaza-islevsel-metin-03)]"}`}>
                        {bakiye.toLocaleString("tr-TR")} Puan
                      </strong>
                    </div>
                  </div>

                  {/* HBStore Günleri Kapalı Bilgi Uyarısı */}
                  {!storeAcik && (
                    <div className="rounded-xl border border-[var(--tema-yerel-magaza-islevsel-cizgi-02)] bg-[var(--tema-yerel-magaza-islevsel-zemin-04)] p-3.5 text-xs font-semibold text-[var(--tema-yerel-magaza-islevsel-metin-05)]">
                      <p className="flex items-center gap-1.5 font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-06)]">
                        <span>⏳</span> HBStore Günleri Kapalı
                      </p>
                      <p className="mt-1 leading-relaxed text-[var(--tema-yerel-magaza-islevsel-metin-07)]">
                        HBStore siparişleri yalnızca HBStore Günleri&apos;nde alınmaktadır. Sonraki sipariş dönemi:{" "}
                        <strong className="font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-05)]">{takvim?.sonrakiDonemEtiketi ?? "HBStore Günleri"}</strong>
                        {takvim ? ` (${takvim.kalanSureMetni} kaldı)` : ""}.
                      </p>
                    </div>
                  )}

                  {/* Satın Alma Butonu */}
                  <button
                    type="button"
                    onClick={handleSatinAl}
                    disabled={!storeAcik || adresler.length === 0 || !seciliAdresId || toplamPuan > bakiye}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold transition-colors ${
                      !storeAcik
                        ? "cursor-not-allowed border border-[var(--tema-yerel-magaza-cizgi-05)] bg-[var(--tema-yerel-magaza-sayfa-zemini-04)] text-[var(--tema-yerel-magaza-yardimci-metin-09)]"
                        : toplamPuan > bakiye
                        ? "cursor-not-allowed bg-[var(--tema-yerel-magaza-islevsel-zemin-05)] text-[var(--tema-yerel-magaza-islevsel-metin-04)]"
                        : adresler.length === 0
                        ? "cursor-not-allowed bg-[var(--tema-yerel-magaza-secim-zemin-03)] text-[var(--tema-yerel-magaza-yardimci-metin-09)]"
                        : "bg-[var(--tema-yerel-magaza-eylem-zemin-01)] text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
                    }`}
                  >
                    <ShoppingBag size={16} />
                    {!storeAcik
                      ? `Siparişe Kapalı (Açılış: ${takvim?.sonrakiDonemEtiketi ?? "HBStore Günleri"})`
                      : toplamPuan > bakiye
                      ? "Yetersiz Bakiye"
                      : adresler.length === 0
                      ? "Teslimat Adresi Gerekli"
                      : "Siparişi Onayla & Satın Al"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Onay Modalı */}
      {onayModal && urun && seciliAdres && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--tema-yerel-magaza-ortu-01)]/50 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-eylem-metin-02)]">
                <Sparkles size={14} /> Sipariş Onayı
              </div>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)]">
                Siparişi Tamamlamak İstiyor Musunuz?
              </h2>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[var(--tema-yerel-magaza-yardimci-metin-03)]">
              <strong className="text-[var(--tema-yerel-magaza-ana-metin-02)]">{adet} adet {urun.ad}</strong> için toplam{" "}
              <strong className="text-[var(--tema-yerel-magaza-islevsel-metin-03)]">{toplamPuan.toLocaleString("tr-TR")} HapPuan</strong> bakiyenizden düşülecektir.
            </p>

            <div className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-06)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] p-3.5 text-xs text-[var(--tema-yerel-magaza-yardimci-metin-10)]">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-yardimci-metin-07)]">
                Teslimat Adresi
              </span>
              <strong className="mt-1 block text-sm text-[var(--tema-yerel-magaza-ana-metin-05)]">{seciliAdres.alici_adi}</strong>
              <span className="block text-[11px] font-medium text-[var(--tema-yerel-magaza-yardimci-metin-11)]">{seciliAdres.telefon}</span>
              <p className="mt-1 text-xs text-[var(--tema-yerel-magaza-ana-metin-03)]">{seciliAdres.adres_detay}</p>
              <span className="mt-0.5 block text-xs font-bold text-[var(--tema-yerel-magaza-ana-metin-01)]">{seciliAdres.ilce} / {seciliAdres.il}</span>
            </div>

            <p className="text-[11px] font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-07)]">
              ℹ️ Siparişinizi 12 saat içinde iptal edebilirsiniz. Kargo sürecine geçtikten sonra iptal işlemi yapılamaz.
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setOnayModal(false)}
                disabled={siparisVeriliyor}
                className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-kart-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-10)] hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-02)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleOnayla}
                disabled={siparisVeriliyor}
                className="rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-5 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)] disabled:opacity-50"
              >
                {siparisVeriliyor ? "Sipariş Veriliyor..." : "Onayla ve Siparişi Tamamla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
