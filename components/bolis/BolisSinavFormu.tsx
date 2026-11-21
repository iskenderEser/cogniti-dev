"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Compass, Save, Send, Trash2 } from "lucide-react";
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
  BOLIS_KAYIT_TIPLERI,
  BOLIS_KAYIT_TIPI_ETIKETLERI,
  BOLIS_RENGI,
  BOLIS_YAYIN_ARACLARI,
  BOLIS_YAYIN_ARACI_ETIKETLERI,
  BOLIS_YUMUSAK_CIZGI,
  BOLIS_YUMUSAK_ZEMIN,
  type BolisHedefRol,
  type BolisKayitTipi,
  type BolisSinavDurumu,
  type BolisYayinAraci,
} from "@/lib/bolis/tipler";
import { BolisDavetliAlani, type BolisDavetliSatiri } from "./BolisDavetliAlani";
import { BolisMedyaYukleyici } from "./BolisMedyaYukleyici";
import {
  BolisSoruEditoru,
  yeniSoruTaslagiOlustur,
  type BolisSoruTaslagi,
} from "./BolisSoruEditoru";
import type { BolisYayinKaynagi } from "@/app/(panel)/bolis/api/kaynaklar/route";

const TR_TARIH_BICIMI = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const TR_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function isoToTrTarih(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : TR_TARIH_BICIMI.format(d);
}

function isoToTrSaat(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : TR_SAAT_BICIMI.format(d);
}

export default function BolisSinavFormu({ sinavId }: { sinavId?: string }) {
  const router = useRouter();
  const duzenlemeModu = Boolean(sinavId);

  const [yukleniyor, setYukleniyor] = useState(duzenlemeModu);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);
  const [silOnayAcik, setSilOnayAcik] = useState(false);
  const [katilimBasladiMi, setKatilimBasladiMi] = useState(false);
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");

  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [hedefRoller, setHedefRoller] = useState<BolisHedefRol[]>(["utt"]);
  const [yayinAraci, setYayinAraci] = useState<BolisYayinAraci>("yayin_yok");
  const [yayinVideoGuid, setYayinVideoGuid] = useState("");
  const [yayinDosyaYolu, setYayinDosyaYolu] = useState("");
  const [yayinBaslik, setYayinBaslik] = useState("");
  const [kaynaklar, setKaynaklar] = useState<BolisYayinKaynagi[]>([]);
  const [kaynakYukleniyor, setKaynakYukleniyor] = useState(false);

  const [sinavTarihi, setSinavTarihi] = useState("");
  const [baslangicSaati, setBaslangicSaati] = useState("10:00");
  const [bitisSaati, setBitisSaati] = useState("10:30");
  const [kayitTipi, setKayitTipi] = useState<BolisKayitTipi>("kendi_kaydi");
  const [davetliler, setDavetliler] = useState<BolisDavetliSatiri[]>([]);
  const [sorular, setSorular] = useState<BolisSoruTaslagi[]>(() => [yeniSoruTaslagiOlustur(1)]);

  // Düzenleme modunda mevcut sınavı yükle
  useEffect(() => {
    if (!sinavId) return;
    let aktif = true;
    setYukleniyor(true);
    void fetch(`/bolis/api/${sinavId}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!aktif) return;
        if (!r.ok) {
          setHata(d.hata ?? "Sınav bilgileri okunamadı.");
          return;
        }
        const s = d.sinav;
        setBaslik(s.baslik ?? "");
        setAciklama(s.aciklama ?? "");
        setHedefRoller(Array.isArray(s.hedef_roller) ? s.hedef_roller : ["utt"]);
        setYayinAraci(s.yayin_araci === "viva" ? "yayin_yok" : (s.yayin_araci ?? "yayin_yok"));
        setYayinVideoGuid(s.yayin_video_guid ?? "");
        setYayinDosyaYolu(s.yayin_dosya_yolu ?? "");
        setYayinBaslik(s.yayin_baslik ?? "");
        setSinavTarihi(isoToTrTarih(s.baslangic_at));
        setBaslangicSaati(isoToTrSaat(s.baslangic_at) || "10:00");
        setBitisSaati(isoToTrSaat(s.bitis_at) || "10:30");
        setKayitTipi(s.kayit_tipi ?? "kendi_kaydi");
        setKatilimBasladiMi(Boolean(d.katilimBasladiMi));

        if (Array.isArray(d.sorular) && d.sorular.length > 0) {
          setSorular(
            d.sorular.map((q: Record<string, unknown>, i: number) => ({
              id: (q.soru_id as string) || `soru-${i}`,
              soru_metni: (q.soru_metni as string) ?? "",
              secenekler: Array.isArray(q.secenekler) ? q.secenekler : [],
              dogru_secenek: (q.dogru_secenek as string) ?? "A",
              puan: Number(q.puan) || 10,
            })),
          );
        } else {
          setSorular([]);
        }

        if (Array.isArray(d.davetliler)) {
          setDavetliler(
            d.davetliler.map((k: Record<string, unknown>) => ({
              ad: (k.ad as string) ?? "",
              soyad: (k.soyad as string) ?? "",
              eposta: (k.eposta as string) ?? "",
              telefon: (k.telefon as string) ?? "",
              rol_grubu: ((k.rol_grubu as BolisHedefRol | null) ?? "") as BolisHedefRol | "",
              takim_adi: (k.takim_adi as string) ?? "",
              bolge_adi: (k.bolge_adi as string) ?? "",
              eczane_adi: (k.eczane_adi as string) ?? "",
            })),
          );
        }
      })
      .catch(() => {
        if (aktif) setHata("Sınav bilgileri okunamadı.");
      })
      .finally(() => {
        if (aktif) setYukleniyor(false);
      });
    return () => {
      aktif = false;
    };
  }, [sinavId]);

  // Seçilen yayın aracına göre firmanın mevcut kaynaklarını çek
  useEffect(() => {
    if (yayinAraci === "yayin_yok") {
      setKaynaklar([]);
      return;
    }
    let aktif = true;
    setKaynakYukleniyor(true);
    void fetch(`/bolis/api/kaynaklar?arac=${encodeURIComponent(yayinAraci)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (aktif && r.ok) {
          setKaynaklar(Array.isArray(d.kaynaklar) ? d.kaynaklar : []);
        }
      })
      .catch(() => {
        if (aktif) setKaynaklar([]);
      })
      .finally(() => {
        if (aktif) setKaynakYukleniyor(false);
      });
    return () => {
      aktif = false;
    };
  }, [yayinAraci]);

  const hedefToggle = (rol: BolisHedefRol) => {
    setHedefRoller((onceki) =>
      onceki.includes(rol) ? onceki.filter((r) => r !== rol) : [...onceki, rol],
    );
  };

  const kaydet = async (hedefDurum: BolisSinavDurumu) => {
    setHata("");
    setBasari("");
    setKaydediliyor(true);
    try {
      const payload = {
        baslik,
        aciklama,
        hedef_roller: hedefRoller,
        yayin_araci: yayinAraci,
        yayin_video_guid: yayinAraci === "video" ? yayinVideoGuid : null,
        yayin_dosya_yolu:
          yayinAraci === "podcast" || yayinAraci === "gorsel" || yayinAraci === "flip_pdf"
            ? yayinDosyaYolu
            : null,
        yayin_viva_etkinlik_id: null,
        yayin_baslik: yayinAraci === "yayin_yok" ? null : yayinBaslik || null,
        baslangic_at:
          sinavTarihi && baslangicSaati ? `${sinavTarihi}T${baslangicSaati}:00+03:00` : null,
        bitis_at:
          sinavTarihi && bitisSaati ? `${sinavTarihi}T${bitisSaati}:00+03:00` : null,
        kayit_tipi: kayitTipi,
        durum: hedefDurum,
        sorular: sorular.map((s) => ({
          soru_metni: s.soru_metni,
          secenekler: s.secenekler,
          dogru_secenek: s.dogru_secenek,
          puan: s.puan,
        })),
        davetliler: kayitTipi === "hazir_liste" ? davetliler : [],
      };

      const url = duzenlemeModu ? `/bolis/api/${sinavId}` : "/bolis/api";
      const method = duzenlemeModu ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Sınav kaydedilemedi.");
        return;
      }

      setBasari(
        hedefDurum === "yayinda"
          ? "BOLIS sınavı başarıyla yayınlandı."
          : "BOLIS sınavı taslak olarak kaydedildi.",
      );
      router.push("/bolis");
      router.refresh();
    } catch {
      setHata("Sınav kaydedilemedi.");
    } finally {
      setKaydediliyor(false);
    }
  };

  const sinaviSil = async () => {
    if (!sinavId) return;
    setSiliniyor(true);
    setHata("");
    try {
      const r = await fetch(`/bolis/api/${sinavId}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Sınav silinemedi.");
        return;
      }
      router.push("/bolis");
      router.refresh();
    } catch {
      setHata("Sınav silinemedi.");
    } finally {
      setSiliniyor(false);
      setSilOnayAcik(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-sm text-[var(--tema-ikincil-metin)]">
        Sınav bilgileri yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Üst Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tema-cizgi)] pb-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => router.push("/bolis")}
            className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-semibold text-[var(--tema-ikincil-metin)] hover:text-[var(--tema-baslik)] cursor-pointer"
          >
            <ArrowLeft size={13} />
            BOLIS Sınav Yönetimi
          </button>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[10px] leading-none font-semibold tracking-wider"
              style={{
                backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                borderColor: BOLIS_YUMUSAK_CIZGI,
                color: BOLIS_RENGI,
              }}
            >
              <Compass size={11} />
              BOLIS
            </span>
            <h1 className="m-0 text-lg font-semibold text-[var(--tema-baslik)]">
              {duzenlemeModu ? "Sınavı Düzenle" : "Yeni Sınav Oluştur"}
            </h1>
          </div>
        </div>
      </div>

      {katilimBasladiMi && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          Bu sınava katılım başladığı için sorular ve hazır davetli listesi veri bütünlüğü gereği
          kilitlenmiştir; başlık, açıklama ve durum alanlarını güncelleyebilirsiniz.
        </div>
      )}

      {hata && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {hata}
        </p>
      )}
      {basari && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {basari}
        </p>
      )}

      {/* 1. Sınav Bilgileri & Hedef Kitle */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm">
        <h2 className="m-0 text-[13px] font-semibold text-[var(--tema-baslik)]">
          1. Sınav Bilgileri ve Hedef Kitle
        </h2>

        <div className="flex flex-col gap-3.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--tema-ikincil-metin)]">
              Sınav Başlığı *
            </label>
            <input
              type="text"
              maxLength={200}
              placeholder="Örn: Q4 Kardiyoloji Ürün Bilgi Ölçümü"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--tema-ikincil-metin)]">
              Açıklama / Yönerge
            </label>
            <textarea
              rows={2}
              maxLength={2000}
              placeholder="Katılımcılara sınav öncesi gösterilecek kısa yönerge…"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              className="w-full rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] p-2.5 text-xs text-[var(--tema-metin)]"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-[var(--tema-ikincil-metin)]">
              Hedef Kitle * (Tekli veya çoklu seçim)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BOLIS_HEDEF_ROLLER.map((rol) => {
                const secili = hedefRoller.includes(rol);
                return (
                  <button
                    key={rol}
                    type="button"
                    aria-pressed={secili}
                    onClick={() => hedefToggle(rol)}
                    className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] leading-none font-medium transition cursor-pointer ${
                      secili
                        ? ""
                        : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)] hover:bg-[var(--tema-kontrol-hover)]"
                    }`}
                    style={
                      secili
                        ? {
                            backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                            borderColor: BOLIS_YUMUSAK_CIZGI,
                            color: BOLIS_RENGI,
                          }
                        : undefined
                    }
                  >
                    {BOLIS_HEDEF_ROL_ETIKETLERI[rol]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Yayın Aracı */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm">
        <h2 className="m-0 text-[13px] font-semibold text-[var(--tema-baslik)]">
          2. Yayın Aracı (İsteğe Bağlı)
        </h2>

        <div className="flex flex-wrap gap-1.5">
          {BOLIS_YAYIN_ARACLARI.map((arac) => {
            const secili = yayinAraci === arac;
            return (
              <button
                key={arac}
                type="button"
                aria-pressed={secili}
                onClick={() => {
                  setYayinAraci(arac);
                  setYayinBaslik("");
                  setYayinVideoGuid("");
                  setYayinDosyaYolu("");
                }}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                  secili
                    ? ""
                    : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)] hover:bg-[var(--tema-kontrol-hover)]"
                }`}
                style={
                  secili
                    ? {
                        backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                        borderColor: BOLIS_YUMUSAK_CIZGI,
                        color: BOLIS_RENGI,
                      }
                    : undefined
                }
              >
                {BOLIS_YAYIN_ARACI_ETIKETLERI[arac]}
              </button>
            );
          })}
        </div>

        {yayinAraci !== "yayin_yok" && (
          <div className="space-y-3 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-4">
            <BolisMedyaYukleyici
              arac={yayinAraci}
              mevcutBaslik={yayinBaslik}
              mevcutDeger={yayinAraci === "video" ? yayinVideoGuid : yayinDosyaYolu}
              onYuklendi={({ deger, baslik: dosyaAdi }) => {
                if (yayinAraci === "video") setYayinVideoGuid(deger);
                else setYayinDosyaYolu(deger);
                setYayinBaslik(dosyaAdi);
              }}
              onTemizle={() => {
                setYayinVideoGuid("");
                setYayinDosyaYolu("");
                setYayinBaslik("");
              }}
            />

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--tema-ikincil-metin)]">
                Veya Firmanızın Mevcut Yayınından Seçin (İsteğe Bağlı)
              </label>
              {kaynakYukleniyor ? (
                <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">Yayınlar yükleniyor…</p>
              ) : (
                <div className="relative flex items-center">
                  <select
                    value={yayinAraci === "video" ? yayinVideoGuid : yayinDosyaYolu}
                    onChange={(e) => {
                      const secilen = kaynaklar.find((k) =>
                        yayinAraci === "video"
                          ? k.videoGuid === e.target.value
                          : k.dosyaYolu === e.target.value,
                      );
                      if (yayinAraci === "video") setYayinVideoGuid(e.target.value);
                      else setYayinDosyaYolu(e.target.value);
                      setYayinBaslik(secilen?.baslik ?? "");
                    }}
                    className="h-9 w-full appearance-none rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] pl-2.5 pr-8 text-xs text-[var(--tema-metin)] cursor-pointer"
                  >
                    <option value="">
                      {kaynaklar.length > 0
                        ? "Bir yayın seçin…"
                        : "Bu araçta kayıtlı yayın bulunamadı"}
                    </option>
                    {kaynaklar.map((k) => {
                      const val =
                        yayinAraci === "video" ? (k.videoGuid ?? "") : (k.dosyaYolu ?? "");
                      return (
                        <option key={k.id} value={val}>
                          {k.baslik}
                          {k.altBilgi ? ` (${k.altBilgi})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-2.5 text-[var(--tema-ikincil-metin)]"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 3. Sınav Tarihi, Saatleri ve Katılımcı Kayıt Tipi */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm">
        <h2 className="m-0 text-[13px] font-semibold text-[var(--tema-baslik)]">
          3. Sınav Tarihi, Saatleri ve Katılımcı Kayıt Tipi
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--tema-ikincil-metin)]">
              Sınav Tarihi *
            </label>
            <input
              type="date"
              value={sinavTarihi}
              onClick={(e) => e.currentTarget.showPicker?.()}
              onChange={(e) => setSinavTarihi(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-2.5 text-xs text-[var(--tema-metin)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--tema-ikincil-metin)]">
              Başlangıç Saati *
            </label>
            <input
              type="time"
              value={baslangicSaati}
              onClick={(e) => e.currentTarget.showPicker?.()}
              onChange={(e) => setBaslangicSaati(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-2.5 text-xs text-[var(--tema-metin)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--tema-ikincil-metin)]">
              Bitiş Saati *
            </label>
            <input
              type="time"
              value={bitisSaati}
              onClick={(e) => e.currentTarget.showPicker?.()}
              onChange={(e) => setBitisSaati(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-2.5 text-xs text-[var(--tema-metin)]"
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-[var(--tema-cizgi)] pt-3.5">
          <span className="block text-xs font-medium text-[var(--tema-ikincil-metin)]">
            Katılımcı Kayıt Tipi * (Tüm tiplerde giriş hakkı tek seferdir)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BOLIS_KAYIT_TIPLERI.map((tip) => {
              const secili = kayitTipi === tip;
              return (
                <button
                  key={tip}
                  type="button"
                  aria-pressed={secili}
                  disabled={katilimBasladiMi}
                  onClick={() => setKayitTipi(tip)}
                  className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] leading-none font-medium transition cursor-pointer ${
                    secili
                      ? ""
                      : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)] hover:bg-[var(--tema-kontrol-hover)]"
                  }`}
                  style={
                    secili
                      ? {
                          backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                          borderColor: BOLIS_YUMUSAK_CIZGI,
                          color: BOLIS_RENGI,
                        }
                      : undefined
                  }
                >
                  {BOLIS_KAYIT_TIPI_ETIKETLERI[tip]}
                </button>
              );
            })}
          </div>

          {kayitTipi === "hazir_liste" && (
            <BolisDavetliAlani
              davetliler={davetliler}
              onChange={setDavetliler}
              saltOkunur={katilimBasladiMi}
            />
          )}
        </div>
      </section>

      {/* 4. Çoktan Seçmeli Sorular */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm">
        <h2 className="m-0 text-[13px] font-semibold text-[var(--tema-baslik)]">
          4. Çoktan Seçmeli Sorular (1–100 Soru, 2–10 Seçenek)
        </h2>

        <BolisSoruEditoru
          sorular={sorular}
          onChange={setSorular}
          saltOkunur={katilimBasladiMi}
        />
      </section>

      {/* Alt Aksiyon Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--tema-cizgi)] pt-4">
        <div>
          {duzenlemeModu && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={siliniyor || kaydediliyor}
              onClick={() => setSilOnayAcik(true)}
              className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
            >
              <Trash2 size={14} aria-hidden="true" />
              Sınavı Sil
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={kaydediliyor}
            onClick={() => void kaydet("taslak")}
            className="gap-1.5"
          >
            <Save size={14} aria-hidden="true" />
            Taslak Kaydet
          </Button>
          <Button
            type="button"
            disabled={kaydediliyor}
            onClick={() => void kaydet("yayinda")}
            className="gap-1.5 text-white"
            style={{ backgroundColor: BOLIS_RENGI }}
          >
            <Send size={14} aria-hidden="true" />
            {kaydediliyor ? "Kaydediliyor..." : "Yayınla"}
          </Button>
        </div>
      </div>

      {/* Silme Onay Modalı (window.confirm kullanılmaz) */}
      <AlertDialog open={silOnayAcik} onOpenChange={setSilOnayAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>BOLIS Sınavını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              “{baslik || "Bu sınav"}” kalıcı olarak silinecektir. Bağlı tüm sorular, davetli
              listesi ve katılım sonuçları da kaldırılır. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={siliniyor}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={siliniyor}
              onClick={() => void sinaviSil()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {siliniyor ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
