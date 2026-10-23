// app/(panel)/raporlar/uretim/page.tsx
//
// Üretim Raporları Sayfası (Üretim & Yayın Grubu).
// Yönetici ve Üretici rolleri için şirketteki içerik fabrikasının (Pazarlama, Medikal, Eğitim, İK)
// üretim hacmini, varyant dağılımını, eğitim portföyünü ve ürün bazlı etki değerlerini sunar.

'use client';

import { panelBaslangici } from "@/lib/panel/baslangic";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpenCheck,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUretimRaporu } from './_hooks/useUretimRaporu';
import { YenileButonu } from '@/components/ui/yenile-butonu';
import RaporPeriyotSecici from '@/components/raporlar/RaporPeriyotSecici';
import { formatPuan, type Periyot } from '@/lib/utils/raporUtils';
import SayfaRehberi from '@/components/rehber/SayfaRehberi';
import UretimVaryantlariModal from '@/components/rehber/UretimVaryantlariModal';
import OgrenmeAraciPerformansi from '@/components/raporlar/OgrenmeAraciPerformansi';
import YayinKonuPerformansi from '@/components/raporlar/YayinKonuPerformansi';
import { ureticiYetenegi } from '@/lib/uretici/yetenekler';
import styles from '../utt/utt-report.module.css';
import raporStyles from './yayin-raporlari.module.css';
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import { SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";

const RAPOR_ROLLERI = [
  { anahtar: 'tumu', etiket: 'Tümü' },
  { anahtar: 'utt', etiket: 'Temsilci' },
  { anahtar: 'bm', etiket: 'BM' },
  { anahtar: 'eczaci', etiket: 'Eczacı' },
  { anahtar: 'eczane_teknisyeni', etiket: 'Eczane Teknisyeni' },
  { anahtar: 'eczanem', etiket: 'Eczanem Üyesi' },
] as const;

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

const VARYANT_ROZETLERI: Record<string, { etiket: string }> = {
  normal: { etiket: 'V1' },
  hazir_video: { etiket: 'V2' },
  hazir_set: { etiket: 'V3' },
  hazir_ikisi: { etiket: 'V4' },
};

export default function UretimRaporlariPage() {
  const { kullanici } = useAuth();
  const [periyot, setPeriyot] = useState<Periyot>(DEFAULT_PERIYOT);
  const [seciliRaporRolu, setSeciliRaporRolu] = useState<typeof RAPOR_ROLLERI[number]['anahtar']>('tumu');
  const [seciliEgitimTuru, setSeciliEgitimTuru] = useState<string | null | undefined>(undefined);
  const [varyantModalAcik, setVaryantModalAcik] = useState(false);

  const { data, yenileniyor, error, yenile } = useUretimRaporu(
    periyot,
    kullanici?.id,
    seciliRaporRolu,
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

  const ureticiEgitimDetaylari = useMemo(() => {
    if (!data?.egitim_turu_etkisi || !ureticiYeteneği) return [];
    return ureticiYeteneği.acabilecegiTalepTurleri
      .map((tur) => data.egitim_turu_etkisi.find((detay) => detay.egitim_turu === tur))
      .filter((detay): detay is NonNullable<typeof detay> => detay != null);
  }, [data, ureticiYeteneği]);

  return (
    <div className={styles.page} style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className={styles.container}>
        <Link href={panelBaslangici(kullanici?.rol).yol} className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-10)] hover:text-[var(--tema-yerel-rapor-eylem-metin-06)]">
          <ArrowLeft className="h-3.5 w-3.5" /> {panelBaslangici(kullanici?.rol).etiket}
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
        />

        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
          <SadeKontrolGrubu tur="sekme" aria-label="Rapor hedef kitlesi" className={`min-w-0 max-w-full ${raporStyles.rolFiltreleri}`}>
            {RAPOR_ROLLERI.map((rol) => (
              <SadeKontrolButonu
                key={rol.anahtar}
                aria-pressed={seciliRaporRolu === rol.anahtar}
                onClick={() => setSeciliRaporRolu(rol.anahtar)}
              >
                {rol.etiket}
              </SadeKontrolButonu>
            ))}
          </SadeKontrolGrubu>
          <div className="min-w-0 max-w-full shrink-0">
            <RaporPeriyotSecici deger={periyot} onDegistir={setPeriyot} />
          </div>
        </div>

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
        <div className="mb-4">
          {/* Varyant Dağılımı Kartı */}
          <section className={raporStyles.varyantPanel}>
            <header className={raporStyles.varyantBaslik}>
              <div>
                <h2>Yayın Üretim Yöntemleri (Varyantlar) ve Dağılımları</h2>
                <p>Yayınlarınızın üretim yöntemleri <button type="button" className={raporStyles.varyantBaglantisi} onClick={() => setVaryantModalAcik(true)} aria-label="Varyant açıklamalarını göster">(varyantları)</button> ve dağılımlarını görebilirsiniz.</p>
              </div>
              <button
                type="button"
                onClick={() => setVaryantModalAcik(true)}
                className={raporStyles.varyantRehber}
                aria-label="Üretim varyantlarını göster"
                title="Üretim varyantları"
              >
                <Layers aria-hidden="true" />
              </button>
            </header>
            {(() => {
              const toplamVaryant = data.uretim.varyantlar.reduce((toplam, v) => toplam + v.adet, 0);
              return (
                <div className={raporStyles.varyantlar}>
                  {data.uretim.varyantlar.map((v) => {
                    const yuzde = toplamVaryant > 0 ? Math.round((v.adet / toplamVaryant) * 100) : 0;
                    const rozet = VARYANT_ROZETLERI[v.kod];
                    return (
                      <article
                        key={v.kod}
                        data-varyant={v.kod}
                        className={raporStyles.varyantKarti + " " + (raporStyles[v.kod] ?? "")}
                        aria-label={(rozet?.etiket ?? v.ad) + ", " + v.adet + " yayın, yüzde " + yuzde}
                      >
                        <div className={raporStyles.varyantYontem}>
                          {rozet && <span className={raporStyles.varyantRozet}>{rozet.etiket}</span>}
                          <span className={raporStyles.varyantAciklama}>{VARYANT_ADLARI[v.kod] ?? v.ad}</span>
                        </div>
                        <div className={raporStyles.varyantSayilar}>
                          <div className={raporStyles.varyantAdet}>{v.adet.toLocaleString('tr-TR')}<span> yayın</span></div>
                          <span className={raporStyles.varyantYuzde}>%{yuzde}</span>
                        </div>
                        <div
                          className={raporStyles.varyantCubuk}
                          role="progressbar"
                          aria-label={(rozet?.etiket ?? v.ad) + " yayın payı"}
                          aria-valuenow={yuzde}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div className={raporStyles.varyantDolgu} style={{ width: yuzde + "%" }} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </div>

        {/* Yayın Konusu ve Saha Etkisi (6 Sütun Tek Satır) */}
        <section className={ureticiRaporu ? "mb-4" : styles.panel + " " + styles.section}>
          {!ureticiRaporu && (
            <>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className="text-base font-extrabold text-[var(--tema-yerel-rapor-ana-metin-06)]">Yayın Konusu ve Saha Etkisi</h2>
                  <p className="mt-0.5 text-[11px] font-medium text-[var(--tema-yerel-rapor-yardimci-metin-08)]">
                    Yayınlarınızdan kazanılan net puanları görebilirsiniz
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
          ).map((egitimDetayi) => (
            <YayinKonuPerformansi
              key={JSON.stringify([kullanici?.id, periyot, seciliRaporRolu, egitimDetayi.egitim_turu])}
              detay={egitimDetayi}
              onKapat={ureticiRaporu ? undefined : () => setSeciliEgitimTuru(null)}
            />
          ))}
        </section>

        {/* Öğrenme Aracı / Format Performansı Detay Tablosu (En Altta) */}
        <OgrenmeAraciPerformansi
          key={JSON.stringify([kullanici?.id, periyot, seciliRaporRolu, data.arac_turu_tarih_araligi])}
          dagilim={data.arac_turu_dagilimi}
          aciklama="Yayın araçlarının performanslarını detaylı analiz edebilirsiniz"
          periyotBasligi={PERIYOT_BASLIK[periyot]}
          detayKapsami={data.arac_turu_tarih_araligi ? {
            ...data.arac_turu_tarih_araligi, periyot,
            raporRolu: seciliRaporRolu,
          } : undefined}
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
