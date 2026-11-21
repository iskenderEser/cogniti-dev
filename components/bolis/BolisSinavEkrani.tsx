"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Clock, Compass, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BOLIS_HEDEF_ROLLER,
  BOLIS_HEDEF_ROL_ETIKETLERI,
  BOLIS_RENGI,
  BOLIS_YAYIN_ARACI_ETIKETLERI,
  BOLIS_YUMUSAK_CIZGI,
  BOLIS_YUMUSAK_ZEMIN,
  type BolisHedefRol,
  type BolisKayitTipi,
  type BolisSecenek,
  type BolisYayinAraci,
} from "@/lib/bolis/tipler";

interface SinavMeta {
  sinav_id: string;
  erisim_kodu: string;
  baslik: string;
  aciklama: string;
  hedef_roller: BolisHedefRol[];
  yayin_araci: BolisYayinAraci;
  yayin_baslik: string | null;
  sure_dakika: number;
  baslangic_at: string | null;
  bitis_at: string | null;
  kayit_tipi: BolisKayitTipi;
  durum: string;
  soru_sayisi: number;
  maksimum_puan: number;
}

interface SinavSoru {
  soru_id: string;
  sira: number;
  soru_metni: string;
  secenekler: BolisSecenek[];
  puan: number;
}

interface OturumVerisi {
  oturum_id: string;
  katilimci_etiketi: string;
  durum: "devam" | "tamamlandi";
  bitis_siniri_at?: string;
  toplam_puan?: number;
  maksimum_puan?: number;
  dogru_sayisi?: number;
  yanlis_sayisi?: number;
  bos_sayisi?: number;
  teslim_at?: string | null;
}

const TARIH_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

function kalanSureBicimle(kalanSaniye: number): string {
  const s = Math.max(0, Math.floor(kalanSaniye));
  const sa = Math.floor(s / 3600);
  const dk = Math.floor((s % 3600) / 60);
  const sn = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return sa > 0 ? `${pad(sa)}:${pad(dk)}:${pad(sn)}` : `${pad(dk)}:${pad(sn)}`;
}

export default function BolisSinavEkrani({ kod }: { kod: string }) {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [sinav, setSinav] = useState<SinavMeta | null>(null);
  const [zaman, setZaman] = useState({ henuzBaslamadi: false, suresiDoldu: false });
  const [oturum, setOturum] = useState<OturumVerisi | null>(null);
  const [medyaUrl, setMedyaUrl] = useState<string | null>(null);
  const [sorular, setSorular] = useState<SinavSoru[]>([]);
  const [cevaplar, setCevaplar] = useState<Record<string, string>>({});
  const [kalanSaniye, setKalanSaniye] = useState<number | null>(null);
  const [baslatiliyor, setBaslatiliyor] = useState(false);
  const [teslimEdiliyor, setTeslimEdiliyor] = useState(false);
  const [teslimOnayAcik, setTeslimOnayAcik] = useState(false);

  // Kayıt formu alanları
  const [ad, setAd] = useState("");
  const [soyad, setSoyad] = useState("");
  const [eposta, setEposta] = useState("");
  const [telefon, setTelefon] = useState("");
  const [rolGrubu, setRolGrubu] = useState<BolisHedefRol>("utt");
  const [takimAdi, setTakimAdi] = useState("");
  const [bolgeAdi, setBolgeAdi] = useState("");
  const [eczaneAdi, setEczaneAdi] = useState("");

  const otomatikTeslimTetiklendi = useRef(false);

  useEffect(() => {
    let aktif = true;
    setYukleniyor(true);
    setHata("");
    void fetch(`/api/bolis-sinav/${encodeURIComponent(kod)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!aktif) return;
        if (!r.ok) {
          setHata(d.hata ?? "Sınav yüklenemedi.");
          return;
        }
        setSinav(d.sinav);
        setZaman(d.zaman ?? { henuzBaslamadi: false, suresiDoldu: false });
        if (d.sinav?.hedef_roller?.length > 0) {
          setRolGrubu(d.sinav.hedef_roller[0]);
        }
        if (d.oturum) setOturum(d.oturum);
        if (d.medya_url) setMedyaUrl(d.medya_url);
        if (Array.isArray(d.sorular)) setSorular(d.sorular);
      })
      .catch(() => {
        if (aktif) setHata("Sınav yüklenemedi.");
      })
      .finally(() => {
        if (aktif) setYukleniyor(false);
      });
    return () => {
      aktif = false;
    };
  }, [kod]);

  const teslimEt = useCallback(async () => {
    if (!oturum || oturum.durum === "tamamlandi" || teslimEdiliyor) return;
    setTeslimEdiliyor(true);
    setHata("");
    try {
      const r = await fetch(`/api/bolis-sinav/${encodeURIComponent(kod)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          islem: "teslim",
          oturum_id: oturum.oturum_id,
          cevaplar,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.oturum) {
        setHata(d.hata ?? "Sınav teslim edilemedi.");
        return;
      }
      setOturum(d.oturum);
      setTeslimOnayAcik(false);
    } catch {
      setHata("Sınav teslim edilemedi.");
    } finally {
      setTeslimEdiliyor(false);
    }
  }, [kod, oturum, cevaplar, teslimEdiliyor]);

  // Canlı geri sayım sayacı
  useEffect(() => {
    if (!oturum || oturum.durum !== "devam" || !oturum.bitis_siniri_at) return;
    const bitisMs = Date.parse(oturum.bitis_siniri_at);
    if (!Number.isFinite(bitisMs)) return;

    const guncelle = () => {
      const kalan = Math.max(0, Math.ceil((bitisMs - Date.now()) / 1000));
      setKalanSaniye(kalan);
      if (kalan <= 0 && !otomatikTeslimTetiklendi.current) {
        otomatikTeslimTetiklendi.current = true;
        void teslimEt();
      }
    };

    guncelle();
    const id = window.setInterval(guncelle, 1000);
    return () => window.clearInterval(id);
  }, [oturum, teslimEt]);

  const baslat = async () => {
    if (!sinav) return;
    setBaslatiliyor(true);
    setHata("");
    try {
      const payload: Record<string, unknown> = { islem: "baslat" };
      if (sinav.kayit_tipi === "hazir_liste") {
        payload.eposta = eposta;
        payload.telefon = telefon;
      } else if (sinav.kayit_tipi === "kendi_kaydi") {
        payload.ad = ad;
        payload.soyad = soyad;
        payload.eposta = eposta;
        payload.telefon = telefon;
        payload.rol_grubu = rolGrubu;
        if (rolGrubu === "utt" || rolGrubu === "bm") {
          payload.takim_adi = takimAdi;
          payload.bolge_adi = bolgeAdi;
        } else if (rolGrubu === "eczaci" || rolGrubu === "eczane_teknisyeni") {
          payload.eczane_adi = eczaneAdi;
        }
      }

      const r = await fetch(`/api/bolis-sinav/${encodeURIComponent(kod)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok || !d.oturum) {
        setHata(d.hata ?? "Sınava giriş yapılamadı.");
        return;
      }
      setOturum(d.oturum);
      setMedyaUrl(d.medya_url ?? null);
      setSorular(Array.isArray(d.sorular) ? d.sorular : []);
    } catch {
      setHata("Sınava giriş yapılamadı.");
    } finally {
      setBaslatiliyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-sm text-[var(--tema-ikincil-metin)]">
        BOLIS sınavı yükleniyor…
      </main>
    );
  }

  if (!sinav) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 text-center shadow-sm">
          <p role="alert" className="m-0 text-sm font-semibold text-red-700">
            {hata || "Sınav bulunamadı."}
          </p>
        </div>
      </main>
    );
  }

  // ─── 1. ANLIK SONUÇ EKRANI ───
  if (oturum && oturum.durum === "tamamlandi") {
    const maks = Number(oturum.maksimum_puan ?? sinav.maksimum_puan ?? 0);
    const toplam = Number(oturum.toplam_puan ?? 0);
    const basariYuzdesi = maks > 0 ? Math.round((toplam / maks) * 100) : 0;

    return (
      <main className="min-h-screen bg-[var(--tema-zemin)] px-4 py-8">
        <div className="mx-auto max-w-xl space-y-5">
          <div className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 text-center shadow-sm">
            <span
              className="inline-flex h-[22px] items-center gap-1 rounded-full border px-2.5 text-[10.5px] leading-none font-semibold tracking-wider"
              style={{
                backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                borderColor: BOLIS_YUMUSAK_CIZGI,
                color: BOLIS_RENGI,
              }}
            >
              <Compass size={11} />
              BOLIS SONUÇ
            </span>
            <h1 className="m-0 mt-3 text-xl font-semibold text-[var(--tema-baslik)]">
              {sinav.baslik}
            </h1>
            <p className="m-0 mt-1 text-xs text-[var(--tema-ikincil-metin)]">
              Katılımcı: <strong className="text-[var(--tema-baslik)]">{oturum.katilimci_etiketi}</strong>
            </p>

            <div className="mt-5 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-5">
              <div className="text-xs font-medium text-[var(--tema-ikincil-metin)]">
                Toplam Puanınız
              </div>
              <div className="mt-1 text-3xl font-bold" style={{ color: BOLIS_RENGI }}>
                {toplam.toLocaleString("tr-TR")}{" "}
                <span className="text-base font-medium text-[var(--tema-ikincil-metin)]">
                  / {maks.toLocaleString("tr-TR")}
                </span>
              </div>
              <div className="mt-1 text-xs font-semibold text-emerald-700">
                Başarı Oranı: %{basariYuzdesi}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-[11px] font-medium text-emerald-800">Doğru</div>
                <div className="mt-0.5 text-lg font-bold text-emerald-700">
                  {oturum.dogru_sayisi ?? 0}
                </div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="text-[11px] font-medium text-red-800">Yanlış</div>
                <div className="mt-0.5 text-lg font-bold text-red-700">
                  {oturum.yanlis_sayisi ?? 0}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3">
                <div className="text-[11px] font-medium text-[var(--tema-ikincil-metin)]">Boş</div>
                <div className="mt-0.5 text-lg font-bold text-[var(--tema-baslik)]">
                  {oturum.bos_sayisi ?? 0}
                </div>
              </div>
            </div>

            <p className="m-0 mt-5 text-[11px] text-[var(--tema-ikincil-metin)]">
              Sınav sonucunuz kaydedildi. Bu sınava giriş hakkınız tamamlanmıştır.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ─── 2. AKTİF SINAV EKRANI (YUKARIDAN AŞAĞIYA: YAYIN + SORULAR) ───
  if (oturum && oturum.durum === "devam") {
    const cevaplananSayisi = Object.values(cevaplar).filter(Boolean).length;
    const sonDakika = kalanSaniye !== null && kalanSaniye <= 60;

    return (
      <main className="min-h-screen bg-[var(--tema-zemin)] pb-12">
        {/* Sabit Üst Sayaç Çubuğu */}
        <header className="sticky top-0 z-40 border-b border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-[20px] items-center gap-1 rounded-full border px-2 text-[10px] leading-none font-semibold"
                  style={{
                    backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                    borderColor: BOLIS_YUMUSAK_CIZGI,
                    color: BOLIS_RENGI,
                  }}
                >
                  BOLIS
                </span>
                <h1 className="m-0 truncate text-sm font-semibold text-[var(--tema-baslik)]">
                  {sinav.baslik}
                </h1>
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--tema-ikincil-metin)]">
                {oturum.katilimci_etiketi} · Cevaplanan: {cevaplananSayisi} / {sorular.length}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {kalanSaniye !== null && (
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                    sonDakika
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-baslik)]"
                  }`}
                >
                  <Clock size={13} aria-hidden="true" />
                  {kalanSureBicimle(kalanSaniye)}
                </div>
              )}
              <Button
                type="button"
                size="sm"
                disabled={teslimEdiliyor}
                onClick={() => setTeslimOnayAcik(true)}
                className="gap-1.5 text-white"
                style={{ backgroundColor: BOLIS_RENGI }}
              >
                <Send size={13} aria-hidden="true" />
                Sınavı Bitir
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-5 px-4 pt-5">
          {hata && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {hata}
            </p>
          )}

          {/* Üst Yayın Alanı */}
          {sinav.yayin_araci !== "yayin_yok" && medyaUrl && (
            <section className="overflow-hidden rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-4 shadow-sm">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--tema-baslik)]">
                  {sinav.yayin_baslik || BOLIS_YAYIN_ARACI_ETIKETLERI[sinav.yayin_araci]}
                </span>
                <span className="text-[11px] text-[var(--tema-ikincil-metin)]">
                  {BOLIS_YAYIN_ARACI_ETIKETLERI[sinav.yayin_araci]}
                </span>
              </div>

              {sinav.yayin_araci === "video" && (
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                  <iframe
                    src={medyaUrl}
                    title={sinav.yayin_baslik || sinav.baslik}
                    className="h-full w-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {sinav.yayin_araci === "podcast" && (
                <audio controls src={medyaUrl} className="w-full" />
              )}

              {sinav.yayin_araci === "gorsel" && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={medyaUrl}
                  alt={sinav.yayin_baslik || sinav.baslik}
                  className="mx-auto max-h-[520px] w-auto max-w-full rounded-xl object-contain"
                />
              )}

              {sinav.yayin_araci === "flip_pdf" && (
                <iframe
                  src={medyaUrl}
                  title={sinav.yayin_baslik || "PDF"}
                  className="h-[520px] w-full rounded-xl border border-[var(--tema-cizgi)]"
                />
              )}
            </section>
          )}

          {/* Sorular Listesi */}
          <div className="space-y-4">
            {sorular.map((s) => {
              const secilen = cevaplar[s.soru_id] ?? "";
              return (
                <article
                  key={s.soru_id}
                  className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className="inline-flex h-[22px] items-center rounded-full border px-2 text-[10.5px] leading-none font-semibold"
                      style={{
                        backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                        borderColor: BOLIS_YUMUSAK_CIZGI,
                        color: BOLIS_RENGI,
                      }}
                    >
                      Soru {s.sira}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--tema-ikincil-metin)]">
                      {s.puan} puan
                    </span>
                  </div>

                  <p className="m-0 mb-3.5 whitespace-pre-wrap text-sm font-medium leading-relaxed text-[var(--tema-baslik)]">
                    {s.soru_metni}
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {s.secenekler.map((opt) => {
                      const aktif = secilen === opt.anahtar;
                      return (
                        <button
                          key={opt.anahtar}
                          type="button"
                          aria-pressed={aktif}
                          onClick={() =>
                            setCevaplar((onceki) => ({ ...onceki, [s.soru_id]: opt.anahtar }))
                          }
                          className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                            aktif
                              ? "font-semibold"
                              : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)] hover:bg-[var(--tema-kontrol-hover)]"
                          }`}
                          style={
                            aktif
                              ? {
                                  backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                                  borderColor: BOLIS_YUMUSAK_CIZGI,
                                  color: BOLIS_RENGI,
                                }
                              : undefined
                          }
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                              aktif
                                ? "border-transparent text-white"
                                : "border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] text-[var(--tema-metin)]"
                            }`}
                            style={aktif ? { backgroundColor: BOLIS_RENGI } : undefined}
                          >
                            {aktif ? <CheckCircle2 size={13} /> : opt.anahtar}
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">{opt.metin}</span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              disabled={teslimEdiliyor}
              onClick={() => setTeslimOnayAcik(true)}
              className="gap-1.5 text-white"
              style={{ backgroundColor: BOLIS_RENGI }}
            >
              <Send size={14} aria-hidden="true" />
              Sınavı Bitir ve Sonucu Gör
            </Button>
          </div>
        </div>

        <AlertDialog open={teslimOnayAcik} onOpenChange={setTeslimOnayAcik}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sınavı Tamamla</AlertDialogTitle>
              <AlertDialogDescription>
                Toplam {sorular.length} sorudan {cevaplananSayisi} tanesini cevapladınız. Sınavı
                bitirdiğinizde cevaplarınız kaydedilir ve sonucunuz hemen gösterilir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={teslimEdiliyor}>Sınava Dön</AlertDialogCancel>
              <AlertDialogAction
                disabled={teslimEdiliyor}
                onClick={() => void teslimEt()}
                className="text-white"
                style={{ backgroundColor: BOLIS_RENGI }}
              >
                {teslimEdiliyor ? "Gönderiliyor..." : "Evet, Bitir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    );
  }

  // ─── 3. SINAV GİRİŞ / KAYIT EKRANI ───
  const girisKapali = sinav.durum !== "yayinda" || zaman.henuzBaslamadi || zaman.suresiDoldu;

  return (
    <main className="min-h-screen bg-[var(--tema-zemin)] px-4 py-8">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span
              className="inline-flex h-[22px] items-center gap-1 rounded-full border px-2.5 text-[10.5px] leading-none font-semibold tracking-wider"
              style={{
                backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                borderColor: BOLIS_YUMUSAK_CIZGI,
                color: BOLIS_RENGI,
              }}
            >
              <Compass size={11} />
              BOLIS
            </span>
            <span className="text-[11px] font-medium text-[var(--tema-ikincil-metin)]">
              {sinav.soru_sayisi} Soru · {sinav.sure_dakika} dk
            </span>
          </div>

          <h1 className="m-0 mt-3 text-xl font-semibold text-[var(--tema-baslik)]">
            {sinav.baslik}
          </h1>
          {sinav.aciklama && (
            <p className="m-0 mt-1.5 text-xs leading-relaxed text-[var(--tema-ikincil-metin)]">
              {sinav.aciklama}
            </p>
          )}

          {sinav.baslangic_at && sinav.bitis_at && (
            <div className="mt-3 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-3 py-2 text-[11px] text-[var(--tema-ikincil-metin)]">
              <strong>Sınav Zamanı:</strong>{" "}
              {TARIH_SAAT_BICIMI.format(new Date(sinav.baslangic_at))} –{" "}
              {TARIH_SAAT_BICIMI.format(new Date(sinav.bitis_at))}
            </div>
          )}

          {hata && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
              {hata}
            </p>
          )}

          {girisKapali ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
              {sinav.durum !== "yayinda"
                ? "Bu sınav şu an katılıma kapalıdır."
                : zaman.henuzBaslamadi
                  ? "Sınav başlangıç saati henüz gelmedi. Belirtilen saatte sayfayı yenileyin."
                  : "Bu sınavın süresi dolmuştur."}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-4 border-t border-[var(--tema-cizgi)] pt-4">
              {sinav.kayit_tipi === "hazir_liste" && (
                <div className="space-y-3">
                  <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
                    Davetli listedeki kaydınızı doğrulamak için e-posta veya telefon numaranızı girin.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input
                      type="email"
                      placeholder="E-posta adresiniz"
                      value={eposta}
                      onChange={(e) => setEposta(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                    />
                    <input
                      type="tel"
                      placeholder="Telefon numaranız"
                      value={telefon}
                      onChange={(e) => setTelefon(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                    />
                  </div>
                </div>
              )}

              {sinav.kayit_tipi === "kendi_kaydi" && (
                <div className="space-y-3">
                  <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
                    Sınava başlamadan önce bilgilerinizi doldurun (giriş hakkı tek seferdir).
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Ad *"
                      value={ad}
                      onChange={(e) => setAd(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                    />
                    <input
                      type="text"
                      placeholder="Soyad *"
                      value={soyad}
                      onChange={(e) => setSoyad(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                    />
                    <input
                      type="tel"
                      placeholder="Telefon *"
                      value={telefon}
                      onChange={(e) => setTelefon(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                    />
                    <input
                      type="email"
                      placeholder="E-posta *"
                      value={eposta}
                      onChange={(e) => setEposta(e.target.value)}
                      className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <select
                      aria-label="Katılımcı rolü"
                      value={rolGrubu}
                      onChange={(e) => setRolGrubu(e.target.value as BolisHedefRol)}
                      className="h-9 w-full appearance-none rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] pl-3 pr-8 text-xs text-[var(--tema-metin)] cursor-pointer"
                    >
                      {(sinav.hedef_roller.length > 0 ? sinav.hedef_roller : BOLIS_HEDEF_ROLLER).map(
                        (r) => (
                          <option key={r} value={r}>
                            {BOLIS_HEDEF_ROL_ETIKETLERI[r]}
                          </option>
                        ),
                      )}
                    </select>
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-2.5 text-[var(--tema-ikincil-metin)]"
                    />
                  </div>

                  {(rolGrubu === "utt" || rolGrubu === "bm") && (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Takım Adı *"
                        value={takimAdi}
                        onChange={(e) => setTakimAdi(e.target.value)}
                        className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                      />
                      <input
                        type="text"
                        placeholder="Bölge Adı *"
                        value={bolgeAdi}
                        onChange={(e) => setBolgeAdi(e.target.value)}
                        className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                      />
                    </div>
                  )}

                  {(rolGrubu === "eczaci" || rolGrubu === "eczane_teknisyeni") && (
                    <input
                      type="text"
                      placeholder="Eczane Adı *"
                      value={eczaneAdi}
                      onChange={(e) => setEczaneAdi(e.target.value)}
                      className="h-9 w-full rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
                    />
                  )}
                </div>
              )}

              {sinav.kayit_tipi === "anonim" && (
                <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
                  Bu sınav kimlik bilgisi istemeden yanıtlanır. Sonucunuz anonim katılımcı numarasıyla
                  kaydedilir (giriş hakkı tek seferdir).
                </p>
              )}

              <Button
                type="button"
                disabled={baslatiliyor}
                onClick={() => void baslat()}
                className="w-full text-white"
                style={{ backgroundColor: BOLIS_RENGI }}
              >
                {baslatiliyor ? "Sınav Hazırlanıyor..." : "Sınava Başla"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
