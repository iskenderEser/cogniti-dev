"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { yayinDetayModaliGorebilir } from "@/lib/utils/roller";
import type { AracTuruRaporSatiri, AracRaporDetayKapsami, AracYayinSayfasi } from "@/lib/rapor/paylasilan/aracTuruDagilimi";
import { Video, Headphones, Image as ImageIcon, BookOpen, Sparkles, ExternalLink, Info } from "lucide-react";
import YayinDetayModal from "./YayinDetayModal";
import styles from "./OgrenmeAraciPerformansi.module.css";

const ADLAR: Record<AracTuruRaporSatiri["arac_turu"], string> = {
  video: "Video",
  podcast: "Podcast",
  gorsel: "Dijital Broşür",
  flip_pdf: "Literatür",
};

const TUKETIM_ADLARI: Record<AracTuruRaporSatiri["arac_turu"], string> = {
  video: "İzleme",
  podcast: "Dinleme",
  gorsel: "İnceleme",
  flip_pdf: "Okuma",
};

const ARAC_TEMASI: Record<
  AracTuruRaporSatiri["arac_turu"],
  { renk: string; acikRenk: string; borderRenk: string; badgeRenk: string; icon: typeof Video }
> = {
  video: {
    renk: "var(--tema-yerel-rapor-islevsel-metin-24)",
    acikRenk: "var(--tema-yerel-rapor-islevsel-metin-38)",
    borderRenk: "var(--tema-yerel-rapor-islevsel-cizgi-10)",
    badgeRenk: "text-[var(--tema-yerel-rapor-islevsel-metin-24)] bg-[var(--tema-yerel-rapor-islevsel-zemin-21)]",
    icon: Video,
  },
  podcast: {
    renk: "var(--tema-yerel-rapor-islevsel-metin-25)",
    acikRenk: "var(--tema-yerel-rapor-islevsel-metin-39)",
    borderRenk: "var(--tema-yerel-rapor-islevsel-cizgi-11)",
    badgeRenk: "text-[var(--tema-yerel-rapor-islevsel-metin-25)] bg-[var(--tema-yerel-rapor-islevsel-zemin-19)]",
    icon: Headphones,
  },
  gorsel: {
    renk: "var(--tema-yerel-rapor-islevsel-metin-17)",
    acikRenk: "var(--tema-yerel-rapor-islevsel-metin-40)",
    borderRenk: "var(--tema-yerel-rapor-islevsel-cizgi-12)",
    badgeRenk: "text-[var(--tema-yerel-rapor-islevsel-metin-17)] bg-[var(--tema-yerel-rapor-islevsel-zemin-25)]",
    icon: ImageIcon,
  },
  flip_pdf: {
    renk: "var(--tema-yerel-rapor-islevsel-metin-41)",
    acikRenk: "var(--tema-yerel-rapor-islevsel-metin-42)",
    borderRenk: "var(--tema-yerel-rapor-islevsel-cizgi-13)",
    badgeRenk: "text-[var(--tema-yerel-rapor-islevsel-metin-41)] bg-[var(--tema-yerel-rapor-islevsel-zemin-26)]",
    icon: BookOpen,
  },
};

const ROL_ADLARI: Record<string, string> = {
  utt: "Saha Temsilcisi (UTT)",
  kd_utt: "Kıdemli UTT",
  temsilci: "Saha Temsilcisi (UTT)",
  bm: "Bölge Müdürü (BM)",
  tm: "Takım Müdürü (TM)",
  eczaci: "Eczacı",
  ikinci_eczaci: "İkinci Eczacı",
  yardimci_eczaci: "Yardımcı Eczacı",
  eczane_teknisyeni: "Eczane Teknisyeni",
  teknisyen: "Eczane Teknisyeni",
  musteri: "Danışan / Eczanem",
  eczanem: "Danışan / Eczanem",
  yonetici: "Yönetici",
  diger: "Diğer Roller",
};

const ROL_SATIRLARI = [
  [
    { ad: "UTT", roller: ["utt", "kd_utt", "temsilci"] },
    { ad: "BM", roller: ["bm"] },
  ],
  [
    { ad: "Eczacı", roller: ["eczaci", "ikinci_eczaci", "yardimci_eczaci"] },
    { ad: "Ecz.Tekn.", roller: ["eczane_teknisyeni", "teknisyen"] },
    { ad: "Danışan", roller: ["musteri", "eczanem"] },
  ],
];

const oran = (deger: number | null) => deger === null ? "—" : `%${deger.toLocaleString("tr-TR")}`;
const sayi = (deger: number) => (deger ?? 0).toLocaleString("tr-TR");

export default function OgrenmeAraciPerformansi({
  dagilim,
  periyotBasligi = "Seçili Dönem",
  aciklama,
  detayKapsami,
}: {
  dagilim?: AracTuruRaporSatiri[];
  periyotBasligi?: string;
  aciklama?: string;
  detayKapsami?: AracRaporDetayKapsami;
}) {
  const { kullanici } = useAuth();
  const [seciliYayinId, setSeciliYayinId] = useState<string | null>(null);
  const [acilanAraclar, setAcilanAraclar] = useState<string[]>([]);

  const modalYetkili = yayinDetayModaliGorebilir(kullanici?.rol ?? "");

  if (!dagilim?.length) return null;

  const toplamTumAraclarNetPuan = dagilim.reduce(
    (acc, item) => acc + (item.net_kazanilan_puan > 0 ? item.net_kazanilan_puan : 0),
    0
  );

  return (
    <section className="my-4 overflow-hidden rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-06)] bg-[var(--tema-yerel-rapor-kart-04)] shadow-[0_8px_24px_var(--tema-yerel-rapor-golge-15)]">
      {/* Header */}
      <div className="border-b border-[var(--tema-yerel-rapor-cizgi-12)] px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="text-base font-extrabold text-[var(--tema-yerel-rapor-ana-metin-20)]">Öğrenme Aracı Performansı</h2>
        {aciklama && (
          <p className="mt-0.5 text-[11px] font-medium text-[var(--tema-yerel-rapor-yardimci-metin-08)]">{aciklama}</p>
        )}
      </div>

      {/* HTML mockup'taki dört araç kartı; mevcut SQL değerleri kullanılır. */}
      <div className={styles.grid}>
        {dagilim.map((satir) => {
          const tema = ARAC_TEMASI[satir.arac_turu];
          const Icon = tema.icon;
          const tamamlamaOrani = satir.tamamlama_orani ?? null;
          const netPuanYuzdesi =
            toplamTumAraclarNetPuan > 0 && satir.net_kazanilan_puan > 0
              ? Math.round((satir.net_kazanilan_puan / toplamTumAraclarNetPuan) * 100)
              : null;

          return (
            <article key={satir.arac_turu} className={styles.article + " " + styles[satir.arac_turu]} aria-label={ADLAR[satir.arac_turu] + " · " + periyotBasligi}>
              <header className={styles.head}>
                <h3>{ADLAR[satir.arac_turu]}</h3>
                <Icon aria-hidden="true" />
              </header>
              <div className={styles.content}>
                <div className={styles.eyebrow}>{periyotBasligi}</div>
                <div className={styles.hero}>
                  <div>
                    <div className={styles.big} data-metrik="tamamlama">{sayi(satir.tamamlama)}</div>
                    <div className={styles.label}>Tamamlanan</div>
                  </div>
                  <div
                    className={styles.ring}
                    style={{ background: "conic-gradient(var(--yapka-accent) " + ((tamamlamaOrani ?? 0) * 3.6) + "deg, var(--yapka-soft) 0)" }}
                    role="img"
                    aria-label={tamamlamaOrani === null ? "Tamamlanma oranı: veri yok" : "Tamamlanma oranı: yüzde " + tamamlamaOrani}
                  >
                    <div className={styles.ringCenter} data-metrik="tamamlama_orani">{oran(tamamlamaOrani)}</div>
                  </div>
                </div>
                <div className={styles.mini}>
                  <div>
                    <b data-metrik="toplam_yayin_sayisi">{satir.toplam_yayin_sayisi == null ? "—" : sayi(satir.toplam_yayin_sayisi)}</b>
                    <div className={styles.label}>Toplam içerik</div>
                  </div>
                  <div>
                    <b data-metrik="baslatma">{sayi(satir.baslatma)}</b>
                    <div className={styles.label}>Başlatılan</div>
                  </div>
                </div>
                <section className={styles.points} aria-label="Puan Katkısı">
                  <div className={styles.scoreTop}>
                    <div>
                      <span>Net puan</span>
                      <b data-metrik="net_kazanilan_puan" className={satir.net_kazanilan_puan < 0 ? styles.negative : undefined}>{sayi(satir.net_kazanilan_puan)}</b>
                    </div>
                    <div className={styles.success} title="Tüm araçların pozitif net puanları içindeki pay.">
                      <span>Başarı</span>
                      <b data-metrik="basari">{oran(netPuanYuzdesi)}</b>
                    </div>
                  </div>
                  <div className={styles.scoreBottom}>
                    <div><span>Kazanılan</span><b data-metrik="kazanilan_puan">{sayi(satir.kazanilan_puan)}</b></div>
                    <span className={styles.separator} aria-hidden="true">|</span>
                    <div><span>Kaybedilen</span><b data-metrik="kaybedilen_puan" className={satir.kaybedilen_puan > 0 ? styles.negative : undefined}>{sayi(satir.kaybedilen_puan)}</b></div>
                    <span className={styles.separator} aria-hidden="true">|</span>
                    <div title="Seçili dönemde yayına açılmış ve hâlen yayında olan yayınların tanımlı öğrenme aracı puanları toplamı.">
                      <span>Potansiyel</span><b data-metrik="potansiyel_puan">{satir.potansiyel_puan == null ? "—" : sayi(satir.potansiyel_puan)}</b>
                    </div>
                  </div>
                </section>
                <section className={styles.audience} aria-label={TUKETIM_ADLARI[satir.arac_turu] + " Sayıları"}>
                  <div className={styles.audienceTitle}>{TUKETIM_ADLARI[satir.arac_turu]} Sayıları</div>
                  <div className={styles.allRoles}>
                    {ROL_SATIRLARI.flat().map((grup) => {
                      const toplam = grup.roller.reduce((adet, rol) => adet + (satir.roller?.[rol]?.tamamlama ?? 0), 0);
                      return (
                        <div key={grup.ad} className={styles.roleCell} data-rol={grup.ad}>
                          <div className={styles.roleName}>{grup.ad}</div>
                          <b>{sayi(toplam)}</b>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </article>
          );
        })}
      </div>

      {/* Alttaki Yaratıcı Açılır Piller (Rol Motivasyon Tablosu & Yayın Detayları) */}
      <div className="grid gap-2.5 border-t border-[var(--tema-yerel-rapor-cizgi-12)] bg-[var(--tema-yerel-rapor-sayfa-zemini-03)] p-3 sm:p-4 sm:grid-cols-2 lg:grid-cols-4">
        {dagilim.map((satir) => {
          const tema = ARAC_TEMASI[satir.arac_turu];
          const Icon = tema.icon;
          const rollerListesi = Object.entries(satir.roller ?? {}).filter(
            ([_, m]) => (m.tamamlama ?? 0) > 0 || (m.baslatma ?? 0) > 0 || (m.kazanilan_puan ?? 0) > 0
          );
          const toplamTuketim = satir.tamamlama || 1;

          return (
            <details
              key={satir.arac_turu}
              onToggle={(event) => {
                if (event.currentTarget.open) setAcilanAraclar((onceki) => onceki.includes(satir.arac_turu) ? onceki : [...onceki, satir.arac_turu]);
              }}
              className="group rounded-xl border border-[var(--tema-yerel-rapor-cizgi-28)] bg-[var(--tema-yerel-rapor-kart-04)] p-3 transition-all hover:border-[var(--tema-yerel-rapor-cizgi-44)]"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-extrabold text-[var(--tema-yerel-rapor-ana-metin-22)]">
                <div className="flex items-center gap-1.5 truncate mr-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: tema.renk }} />
                  <span className="truncate">{ADLAR[satir.arac_turu]}, {periyotBasligi} Etkileşim Detayları</span>
                </div>
                <span className="rounded-md bg-[var(--tema-yerel-rapor-secim-zemin-15)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--tema-yerel-rapor-eylem-metin-06)] shrink-0">
                  {satir.etkilesim_yayin_sayisi ?? satir.yayinlar.length}
                </span>
              </summary>

              <div className="mt-3 pt-3 border-t border-[var(--tema-yerel-rapor-cizgi-27)] space-y-3">
                {/* 1. Rol Bazlı Motivasyon & Skor Tablosu */}
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-rapor-yardimci-metin-14)] mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[var(--tema-yerel-rapor-eylem-metin-06)]" />
                    <span>Rol Motivasyon Tablosu</span>
                  </div>

                  {rollerListesi.length === 0 ? (
                    <div className="text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-66)] italic">Henüz rol aktivitesi yok.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px]">
                        <thead>
                          <tr className="border-b border-[var(--tema-yerel-rapor-cizgi-27)] text-[var(--tema-yerel-rapor-yardimci-metin-08)] font-bold">
                            <th className="pb-1">Rol</th>
                            <th className="pb-1 text-center">Tüketim</th>
                            <th className="pb-1 text-right">Net Puan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--tema-yerel-rapor-cizgi-46)]">
                          {rollerListesi.map(([rol, m]) => {
                            const rolAdi = ROL_ADLARI[rol] ?? rol;
                            const netPuan = m.net_puan ?? ((m.kazanilan_puan ?? 0) - (m.kaybedilen_puan ?? 0));
                            const pay = Math.round(((m.tamamlama ?? 0) / toplamTuketim) * 100);
                            return (
                              <tr key={rol} className="text-[var(--tema-yerel-rapor-ana-metin-13)]">
                                <td className="py-1 font-bold text-[var(--tema-yerel-rapor-ana-metin-07)] truncate max-w-[110px]" title={rolAdi}>
                                  {rolAdi}
                                </td>
                                <td className="py-1 text-center tabular-nums">
                                  {sayi(m.tamamlama)}{" "}
                                  <span className="text-[9px] text-[var(--tema-yerel-rapor-yardimci-metin-08)]">({pay > 0 ? `%${pay}` : "—"})</span>
                                </td>
                                <td className="py-1 text-right font-extrabold tabular-nums">
                                  <span className={netPuan >= 0 ? "text-[var(--tema-yerel-rapor-islevsel-metin-06)]" : "text-[var(--tema-yerel-rapor-islevsel-metin-07)]"}>
                                    {netPuan >= 0 ? `+${sayi(netPuan)}` : sayi(netPuan)} p
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Yayın Listesi */}
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-rapor-yardimci-metin-14)] mb-1.5 flex items-center justify-between">
                    <span>{periyotBasligi} Etkileşim Alan Yayınlar ({satir.etkilesim_yayin_sayisi ?? satir.yayinlar.length})</span>
                  </div>

                  {/* Sabit 2 Sütunlu Alt Başlık Satırı */}
                  <div className="flex items-center justify-between px-2 py-1 mb-1 text-[9px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-rapor-yardimci-metin-08)] border-b border-[var(--tema-yerel-rapor-cizgi-27)] bg-[var(--tema-yerel-rapor-sayfa-zemini-03)] rounded-t">
                    <span>Yayın Kodu</span>
                    <span>Tamamlama - Puan</span>
                  </div>

                  {(!detayKapsami || acilanAraclar.includes(satir.arac_turu)) && (
                    <AracYayinListesi
                      aracTuru={satir.arac_turu} ilkYayinlar={satir.yayinlar}
                      toplam={satir.etkilesim_yayin_sayisi ?? satir.yayinlar.length}
                      kapsam={detayKapsami} modalYetkili={modalYetkili} onSec={setSeciliYayinId}
                    />
                  )}
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <div className="border-t border-[var(--tema-yerel-rapor-cizgi-47)] bg-[var(--tema-yerel-rapor-secim-zemin-06)] px-4 py-3 sm:px-5">
        <div className="flex items-start gap-2 text-[11px] font-semibold leading-relaxed text-[var(--tema-yerel-rapor-yardimci-metin-67)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--tema-yerel-rapor-eylem-metin-06)]" />
          <p>
            <strong className="font-extrabold text-[var(--tema-yerel-rapor-eylem-metin-13)]">Kümülatif Tüketim</strong>{" "}
            seçili dönemde öğrenme araçları için tamamlanan izleme, dinleme veya okuma hareketlerinin toplam sayısını ifade eder.
          </p>
        </div>
      </div>

      {/* Yayın & Soru Detay Modalı */}
      {modalYetkili && seciliYayinId && (
        <YayinDetayModal
          yayinId={seciliYayinId}
          onKapat={() => setSeciliYayinId(null)}
        />
      )}
    </section>
  );
}

function AracYayinListesi({ aracTuru, ilkYayinlar, toplam, kapsam, modalYetkili, onSec }: {
  aracTuru: AracTuruRaporSatiri['arac_turu']; ilkYayinlar: AracTuruRaporSatiri['yayinlar'];
  toplam: number; kapsam?: AracRaporDetayKapsami; modalYetkili: boolean; onSec: (id: string) => void;
}) {
  const [yayinlar, setYayinlar] = useState(ilkYayinlar);
  const [sonrakiImlec, setSonrakiImlec] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(Boolean(kapsam && toplam > 0));
  const [hata, setHata] = useState<string | null>(null);
  const istekRef = useRef<AbortController | null>(null);
  const temelUrl = kapsam ? '/raporlar/api/uretim?' + new URLSearchParams({
    arac_turu: aracTuru, periyot: kapsam.periyot, rapor_rolu: kapsam.raporRolu,
    baslangic: kapsam.baslangic, bitis: kapsam.bitis,
  }).toString() : null;

  const sayfayiYukle = useCallback(async (imlec: string | null) => {
    if (!temelUrl || istekRef.current) return;
    const controller = new AbortController();
    istekRef.current = controller;
    setYukleniyor(true);
    setHata(null);
    try {
      const res = await fetch(temelUrl + (imlec ? '&son_yayin_id=' + encodeURIComponent(imlec) : ''), {
        signal: controller.signal, cache: 'no-store',
      });
      const json = await res.json();
      if (controller.signal.aborted) return;
      if (!res.ok || !json.success || !Array.isArray(json.data?.yayinlar)) {
        throw new Error(json.hata || 'Yayınlar yüklenemedi.');
      }
      const sayfa = json.data as AracYayinSayfasi;
      setYayinlar((onceki) => imlec ? [...onceki, ...sayfa.yayinlar] : sayfa.yayinlar);
      setSonrakiImlec(sayfa.sonrakiImlec);
    } catch (err) {
      if (!controller.signal.aborted) setHata(err instanceof Error ? err.message : 'Yayınlar yüklenemedi.');
    } finally {
      if (!controller.signal.aborted) setYukleniyor(false);
      if (istekRef.current === controller) istekRef.current = null;
    }
  }, [temelUrl]);

  useEffect(() => {
    if (toplam > 0) void sayfayiYukle(null);
    return () => { istekRef.current?.abort(); istekRef.current = null; };
  }, [sayfayiYukle, toplam]);

  return (
    <>
      {yayinlar.length > 0 ? (
        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
          {yayinlar.map((y) => (
            <div key={y.yayin_id} className="flex items-center justify-between gap-1 rounded bg-[var(--tema-yerel-rapor-sayfa-zemini-03)] px-2 py-1 text-[10px] border border-[var(--tema-yerel-rapor-cizgi-27)] hover:bg-[var(--tema-yerel-rapor-secim-zemin-01)] transition-colors">
              {modalYetkili ? (
                <button type="button" onClick={() => onSec(y.yayin_id)}
                  className="font-extrabold text-[var(--tema-yerel-rapor-eylem-metin-06)] hover:underline truncate flex items-center gap-1 text-left cursor-pointer focus-visible:outline-none"
                  title={`${y.yayin_kodu ?? '-'} — Yayın detayını ve soruları aç`}>
                  <span>{y.yayin_kodu ?? '-'}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0 text-[var(--tema-yerel-rapor-yardimci-metin-14)]" />
                </button>
              ) : (
                <span className="font-bold text-[var(--tema-yerel-rapor-ana-metin-06)] truncate" title={y.yayin_kodu ?? '-'}>{y.yayin_kodu ?? '-'}</span>
              )}
              <span className="tabular-nums text-[var(--tema-yerel-rapor-yardimci-metin-27)] shrink-0 font-medium">
                {sayi(y.tamamlama)} tamamlama ·{' '}
                <strong className="text-[var(--tema-yerel-rapor-ana-metin-07)] font-bold">{sayi(y.kazanilan_puan - y.kaybedilen_puan)} p</strong>
              </span>
            </div>
          ))}
        </div>
      ) : !yukleniyor && !hata ? (
        <div className="text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-66)] italic px-2 py-1">Bu dönemde etkileşim alan yayın yok.</div>
      ) : null}
      {yukleniyor && <div role="status" className="py-2 text-[10px]">Yayınlar yükleniyor…</div>}
      {hata && <div role="alert" className="py-2 text-[10px] text-[var(--tema-yerel-rapor-islevsel-metin-07)]">{hata}</div>}
      {!yukleniyor && (hata || (sonrakiImlec && yayinlar.length < toplam)) && (
        <button type="button" onClick={() => void sayfayiYukle(sonrakiImlec)} className="mt-2 text-[10px] font-bold text-[var(--tema-yerel-rapor-eylem-metin-06)] hover:underline">
          {hata ? 'Tekrar dene' : 'Daha fazla yayın göster'}
        </button>
      )}
    </>
  );
}
