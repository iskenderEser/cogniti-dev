// app/(panel)/store/siparislerim/page.tsx
//
// Kullanıcının kendi sipariş geçmişi. UTT/KD_UTT/BM görür.
// Genel site dokusuna (1480px, Nunito, kurumsal stat kartları) uygun olarak modernize edilmiştir.

"use client";

import { panelBaslangici } from "@/lib/panel/baslangic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  Clock3,
  XCircle,
} from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { STORE_ALABILEN_ROLLER } from "@/lib/utils/roller";
import { useAuth } from "@/app/providers/AuthProvider";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { DURUM_ETIKETLERI, DURUM_RENKLERI } from "@/lib/tclub/store/sabitler";
import type { SiparisGosterim } from "@/lib/tclub/store/tipler";
import { hbstoreBakiyesiDegistiBildir } from "@/lib/tclub/store/olay";
import { useStoreSunucuSaati } from "@/hooks/useStoreSunucuSaati";
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
  const iptalKilidi = useRef(false);
  const { simdi: sunucuSimdi, ayarla: sunucuSaatiniAyarla } = useStoreSunucuSaati();

  const [talepFiltresi, setTalepFiltresi] = useState("tumu");

  const { mesajlar, hata, basari } = useHataMesaji();

  useEffect(() => {
    if (authYukleniyor) return;

    if (!kullanici) {
      router.push("/login");
      return;
    }

    const r = kullanici.rol.toLowerCase();
    if (!STORE_ALABILEN_ROLLER.includes(r)) {
      router.push(panelBaslangici(kullanici.rol).yol);
      return;
    }

    setYetkiKontrolEdildi(true);
  }, [kullanici, authYukleniyor, router]);

  const siparisleriYukle = useCallback(async (sessiz = false) => {
    if (sessiz) setYenileniyor(true);
    else setYukleniyor(true);
    try {
      const res = await fetch("/store/api/siparis", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        hata(d.hata ?? "Talepler yüklenemedi.", d.adim, d.detay);
        return;
      }
      if (!Array.isArray(d.siparisler) || !sunucuSaatiniAyarla(d.sunucu_zamani)) {
        hata("Talep ve sunucu saati bilgileri alınamadı."); return;
      }
      setSiparisler(d.siparisler);
    } catch (err) {
      hata("Talepler yüklenirken hata oluştu.", "fetch", String(err));
    } finally {
      if (sessiz) setYenileniyor(false);
      else setYukleniyor(false);
    }
  }, [hata, sunucuSaatiniAyarla]);

  useEffect(() => {
    if (!yetkiKontrolEdildi) return;
    void siparisleriYukle();
    const yenile = () => { if (document.visibilityState === "visible") void siparisleriYukle(true); };
    const timer = window.setInterval(yenile, 30_000);
    window.addEventListener("focus", yenile);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", yenile); };
  }, [yetkiKontrolEdildi, siparisleriYukle]);

  const handleIptalOnayla = async () => {
    if (!iptalEdilecek || iptalKilidi.current) return;
    if (!iptalEdilebilirMi(iptalEdilecek)) { hata("12 saatlik iptal süresi doldu; talep admin işlemine aktarıldı."); setIptalEdilecek(null); return; }
    iptalKilidi.current = true;
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
        hata(d.hata ?? "Talep iptal edilemedi.", d.adim, d.detay);
        setIptalIslemi(false);
        setIptalEdilecek(null);
        return;
      }

      basari("Talebiniz iptal edildi ve puanınız iade edildi.");
      setIptalEdilecek(null);
      setIptalIslemi(false);
      hbstoreBakiyesiDegistiBildir();
      await siparisleriYukle(true);
    } catch (err) {
      hata("İptal sırasında hata oluştu.", "fetch", String(err));
      setIptalIslemi(false);
      setIptalEdilecek(null);
    } finally { iptalKilidi.current = false; }
  };

  const iptalEdilebilirMi = (s: SiparisGosterim) => s.durum === "beklemede"
    && s.iptal_edilebilir === true && !!s.iptal_son_at && sunucuSimdi !== null
    && sunucuSimdi < Date.parse(s.iptal_son_at);

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
    const kargoda = siparisler.filter((s) => ["hazirlaniyor", "kargoda"].includes(s.durum)).length;
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
            Taleplerim
          </h1>}

          aciklama={<><p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-[var(--tema-yerel-magaza-yardimci-metin-12)] md:text-sm">
            İlettiğiniz çek taleplerinin durumlarını ve teslimat bilgilerini inceleyin.
          </p></>}
          aksiyon={<YenileButonu
            yenileniyor={yenileniyor}
            onYenile={() => siparisleriYukle(true)}
            disabled={iptalIslemi}
          />}
          ekKontroller={<><div className="flex flex-wrap items-center gap-2">

            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-3.5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] shadow-sm transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)]"
            >
              <ShoppingBag size={14} /> FirmaStore&apos;a Dön
            </Link>
          </div></>}
        />

        <section aria-label="Talep Özeti" className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatKarti
            ikon={Package}
            etiket="Toplam Talebim"
            deger={ozet.toplam}
            detay="FirmaStore'dan iletilen tüm talepler"
            renk="var(--tema-yerel-magaza-eylem-metin-01)"
            zemin="var(--tema-yerel-magaza-secim-zemin-04)"
          />
          <StatKarti
            ikon={Clock3}
            etiket="Aktif Talepler"
            deger={ozet.aktif}
            detay="Hazırlıkları devam eden talepler"
            renk="var(--tema-yerel-magaza-islevsel-metin-12)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-17)"
          />
          <StatKarti
            ikon={CheckCircle2}
            etiket="Tamamlanan Talepler"
            deger={ozet.teslim}
            detay="Başarıyla tamamlanan talepler"
            renk="var(--tema-yerel-magaza-islevsel-metin-03)"
            zemin="var(--tema-yerel-magaza-islevsel-zemin-15)"
          />
        </section>

        <div role="group" aria-label="Talep durumu filtreleri" className="flex flex-wrap gap-2">{[["tumu","Tümü"],["aktif","Devam eden"],["teslim_edildi","Tamamlanan Talepler"],["iptal","İptal edilen"]].map(([k,v])=><button key={k} type="button" aria-pressed={talepFiltresi===k} onClick={()=>setTalepFiltresi(k)} className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-01)] px-3 py-2 text-xs font-bold aria-pressed:bg-[var(--tema-yerel-magaza-secim-zemin-04)]">{v}</button>)}</div>
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
            <p className="mt-3 text-xs font-extrabold text-[var(--tema-yerel-magaza-yardimci-metin-03)]">Talep geçmişi yükleniyor...</p>
          </div>
        ) : siparisler.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] py-16 text-center shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--tema-yerel-magaza-sayfa-zemini-06)] text-[var(--tema-yerel-magaza-yardimci-metin-01)]">
              <Package size={24} />
            </span>
            <h3 className="mt-3 text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Henüz talebiniz yok</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold text-[var(--tema-yerel-magaza-yardimci-metin-08)]">
              FirmaStore&apos;dan puanlarınızla çek seçip ilk talebinizi oluşturabilirsiniz.
            </p>
            <Link
              href="/store"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--tema-yerel-magaza-eylem-zemin-01)] px-4 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-eylem-zemin-02)]"
            >
              FirmaStore&apos;a Git
            </Link>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            {!siparisler.some(s => talepFiltresi === "tumu" || (talepFiltresi === "aktif" ? ["beklemede","hazirlaniyor","kargoda"].includes(s.durum) : s.durum === talepFiltresi)) && <p className="py-8 text-center text-sm">Bu durumda talebiniz bulunmuyor.</p>}
            {siparisler.filter(s => talepFiltresi === "tumu" || (talepFiltresi === "aktif" ? ["beklemede","hazirlaniyor","kargoda"].includes(s.durum) : s.durum === talepFiltresi)).map((s) => {
              const durumStili = DURUM_RENKLERI[s.durum];

              const urunAdi = s.store_urunler?.ad ?? "Ürün";
              const urunGorsel = s.store_urunler?.gorsel_url ?? null;
              const iptalUygun = iptalEdilebilirMi(s);
              const durumEtiketi = s.durum === "beklemede" ? (iptalUygun ? "İptal süresinde" : "Admin işleminde") : DURUM_ETIKETLERI[s.durum];

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
                          {s.toplam_tl != null && <><span>{s.toplam_tl.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL</span><span>·</span></>}
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

                  {s.durum === "teslim_edildi" && s.teslimler?.length ? <div className="space-y-3 border-t border-[var(--tema-yerel-magaza-cizgi-02)] px-4 py-3">
                    <h3 className="text-sm font-extrabold">Hediye çekleriniz</h3>
                    {s.teslimler.map((t,i)=><div key={i} className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-02)] p-3 text-sm"><span>Çek kodu: </span><strong className="select-all break-all font-mono">{t.cek_kodu}</strong>{t.kullanim_linki&&<p className="mt-2"><a className="font-bold underline" href={t.kullanim_linki} target="_blank" rel="noopener noreferrer">Kullanım bağlantısını aç ↗</a></p>}</div>)}
                  </div> : null}

                  <div className="flex flex-col gap-2 border-t border-[var(--tema-yerel-magaza-cizgi-09)] bg-[var(--tema-yerel-magaza-sayfa-zemini-02)] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between md:px-5">
                    {s.durum === "iptal" && s.admin_aktarildi === false && <p className="font-semibold">Talebiniz iptal edildi; admine aktarılmadı.</p>}
                    {s.durum === "beklemede" && <p className="font-semibold">
                      {iptalUygun ? `Talebiniz henüz admine aktarılmadı. ${s.iptal_son_at ? tarihFormatla(s.iptal_son_at) : ""} tarihine kadar iptal edebilirsiniz.` : "12 saatlik iptal süresi doldu; talebiniz admin işlemine aktarıldı."}
                    </p>}
                    {iptalUygun && (
                      <button
                        type="button"
                        onClick={() => setIptalEdilecek(s)}
                        disabled={iptalIslemi}
                        className="shrink-0 text-xs font-extrabold text-[var(--tema-yerel-magaza-islevsel-metin-04)] hover:underline"
                      >
                        Talebi İptal Et
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
                <XCircle size={14} /> Talep İptali
              </div>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--tema-yerel-magaza-ana-metin-02)]">
                Talebi İptal Etmek İstiyor Musunuz?
              </h2>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[var(--tema-yerel-magaza-yardimci-metin-03)]">
              <strong className="text-[var(--tema-yerel-magaza-ana-metin-02)]">{iptalEdilecek.store_urunler?.ad}</strong> talebiniz iptal edilecek ve harcanan{" "}
              <strong className="text-[var(--tema-yerel-magaza-islevsel-metin-03)]">{iptalEdilecek.toplam_puan.toLocaleString("tr-TR")} HapPuan</strong> bakiyenize anında iade edilecektir.
            </p>

            {!iptalEdilebilirMi(iptalEdilecek) && <p role="alert" className="text-sm font-semibold">12 saatlik iptal süresi doldu; talebiniz admin işlemine aktarıldı.</p>}
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
                disabled={iptalIslemi || !iptalEdilebilirMi(iptalEdilecek)}
                className="rounded-xl bg-[var(--tema-yerel-magaza-islevsel-zemin-01)] px-5 py-2.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-ters-metin-01)] shadow-sm hover:bg-[var(--tema-yerel-magaza-islevsel-zemin-10)] disabled:opacity-50"
              >
                {iptalIslemi ? "İptal Ediliyor..." : "Talebi İptal Et"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
