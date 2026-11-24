"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Check, ClipboardCheck, Clock, Compass, Link2, Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SUREC16_TOAST, sonrakiSayfaToastOku } from "@/lib/bildirimler/toastMesajlari";
import {
  SadeKontrolButonu,
  SadeKontrolGrubu,
} from "@/components/kontrol/SadeKontroller";
import {
  BOLIS_DURUM_ETIKETLERI,
  BOLIS_HEDEF_ROL_ETIKETLERI,
  BOLIS_KAYIT_TIPI_ETIKETLERI,
  BOLIS_RENGI,
  BOLIS_YAYIN_ARACI_ETIKETLERI,
  BOLIS_YUMUSAK_CIZGI,
  BOLIS_YUMUSAK_ZEMIN,
  type BolisSinavDurumu,
  type BolisSinavOzeti,
} from "@/lib/bolis/tipler";

type YoneticiFiltre = "tumu" | BolisSinavDurumu;
type KatilimciFiltre = "aktif" | "tamamlanan";

export default function BolisAnaSayfa() {
  const router = useRouter();
  const { mesajlar, basari: toastBasari } = useHataMesaji();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [yoneticiMi, setYoneticiMi] = useState(false);
  const [kurulumBekliyor, setKurulumBekliyor] = useState(false);
  const [sinavlar, setSinavlar] = useState<BolisSinavOzeti[]>([]);
  const [yoneticiFiltresi, setYoneticiFiltresi] = useState<YoneticiFiltre>("tumu");
  const [katilimciFiltresi, setKatilimciFiltresi] = useState<KatilimciFiltre>("aktif");
  const [kopyalananId, setKopyalananId] = useState<string | null>(null);
  const [durumIslenenId, setDurumIslenenId] = useState<string | null>(null);

  useEffect(() => {
    const bekleyen = sonrakiSayfaToastOku();
    if (bekleyen) {
      toastBasari(bekleyen.mesaj);
    }
  }, [toastBasari]);

  const yenile = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const r = await fetch("/bolis/api", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "BOLIS sınavları alınamadı.");
        return;
      }
      setYoneticiMi(Boolean(d.yoneticiMi));
      setKurulumBekliyor(Boolean(d.kurulumBekliyor));
      setSinavlar(Array.isArray(d.sinavlar) ? d.sinavlar : []);
    } catch {
      setHata("BOLIS sınavları alınamadı.");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void yenile();
  }, [yenile]);

  const filtrelenmis = useMemo(() => {
    if (yoneticiMi) {
      if (yoneticiFiltresi === "tumu") return sinavlar;
      return sinavlar.filter((s) => s.durum === yoneticiFiltresi);
    }
    return sinavlar.filter((s) =>
      katilimciFiltresi === "tamamlanan" ? Boolean(s.katildi_mi) : !s.katildi_mi,
    );
  }, [sinavlar, yoneticiMi, yoneticiFiltresi, katilimciFiltresi]);

  const yayindaSayisi = useMemo(
    () => sinavlar.filter((s) => s.durum === "yayinda").length,
    [sinavlar],
  );
  const toplamKatilimci = useMemo(
    () => sinavlar.reduce((t, s) => t + s.katilimci_sayisi, 0),
    [sinavlar],
  );

  const linkKopyala = async (s: BolisSinavOzeti) => {
    const url = `${window.location.origin}/bolis-sinav/${s.erisim_kodu}`;
    try {
      await navigator.clipboard.writeText(url);
      setKopyalananId(s.sinav_id);
      toastBasari(SUREC16_TOAST.baglantiKopyalandi);
      window.setTimeout(() => setKopyalananId((mevcut) => (mevcut === s.sinav_id ? null : mevcut)), 2000);
    } catch {
      setHata("Sınav bağlantısı kopyalanamadı.");
    }
  };

  const durumDegistir = async (s: BolisSinavOzeti, yeniDurum: BolisSinavDurumu) => {
    setDurumIslenenId(s.sinav_id);
    setHata("");
    try {
      const r = await fetch(`/bolis/api/${s.sinav_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: yeniDurum }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Sınav durumu güncellenemedi.");
        return;
      }
      if (yeniDurum === "yayinda") {
        toastBasari(
          (d.kayit_tipi ?? s.kayit_tipi) === "hazir_liste"
            ? SUREC16_TOAST.hazirListeYayinlandi
            : SUREC16_TOAST.sinavYayinlandi,
        );
      } else if (yeniDurum === "kapali") {
        toastBasari(SUREC16_TOAST.sinavKapatildi);
      }
      await yenile();
    } catch {
      setHata("Sınav durumu güncellenemedi.");
    } finally {
      setDurumIslenenId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-4 pt-9 sm:px-6 sm:pb-6 sm:pt-11">
      {/* Üst Başlık */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--tema-cizgi)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[10px] leading-none font-semibold tracking-wider"
              style={{
                backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                borderColor: BOLIS_YUMUSAK_CIZGI,
                color: BOLIS_RENGI,
              }}
            >
              <Compass size={11} aria-hidden="true" />
              BOLIS
            </span>
            <span className="text-xs font-medium text-[var(--tema-ikincil-metin)]">
              Bilgi Derinliği Ölçüm ve Sınav Merkezi
            </span>
          </div>
          <h1 className="m-0 text-xl font-semibold text-[var(--tema-baslik)]">
            {yoneticiMi ? "Sınav Yönetimi" : "Sınavlarım"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {yoneticiMi && (
            <Button
              type="button"
              size="sm"
              onClick={() => router.push("/bolis/yeni")}
              className="gap-1.5 text-white"
              style={{ backgroundColor: BOLIS_RENGI }}
            >
              <Plus size={15} aria-hidden="true" />
              Yeni Sınav Oluştur
            </Button>
          )}
          <YenileButonu yenileniyor={yukleniyor} onYenile={() => void yenile()} />
        </div>
      </div>

      {/* Özet Kartları (Yönetici / Üretici) */}
      {yoneticiMi && (
        <section
          aria-label="BOLIS özeti"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {[
            {
              etiket: "Toplam Sınav",
              deger: sinavlar.length,
              aciklama: "Taslak, yayında ve kapalı sınavlar",
            },
            {
              etiket: "Yayındaki Sınavlar",
              deger: yayindaSayisi,
              aciklama: "Katılıma açık aktif ölçüm sınavları",
            },
            {
              etiket: "Tamamlanan Katılım",
              deger: toplamKatilimci,
              aciklama: "Tüm sınavlarda tamamlanan toplam katılım",
            },
          ].map((k) => (
            <article
              key={k.etiket}
              className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-4 shadow-sm"
              style={{ borderLeft: `3px solid ${BOLIS_RENGI}` }}
            >
              <span className="block text-xs font-bold text-[var(--tema-ikincil-metin)]">
                {k.etiket}
              </span>
              <strong className="mt-1.5 block text-2xl font-extrabold text-[var(--tema-baslik)]">
                {k.deger.toLocaleString("tr-TR")}
              </strong>
              <small className="mt-1 block text-[11px] text-[var(--tema-ikincil-metin)]">
                {k.aciklama}
              </small>
            </article>
          ))}
        </section>
      )}

      {kurulumBekliyor && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          BOLIS veritabanı tabloları henüz oluşturulmadı. <code>scripts/sql/bolis_kurulum.sql</code>{" "}
          dosyasını Supabase SQL Editor’da çalıştırdıktan sonra sayfayı yenileyin.
        </div>
      )}

      {hata && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {hata}
        </p>
      )}

      {/* Filtre Sekmeleri */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {yoneticiMi ? (
          <SadeKontrolGrubu tur="sekme" aria-label="Sınav durumu filtresi">
            {(
              [
                ["tumu", "Tümü"],
                ["yayinda", "Yayında"],
                ["taslak", "Taslak"],
                ["kapali", "Kapalı"],
              ] as const
            ).map(([deger, etiket]) => (
              <SadeKontrolButonu
                key={deger}
                aria-pressed={yoneticiFiltresi === deger}
                onClick={() => setYoneticiFiltresi(deger)}
              >
                {etiket}
              </SadeKontrolButonu>
            ))}
          </SadeKontrolGrubu>
        ) : (
          <SadeKontrolGrubu tur="sekme" aria-label="Katılım durumu filtresi">
            <SadeKontrolButonu
              aria-pressed={katilimciFiltresi === "aktif"}
              onClick={() => setKatilimciFiltresi("aktif")}
            >
              Aktif Sınavlar
            </SadeKontrolButonu>
            <SadeKontrolButonu
              aria-pressed={katilimciFiltresi === "tamamlanan"}
              onClick={() => setKatilimciFiltresi("tamamlanan")}
            >
              Tamamladıklarım
            </SadeKontrolButonu>
          </SadeKontrolGrubu>
        )}
      </div>

      {/* Liste / Boş Durum */}
      {yukleniyor ? (
        <p role="status" className="m-0 py-6 text-sm text-[var(--tema-ikincil-metin)]">
          BOLIS sınavları yükleniyor…
        </p>
      ) : filtrelenmis.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-8 text-center">
          <ClipboardCheck
            size={28}
            className="mx-auto mb-2"
            style={{ color: BOLIS_RENGI }}
            aria-hidden="true"
          />
          <p className="m-0 text-sm font-bold text-[var(--tema-baslik)]">
            {yoneticiMi
              ? "Henüz oluşturulmuş bir BOLIS sınavı bulunmuyor."
              : katilimciFiltresi === "tamamlanan"
                ? "Henüz tamamladığınız bir sınav bulunmuyor."
                : "Şu an katılımınıza açık aktif bir sınav bulunmuyor."}
          </p>
          <p className="m-0 mt-1 text-xs text-[var(--tema-ikincil-metin)]">
            {yoneticiMi
              ? "Faz 2 ile sınav oluşturma, 5 yayın aracı bağlantısı ve 100 soruya kadar çoktan seçmeli soru editörü devreye alınacak."
              : "Sınav açıldığında burada listelenecek veya paylaşılan bağlantı üzerinden doğrudan katılabileceksiniz."}
          </p>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtrelenmis.map((s) => (
            <article
              key={s.sinav_id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-4 shadow-sm"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[var(--tema-zemin)] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--tema-metin)]">
                    {BOLIS_YAYIN_ARACI_ETIKETLERI[s.yayin_araci]}
                  </span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                    style={
                      s.durum === "yayinda"
                        ? {
                            backgroundColor: "rgb(21 128 61 / 0.09)",
                            borderColor: "rgb(21 128 61 / 0.28)",
                            color: "#15803D",
                          }
                        : s.durum === "kapali"
                          ? {
                              backgroundColor: "rgb(100 116 139 / 0.10)",
                              borderColor: "rgb(100 116 139 / 0.25)",
                              color: "#475569",
                            }
                          : {
                              backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                              borderColor: BOLIS_YUMUSAK_CIZGI,
                              color: BOLIS_RENGI,
                            }
                    }
                  >
                    {BOLIS_DURUM_ETIKETLERI[s.durum]}
                  </span>
                </div>

                <h2 className="m-0 line-clamp-2 text-base font-extrabold text-[var(--tema-baslik)]">
                  {s.baslik}
                </h2>

                {s.aciklama && (
                  <p className="m-0 line-clamp-2 text-xs text-[var(--tema-ikincil-metin)]">
                    {s.aciklama}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {s.hedef_roller.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2 py-0.5 text-[10px] font-bold text-[var(--tema-metin)]"
                    >
                      {BOLIS_HEDEF_ROL_ETIKETLERI[r]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-[var(--tema-cizgi)] pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-[var(--tema-ikincil-metin)]">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} aria-hidden="true" />
                    {s.sure_dakika} dk
                  </span>
                  {yoneticiMi ? (
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} aria-hidden="true" />
                      {s.soru_sayisi} soru · {s.katilimci_sayisi} katılım
                    </span>
                  ) : s.katildi_mi ? (
                    <strong className="text-emerald-700">
                      Puan: {s.kullanici_puani ?? 0} / {s.maksimum_puan ?? 0}
                    </strong>
                  ) : (
                    <span>{BOLIS_KAYIT_TIPI_ETIKETLERI[s.kayit_tipi]}</span>
                  )}
                </div>

                {yoneticiMi ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 gap-1 px-2 text-[11px]"
                      onClick={() => router.push(`/bolis/${s.sinav_id}/duzenle`)}
                    >
                      <Pencil size={12} aria-hidden="true" />
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 gap-1 px-2 text-[11px]"
                      onClick={() => router.push(`/bolis/${s.sinav_id}/rapor`)}
                    >
                      <BarChart3 size={12} aria-hidden="true" />
                      Rapor
                    </Button>
                    {s.durum === "yayinda" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 gap-1 px-2 text-[11px]"
                        onClick={() => void linkKopyala(s)}
                      >
                        {kopyalananId === s.sinav_id ? (
                          <>
                            <Check size={12} aria-hidden="true" />
                            Kopyalandı
                          </>
                        ) : (
                          <>
                            <Link2 size={12} aria-hidden="true" />
                            Bağlantı
                          </>
                        )}
                      </Button>
                    )}
                    {s.durum !== "yayinda" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={durumIslenenId === s.sinav_id}
                        onClick={() => void durumDegistir(s, "yayinda")}
                        className="h-7 px-2.5 text-[11px] text-white"
                        style={{ backgroundColor: BOLIS_RENGI }}
                      >
                        Yayınla
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={durumIslenenId === s.sinav_id}
                        onClick={() => void durumDegistir(s, "kapali")}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        Kapat
                      </Button>
                    )}
                  </div>
                ) : !s.katildi_mi ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => router.push(`/bolis-sinav/${s.erisim_kodu}`)}
                    className="h-7 w-full text-[11px] text-white"
                    style={{ backgroundColor: BOLIS_RENGI }}
                  >
                    Sınava Gir
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
      <HataMesajiContainer mesajlar={mesajlar} />
    </div>
  );
}
