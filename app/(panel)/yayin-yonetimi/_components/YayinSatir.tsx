// app/yayin-yonetimi/_components/YayinSatir.tsx
//
// Yayınlanmış/durdurulmuş bir içeriğin satırı: ürün/teknik bilgisi, video önizleme,
// yayın tarihi, tekrar sayacı rozeti (periyotlu yayınlarda), ileri sarma toggle'ı,
// soru seti akordiyonu ve Durdur/Başlat butonu.
//
// Davranış orijinal page.tsx ile birebir aynıdır.

"use client";

import { useState } from "react";
import type { Yayin, OnizlemeHedefi } from "../_types";
import type { Soru } from "@/app/(panel)/talepler/_types";
import type { HesaplananTur } from "@/lib/tclub/tur/kayit";
import { HedefRolPilleri } from "@/components/pill";
import { yalnizEclubHedefliMi } from "@/lib/utils/roller";
import { talepIdGoster } from "@/lib/utils/talepId";
import { ureticiDurumMesaji, yayinDurumKodu } from "@/lib/utils/durum/mesaj";
import { yayinThumbnailIstemciCoz } from "@/lib/ogrenmeAraci/thumbnailIstemci";
import { VideoThumb } from "./Yardimcilar";
import { SoruListesi } from "./SoruListesi";
import { AracVarsayilanKapak } from "@/components/ogrenme-araci/AracVarsayilanKapak";

interface YayinSatirProps {
  y: Yayin;
  islemLoading: string | null;
  acikAkordiyon: string | null;
  setAcikAkordiyon: (v: string | null) => void;
  formatTarih: (tarih: string) => string;
  tekrarBilgi?: HesaplananTur;
  getSoruPuani: (soru_seti_durum_id: string, soru_index: number) => number | "";
  setSoruPuani: (soru_seti_durum_id: string, soru_index: number, puan: number) => void;
  hepsineAyniPuanAta: (soru_seti_durum_id: string, sorular: Soru[], puan: number) => void;
  onVideoAc: (url: string) => void;
  onOnizle?: (hedef: OnizlemeHedefi) => void;
  onDurumDegistir: (yayin_id: string, mevcutDurum: string) => void;
  kartGorunumu?: boolean;
  // Planlanmış yayın aksiyonları (İş 2): tarih_degistir | hemen_yayinla | plan_iptal
  onPlanIslem?: (yayin_id: string, islem: string, yayin_gunu?: string) => void;
}

const GUN_MS = 24 * 60 * 60 * 1000;
const eclubBilgiPili = "max-w-full rounded-md border border-[var(--tema-yerel-uretim-cizgi-46)] bg-[var(--tema-yerel-uretim-sayfa-zemini-11)] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[var(--tema-yerel-uretim-ana-metin-25)] sm:text-[8px]";
const eclubBaremPili = "max-w-full rounded-md border border-[var(--tema-yerel-uretim-cizgi-46)] bg-[var(--tema-yerel-uretim-sayfa-zemini-11)] px-1.5 py-0.5 text-[9px] font-normal leading-tight text-[var(--tema-yerel-uretim-ana-metin-25)] sm:text-[7px]";

/** Sonraki tura kalan tam gün (yukarı yuvarlanır; geçmişse 0). */
function kalanGun(sonrakiTurTarihi: string): number {
  return Math.max(0, Math.ceil((new Date(sonrakiTurTarihi).getTime() - Date.now()) / GUN_MS));
}

export function YayinSatir({
  y, islemLoading, acikAkordiyon, setAcikAkordiyon, formatTarih, tekrarBilgi,
  getSoruPuani, setSoruPuani, hepsineAyniPuanAta,
  onVideoAc, onOnizle, onDurumDegistir, kartGorunumu = false, onPlanIslem,
}: YayinSatirProps) {
  const yayinda = y.durum === "yayinda";
  const planlandi = y.durum === "planlandi";
  const durum = ureticiDurumMesaji(yayinDurumKodu(y.durum), y.yayin_tarihi);
  const tekrarli = !!tekrarBilgi?.tekrar_periyot_gun && !!tekrarBilgi?.sonraki_tur_tarihi;
  // Tarih değiştirme alanı (yalnız planlanmış yayında görünür)
  const [yeniGun, setYeniGun] = useState("");
  const [hataliThumbnail, setHataliThumbnail] = useState<string | null>(null);
  const bugun = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD (yerel)

  if (kartGorunumu) {
    const tur = y.arac_turu ?? "video";
    const eclubHedefli = yalnizEclubHedefliMi(y.hedef_roller);
    const thumbnail = yayinThumbnailIstemciCoz(y);
    const akordiyonAcik = acikAkordiyon === y.yayin_id;

    const etiket =
      tur === "podcast" ? "Podcast"
      : tur === "gorsel" ? "Dijital Broşür"
      : tur === "flip_pdf" ? "Literatür"
      : "Video";

    const tiklanabilir = Boolean(onOnizle || y.video_url || y.arac_id);

    const handleOnizle = () => {
      if (onOnizle) {
        onOnizle({
          arac_turu: tur,
          arac_id: y.arac_id,
          video_url: y.video_url,
          urun_adi: y.urun_adi,
          yayin_id: y.yayin_id,
        });
      } else if (y.video_url) {
        onVideoAc(y.video_url);
      }
    };

    const resimGoster = Boolean(thumbnail && hataliThumbnail !== thumbnail);

    return (
      <article className="self-start overflow-hidden rounded-xl border border-[var(--tema-yerel-uretim-cizgi-36)] bg-[var(--tema-yerel-uretim-kart-01)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--tema-yerel-uretim-cizgi-47)] hover:shadow-[0_10px_24px_var(--tema-yerel-uretim-golge-08)]">
        <button
          type="button"
          onClick={handleOnizle}
          disabled={!tiklanabilir}
          aria-label={tiklanabilir ? `${y.urun_adi} ${etiket.toLowerCase()} önizle` : "Önizleme bulunmuyor"}
          className="group relative block aspect-video w-full overflow-hidden bg-[var(--tema-yerel-uretim-secim-zemin-14)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--tema-yerel-uretim-odak-01)] disabled:cursor-default"
        >
          {resimGoster ? (
            <img
              src={thumbnail!}
              alt=""
              onError={() => setHataliThumbnail(thumbnail)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <AracVarsayilanKapak aracTuru={tur} urunAdi={y.urun_adi} className="h-full w-full" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-[var(--tema-yerel-uretim-dekoratif-zemin-01)]/55 via-transparent to-[var(--tema-yerel-uretim-dekoratif-zemin-01)]/10" />
          {y.video_isleniyor ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-[var(--tema-yerel-uretim-islevsel-cizgi-06)] bg-[var(--tema-yerel-uretim-islevsel-zemin-04)] px-2 py-1 text-[9px] font-extrabold text-[var(--tema-yerel-uretim-islevsel-metin-25)] shadow-sm">
              <svg className="animate-spin h-2.5 w-2.5 text-[var(--tema-yerel-uretim-islevsel-metin-07)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>İşleniyor</span>
            </span>
          ) : (
            <span className="absolute left-2 top-2 rounded-full px-2 py-1 text-[9px] font-extrabold shadow-sm"
              style={{ background: durum.renk.bg, color: durum.renk.text, border: `0.5px solid ${durum.renk.border}` }}>
              {durum.metin}
            </span>
          )}
          <span className="absolute right-2 top-2 flex max-w-[70%] flex-wrap justify-end gap-1">
            <HedefRolPilleri hedefRoller={y.hedef_roller} />
          </span>
          {tiklanabilir && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tema-yerel-uretim-cizgi-48)]/45 bg-[var(--tema-yerel-uretim-eylem-zemin-11)]/65 text-[var(--tema-yerel-uretim-ters-metin-01)] shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
                {tur === "podcast" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                ) : tur === "gorsel" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : tur === "flip_pdf" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                ) : (
                  <svg aria-hidden="true" width="12" height="14" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z" /></svg>
                )}
              </span>
            </span>
          )}
          <span className="absolute bottom-2 left-2 rounded-full border border-[var(--tema-yerel-uretim-cizgi-48)]/25 bg-[var(--tema-yerel-uretim-eylem-zemin-11)]/70 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--tema-yerel-uretim-ters-metin-01)] backdrop-blur-sm">
            Önizle
          </span>
        </button>

        <div className="flex flex-col gap-2.5 p-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold text-[var(--tema-yerel-uretim-ana-metin-18)]">{y.urun_adi}</h3>
            <p className="mt-1 truncate text-[10px] font-bold text-[var(--tema-yerel-uretim-eylem-metin-17)]">
              {[y.turu_adi, y.teknik_adi && y.teknik_adi !== "-" ? y.teknik_adi : null].filter(Boolean).join(" · ") || "İçerik bilgisi belirtilmedi"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--tema-yerel-uretim-yardimci-metin-36)]">
            <span className="truncate font-mono text-[var(--tema-yerel-uretim-vurgu-metin-01)]">{talepIdGoster(y.firma_adi, y.talep_no)}</span>
            <span className="shrink-0">{formatTarih(y.yayin_tarihi)}</span>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--tema-yerel-uretim-sayfa-zemini-12)] px-2 py-1.5">
            <span className="flex items-center justify-center gap-1 text-[10px] text-[var(--tema-yerel-uretim-yardimci-metin-37)]">
              Öğrenme aracı puanı <b className="text-[var(--tema-yerel-uretim-ana-metin-26)]">{y.video_puani ?? "—"}</b>
            </span>
            <span className="flex items-center justify-center gap-1 border-l border-[var(--tema-yerel-uretim-cizgi-49)] text-[10px] text-[var(--tema-yerel-uretim-yardimci-metin-37)]">
              Soru <b className="text-[var(--tema-yerel-uretim-ana-metin-26)]">{y.sorular?.length ?? 0}</b>
            </span>
          </div>

          {tekrarli && (
            <div className="rounded-lg border border-[var(--tema-yerel-uretim-cizgi-50)] bg-[var(--tema-yerel-uretim-secim-zemin-16)] px-2.5 py-1.5 text-[10px] leading-4 text-[var(--tema-yerel-uretim-eylem-metin-18)]">
              <strong>{tekrarBilgi!.tekrar_periyot_gun} günlük tur</strong>
              <span className="ml-1">· Yeni tur {kalanGun(tekrarBilgi!.sonraki_tur_tarihi!)} gün sonra</span>
            </div>
          )}

          {eclubHedefli && (
            <div className="border-t border-[var(--tema-yerel-uretim-cizgi-10)] pt-2" aria-label="Yayın bilgileri ve koşulları">
              <div className="flex flex-wrap items-start justify-between gap-1">
                {y.cek_karsiligi_var_mi === false ? (
                  <span className={eclubBilgiPili}>Çeksiz Puan · Yalnız lig</span>
                ) : y.cek_karsiligi_var_mi === true ? (
                  <>
                    <span className={eclubBilgiPili}>Çekli Puan</span>
                    {y.satis_sarti_tipi === "satis_sartli" ? <span className={eclubBilgiPili}>Sipariş zorunlu</span> : y.satis_sarti_tipi === "serbest_siparis" ? <span className={eclubBilgiPili}>Siparişle çek tutarı artar</span> : y.satis_sarti_tipi === "siparissiz_cek" ? <span className={eclubBilgiPili}>Sipariş yok</span> : <span className={eclubBilgiPili}>Sipariş koşulu belirtilmemiş</span>}
                    {y.satis_sarti_tipi === "serbest_siparis" && y.gizli_sart_katlama_orani != null && <span className={eclubBilgiPili}>Siparişle çek tutarı +%{y.gizli_sart_katlama_orani}</span>}
                  </>
                ) : <span className={eclubBilgiPili}>Puan türü belirtilmemiş</span>}
              </div>
              {y.cek_karsiligi_var_mi === true && Array.isArray(y.barem_tablosu) && y.barem_tablosu.length > 0 && (
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {y.barem_tablosu.map((barem, index) => (
                    <span key={index} className={`${eclubBaremPili} flex min-w-0 flex-col items-center text-center`} title={`${barem.min_puan.toLocaleString("tr-TR")}–${barem.max_puan.toLocaleString("tr-TR")} puan${y.satis_sarti_tipi === "siparissiz_cek" ? "" : `: ${barem.adet}+${barem.mal_fazlasi}`}`}>
                      <span>{barem.min_puan.toLocaleString("tr-TR")}–{barem.max_puan.toLocaleString("tr-TR")}p</span>
                      {y.satis_sarti_tipi !== "siparissiz_cek" && <span>{barem.adet}+{barem.mal_fazlasi}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--tema-yerel-uretim-cizgi-13)] p-2.5">
          {planlandi && onPlanIslem ? (
            <div className="grid gap-2">
              <button type="button" onClick={() => onPlanIslem(y.yayin_id, "hemen_yayinla")} disabled={islemLoading === y.yayin_id}
                className="w-full rounded-lg bg-[var(--tema-yerel-uretim-eylem-zemin-01)] px-3 py-2 text-[11px] font-extrabold text-[var(--tema-yerel-uretim-ters-metin-01)] disabled:opacity-60">
                {islemLoading === y.yayin_id ? "..." : "Hemen Yayınla"}
              </button>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
                <input type="date" value={yeniGun} min={bugun} onChange={(e) => setYeniGun(e.target.value)} aria-label="Yeni yayın günü"
                  className="min-w-0 rounded-lg border border-[var(--tema-yerel-uretim-cizgi-33)] bg-[var(--tema-yerel-uretim-kart-01)] px-2 py-1.5 text-[10px] text-[var(--tema-yerel-uretim-ana-metin-27)]" />
                <button type="button" onClick={() => yeniGun && onPlanIslem(y.yayin_id, "tarih_degistir", yeniGun)} disabled={!yeniGun || islemLoading === y.yayin_id}
                  className="rounded-lg border border-[var(--tema-yerel-uretim-cizgi-06)] px-2 py-1.5 text-[10px] font-bold text-[var(--tema-yerel-uretim-eylem-metin-02)] disabled:border-[var(--tema-yerel-uretim-cizgi-05)] disabled:text-[var(--tema-yerel-uretim-yardimci-metin-03)]">
                  Değiştir
                </button>
              </div>
              <button type="button" onClick={() => onPlanIslem(y.yayin_id, "plan_iptal")} disabled={islemLoading === y.yayin_id}
                className="w-full rounded-lg border border-[var(--tema-yerel-uretim-islevsel-cizgi-07)] px-3 py-1.5 text-[10px] font-bold text-[var(--tema-yerel-uretim-islevsel-metin-39)] disabled:opacity-60">
                Planı İptal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-expanded={akordiyonAcik}
                onClick={() => setAcikAkordiyon(akordiyonAcik ? null : y.yayin_id)}
                disabled={!y.sorular?.length}
                className="rounded-lg border border-[var(--tema-yerel-uretim-cizgi-33)] bg-[var(--tema-yerel-uretim-kart-01)] px-2.5 py-2 text-[11px] font-extrabold text-[var(--tema-yerel-uretim-yardimci-metin-38)] disabled:cursor-default disabled:opacity-50"
              >
                Soru Seti ({y.sorular?.length ?? 0})
              </button>
              <button type="button" onClick={() => onDurumDegistir(y.yayin_id, y.durum)} disabled={islemLoading === y.yayin_id}
                className="rounded-lg border border-[var(--tema-yerel-uretim-islevsel-cizgi-07)] bg-[var(--tema-yerel-uretim-kart-01)] px-3 py-2 text-[11px] font-extrabold text-[var(--tema-yerel-uretim-islevsel-metin-39)] disabled:opacity-60">
                {islemLoading === y.yayin_id ? "..." : yayinda ? "Durdur" : "Başlat"}
              </button>
            </div>
          )}
        </div>

        {y.video_isleniyor && (
          <div className="border-t border-[var(--tema-yerel-uretim-islevsel-cizgi-06)]/80 bg-[var(--tema-yerel-uretim-islevsel-zemin-04)]/70 px-3 py-2 text-[11px] leading-relaxed text-[var(--tema-yerel-uretim-islevsel-metin-06)] flex items-center gap-1.5">
            <span className="font-bold text-[var(--tema-yerel-uretim-islevsel-metin-07)] select-none">ℹ️</span>
            <span>Videonuz işleniyor. Yayın kapak görseliniz ve önizlemeniz, videonuzun büyüklüğüne uygun olarak en kısa sürede hazır olacaktır.</span>
          </div>
        )}

        {akordiyonAcik && y.sorular?.length > 0 && (
          <SoruListesi sorular={y.sorular} soru_seti_durum_id={y.soru_seti_durum_id}
            getSoruPuani={getSoruPuani} setSoruPuani={setSoruPuani} hepsineAyniPuanAta={hepsineAyniPuanAta} />
        )}
      </article>
    );
  }

  return (
    <article className="mb-2.5 overflow-hidden rounded-2xl border border-[var(--tema-yerel-uretim-cizgi-36)] bg-[var(--tema-yerel-uretim-kart-01)] shadow-[0_6px_18px_var(--tema-yerel-uretim-golge-07)]">
      <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-[128px_minmax(0,1fr)] lg:grid-cols-[128px_minmax(0,1fr)_minmax(190px,auto)] lg:items-center lg:p-4">
        <div className="order-2 sm:order-1">
          <VideoThumb
            video_url={y.video_url}
            thumbnail_url={y.thumbnail_url}
            arac_turu={y.arac_turu}
            urun_adi={y.urun_adi}
            arac_id={y.arac_id}
            onOnizle={() => onOnizle ? onOnizle({
              arac_turu: y.arac_turu ?? "video",
              arac_id: y.arac_id,
              video_url: y.video_url,
              urun_adi: y.urun_adi,
              yayin_id: y.yayin_id,
            }) : y.video_url && onVideoAc(y.video_url)}
            onAc={onVideoAc}
          />
        </div>

        <div className="order-1 min-w-0 sm:order-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-base font-extrabold text-[var(--tema-yerel-uretim-ana-metin-28)]">{y.urun_adi}</span>
            <HedefRolPilleri hedefRoller={y.hedef_roller} />
            {y.video_isleniyor ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--tema-yerel-uretim-islevsel-cizgi-06)] bg-[var(--tema-yerel-uretim-islevsel-zemin-04)] px-2 py-0.5 text-[10px] font-bold leading-tight text-[var(--tema-yerel-uretim-islevsel-metin-25)]">
                <svg className="animate-spin h-2.5 w-2.5 text-[var(--tema-yerel-uretim-islevsel-metin-07)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>İşleniyor</span>
              </span>
            ) : (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight"
                style={{ background: durum.renk.bg, color: durum.renk.text, border: `0.5px solid ${durum.renk.border}` }}>
                {durum.metin}
              </span>
            )}
          </div>
          <span className="mt-1 block text-[11px] font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-10)]">{talepIdGoster(y.firma_adi, y.talep_no)}</span>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--tema-yerel-uretim-yardimci-metin-32)]">
            {y.turu_adi && <span className="font-bold">{y.turu_adi}</span>}
            {y.teknik_adi && y.teknik_adi !== "-" && <><span className="text-[var(--tema-yerel-uretim-yardimci-metin-39)]">•</span><span>{y.teknik_adi}</span></>}
          </div>
          <span className="mt-1.5 block text-[11px] text-[var(--tema-yerel-uretim-yardimci-metin-33)]">
            {yayinda ? `Yayın: ${formatTarih(y.yayin_tarihi)}`
              : planlandi ? `Planlanan yayın: ${formatTarih(y.yayin_tarihi)}`
              : `Durdurma: ${y.durdurma_tarihi ? formatTarih(y.durdurma_tarihi) : "-"}`}
          </span>
        </div>

        <div className="order-3 flex flex-col gap-2 sm:col-span-2 sm:grid sm:grid-cols-[1fr_auto] sm:items-center lg:col-span-1 lg:flex lg:items-stretch">
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--tema-yerel-uretim-sayfa-zemini-23)] px-3 py-2">
            <span className="text-[10px] font-bold text-[var(--tema-yerel-uretim-yardimci-metin-40)]">Öğrenme aracı puanı</span>
            <strong className="text-sm text-[var(--tema-yerel-uretim-ana-metin-16)]">{y.video_puani ?? "—"}</strong>
            <span className="h-4 w-px bg-[var(--tema-yerel-uretim-secim-zemin-17)]" />
            <span className="text-[10px] font-bold text-[var(--tema-yerel-uretim-yardimci-metin-40)]">Soru</span>
            <strong className="text-sm text-[var(--tema-yerel-uretim-ana-metin-16)]">{y.sorular?.length ?? 0}</strong>
          </div>
          {tekrarli && (
            <div className="rounded-xl border border-[var(--tema-yerel-uretim-cizgi-50)] bg-[var(--tema-yerel-uretim-secim-zemin-16)] px-3 py-2 text-[10px] leading-4 text-[var(--tema-yerel-uretim-eylem-metin-18)]">
              <strong>{tekrarBilgi!.tekrar_periyot_gun} günlük tur</strong>
              <span className="block">Yeni tur {kalanGun(tekrarBilgi!.sonraki_tur_tarihi!)} gün sonra</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
          {y.sorular?.length > 0 && (
            <button
              type="button"
              aria-expanded={acikAkordiyon === y.yayin_id}
              onClick={() => setAcikAkordiyon(acikAkordiyon === y.yayin_id ? null : y.yayin_id)}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--tema-yerel-uretim-cizgi-33)] bg-[var(--tema-yerel-uretim-kart-01)] px-2.5 py-1.5 text-xs font-bold text-[var(--tema-yerel-uretim-yardimci-metin-38)]"
              style={{ fontFamily: "'Nunito', sans-serif" }}>
              Soru Seti ({y.sorular.length})
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: acikAkordiyon === y.yayin_id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
          {planlandi && onPlanIslem ? (
            <div className="flex w-full flex-col items-end gap-1.5">
              <button onClick={() => onPlanIslem(y.yayin_id, "hemen_yayinla")} disabled={islemLoading === y.yayin_id}
                className="cursor-pointer rounded-lg border-none px-3 py-1.5 text-xs font-extrabold"
                style={{ background: "var(--tema-yerel-uretim-eylem-zemin-01)", color: "var(--tema-yerel-uretim-ters-metin-02)", fontFamily: "'Nunito', sans-serif" }}>
                {islemLoading === y.yayin_id ? "..." : "Hemen Yayınla"}
              </button>
              <div className="flex items-center gap-1">
                <input type="date" value={yeniGun} min={bugun}
                  onChange={(e) => setYeniGun(e.target.value)}
                  aria-label="Yeni yayın günü"
                  className="rounded-lg border border-[var(--tema-yerel-uretim-cizgi-01)] bg-[var(--tema-yerel-uretim-kart-01)] px-2 py-1 text-xs text-[var(--tema-yerel-uretim-ana-metin-01)]"
                  style={{ fontFamily: "'Nunito', sans-serif" }} />
                <button onClick={() => yeniGun && onPlanIslem(y.yayin_id, "tarih_degistir", yeniGun)}
                  disabled={!yeniGun || islemLoading === y.yayin_id}
                  className="px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{
                    background: yeniGun ? "var(--tema-yerel-uretim-kart-04)" : "var(--tema-yerel-uretim-sayfa-zemini-24)",
                    color: yeniGun ? "var(--tema-yerel-uretim-eylem-metin-02)" : "var(--tema-yerel-uretim-yardimci-metin-03)",
                    border: yeniGun ? "0.5px solid var(--tema-yerel-uretim-cizgi-06)" : "0.5px solid var(--tema-yerel-uretim-cizgi-05)",
                    cursor: yeniGun ? "pointer" : "not-allowed",
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                  Tarihi Değiştir
                </button>
              </div>
              <button onClick={() => onPlanIslem(y.yayin_id, "plan_iptal")} disabled={islemLoading === y.yayin_id}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                style={{ background: "var(--tema-yerel-uretim-kart-04)", color: "var(--tema-yerel-uretim-islevsel-metin-39)", border: "0.5px solid var(--tema-yerel-uretim-islevsel-cizgi-07)", fontFamily: "'Nunito', sans-serif" }}>
                Planı İptal
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => onDurumDegistir(y.yayin_id, y.durum)} disabled={islemLoading === y.yayin_id}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-extrabold"
              style={{
                background: yayinda ? "var(--tema-yerel-uretim-kart-04)" : "var(--tema-yerel-uretim-eylem-zemin-01)",
                color: yayinda ? "var(--tema-yerel-uretim-islevsel-metin-39)" : "var(--tema-yerel-uretim-ters-metin-02)",
                border: yayinda ? "0.5px solid var(--tema-yerel-uretim-islevsel-cizgi-07)" : "none",
                fontFamily: "'Nunito', sans-serif",
              }}>
              {islemLoading === y.yayin_id ? "..." : yayinda ? "Durdur" : "Başlat"}
            </button>
          )}
          </div>
        </div>
      </div>
      {y.video_isleniyor && (
        <div className="border-t border-[var(--tema-yerel-uretim-islevsel-cizgi-06)]/80 bg-[var(--tema-yerel-uretim-islevsel-zemin-04)]/70 px-4 py-2 text-[11px] leading-relaxed text-[var(--tema-yerel-uretim-islevsel-metin-06)] flex items-center gap-1.5">
          <span className="font-bold text-[var(--tema-yerel-uretim-islevsel-metin-07)] select-none">ℹ️</span>
          <span>Videonuz işleniyor. Yayın kapak görseliniz ve önizlemeniz, videonuzun büyüklüğüne uygun olarak en kısa sürede hazır olacaktır.</span>
        </div>
      )}
      {acikAkordiyon === y.yayin_id && y.sorular?.length > 0 && (
        <SoruListesi sorular={y.sorular} soru_seti_durum_id={y.soru_seti_durum_id}
          getSoruPuani={getSoruPuani} setSoruPuani={setSoruPuani} hepsineAyniPuanAta={hepsineAyniPuanAta} />
      )}
    </article>
  );
}
