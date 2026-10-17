"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { yayinDetayModaliGorebilir } from "@/lib/utils/roller";
import type { AracTuruRaporSatiri } from "@/lib/rapor/paylasilan/aracTuruDagilimi";
import { Video, Headphones, Image as ImageIcon, BookOpen, Users, Sparkles, ExternalLink, Info } from "lucide-react";
import YayinDetayModal from "./YayinDetayModal";

const ADLAR: Record<AracTuruRaporSatiri["arac_turu"], string> = {
  video: "Video",
  podcast: "Podcast",
  gorsel: "Dijital Broşür",
  flip_pdf: "Literatür",
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

const ROL_KISA_ADLARI: Record<string, string> = {
  utt: "UTT",
  kd_utt: "KD-UTT",
  temsilci: "UTT",
  bm: "BM",
  tm: "TM",
  eczaci: "Eczacı",
  ikinci_eczaci: "2. Eczacı",
  yardimci_eczaci: "Yrd. Eczacı",
  eczane_teknisyeni: "Teknisyen",
  teknisyen: "Teknisyen",
  musteri: "Danışan",
  eczanem: "Danışan",
  yonetici: "Yönetici",
  diger: "Diğer",
};

const oran = (deger: number | null) => deger === null ? "—" : `%${deger.toLocaleString("tr-TR")}`;
const sayi = (deger: number) => (deger ?? 0).toLocaleString("tr-TR");

export default function OgrenmeAraciPerformansi({
  dagilim,
  periyotBasligi = "Seçili Dönem",
}: {
  dagilim?: AracTuruRaporSatiri[];
  periyotBasligi?: string;
}) {
  const { kullanici } = useAuth();
  const [seciliYayinId, setSeciliYayinId] = useState<string | null>(null);

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
      </div>

      {/* 4 Format Kartı */}
      <div className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
        {dagilim.map((satir) => {
          const tema = ARAC_TEMASI[satir.arac_turu];
          const Icon = tema.icon;
          const rollerListesi = Object.entries(satir.roller ?? {}).filter(
            ([_, m]) => (m.tamamlama ?? 0) > 0 || (m.baslatma ?? 0) > 0 || (m.kazanilan_puan ?? 0) > 0
          );
          const tamamlamaOrani =
            satir.baslatma > 0
              ? Math.min(100, Math.round((satir.tamamlama / satir.baslatma) * 100))
              : null;
          const netPuanYuzdesi =
            toplamTumAraclarNetPuan > 0 && satir.net_kazanilan_puan > 0
              ? Math.round((satir.net_kazanilan_puan / toplamTumAraclarNetPuan) * 100)
              : null;

          return (
            <div
              key={satir.arac_turu}
              className="flex flex-col justify-between rounded-2xl border border-[var(--tema-yerel-rapor-cizgi-09)] bg-[var(--tema-yerel-rapor-sayfa-zemini-17)] p-4 transition-all hover:border-[var(--tema-yerel-rapor-cizgi-44)] hover:shadow-[0_6px_20px_var(--tema-yerel-rapor-golge-15)]"
            >
              <div>
                {/* Kart Üst Başlığı */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: tema.acikRenk, color: tema.renk }}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <strong className="text-sm font-extrabold text-[var(--tema-yerel-rapor-ana-metin-07)]">
                      {ADLAR[satir.arac_turu]}
                    </strong>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${tema.badgeRenk}`}>
                    {sayi(satir.yayin_sayisi)} Yeni Yayın · {periyotBasligi}
                  </span>
                </div>

                {/* Ana Rakam: Toplam Tüketim */}
                <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-34)] bg-[var(--tema-yerel-rapor-kart-04)] p-3 mb-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-rapor-yardimci-metin-64)]">
                    {periyotBasligi} Kümülatif Tüketim
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <strong className="text-2xl font-black tabular-nums text-[var(--tema-yerel-rapor-ana-metin-07)]">
                      {sayi(satir.tamamlama)}
                    </strong>
                    {tamamlamaOrani !== null && (
                      <span className="text-[11px] font-extrabold text-[var(--tema-yerel-rapor-islevsel-metin-06)]">
                        %{tamamlamaOrani} Tamamlama
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-[var(--tema-yerel-rapor-yardimci-metin-65)]">
                    <span>{sayi(satir.baslatma)} Başlatma</span>
                    <span>Yeni yayın puanı: {sayi(satir.kayitli_arac_puani)} p</span>
                  </div>
                </div>

                {/* Puan Dengesi (Kazanılan / Kaybedilen / Net Puan + % Payı) */}
                <div className="rounded-xl border border-[var(--tema-yerel-rapor-cizgi-34)] bg-[var(--tema-yerel-rapor-kart-04)] p-2.5 mb-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-14)] mb-1">
                    <span>{periyotBasligi} Oluşan Puan</span>
                    <div className="flex items-center gap-1.5">
                      {netPuanYuzdesi !== null && (
                        <span className="rounded bg-[var(--tema-yerel-rapor-secim-zemin-01)] px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--tema-yerel-rapor-eylem-metin-06)]" title="Tüm araçların net puanı içindeki payı">
                          %{netPuanYuzdesi} Pay
                        </span>
                      )}
                      <strong className="text-xs font-black text-[var(--tema-yerel-rapor-eylem-metin-06)]">
                        {sayi(satir.net_kazanilan_puan)} p Net
                      </strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-extrabold pt-1 border-t border-[var(--tema-yerel-rapor-cizgi-45)]">
                    <span className="text-[var(--tema-yerel-rapor-islevsel-metin-06)]">+{sayi(satir.kazanilan_puan)}</span>
                    <span className="text-[var(--tema-yerel-rapor-islevsel-metin-07)]">−{sayi(satir.kaybedilen_puan)}</span>
                  </div>
                </div>

                {/* Rol Tüketim Önizlemesi */}
                {rollerListesi.length > 0 ? (
                  <div className="mb-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-rapor-yardimci-metin-08)] mb-1.5 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>ROL TÜKETİM SAYILARI</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rollerListesi.slice(0, 3).map(([rol, m]) => {
                        const rolKisa = ROL_KISA_ADLARI[rol] ?? rol.toUpperCase();
                        const rolAdi = ROL_ADLARI[rol] ?? rol;
                        return (
                          <span
                            key={rol}
                            className="inline-flex items-center gap-1 rounded-md bg-[var(--tema-yerel-rapor-secim-zemin-14)] px-2 py-0.5 text-[10px] font-bold text-[var(--tema-yerel-rapor-ana-metin-21)]"
                            title={`${rolAdi}: ${sayi(m.tamamlama)} tamamlama`}
                          >
                            <span>{rolKisa}</span>
                            <strong className="text-[var(--tema-yerel-rapor-ana-metin-07)]">{sayi(m.tamamlama)}</strong>
                          </span>
                        );
                      })}
                      {rollerListesi.length > 3 && (
                        <span className="rounded-md bg-[var(--tema-yerel-rapor-secim-zemin-14)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--tema-yerel-rapor-yardimci-metin-64)]">
                          +{rollerListesi.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] font-medium text-[var(--tema-yerel-rapor-yardimci-metin-66)] italic py-1 mb-2">
                    Dönemde henüz tüketim kaydı yok.
                  </div>
                )}
              </div>
            </div>
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
              className="group rounded-xl border border-[var(--tema-yerel-rapor-cizgi-28)] bg-[var(--tema-yerel-rapor-kart-04)] p-3 transition-all hover:border-[var(--tema-yerel-rapor-cizgi-44)]"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-extrabold text-[var(--tema-yerel-rapor-ana-metin-22)]">
                <div className="flex items-center gap-1.5 truncate mr-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: tema.renk }} />
                  <span className="truncate">{ADLAR[satir.arac_turu]}, {periyotBasligi} Etkileşim Detayları</span>
                </div>
                <span className="rounded-md bg-[var(--tema-yerel-rapor-secim-zemin-15)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--tema-yerel-rapor-eylem-metin-06)] shrink-0">
                  {satir.yayinlar.length}
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
                    <span>{periyotBasligi} Etkileşim Alan Yayınlar ({satir.yayinlar.length})</span>
                  </div>

                  {/* Sabit 2 Sütunlu Alt Başlık Satırı */}
                  <div className="flex items-center justify-between px-2 py-1 mb-1 text-[9px] font-extrabold uppercase tracking-wider text-[var(--tema-yerel-rapor-yardimci-metin-08)] border-b border-[var(--tema-yerel-rapor-cizgi-27)] bg-[var(--tema-yerel-rapor-sayfa-zemini-03)] rounded-t">
                    <span>Yayın ID</span>
                    <span>Tamamlama - Puan</span>
                  </div>

                  {satir.yayinlar.length === 0 ? (
                    <div className="text-[10px] text-[var(--tema-yerel-rapor-yardimci-metin-66)] italic px-2 py-1">Bu dönemde etkileşim alan yayın yok.</div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {satir.yayinlar.map((y) => (
                        <div
                          key={y.yayin_id}
                          className="flex items-center justify-between gap-1 rounded bg-[var(--tema-yerel-rapor-sayfa-zemini-03)] px-2 py-1 text-[10px] border border-[var(--tema-yerel-rapor-cizgi-27)] hover:bg-[var(--tema-yerel-rapor-secim-zemin-01)] transition-colors"
                        >
                          {modalYetkili ? (
                            <button
                              type="button"
                              onClick={() => setSeciliYayinId(y.yayin_id)}
                              className="font-extrabold text-[var(--tema-yerel-rapor-eylem-metin-06)] hover:underline truncate flex items-center gap-1 text-left cursor-pointer focus-visible:outline-none"
                              title={`${y.talep_no ?? y.yayin_id} — Yayın detayını ve soruları aç`}
                            >
                              <span>{y.talep_no ?? y.yayin_id.slice(0, 8)}</span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0 text-[var(--tema-yerel-rapor-yardimci-metin-14)]" />
                            </button>
                          ) : (
                            <span
                              className="font-bold text-[var(--tema-yerel-rapor-ana-metin-06)] truncate"
                              title={String(y.talep_no ?? y.yayin_id)}
                            >
                              {y.talep_no ?? y.yayin_id.slice(0, 8)}
                            </span>
                          )}
                          <span className="tabular-nums text-[var(--tema-yerel-rapor-yardimci-metin-27)] shrink-0 font-medium">
                            {sayi(y.tamamlama)} tamamlama ·{" "}
                            <strong className="text-[var(--tema-yerel-rapor-ana-metin-07)] font-bold">
                              {sayi(y.kazanilan_puan - y.kaybedilen_puan)} p
                            </strong>
                          </span>
                        </div>
                      ))}
                    </div>
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
