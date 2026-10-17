// components/cc-ligi/CcTakimLigAkordeonu.tsx
//
// Yönetici / GM C-Club Ligi 2 Kademeli Hiyerarşik Takım Akordiyonu:
//   1. Kademe: Takımlar Ligi (Sıra, Takım Adı, Aktif BM, Kazanım, Kayıp, Net CC Puanı)
//   2. Kademe: Açılan Takımın Bölge Müdürleri (BM) ve detaylı CC karnesi.
//
// Veriler doğrudan istemci tarafında gruplanır.

'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Layers, MapPin, Trophy, User, Users } from 'lucide-react';
import { formatPuan } from '@/lib/utils/raporUtils';
import type { LigSatiri } from '@/components/cc-ligi/CcLigiTablosu';
import SayfaRehberi from '@/components/rehber/SayfaRehberi';
import bmStyles from '@/app/(panel)/raporlar/bm/bm-report.module.css';
import styles from '@/app/(panel)/raporlar/utt/utt-report.module.css';

interface Props {
  satirlar: (LigSatiri & { takim_adi?: string; bolge_adi?: string })[];
  yukleniyor: boolean;
  aciklama?: string;
}

interface BmSatiri extends LigSatiri {
  takim_adi?: string;
  bolge_adi?: string;
  sira: number;
  kazanim: number;
  kayip: number;
}

interface TakimGrup {
  takim_id: string;
  takim_adi: string;
  toplam_bm: number;
  aktif_bm: number;
  kazanim: number;
  kayip: number;
  net: number;
  sira: number;
  bmler: BmSatiri[];
}

function hesaplaKazanim(s: LigSatiri) {
  return (
    Number(s.izleme_puani || 0) +
    Number(s.cevaplama_puani || 0) +
    Number(s.extra_puani || 0) +
    Number(s.cc_gonderme_puani || 0) +
    Number(s.cc_referral_puani || 0)
  );
}

function hesaplaKayip(s: LigSatiri) {
  return Number(s.ileri_sarma_kaybi || 0)
    + Number(s.yanlis_cevap_kaybi || 0)
    + Number(s.challenge_kaybi || 0);
}

export default function CcTakimLigAkordeonu({
  satirlar,
  yukleniyor,
  aciklama = 'Şirket genelindeki takımların ve bağlı Bölge Müdürlüklerinin (BM) C-Club Ligi performansı',
}: Props) {
  const [acikTakim, setAcikTakim] = useState<string | null>(null);
  const [acikBm, setAcikBm] = useState<string | null>(null);

  const takimlar = useMemo(() => {
    const takimMap = new Map<string, { takim_adi: string; satirlar: (LigSatiri & { takim_adi?: string; bolge_adi?: string })[] }>();

    for (const s of satirlar) {
      const tId = s.takim_id || 'diger_takim';
      const tAd = s.takim_adi || 'Genel Takım';
      const mevcut = takimMap.get(tId) ?? { takim_adi: tAd, satirlar: [] };
      mevcut.satirlar.push(s);
      takimMap.set(tId, mevcut);
    }

    const takimListesi = [...takimMap.entries()].map(([tId, tData]) => {
      let tKazanim = 0;
      let tKayip = 0;
      let tAktif = 0;

      const bmSirali = tData.satirlar
        .map((bm) => {
          const k = hesaplaKazanim(bm);
          const z = hesaplaKayip(bm);
          const net = Number(bm.toplam_net_puan ?? (k - z));
          tKazanim += k;
          tKayip += z;
          if (k + z > 0) tAktif++;
          return {
            ...bm,
            kazanim: k,
            kayip: z,
            toplam_net_puan: net,
            sira: 0,
          };
        })
        .sort((a, b) => b.toplam_net_puan - a.toplam_net_puan);

      // BM sıraları
      let sonPuan = -Infinity;
      let sonSira = 0;
      const bmler: BmSatiri[] = bmSirali.map((bm, index) => {
        if (bm.toplam_net_puan !== sonPuan) {
          sonSira = index + 1;
          sonPuan = bm.toplam_net_puan;
        }
        return { ...bm, sira: sonSira };
      });

      return {
        takim_id: tId,
        takim_adi: tData.takim_adi,
        toplam_bm: tData.satirlar.length,
        aktif_bm: tAktif,
        kazanim: tKazanim,
        kayip: tKayip,
        net: tKazanim - tKayip,
        sira: 0,
        bmler,
      };
    });

    takimListesi.sort((a, b) => b.net - a.net);

    let sonTPuan = -Infinity;
    let sonTSira = 0;
    return takimListesi.map((t, index) => {
      if (t.net !== sonTPuan) {
        sonTSira = index + 1;
        sonTPuan = t.net;
      }
      return { ...t, sira: sonTSira };
    });
  }, [satirlar]);

  if (yukleniyor) {
    return (
      <div className="rounded-2xl border border-[var(--tema-akordiyon-cc-cizgi)] bg-[var(--tema-akordiyon-yuzey)] p-12 text-center text-sm font-bold text-[var(--tema-akordiyon-cc-aciklama)]">
        C-Club Takımlar Ligi yükleniyor...
      </div>
    );
  }

  if (takimlar.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--tema-akordiyon-cc-cizgi)] bg-[var(--tema-akordiyon-yuzey)] p-12 text-center text-sm font-bold text-[var(--tema-akordiyon-cc-aciklama)]">
        Bu periyotta sıralama verisi bulunmuyor.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--tema-akordiyon-cc-simge-zemin)] text-[var(--tema-akordiyon-eylem)]">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[var(--tema-akordiyon-cc-baslik)]">C-Club Takımlar Ligi</h3>
            <p className="text-[11px] font-semibold text-[var(--tema-akordiyon-cc-aciklama)]">{aciklama}</p>
          </div>
        </div>
        <SayfaRehberi anahtar="cclub-ligi" />
      </div>

      <div className="space-y-3">
        {takimlar.map((takim) => {
          const takimAcik = acikTakim === takim.takim_id;
          const katilimYuzdesi = takim.toplam_bm > 0 ? Math.round((takim.aktif_bm / takim.toplam_bm) * 100) : 0;

          return (
            <div
              key={takim.takim_id}
              className="overflow-hidden rounded-2xl border border-[var(--tema-akordiyon-cc-kart-cizgi)] bg-[var(--tema-akordiyon-yuzey)] shadow-[0_2px_8px_var(--tema-akordiyon-cc-kart-golge)] transition-all"
            >
              {/* 1. KADEME: TAKIM KARTI */}
              <button
                type="button"
                onClick={() => {
                  setAcikTakim(takimAcik ? null : takim.takim_id);
                  setAcikBm(null);
                }}
                className={`flex w-full items-center justify-between gap-4 p-4 text-left transition-colors ${
                  takimAcik ? 'bg-[var(--tema-akordiyon-cc-takim-acik)] border-b border-[var(--tema-akordiyon-cc-ic-cizgi)]' : 'hover:bg-[var(--tema-akordiyon-cc-hover)]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                      takim.sira === 1
                        ? 'bg-[var(--tema-lig-sira-altin-zemin)] text-[var(--tema-lig-sira-cc-altin)] border border-[var(--tema-lig-sira-altin-cizgi)]'
                        : takim.sira === 2
                        ? 'bg-[var(--tema-lig-sira-gumus-zemin)] text-[var(--tema-lig-sira-gumus-metin)] border border-[var(--tema-lig-sira-gumus-cizgi)]'
                        : takim.sira === 3
                        ? 'bg-[var(--tema-lig-sira-bronz-zemin)] text-[var(--tema-lig-sira-cc-bronz)] border border-[var(--tema-lig-sira-bronz-cizgi)]'
                        : 'bg-[var(--tema-akordiyon-ic-soluk-zemin)] text-[var(--tema-akordiyon-ikincil-metin)] border border-[var(--tema-akordiyon-sira-cizgi)]'
                    }`}
                  >
                    #{takim.sira}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base tracking-[-0.01em] text-[var(--tema-akordiyon-cc-baslik)] truncate">
                        {takim.takim_adi}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--tema-akordiyon-cc-katilim-zemini)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--tema-akordiyon-eylem)]">
                        <Users className="h-3 w-3" /> {takim.aktif_bm} / {takim.toplam_bm} Aktif BM (%{katilimYuzdesi})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-semibold text-[var(--tema-akordiyon-cc-aciklama)]">
                      <span>Kazanılan: <strong className="text-[var(--tema-akordiyon-cc-kazanim)]">+{formatPuan(takim.kazanim)}</strong></span>
                      <span>·</span>
                      <span>Kayıp: <strong className="text-[var(--tema-akordiyon-cc-kayip)]">−{formatPuan(takim.kayip)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--tema-akordiyon-cc-aciklama)]">Net CC Puanı</div>
                    <div className="text-lg font-black text-[var(--tema-akordiyon-cc-baslik)]">{formatPuan(takim.net)} p</div>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--tema-akordiyon-yuzey)] border border-[var(--tema-akordiyon-cc-ok-cizgi)] text-[var(--tema-akordiyon-cc-detay-etiket)]">
                    {takimAcik ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {/* 2. KADEME: AÇILAN TAKIMIN BÖLGE MÜDÜRLERİ */}
              {takimAcik && (
                <div className="p-4 space-y-3 bg-[var(--tema-akordiyon-cc-ic-zemin)]">
                  <div className="flex items-center justify-between px-2 pb-1 border-b border-[var(--tema-akordiyon-cc-ic-cizgi)]">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--tema-akordiyon-cc-detay-etiket)]">
                      {takim.takim_adi} Bölge Müdürlükleri ({takim.bmler.length} BM)
                    </span>
                    <span className="text-[10px] font-bold text-[var(--tema-akordiyon-cc-soluk-metin)]">Detay için BM satırına tıklayın</span>
                  </div>

                  <div className="space-y-2">
                    {takim.bmler.map((bm) => {
                      const bmAcik = acikBm === bm.kullanici_id;

                      return (
                        <div
                          key={bm.kullanici_id}
                          className="overflow-hidden rounded-xl border border-[var(--tema-akordiyon-cc-bm-cizgi)] bg-[var(--tema-akordiyon-yuzey)] transition-all shadow-[0_1px_3px_var(--tema-akordiyon-cc-bm-golge)]"
                        >
                          <button
                            type="button"
                            onClick={() => setAcikBm(bmAcik ? null : bm.kullanici_id)}
                            className={`flex w-full items-center justify-between gap-3 p-3 text-left transition-colors ${
                              bmAcik ? 'bg-[var(--tema-akordiyon-cc-bm-acik)]' : 'hover:bg-[var(--tema-akordiyon-cc-bm-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                  bm.sira === 1
                                    ? 'bg-[var(--tema-lig-sira-altin-zemin)] text-[var(--tema-lig-sira-cc-altin)]'
                                    : bm.sira === 2
                                    ? 'bg-[var(--tema-lig-sira-gumus-zemin)] text-[var(--tema-lig-sira-gumus-metin)]'
                                    : bm.sira === 3
                                    ? 'bg-[var(--tema-lig-sira-bronz-zemin)] text-[var(--tema-lig-sira-cc-bronz)]'
                                    : 'bg-[var(--tema-akordiyon-ic-soluk-zemin)] text-[var(--tema-akordiyon-ikincil-metin)]'
                                }`}
                              >
                                #{bm.sira}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-xs text-[var(--tema-akordiyon-cc-baslik)] truncate">
                                    {bm.ad} {bm.soyad}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded bg-[var(--tema-akordiyon-cc-bolge-zemini)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--tema-akordiyon-cc-bolge-metni)]">
                                    <MapPin className="h-2.5 w-2.5" /> {bm.bolge_adi || 'Bölge'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-[var(--tema-akordiyon-cc-soluk-metin)]">
                                  <span>Kazanılan: <strong className="text-[var(--tema-akordiyon-cc-kazanim)]">+{formatPuan(bm.kazanim)}</strong></span>
                                  <span>·</span>
                                  <span>Kayıp: <strong className="text-[var(--tema-akordiyon-cc-kayip)]">−{formatPuan(bm.kayip)}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="text-sm font-black text-[var(--tema-akordiyon-cc-baslik)]">{formatPuan(bm.toplam_net_puan)} p</span>
                              </div>
                              <div className="text-[var(--tema-akordiyon-cc-soluk-metin)]">
                                {bmAcik ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              </div>
                            </div>
                          </button>

                          {/* BM KARNE DETAYI */}
                          {bmAcik && (
                            <div className="p-3 border-t border-[var(--tema-akordiyon-cc-ic-cizgi)] bg-[var(--tema-akordiyon-cc-detay-zemini)] text-[11px]">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="rounded-lg bg-[var(--tema-akordiyon-yuzey)] border border-[var(--tema-akordiyon-cc-karne-cizgi)] p-2">
                                  <span className="block text-[9px] font-extrabold uppercase text-[var(--tema-akordiyon-cc-aciklama)]">Video İzleme</span>
                                  <strong className="text-xs font-black text-[var(--tema-akordiyon-cc-kazanim)]">+{formatPuan(bm.izleme_puani)} p</strong>
                                </div>
                                <div className="rounded-lg bg-[var(--tema-akordiyon-yuzey)] border border-[var(--tema-akordiyon-cc-karne-cizgi)] p-2">
                                  <span className="block text-[9px] font-extrabold uppercase text-[var(--tema-akordiyon-cc-aciklama)]">Doğru Cevap</span>
                                  <strong className="text-xs font-black text-[var(--tema-akordiyon-cc-kazanim)]">+{formatPuan(bm.cevaplama_puani)} p</strong>
                                </div>
                                <div className="rounded-lg bg-[var(--tema-akordiyon-yuzey)] border border-[var(--tema-akordiyon-cc-karne-cizgi)] p-2">
                                  <span className="block text-[9px] font-extrabold uppercase text-[var(--tema-akordiyon-cc-aciklama)]">CC Gönderim & Referral</span>
                                  <strong className="text-xs font-black text-[var(--tema-akordiyon-cc-kazanim)]">
                                    +{formatPuan(Number(bm.cc_gonderme_puani || 0) + Number(bm.cc_referral_puani || 0))} p
                                  </strong>
                                </div>
                                <div className="rounded-lg bg-[var(--tema-akordiyon-yuzey)] border border-[var(--tema-akordiyon-cc-karne-cizgi)] p-2">
                                  <span className="block text-[9px] font-extrabold uppercase text-[var(--tema-akordiyon-cc-aciklama)]">Davranış Kaybı</span>
                                  <strong className="text-xs font-black text-[var(--tema-akordiyon-cc-kayip)]">−{formatPuan(bm.kayip)} p</strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
