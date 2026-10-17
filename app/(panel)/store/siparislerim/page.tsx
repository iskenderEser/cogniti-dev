// app/(panel)/store/siparislerim/page.tsx
//
// Kullanıcının kendi sipariş geçmişi. UTT/KD_UTT/BM görür.
// Genel site dokusuna (1480px, Nunito, kurumsal stat kartları) uygun olarak modernize edilmiştir.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ExternalLink,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import { useAuth } from "@/app/providers/AuthProvider";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { DURUM_ETIKETLERI, DURUM_RENKLERI, IPTAL_SURE_SAATI } from "@/lib/tclub/store/sabitler";
import { kargoTakipUrl } from "@/lib/tclub/store/kargo";
import type { SiparisGosterim, AdresSnapshot } from "@/lib/tclub/store/tipler";
import { hbstoreBakiyesiDegistiBildir } from "@/lib/tclub/store/olay";
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

export default function SiparislerimPage() {
  const router = useRouter();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const [yetkiKontrolEdildi, setYetkiKontrolEdildi] = useState(false);

  const [siparisler, setSiparisler] = useState<SiparisGosterim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);

  const [iptalEdilecek, setIptalEdilecek] = useState<SiparisGosterim | null>(null);
  const [iptalIslemi, setIptalIslemi] = useState(false);

  const [teslimEdilecek, setTeslimEdilecek] = useState<SiparisGosterim | null>(null);
  const [teslimIslemi, setTeslimIslemi] = useState(false);

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

  const siparisleriYukle = async (sessiz = false) => {
    if (sessiz) setYenileniyor(true);
    else setYukleniyor(true);
    try {
      const res = await fetch("/store/api/siparis");
      const d = await res.json();
      if (!res.ok) {
        hata(d.hata ?? "Siparişler yüklenemedi.", d.adim, d.detay);
        return;
      }
      setSiparisler(d.siparisler ?? []);
    } catch (err) {
      hata("Siparişler yüklenirken hata oluştu.", "fetch", String(err));
    } finally {
      if (sessiz) setYenileniyor(false);
      else setYukleniyor(false);
    }
  };

  useEffect(() => {
    if (!yetkiKontrolEdildi) return;
    siparisleriYukle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yetkiKontrolEdildi]);

  const handleIptalOnayla = async () => {
    if (!iptalEdilecek) return;
    setIptalIslemi(true);

    try {
      const res = await fetch("/store/api/siparis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siparis_id: iptalEdilecek.siparis_id,
          action: "iptal",
        }),
      });
      const d = await res.json();

      if (!res.ok) {
        hata(d.hata ?? "Sipariş iptal edilemedi.", d.adim, d.detay);
        setIptalIslemi(false);
        setIptalEdilecek(null);
        return;
      }

      basari("Siparişiniz iptal edildi ve puanınız iade edildi.");
      setIptalEdilecek(null);
      setIptalIslemi(false);
      hbstoreBakiyesiDegistiBildir();
      await siparisleriYukle(true);
    } catch (err) {
      hata("İptal sırasında hata oluştu.", "fetch", String(err));
      setIptalIslemi(false);
      setIptalEdilecek(null);
    }
  };

  const handleTeslimOnayla = async () => {
    if (!teslimEdilecek) return;
    setTeslimIslemi(true);

    try {
      const res = await fetch("/store/api/siparis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siparis_id: teslimEdilecek.siparis_id,
          action: "teslim_aldim",
        }),
      });
      const d = await res.json();

      if (!res.ok) {
        hata(d.hata ?? "İşlem tamamlanamadı.", d.adim, d.detay);
        setTeslimIslemi(false);
        setTeslimEdilecek(null);
        return;
      }

      basari("Sipariş teslim edildi olarak işaretlendi.");
      setTeslimEdilecek(null);
      setTeslimIslemi(false);
      await siparisleriYukle(true);
    } catch (err) {
      hata("İşlem sırasında hata oluştu.", "fetch", String(err));
      setTeslimIslemi(false);
      setTeslimEdilecek(null);
    }
  };

  const iptalEdilebilirMi = (s: SiparisGosterim) => {
    if (s.durum !== "beklemede") return false;
    const olusturmaZamani = new Date(s.created_at).getTime();
    const simdi = Date.now();
    const farkSaat = (simdi - olusturmaZamani) / (1000 * 60 * 60);
    return farkSaat <= IPTAL_SURE_SAATI;
  };

  const tarihFormatla = (dStr: string) => {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dStr));
  };

  const ozet = useMemo(() => {
    const bekleyen = siparisler.filter((s) => s.durum === "beklemede").length;
    const kargoda = siparisler.filter((s) => s.durum === "kargoda").length;
    const teslim = siparisler.filter((s) => s.durum === "teslim_edildi").length;
    return {
      toplam: siparisler.length,
      aktif: bekleyen + kargoda,
      teslim,
    };
  }, [siparisler]);

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
        <SayfaYenileBasligi className="flex flex-wrap items-end justify-between gap-4"
          baslik={<h1 className="text-2xl font-extrabold tracking-[-0.025em] text-[var(--tema-yerel-magaza-ana-metin-06)] md:text-[28px]">
            Siparişlerim
          </h1>}

          aciklama={<><p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[var(--tema-yerel-magaza-yardimci-metin-12)] md:text-sm">
            Verdiğiniz siparişlerin durumlarını, kargo takibini ve teslimat dökümünü inceleyin.
          </p></>}
          aksiyon={<YenileButonu
            yenileniyor={yenileniyor}
            onYenile={() => siparisleriYukle(true)}
            disabled={iptalIslemi || teslimIslemi}
          />}
          ekKontroller={<><div className="flex flex-wrap items-center gap-2">

            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <ShoppingBag size={14} /> HBStore&apos;a Dön
            </Link>
            <Link
              href="/store/adreslerim"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <MapPin size={14} /> Adreslerim
            </Link>
          </div></>}
        />

        <section aria-label="Sipariş Özeti" className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatKarti
            ikon={Package}
            etiket="Toplam Siparişim"
            deger={ozet.toplam}
            detay="HBStore'dan verilen tüm siparişler"
            renk="var(--tema-yerel-magaza-eylem-metin-01)"
            zemin="var(--tema-yerel-magaza-secim-zemin-04)"
          />
          <StatKarti
            ikon={Truck}
            etiket="Aktif Siparişler"
            deger={ozet.aktif}
            detay="Hazırlanan ve kargodaki gönderiler"
            renk="var(--tema-yerel-magaza-islevsel-metin-12)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-17)"
          />
          <StatKarti
            ikon={CheckCircle2}
            etiket="Teslim Edilenler"
            deger={ozet.teslim}
            detay="Başarıyla tamamlanan siparişler"
            renk="var(--tema-yerel-magaza-islevsel-metin-03)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-15)"
          />
        </section>

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
            <p className="mt-3 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-03)]">Sipariş geçmişi yükleniyor...</p>
          </div>
        ) : siparisler.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] py-16 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--tema-yerel-magaza-sayfa-zemini-06)] text-[var(--tema-yerel-magaza-yardimci-metin-01)]">
              <Package size={24} />
            </span>
            <h3 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Henüz siparişiniz yok</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
              HBStore&apos;dan puanlarınızla ürün seçip ilk siparişinizi hemen oluşturabilirsiniz.
            </p>
            <Link
              href="/store"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
            >
              HBStore&apos;a Git
            </Link>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            {siparisler.map((s) => {
              const durumStili = DURUM_RENKLERI[s.durum];
              const durumEtiketi = DURUM_ETIKETLERI[s.durum];
              const adres = s.adres_snapshot as AdresSnapshot;
              const urunAdi = s.store_urunler?.ad ?? "Ürün";
              const urunGorsel = s.store_urunler?.gorsel_url ?? null;
              const iptalUygun = iptalEdilebilirMi(s);
              const kargoUrl = kargoTakipUrl(s.kargo_firmasi, s.kargo_takip_no);

              return (
                <article
                  key={s.siparis_id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)] transition-all hover:border-[var(--tema-yerel-magaza-cizgi-08)]"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--tema-yerel-magaza-cizgi-13)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] p-1.5 sm:size-20">
                        {urunGorsel ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={urunGorsel} alt={urunAdi} className="h-full w-full object-contain" />
                        ) : (
                          <Package size={24} className="text-[var(--tema-yerel-magaza-yardimci-metin-05)]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <strong className="block text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)] md:text-base">
                          {urunAdi}
                        </strong>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-16)]">
                          <span>{s.adet} Adet</span>
                          <span>·</span>
                          <strong className="text-[var(--tema-yerel-magaza-islevsel-metin-03)]">
                            {s.toplam_puan.toLocaleString("tr-TR")} HapPuan
                          </strong>
                          <span>·</span>
                          <span>{tarihFormatla(s.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-extrabold shadow-sm"
                        style={{
                          color: durumStili.metin,
                          backgroundColor: durumStili.arka,
                          border: `1px solid ${durumStili.kenar}`,
                        }}
                      >
                        {durumEtiketi}
                      </span>
                    </div>
                  </div>

                  {s.durum === "kargoda" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--tema-yerel-magaza-cizgi-02)] bg-[var(--tema-yerel-magaza-sayfa-zemini-12)] px-4 py-3 md:px-5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--tema-yerel-magaza-islevsel-metin-13)]">
                        <Truck size={16} className="text-[var(--tema-yerel-magaza-islevsel-metin-12)]" />
                        <span>Kargo Firması: <strong>{s.kargo_firmasi}</strong></span>
                        {s.kargo_takip_no && (
                          <span>(Takip No: <strong>{s.kargo_takip_no}</strong>)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {kargoUrl && (
                          <a
                            href={kargoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--tema-yerel-magaza-eylem-metin-01)] hover:underline"
                          >
                            Kargo Takip <ExternalLink size={12} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setTeslimEdilecek(s)}
                          disabled={teslimIslemi}
                          className="rounded-xl bg-[var(--tema-yerel-magaza-islevsel-zemin-18)] px-3 py-1.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-islevsel-zemin-19)]"
                        >
                          Teslim Aldım ✓
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 border-t border-[var(--tema-yerel-magaza-cizgi-09)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between md:px-5">
                    <div className="flex items-start gap-2 text-[var(--tema-yerel-magaza-yardimci-metin-23)]">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--tema-yerel-magaza-yardimci-metin-24)]" />
                      <span>
                        <strong className="text-[var(--tema-yerel-magaza-ana-metin-01)]">{adres.baslik}:</strong> {adres.alici_adi} · {adres.telefon} — {adres.adres_detay} ({adres.ilce} / {adres.il})
                      </span>
                    </div>

                    {iptalUygun && (
                      <button
                        type="button"
                        onClick={() => setIptalEdilecek(s)}
                        disabled={iptalIslemi}
                        className="shrink-0 text-xs font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-04)] hover:underline"
                      >
                        Siparişi İptal Et
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {iptalEdilecek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--tema-yerel-magaza-ortu-01)]/50 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-islevsel-metin-04)]">
                <XCircle size={14} /> Sipariş İptali
              </div>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)]">
                Siparişi İptal Etmek İstiyor Musunuz?
              </h2>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[var(--tema-yerel-magaza-yardimci-metin-03)]">
              <strong className="text-[var(--tema-yerel-magaza-ana-metin-02)]">{iptalEdilecek.store_urunler?.ad}</strong> siparişiniz iptal edilecek ve harcanan{" "}
              <strong className="text-[var(--tema-yerel-magaza-islevsel-metin-03)]">{iptalEdilecek.toplam_puan.toLocaleString("tr-TR")} HapPuan</strong> bakiyenize anında iade edilecektir.
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIptalEdilecek(null)}
                disabled={iptalIslemi}
                className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-kart-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-10)] hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-02)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleIptalOnayla}
                disabled={iptalIslemi}
                className="rounded-xl bg-[var(--tema-yerel-magaza-islevsel-zemin-01)] px-5 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-islevsel-zemin-10)] disabled:opacity-50"
              >
                {iptalIslemi ? "İptal Ediliyor..." : "Siparişi İptal Et"}
              </button>
            </div>
          </div>
        </div>
      )}

      {teslimEdilecek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--tema-yerel-magaza-ortu-01)]/50 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] p-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-magaza-islevsel-metin-03)]">
                <CheckCircle2 size={14} /> Teslimat Onayı
              </div>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)]">
                Ürünü Teslim Aldığınızı Onaylıyor Musunuz?
              </h2>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[var(--tema-yerel-magaza-yardimci-metin-03)]">
              <strong className="text-[var(--tema-yerel-magaza-ana-metin-02)]">{teslimEdilecek.store_urunler?.ad}</strong> siparişiniz teslim edildi olarak kaydedilecektir.
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setTeslimEdilecek(null)}
                disabled={teslimIslemi}
                className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-03)] bg-[var(--tema-yerel-magaza-kart-01)] px-4 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-10)] hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-02)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleTeslimOnayla}
                disabled={teslimIslemi}
                className="rounded-xl bg-[var(--tema-yerel-magaza-islevsel-zemin-18)] px-5 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-islevsel-zemin-19)] disabled:opacity-50"
              >
                {teslimIslemi ? "İşleniyor..." : "Teslim Aldım"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
