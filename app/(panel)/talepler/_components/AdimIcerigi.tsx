// app/talepler/_components/AdimIcerigi.tsx
//
// Bir adımın açılınca görünen içeriği. Senaryo metni, video önizlemesi ve soru
// listesi artık ayrı sayfalarda değil — talebin içindeki adımın kutusunda.
//
// Bu dosya DAĞITICIDIR: hangi adımsa onun kutusunu çizer, veri getirmez, durum
// yorumlamaz. Metinler ve bileşenler mevcut ortak katmandan gelir
// (SenaryoMetniGoster, VideoCercevesi, DosyaGoruntuleListesi) — hiçbiri kopyalanmaz.

"use client";

import { DosyaGoruntuleListesi, type DosyaItem } from "@/components/DosyaGoruntuleListesi";
import { SenaryoMetniGoster } from "@/components/SenaryoMetniGoster";
import { Pill, type PillRenk } from "@/components/pill";
import VideoOnizleme from "@/components/video/VideoOnizleme";
import OgrenmeAraciOnizleme from "@/components/ogrenme-araci/OgrenmeAraciOnizleme";
import type { IslemeDurumu } from "@/lib/video/islemeDurumu";
import type { AdimAnahtari } from "@/lib/utils/uretimSeridi";
import { ogrenmeAraciMetinleri } from "@/lib/ogrenmeAraci/etiketler";
import { HazirVideoYukleme } from "./HazirVideoYukleme";
import type { RevizyonNotu, TalepDetay, TalepSatiri } from "../_ureticiRolTypes";

interface Props {
  anahtar: AdimAnahtari;
  talep: TalepSatiri;
  detay: TalepDetay | null;
  detayYukleniyor: boolean;
  bunnyIslemeDurumu: IslemeDurumu;
  /** Hazır video yükleme alanı görünsün mü (V2/V4, video yok, sıra üreticide). */
  videoYuklenebilir: boolean;
  videoIsleniyor: boolean;
  videoYuzdesi: number | null;
  formatTarih: (tarih: string | null) => string;
  onHata: (mesaj: string, adim?: string, detay?: string) => void;
  onVideoYukle: (dosya: File) => void;
}

const Bos = ({ metin }: { metin: string }) => (
  <p className="text-sm text-[var(--tema-yerel-uretim-yardimci-metin-02)] m-0">{metin}</p>
);

// Şık rozetinin iki hâli. Pill ÖLÇÜYÜ sahiplenir, renk buradan gelir — sözlükte
// "doğru şık" diye bir kavram yok, bu yüzden renk merkezden değil buradan verilir.
const SIK_DOGRU: PillRenk = { bg: "var(--tema-yerel-uretim-secim-zemin-01)", metin: "var(--tema-yerel-uretim-eylem-metin-01)", kenar: "var(--tema-yerel-uretim-cizgi-04)" };
const SIK_NORMAL: PillRenk = { bg: "var(--tema-yerel-uretim-kart-02)", metin: "var(--tema-yerel-uretim-yardimci-metin-04)", kenar: "var(--tema-yerel-uretim-cizgi-05)" };

function RevizyonNotlari({ notlar, formatTarih }: { notlar: RevizyonNotu[]; formatTarih: (t: string | null) => string }) {
  if (notlar.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-1">
      <span className="text-xs font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-01)]">Revizyon notları</span>
      {notlar.map((n, i) => (
        <div key={i} className="text-xs text-[var(--tema-yerel-uretim-ana-metin-03)] bg-[var(--tema-yerel-uretim-kart-01)] border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-lg px-3 py-2">
          {n.notlar} <span className="text-[var(--tema-yerel-uretim-yardimci-metin-02)]">— {formatTarih(n.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

/** Talebin künye parametreleri — üretici bunları talep açarken seçiyor ama
 *  sonrasında hiçbir ekranda geriye dönük göremiyordu (D-6). */
function KunyeParametreleri({ talep }: { talep: TalepSatiri }) {
  const metin = ogrenmeAraciMetinleri(talep.ogrenme_araci_turu);
  const kutular = [
    { etiket: "Soru seti", deger: `${talep.soru_seti_buyuklugu} soru`, bg: "var(--tema-yerel-uretim-secim-zemin-02)", renk: "var(--tema-yerel-uretim-eylem-metin-02)", kenar: "var(--tema-yerel-uretim-cizgi-06)" },
    { etiket: "Seçenek", deger: `${talep.secenek_sayisi} seçenek`, bg: "var(--tema-yerel-uretim-islevsel-zemin-01)", renk: "var(--tema-yerel-uretim-islevsel-metin-03)", kenar: "var(--tema-yerel-uretim-islevsel-cizgi-01)" },
    { etiket: `${metin.ad} başı`, deger: `${talep.video_basi_soru_sayisi} soru`, bg: "var(--tema-yerel-uretim-islevsel-zemin-02)", renk: "var(--tema-yerel-uretim-islevsel-metin-04)", kenar: "var(--tema-yerel-uretim-islevsel-cizgi-02)" },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {kutular.map((k) => (
        <span
          key={k.etiket}
          className="text-[10px] px-2.5 py-1 rounded-full"
          style={{ background: k.bg, color: k.renk, border: `0.5px solid ${k.kenar}` }}
        >
          {k.etiket}: <strong>{k.deger}</strong>
        </span>
      ))}
    </div>
  );
}

export function AdimIcerigi({
  anahtar, talep, detay, detayYukleniyor, bunnyIslemeDurumu,
  videoYuklenebilir, videoIsleniyor, videoYuzdesi, formatTarih, onHata, onVideoYukle,
}: Props) {
  if (anahtar !== "talep" && detayYukleniyor) {
    return <Bos metin="Yükleniyor..." />;
  }

  switch (anahtar) {
    // ── Talep: açıklama + ek dosyalar + künye parametreleri (D-6) ──────────
    case "talep": {
      const dosyalar = (talep.dosya_urls ?? []) as DosyaItem[];
      return (
        <div className="flex flex-col gap-3">
          {talep.aciklama
            ? <p className="text-sm text-[var(--tema-yerel-uretim-ana-metin-03)] leading-relaxed m-0 whitespace-pre-wrap">{talep.aciklama}</p>
            : <Bos metin="Açıklama girilmedi." />}
          {dosyalar.length > 0 && <DosyaGoruntuleListesi dosyalar={dosyalar} onHata={onHata} />}
          <KunyeParametreleri talep={talep} />
        </div>
      );
    }

    // ── Senaryo: metin (önceki varsa farkıyla) + revizyon notları ──────────
    case "senaryo": {
      const s = detay?.senaryo;
      if (!s) return <Bos metin="Senaryonuz burada görünecek" />;
      return (
        <div>
          <SenaryoMetniGoster mevcut={s.metin} onceki={s.onceki_metin ?? undefined} />
          <RevizyonNotlari notlar={s.notlar} formatTarih={formatTarih} />
        </div>
      );
    }

    // ── Video / Öğrenme Aracı: oynatıcı + Bunny işlenme rozeti + revizyon notu ─
    case "video": {
      const v = detay?.video;
      const metin = ogrenmeAraciMetinleri(talep.ogrenme_araci_turu);
      if (videoIsleniyor) {
        return (
          <div className="rounded-lg border border-[var(--tema-yerel-uretim-cizgi-07)] bg-[var(--tema-yerel-uretim-secim-zemin-03)] px-3 py-3">
            <p className="m-0 text-sm font-semibold text-[var(--tema-yerel-uretim-eylem-metin-03)]">{metin.ad} işleniyor</p>
          </div>
        );
      }
      // V2/V4: öğrenme aracı henüz yokken sıra ÜRETİCİDEDİR — yükleme alanı burada açılır,
      // talep sayfasından çıkmaya gerek kalmaz.
      if (videoYuklenebilir) {
        return <HazirVideoYukleme yuzde={videoYuzdesi} onYukle={onVideoYukle} ogrenmeAraciTuru={talep.ogrenme_araci_turu} />;
      }

      // Video dışı öğrenme araçları (Podcast, Dijital Broşür, Literatür)
      if (talep.ogrenme_araci_turu !== "video") {
        if (detay?.ogrenme_araci?.arac_id) {
          return (
            <div>
              <OgrenmeAraciOnizleme
                yayinId={detay.ogrenme_araci.arac_id}
                aracId={detay.ogrenme_araci.arac_id}
                aracTuru={talep.ogrenme_araci_turu}
                urunAdi={talep.urun_adi ?? metin.ad}
                hata={onHata}
                onBitti={() => {}}
              />
              <RevizyonNotlari notlar={detay.ogrenme_araci.notlar} formatTarih={formatTarih} />
            </div>
          );
        }
        return (
          <div className="aspect-video rounded-lg border border-[var(--tema-yerel-uretim-cizgi-01)] bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] flex flex-col items-center justify-center gap-2 text-[var(--tema-yerel-uretim-yardimci-metin-02)]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M10 9.5 L15 12 L10 14.5 Z" fill="currentColor" stroke="none" />
            </svg>
            <span className="text-sm">{metin.ad} içeriğiniz burada gösterilecek</span>
          </div>
        );
      }

      if (!v || !v.video_url) return (
        <div className="aspect-video rounded-lg border border-[var(--tema-yerel-uretim-cizgi-01)] bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] flex flex-col items-center justify-center gap-2 text-[var(--tema-yerel-uretim-yardimci-metin-02)]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M10 9.5 L15 12 L10 14.5 Z" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-sm">{metin.ad} içeriğiniz burada gösterilecek</span>
        </div>
      );
      return (
        <div>
          {bunnyIslemeDurumu === "isleniyor" && (
            <div className="mb-2.5 bg-[var(--tema-yerel-uretim-secim-zemin-03)] border border-[var(--tema-yerel-uretim-cizgi-07)] rounded-lg px-3 py-2">
              <p className="text-xs text-[var(--tema-yerel-uretim-eylem-metin-03)] m-0">
                {metin.ad} işleniyor
              </p>
            </div>
          )}
          {bunnyIslemeDurumu === "hatali" && (
            <div className="mb-2.5 bg-[var(--tema-yerel-uretim-islevsel-zemin-03)] border border-[var(--tema-yerel-uretim-islevsel-cizgi-03)] rounded-lg px-3 py-2">
              <p className="text-xs text-[var(--tema-yerel-uretim-islevsel-metin-05)] m-0">
                {metin.ad} işlenemedi — dosya bozuk olabilir.
              </p>
            </div>
          )}
          <VideoOnizleme
            videoUrl={v.video_url}
            className="rounded-lg border border-[var(--tema-yerel-uretim-cizgi-01)]"
            ariaLabel={`${metin.ad} oynat`}
          />
          <RevizyonNotlari notlar={v.notlar} formatTarih={formatTarih} />
        </div>
      );
    }

    // ── Soru seti: soru listesi + revizyon notu ────────────────────────────
    case "soru_seti": {
      const ss = detay?.soru_seti;
      if (!ss || ss.sorular.length === 0) return <Bos metin="Soru setiniz burada gösterilecek" />;
      return (
        <div>
          <div className="flex flex-col gap-2 max-h-80 overflow-auto">
            {ss.sorular.map((soru, i) => (
              <div key={i} className="px-3 py-2.5 bg-[var(--tema-yerel-uretim-kart-01)] rounded-lg border border-[var(--tema-yerel-uretim-cizgi-01)]">
                <p className="text-xs text-[var(--tema-yerel-uretim-ana-metin-03)] font-semibold m-0 mb-1.5">{i + 1}. {soru.soru_metni}</p>
                {/* Ölçü pill merkezinden (27.07 kararı): yazı boyu, dolgu, kenar
                    ve satır yüksekliği burada YAZILMAZ. sarabilir: şık metni uzun
                    olabilir, tek satırda kalıp taşmasın. */}
                <div className="flex flex-col gap-1">
                  {soru.secenekler?.map((sec, j) => (
                    <Pill key={j} renk={sec.dogru ? SIK_DOGRU : SIK_NORMAL} sarabilir className="w-fit">
                      {sec.harf}. {sec.metin}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <RevizyonNotlari notlar={ss.notlar} formatTarih={formatTarih} />
        </div>
      );
    }

    // Yayın adımının kutusu yoktur: durumu şeritte görünüyor, işlem kendi sayfasında (D-3).
    default:
      return null;
  }
}
