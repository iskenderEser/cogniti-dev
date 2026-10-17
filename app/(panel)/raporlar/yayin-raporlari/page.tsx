// app/(panel)/raporlar/uretim/page.tsx
//
// Üretim Raporları Sayfası (Üretim & Yayın Grubu).
// Yönetici ve Üretici rolleri için şirketteki içerik fabrikasının (Pazarlama, Medikal, Eğitim, İK)
// üretim hacmini, varyant dağılımını, eğitim portföyünü ve ürün bazlı etki değerlerini sunar.

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpenCheck,
  Calendar,
  Heart,
  Layers,
  Radio,
  Repeat2,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUretimRaporu } from './_hooks/useUretimRaporu';
import { YenileButonu } from '@/components/ui/yenile-butonu';
import RaporPeriyotSecici from '@/components/raporlar/RaporPeriyotSecici';
import { formatPuan, type Periyot } from '@/lib/utils/raporUtils';
import SayfaRehberi from '@/components/rehber/SayfaRehberi';
import UretimVaryantlariModal from '@/components/rehber/UretimVaryantlariModal';
import OgrenmeAraciPerformansi from '@/components/raporlar/OgrenmeAraciPerformansi';
import { ureticiYetenegi } from '@/lib/uretici/yetenekler';
import styles from '../utt/utt-report.module.css';
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";

const DEFAULT_PERIYOT: Periyot = 'bu_ay';
const PERIYOT_BASLIK: Record<Periyot, string> = {
  bu_gun: 'Bugün',
  bu_hafta: 'Bu Hafta',
  bu_ay: 'Bu Ay',
  bu_donem: 'Bu Dönem',
  bu_yil: 'Bu Yıl',
};

const EGITIM_TURU_RENK: Record<string, string> = {
  urun_egitimi: 'var(--tema-yerel-rapor-islevsel-metin-15)',
  satis_teknikleri: 'var(--tema-yerel-rapor-islevsel-metin-16)',
  yonetim_egitimi: 'var(--tema-yerel-rapor-islevsel-metin-17)',
  medikal_egitim: 'var(--tema-yerel-rapor-islevsel-metin-18)',
  urun_medikal_egitim: 'var(--tema-yerel-rapor-islevsel-metin-19)',
  ik_egitimi: 'var(--tema-yerel-rapor-islevsel-metin-20)',
};

const VARYANT_ADLARI: Record<string, string> = {
  normal: 'İçerik üreticisiyle birlikte.',
  hazir_video: 'Öğrenme aracı sizden, soru seti içerik üreticisinden.',
  hazir_set: 'Soru seti sizden, öğrenme aracı içerik üreticisinden.',
  hazir_ikisi: 'Öğrenme aracı ve soru seti sizden.',
};

const VARYANT_ROZETLERI: Record<string, { etiket: string; arkaPlan: string; renk: string }> = {
  normal: { etiket: 'V1', arkaPlan: 'var(--tema-yerel-rapor-islevsel-zemin-14)', renk: 'var(--tema-yerel-rapor-islevsel-metin-21)' },
  hazir_video: { etiket: 'V2', arkaPlan: 'var(--tema-yerel-rapor-islevsel-zemin-15)', renk: 'var(--tema-yerel-rapor-islevsel-metin-16)' },
  hazir_set: { etiket: 'V3', arkaPlan: 'var(--tema-yerel-rapor-islevsel-zemin-16)', renk: 'var(--tema-yerel-rapor-islevsel-metin-06)' },
  hazir_ikisi: { etiket: 'V4', arkaPlan: 'var(--tema-yerel-rapor-islevsel-zemin-17)', renk: 'var(--tema-yerel-rapor-islevsel-metin-22)' },
};

export default function UretimRaporlariPage() {
  const { kullanici } = useAuth();
  const [periyot, setPeriyot] = useState<Periyot>(DEFAULT_PERIYOT);
  const [seciliEgitimTuru, setSeciliEgitimTuru] = useState<string | null | undefined>(undefined);
  const [varyantModalAcik, setVaryantModalAcik] = useState(false);

  const { data, yenileniyor, error, yenile } = useUretimRaporu(
    periyot,
    kullanici?.id,
  );

  const ureticiYeteneği = kullanici?.rol ? ureticiYetenegi(kullanici.rol) : null;
  const ureticiRaporu = ureticiYeteneği !== null;

  const seciliEgitimDetayi = useMemo(() => {
    if (!data?.egitim_turu_etkisi) return null;
    if (seciliEgitimTuru === null) return null;
    if (seciliEgitimTuru === undefined) return data.egitim_turu_etkisi[0] ?? null;
    return (
      data.egitim_turu_etkisi.find((x) => x.egitim_adi === seciliEgitimTuru) ?? null
    );
  }, [data, seciliEgitimTuru]);

  const etkilesim = useMemo(() => {
    if (!data?.egitim_turu_etkisi) return { begeni: 0, favori: 0, extra: 0 };
    return data.egitim_turu_etkisi.reduce(
      (acc, x) => ({
        begeni: acc.begeni + Number(x.begeni_sayisi ?? 0),
        favori: acc.favori + Number(x.favori_sayisi ?? 0),
        extra: acc.extra + Number(x.extra_izleme_sayisi ?? 0),
      }),
      { begeni: 0, favori: 0, extra: 0 },
    );
  }, [data]);

  const ureticiEgitimDetaylari = useMemo(() => {
    if (!data?.egitim_turu_etkisi || !ureticiYeteneği) return [];
    return ureticiYeteneği.acabilecegiTalepTurleri
      .map((tur) => data.egitim_turu_etkisi.find((detay) => detay.egitim_turu === tur))
      .filter((detay): detay is NonNullable<typeof detay> => detay != null);
  }, [data, ureticiYeteneği]);

  return (
    <div className={styles.page} style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className={styles.container}>
        <Link href="/ana-sayfa" className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-10)] hover:text-[var(--tema-yerel-rapor-eylem-metin-06)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Ana Sayfa
        </Link>

        <SayfaYenileBasligi className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6"
          baslik={<h1 className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--tema-yerel-rapor-ana-metin-07)] inline-flex items-center">
            <span>Yayın Raporları</span>
            <SayfaRehberi anahtar="raporlar-uretim" className="ml-1.5 -translate-y-1.5" />
          </h1>}

          aciklama={<><p className="mt-0.5 text-xs font-semibold text-[var(--tema-yerel-rapor-yardimci-metin-11)]">
            Yayınlarınızın üretim, saha etkisi ve öğrenme aracı performansını seçili dönemde görebilirsiniz.
          </p></>}
          aksiyon={<YenileButonu yenileniyor={yenileniyor} onYenile={yenile} className="min-w-[88px] justify-center" />}
          ekKontroller={<><div className="flex w-full items-center gap-2 sm:w-auto">
            <RaporPeriyotSecici deger={periyot} onDegistir={setPeriyot} />

          </div></>}
        />

        {error && !data ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[var(--tema-yerel-rapor-islevsel-cizgi-07)] bg-[var(--tema-yerel-rapor-islevsel-zemin-07)] p-6">
            <div className="text-sm font-bold text-[var(--tema-yerel-rapor-islevsel-metin-23)]">Hata: {error}</div>
          </div>
        ) : !data ? (
          <div className="flex flex-col gap-4 animate-pulse mt-4">
            <div className="h-44 rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-28)] bg-[var(--tema-yerel-rapor-kart-04)] p-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-44 rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-28)] bg-[var(--tema-yerel-rapor-kart-04)]" />
              <div className="h-44 rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-28)] bg-[var(--tema-yerel-rapor-kart-04)]" />
            </div>
          </div>
        ) : (
          <>
        {/* Yayın Hero Grid */}
        <div className={styles.uretimHeroGrid}>
          <section className={`${styles.panel} p-4 sm:p-5 flex flex-col justify-between`}>
            <div>
              <h2 className="text-base font-extrabold text-[var(--tema-yerel-rapor-ana-metin-06)]">Yayın Özeti</h2>
              <p className="mt-0.5 text-xs text-[var(--tema-yerel-rapor-yardimci-metin-20)]">
                Tüm ve farklı zamanlardaki canlı yayın sayılarınız
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 sm:mt-4">
              {/* 1. Stat Kart: ŞU ANDA YAYINDA */}
              <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-29)] bg-[var(--tema-yerel-rapor-sayfa-zemini-01)] p-3.5">
                <div className="flex items-center gap-1.5 text-[var(--tema-yerel-rapor-islevsel-metin-06)] mb-1">
                  <Radio className="h-4 w-4" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-rapor-yardimci-metin-14)]">
                    ŞU ANDA YAYINDA
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black tabular-nums text-[var(--tema-yerel-rapor-islevsel-metin-06)]">
                  {data.uretim.su_an_yayinda}
                </div>
                <span className="block text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-25)] mt-0.5">Canlı yayın</span>
              </div>

              {/* 2. Stat Kart: [ZAMAN] YAYINA ALINAN */}
              <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-29)] bg-[var(--tema-yerel-rapor-sayfa-zemini-01)] p-3.5">
                <div className="flex items-center gap-1.5 text-[var(--tema-yerel-rapor-eylem-metin-06)] mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-rapor-yardimci-metin-14)]">
                    {PERIYOT_BASLIK[periyot]}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black tabular-nums text-[var(--tema-yerel-rapor-eylem-metin-06)]">
                  {data.uretim.donemde_yayina_alinan}
                </div>
                <span className="block text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-25)] mt-0.5">Açılan canlı yayın</span>
              </div>
            </div>
          </section>

          {/* Varyant Dağılımı Kartı */}
          <section className={`${styles.panel} p-4 sm:p-5 flex flex-col justify-between`}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[var(--tema-yerel-rapor-ana-metin-06)]">Yayın Üretim Yöntemleri (Varyantlar) ve Dağılımları</h2>
                <p className="mt-0.5 text-xs text-[var(--tema-yerel-rapor-yardimci-metin-20)]">
                  Yayınlarınızın üretim yöntemleri{" "}
                  <button
                    type="button"
                    onClick={() => setVaryantModalAcik(true)}
                    className="font-bold text-[var(--tema-yerel-rapor-eylem-metin-09)] hover:text-[var(--tema-yerel-rapor-eylem-metin-10)] underline underline-offset-2 cursor-pointer inline"
                  >
                    (varyantları)
                  </button>{" "}
                  ve dağılımlarına genel bakış
                </p>
              </div>
              <div className={styles.sectionIcon}><Layers className="h-4 w-4" /></div>
            </div>
            {(() => {
              const toplamVaryant = data.uretim.varyantlar.reduce((toplam, v) => toplam + v.adet, 0);
              return (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {data.uretim.varyantlar.map((v) => {
                    const yuzde = toplamVaryant > 0 ? Math.round((v.adet / toplamVaryant) * 100) : 0;
                    const rozet = VARYANT_ROZETLERI[v.kod];
                    return (
                      <div key={v.kod} className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-sayfa-zemini-01)] p-2.5 flex flex-col justify-between">
                        <div className="flex items-center gap-2">
                          {rozet && (
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                              style={{ backgroundColor: rozet.arkaPlan, color: rozet.renk }}
                            >
                              {rozet.etiket}
                            </span>
                          )}
                          <span
                            className="block text-[11px] font-bold leading-snug"
                            style={{ color: rozet?.renk ?? 'var(--tema-yerel-rapor-yardimci-metin-14)' }}
                          >
                            {VARYANT_ADLARI[v.kod] ?? v.ad}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-[var(--tema-yerel-rapor-cizgi-30)]">
                          <strong
                            className="text-sm sm:text-base font-extrabold"
                            style={{ color: rozet?.renk ?? 'var(--tema-yerel-rapor-ana-metin-07)' }}
                          >
                            {v.adet} Yayın
                          </strong>
                          {toplamVaryant > 0 && (
                            <span
                              className="text-[11px] font-extrabold"
                              style={{ color: rozet?.renk ?? 'var(--tema-yerel-rapor-eylem-metin-06)' }}
                            >
                              %{yuzde}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </div>

        {/* Etkileşim İstatistikleri Şeridi */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-kart-04)] p-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tema-yerel-rapor-islevsel-zemin-18)] text-[var(--tema-yerel-rapor-islevsel-metin-24)]">
              <Heart className="h-5 w-5" />
            </span>
            <div>
              <strong className="block text-lg font-black text-[var(--tema-yerel-rapor-ana-metin-07)]">{etkilesim.begeni}</strong>
              <span className="block text-xs font-bold text-[var(--tema-yerel-rapor-yardimci-metin-08)]">Toplam Beğeni</span>
              <span className="block text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-26)]">Tüm araçlar · seçili dönem</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-kart-04)] p-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tema-yerel-rapor-secim-zemin-09)] text-[var(--tema-yerel-rapor-eylem-metin-11)]">
              <Star className="h-5 w-5" />
            </span>
            <div>
              <strong className="block text-lg font-black text-[var(--tema-yerel-rapor-ana-metin-07)]">{etkilesim.favori}</strong>
              <span className="block text-xs font-bold text-[var(--tema-yerel-rapor-yardimci-metin-08)]">Toplam Favori</span>
              <span className="block text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-26)]">Tüm araçlar · seçili dönem</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-kart-04)] p-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tema-yerel-rapor-islevsel-zemin-19)] text-[var(--tema-yerel-rapor-islevsel-metin-25)]">
              <Repeat2 className="h-5 w-5" />
            </span>
            <div>
              <strong className="block text-lg font-black text-[var(--tema-yerel-rapor-ana-metin-07)]">{etkilesim.extra}</strong>
              <span className="block text-xs font-bold text-[var(--tema-yerel-rapor-yardimci-metin-08)]">Toplam Extra İzleme</span>
              <span className="block text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-26)]">Tüm araçlar · seçili dönem</span>
            </div>
          </div>
        </div>

        {/* Yayın Konusu ve Saha Etkisi (6 Sütun Tek Satır) */}
        <section className={`${styles.panel} ${styles.section}`}>
          {!ureticiRaporu && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className="text-base font-extrabold text-[var(--tema-yerel-rapor-ana-metin-06)]">Yayın Konusu ve Saha Etkisi</h2>
                  <p className="mt-0.5 text-[11px] font-medium text-[var(--tema-yerel-rapor-yardimci-metin-08)]">
                    Yayına alma sayıları ve sahada oluşturduğu tüketim karşılığı
                  </p>
                </div>
                <div className={styles.sectionIcon}><BookOpenCheck className="h-4 w-4" /></div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:flex sm:overflow-x-auto sm:snap-x sm:pb-2.5 lg:grid lg:grid-cols-6 lg:overflow-visible w-full">
                {data.uretim.turler.map((tur) => {
                  const etki = data.egitim_turu_etkisi.find((x) => x.egitim_turu === tur.kod);
                  const secili = seciliEgitimDetayi?.egitim_turu === tur.kod;

                  return (
                    <button
                      type="button"
                      key={tur.kod}
                      onClick={() => setSeciliEgitimTuru(secili ? null : tur.ad)}
                      className={`group relative flex flex-col justify-between rounded-2xl p-3 text-left transition-all cursor-pointer border ${
                        secili
                          ? 'bg-[var(--tema-yerel-rapor-secim-zemin-01)] border-[var(--tema-yerel-rapor-cizgi-18)] shadow-[0_4px_16px_var(--tema-yerel-rapor-golge-07)] ring-2 ring-[var(--tema-yerel-rapor-odak-01)]/25'
                          : 'bg-[var(--tema-yerel-rapor-sayfa-zemini-03)] border-transparent hover:bg-[var(--tema-yerel-rapor-sayfa-zemini-21)] hover:border-[var(--tema-yerel-rapor-cizgi-29)]'
                      } w-full min-w-0 sm:w-[190px] sm:min-w-[190px] sm:shrink-0 sm:snap-start lg:w-auto lg:min-w-0 lg:shrink`}
                    >
                      <div className="w-full min-w-0">
                        <div className="flex items-center justify-end mb-2">
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-extrabold"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${EGITIM_TURU_RENK[tur.kod] ?? 'var(--tema-yerel-rapor-eylem-zemin-03)'} 9.411764705882353%, transparent)`,
                              color: EGITIM_TURU_RENK[tur.kod] ?? 'var(--tema-yerel-rapor-eylem-metin-11)',
                            }}
                          >
                            {tur.adet} Yayın
                          </span>
                        </div>
                        <strong className={`block text-xs font-extrabold leading-snug truncate ${secili ? 'text-[var(--tema-yerel-rapor-ana-metin-07)]' : 'text-[var(--tema-yerel-rapor-ana-metin-13)]'}`}>
                          {tur.ad} Yayınları
                        </strong>
                      </div>

                      <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-bold ${
                        secili ? 'border-[var(--tema-yerel-rapor-cizgi-31)] text-[var(--tema-yerel-rapor-eylem-metin-06)]' : 'border-[var(--tema-yerel-rapor-cizgi-32)] text-[var(--tema-yerel-rapor-yardimci-metin-27)]'
                      }`}>
                        <span>{etki?.tamamlanan_izleme ?? 0} İzleme</span>
                        <span className="font-extrabold text-[var(--tema-yerel-rapor-islevsel-metin-06)]">+{formatPuan(etki?.net_puan ?? 0)} p</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Yönetici seçimi veya üretici rolün doğrudan yetkili olduğu konular */}
          {(ureticiRaporu
            ? ureticiEgitimDetaylari
            : seciliEgitimDetayi
              ? [seciliEgitimDetayi]
              : []
          ).map((egitimDetayi, indeks) => (
            <div
              key={egitimDetayi.egitim_turu}
              className={ureticiRaporu && indeks === 0 ? '' : 'mt-5 pt-4 border-t border-[var(--tema-yerel-rapor-cizgi-33)]'}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: EGITIM_TURU_RENK[egitimDetayi.egitim_turu] ?? 'var(--tema-yerel-rapor-eylem-zemin-01)',
                    }}
                  />
                  <h3 className="text-sm font-extrabold text-[var(--tema-yerel-rapor-ana-metin-07)] truncate">
                    {egitimDetayi.egitim_adi} Yayın Performansı
                  </h3>
                  {!ureticiRaporu && (
                    <span className="hidden sm:inline text-[11px] font-semibold text-[var(--tema-yerel-rapor-yardimci-metin-08)]">
                      · Seçili konunun dönem performansı
                    </span>
                  )}
                </div>
                {!ureticiRaporu && (
                  <button
                    type="button"
                    onClick={() => setSeciliEgitimTuru(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--tema-yerel-rapor-yardimci-metin-14)] hover:bg-[var(--tema-yerel-rapor-sayfa-zemini-22)] hover:text-[var(--tema-yerel-rapor-ana-metin-07)] transition-colors shrink-0 cursor-pointer"
                    aria-label="Detayı kapat"
                    title="Detayı Kapat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div
                className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full ${
                  (egitimDetayi.urun_dagilimi ?? []).some((u) => u.urun_id != null) ? 'mb-3.5' : 'mb-0'
                }`}
              >
                <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-sayfa-zemini-01)] p-3 text-center">
                  <span className="text-[10px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-08)] uppercase">Yayına Alınan</span>
                  <strong className="block text-lg font-black text-[var(--tema-yerel-rapor-ana-metin-07)] mt-0.5">{egitimDetayi.donemde_yayina_alinan}</strong>
                </div>
                <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-sayfa-zemini-01)] p-3 text-center">
                  <span className="text-[10px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-08)] uppercase">Tamamlanan İzleme</span>
                  <strong className="block text-lg font-black text-[var(--tema-yerel-rapor-eylem-metin-06)] mt-0.5">{egitimDetayi.tamamlanan_izleme}</strong>
                </div>
                <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-sayfa-zemini-01)] p-3 text-center">
                  <span className="text-[10px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-08)] uppercase">Kazanılan Puan</span>
                  <strong className="block text-lg font-black text-[var(--tema-yerel-rapor-islevsel-metin-06)] mt-0.5">+{formatPuan(egitimDetayi.kazanilan_toplam)}</strong>
                </div>
                <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-sayfa-zemini-01)] p-3 text-center">
                  <span className="text-[10px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-08)] uppercase">Net Puan</span>
                  <strong className="block text-lg font-black text-[var(--tema-yerel-rapor-ana-metin-07)] mt-0.5">{formatPuan(egitimDetayi.net_puan)} p</strong>
                </div>
              </div>

              {(egitimDetayi.urun_dagilimi ?? []).some((u) => u.urun_id != null) && (
                <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-34)] bg-[var(--tema-yerel-rapor-sayfa-zemini-17)] p-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-rapor-yardimci-metin-28)] mb-2">
                    Ürün Bazlı Puan Dağılımı
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {egitimDetayi.urun_dagilimi.filter((u) => u.urun_id != null).map((u) => (
                      <div key={u.urun_id ?? u.urun_adi} className="rounded-lg border border-[var(--tema-yerel-rapor-cizgi-05)] bg-[var(--tema-yerel-rapor-kart-04)] p-2.5 flex items-center justify-between">
                        <strong className="text-xs font-extrabold text-[var(--tema-yerel-rapor-ana-metin-07)] truncate mr-2">{u.urun_adi}</strong>
                        <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                          <span className="text-[var(--tema-yerel-rapor-islevsel-metin-06)]">+{formatPuan(u.kazanilan_toplam)}</span>
                          <span className="text-[var(--tema-yerel-rapor-islevsel-metin-07)]">−{formatPuan(u.kaybedilen_toplam)}</span>
                          <strong className="text-[var(--tema-yerel-rapor-eylem-metin-06)]">{formatPuan(u.net_puan)} p</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Öğrenme Aracı / Format Performansı Detay Tablosu (En Altta) */}
        <OgrenmeAraciPerformansi
          dagilim={data.arac_turu_dagilimi}
          periyotBasligi={PERIYOT_BASLIK[periyot]}
        />
        </>
      )}
      </div>
      <UretimVaryantlariModal
        acik={varyantModalAcik}
        onKapat={() => setVaryantModalAcik(false)}
      />
    </div>
  );
}
