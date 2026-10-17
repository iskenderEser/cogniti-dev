// app/(panel)/store/adreslerim/page.tsx
//
// Kullanıcının adres yönetimi sayfası. UTT/KD_UTT/BM görür.
// Genel site dokusuna (1480px, Nunito, kurumsal kartlar) uygun olarak modernize edilmiştir.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Edit2,
  MapPin,
  Package,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import { useAuth } from "@/app/providers/AuthProvider";
import AdresModal from "@/components/store/AdresModal";
import type { Adres } from "@/lib/tclub/store/tipler";

export default function AdreslerimPage() {
  const router = useRouter();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const [yetkiKontrolEdildi, setYetkiKontrolEdildi] = useState(false);

  const [adresler, setAdresler] = useState<Adres[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [modalAcik, setModalAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState<Adres | null>(null);
  const [silinecek, setSilinecek] = useState<Adres | null>(null);
  const [silmeIslemi, setSilmeIslemi] = useState(false);

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

  const adresleriYukle = async () => {
    setYukleniyor(true);
    try {
      const res = await fetch("/store/api/adres");
      const d = await res.json();
      if (!res.ok) {
        hata(d.hata ?? "Adresler yüklenemedi.", d.adim, d.detay);
        setYukleniyor(false);
        return;
      }
      setAdresler(d.adresler ?? []);
    } catch (err) {
      hata("Adresler yüklenirken hata oluştu.", "fetch", String(err));
    }
    setYukleniyor(false);
  };

  useEffect(() => {
    if (!yetkiKontrolEdildi) return;
    adresleriYukle();
  }, [yetkiKontrolEdildi]);

  const handleYeniEkle = () => {
    setDuzenlenecek(null);
    setModalAcik(true);
  };

  const handleDuzenle = (adres: Adres) => {
    setDuzenlenecek(adres);
    setModalAcik(true);
  };

  const handleVarsayilanYap = async (adres: Adres) => {
    if (adres.varsayilan_mi) return;
    try {
      const res = await fetch("/store/api/adres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adres_id: adres.adres_id,
          varsayilan_mi: true,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        hata(d.hata ?? "Varsayılan adres güncellenemedi.", d.adim, d.detay);
        return;
      }
      basari("Varsayılan teslimat adresi güncellendi.");
      await adresleriYukle();
    } catch (err) {
      hata("İşlem sırasında hata oluştu.", "fetch", String(err));
    }
  };

  const handleSilOnayla = async () => {
    if (!silinecek) return;
    setSilmeIslemi(true);
    try {
      const res = await fetch(`/store/api/adres?adres_id=${silinecek.adres_id}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!res.ok) {
        hata(d.hata ?? "Adres silinemedi.", d.adim, d.detay);
        setSilmeIslemi(false);
        return;
      }
      basari("Adres başarıyla silindi.");
      setSilinecek(null);
      setSilmeIslemi(false);
      await adresleriYukle();
    } catch (err) {
      hata("Silme sırasında hata oluştu.", "fetch", String(err));
      setSilmeIslemi(false);
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

      <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-magaza-ana-metin-06)] md:text-[28px]">
              Adreslerim
            </h1>
            <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[var(--tema-yerel-magaza-yardimci-metin-12)] md:text-sm">
              Siparişlerinizde kullanacağınız teslimat adreslerini yönetin ve varsayılan adresinizi belirleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleYeniEkle}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
            >
              <Plus size={15} /> Yeni Adres Ekle
            </button>
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <ShoppingBag size={14} /> HBStore
            </Link>
            <Link
              href="/store/siparislerim"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <Package size={14} /> Siparişlerim
            </Link>
          </div>
        </header>

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
            <p className="mt-3 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-03)]">Adresler yükleniyor...</p>
          </div>
        ) : adresler.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] py-16 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--tema-yerel-magaza-sayfa-zemini-06)] text-[var(--tema-yerel-magaza-yardimci-metin-01)]">
              <MapPin size={24} />
            </span>
            <h3 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Kayıtlı adresiniz bulunmuyor</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
              HBStore&apos;dan sipariş verebilmek için teslimat adresi tanımlamanız gerekir.
            </p>
            <button
              type="button"
              onClick={handleYeniEkle}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
            >
              <Plus size={15} /> İlk Adresinizi Ekleyin
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adresler.map((a) => (
              <article
                key={a.adres_id}
                className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-[var(--tema-yerel-magaza-kart-01)] p-5 shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)] transition-all ${
                  a.varsayilan_mi
                    ? "border-[var(--tema-yerel-magaza-islevsel-cizgi-03)] ring-2 ring-[var(--tema-yerel-magaza-islevsel-odak-01)]"
                    : "border-[var(--tema-yerel-magaza-cizgi-01)] hover:border-[var(--tema-yerel-magaza-cizgi-08)]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className={a.varsayilan_mi ? "text-[var(--tema-yerel-magaza-islevsel-metin-03)]" : "text-[var(--tema-yerel-magaza-eylem-metin-01)]"} />
                      <strong className="text-base font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)]">
                        {a.baslik}
                      </strong>
                    </div>

                    {a.varsayilan_mi && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tema-yerel-magaza-islevsel-zemin-03)] px-2.5 py-0.5 text-[9px] font-black text-[var(--tema-yerel-magaza-islevsel-metin-02)] shadow-sm">
                        <Check size={10} strokeWidth={3} /> Varsayılan
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-xs">
                    <span className="font-extrabold text-[var(--tema-yerel-magaza-ana-metin-08)]">{a.alici_adi}</span>
                    <span className="font-medium text-[var(--tema-yerel-magaza-yardimci-metin-08)]">{a.telefon}</span>
                    <p className="mt-1 text-[var(--tema-yerel-magaza-ana-metin-09)] leading-relaxed">{a.adres_detay}</p>
                    <span className="mt-1 font-bold text-[var(--tema-yerel-magaza-ana-metin-01)]">
                      {a.ilce} / {a.il} {a.posta_kodu ? `(${a.posta_kodu})` : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--tema-yerel-magaza-cizgi-09)] pt-3">
                  {!a.varsayilan_mi ? (
                    <button
                      type="button"
                      onClick={() => handleVarsayilanYap(a)}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--tema-yerel-magaza-eylem-metin-01)] hover:underline"
                    >
                      <Star size={12} /> Varsayılan Yap
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-07)]">
                      Ana Teslimat Adresi
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuzenle(a)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] text-[var(--tema-yerel-magaza-yardimci-metin-13)] hover:bg-[var(--tema-yerel-magaza-secim-zemin-02)]"
                      title="Düzenle"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSilinecek(a)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--tema-yerel-magaza-islevsel-cizgi-04)] bg-[var(--tema-yerel-magaza-islevsel-zemin-06)] text-[var(--tema-yerel-magaza-islevsel-metin-04)] hover:bg-[var(--tema-yerel-magaza-islevsel-zemin-07)]"
                      title="Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <AdresModal
        acik={modalAcik}
        mevcutAdres={duzenlenecek}
        onKapat={() => {
          setModalAcik(false);
          setDuzenlenecek(null);
        }}
        onKaydedildi={adresleriYukle}
        hata={hata}
        basari={basari}
      />

      {silinecek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--tema-yerel-magaza-ortu-01)]/50 p-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-islevsel-metin-04)]">
                <XCircle size={14} /> Adres Silme
              </div>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)]">
                Adresi Silmek İstiyor Musunuz?
              </h2>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[var(--tema-yerel-magaza-yardimci-metin-03)]">
              <strong className="text-[var(--tema-yerel-magaza-ana-metin-02)]">{silinecek.baslik}</strong> başlıklı adres kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setSilinecek(null)}
                disabled={silmeIslemi}
                className="rounded-xl border border-[var(--tema-yerel-magaza-islevsel-cizgi-05)] bg-[var(--tema-yerel-magaza-islevsel-zemin-08)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-08)] hover:bg-[var(--tema-yerel-magaza-islevsel-zemin-09)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSilOnayla}
                disabled={silmeIslemi}
                className="rounded-xl bg-[var(--tema-yerel-magaza-islevsel-zemin-01)] px-5 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-09)] shadow-sm hover:bg-[var(--tema-yerel-magaza-islevsel-zemin-10)] disabled:opacity-50"
              >
                {silmeIslemi ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
