"use client";

import React, { type MouseEvent, type ReactNode } from "react";
import { Heart, Star, RotateCcw } from "lucide-react";
import { yayinThumbnailIstemciCoz } from "@/lib/ogrenmeAraci/thumbnailIstemci";
import { type IcerikTuru } from "@/lib/video/icerikTuru";
import { talepIdGoster } from "@/lib/utils/talepId";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { AracVarsayilanKapak } from "@/components/ogrenme-araci/AracVarsayilanKapak";
import { YayinTuruPill } from "@/components/ogrenme-araci/YayinTuruPill";
import { EclubHoykSureCercevesi } from "@/components/eclub/EclubHoykSureCercevesi";

export type YayinKartiDurumu = "yeni" | "devam" | "tamamlanan" | string;

export interface YayinKartiVerisi {
  yayin_id: string;
  urun_adi: string;
  gorunen_urun_id?: string | null;
  teknik_adi?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  arac_id?: string | null;
  arac_turu?: OgrenmeAraciTuru | string | null;
  durum?: YayinKartiDurumu | null;
  icerik_turu?: IcerikTuru | string | null;
  yayin_tarihi?: string | null;
  izlenme_sayisi?: number | null;
  video_puani?: number | null;
  extra_puan?: number | null;
  firma_adi?: string | null;
  talep_no?: number | null;
  begeni_sayisi?: number;
  favori_sayisi?: number;
  begeni_mi?: boolean;
  favori_mi?: boolean;
  daha_once_izledi?: boolean;
  sonraki_tur_tarihi?: string | null;
}

export interface YayinKartiProps {
  yayin: YayinKartiVerisi;
  onClick?: (yayin: YayinKartiVerisi) => void;
  onBegeni?: (event: MouseEvent, yayinId: string) => void;
  onFavori?: (event: MouseEvent, yayinId: string) => void;
  etkilesimAktif?: boolean;

  // Slot ve Ek Rozetler
  solUstRozet?: ReactNode;
  thumbnailSolUstRozet?: ReactNode;
  sagUstEkRozet?: ReactNode;
  puanYaniRozet?: ReactNode;
  baslikSagAksiyon?: ReactNode;
  tarihSatiriSagAksiyon?: ReactNode;
  puanSatiriSagAksiyon?: ReactNode;
  altEkIcerik?: ReactNode;
  hoverOverlay?: ReactNode;
  thumbnailAltBant?: ReactNode;

  // Görünürlük Kontrolleri (Farklı roller için eksiltme seçenekleri)
  durumGoster?: boolean;
  yayinTuruGoster?: boolean;
  icerikTuruGoster?: boolean;
  etkilesimGoster?: boolean;
  tarihGoster?: boolean;
  izlenmeGoster?: boolean;
  puanGoster?: boolean;
  extraPuanGoster?: boolean;
  talepNoGoster?: boolean;
  donguGoster?: boolean;

  className?: string;
  ariaLabel?: string;
  kapakOncelikli?: boolean;
  pillMetniNormal?: boolean;
  kapsulZeminiGoster?: boolean;
  uyariCercevesi?: boolean;
  tamamlandiCercevesi?: boolean;
  eclubGecenGun?: number;
}

const GUN_MS = 24 * 60 * 60 * 1000;
const kalanGun = (tarih: string) =>
  Math.max(0, Math.ceil((new Date(tarih).getTime() - Date.now()) / GUN_MS));

const ICERIK_TURU_KISA: Record<string, string> = {
  urun: "Ürün",
  urun_medikal: "ÜrünMed",
  medikal: "Medikal",
  egitim: "Satış",
  yonetim: "Yönetim",
  ik: "İK",
  "Ürün Eğitimi": "Ürün",
  "Ürün Eğitimleri": "Ürün",
  "Ürün Medikal Eğitimi": "ÜrünMed",
  "Ürün Medikal Eğitimleri": "ÜrünMed",
  "Medikal Eğitimi": "Medikal",
  "Medikal Eğitimler": "Medikal",
  "Satış Eğitimi": "Satış",
  "Satış Eğitimleri": "Satış",
  "Yönetim Eğitimi": "Yönetim",
  "Yönetim Eğitimleri": "Yönetim",
  "İK Eğitimi": "İK",
  "İK Eğitimleri": "İK",
};

const formatIcerikTuruKisa = (tur?: string | null) => {
  if (!tur) return "";
  if (ICERIK_TURU_KISA[tur]) return ICERIK_TURU_KISA[tur];
  return tur.replace(/ Eğitimleri| Eğitimi| Eğitim/gi, "").trim();
};

const formatTarihUzun = (tarihStr?: string | null) => {
  if (!tarihStr) return "";
  const d = new Date(tarihStr);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export function YayinKarti({
  yayin,
  onClick,
  onBegeni,
  onFavori,
  etkilesimAktif = true,

  solUstRozet,
  thumbnailSolUstRozet,
  sagUstEkRozet,
  puanYaniRozet,
  baslikSagAksiyon,
  tarihSatiriSagAksiyon,
  puanSatiriSagAksiyon,
  altEkIcerik,
  hoverOverlay,
  thumbnailAltBant,

  durumGoster = true,
  yayinTuruGoster = true,
  icerikTuruGoster = true,
  etkilesimGoster = true,
  tarihGoster = true,
  izlenmeGoster = true,
  puanGoster = true,
  extraPuanGoster = true,
  talepNoGoster = true,
  donguGoster = true,

  className = "",
  ariaLabel,
  kapakOncelikli = false,
  pillMetniNormal = false,
  kapsulZeminiGoster = true,
  uyariCercevesi = false,
  tamamlandiCercevesi = false,
  eclubGecenGun,
}: YayinKartiProps) {
  const thumbnail = yayinThumbnailIstemciCoz(yayin);

  // Birleşik Kapsül Segmentleri (UTT Navbar Tarzı)
  const kapsulSegmentleri: ReactNode[] = [];

  if (durumGoster) {
    if (solUstRozet) {
      kapsulSegmentleri.push(
        <React.Fragment key="durum">{solUstRozet}</React.Fragment>
      );
    } else if (yayin.durum === "yeni") {
      kapsulSegmentleri.push(
        <span key="durum" className={`${pillMetniNormal ? "font-normal" : "font-extrabold"} text-[var(--tema-hoyk-durum-yeni)]`}>
          Yeni
        </span>
      );
    } else if (yayin.durum === "devam") {
      kapsulSegmentleri.push(
        <span key="durum" className={`${pillMetniNormal ? "font-normal" : "font-extrabold"} text-[var(--tema-hoyk-durum-devam)]`}>
          Yarım Kaldı
        </span>
      );
    } else if (yayin.durum === "tamamlanan") {
      kapsulSegmentleri.push(
        <span key="durum" className={`${pillMetniNormal ? "font-normal" : "font-bold"} text-[var(--tema-hoyk-durum-izlendi)]`}>
          ✓ İzlendi
        </span>
      );
    }
  }

  if (donguGoster && yayin.durum === "tamamlanan" && yayin.sonraki_tur_tarihi) {
    kapsulSegmentleri.push(
      <span
        key="dongu"
        className={`flex items-center gap-0.5 ${pillMetniNormal ? "font-normal" : "font-bold"} text-[var(--tema-hoyk-dongu-metni)]`}
        title={`${kalanGun(yayin.sonraki_tur_tarihi)} gün sonra yeniden puanlı`}
      >
        <RotateCcw className="h-2.5 w-2.5" />
        <span>{kalanGun(yayin.sonraki_tur_tarihi)} gün</span>
      </span>
    );
  }

  if (icerikTuruGoster && yayin.icerik_turu) {
    kapsulSegmentleri.push(
      <span key="icerik" className={`${pillMetniNormal ? "font-normal" : "font-medium"} text-[var(--tema-hoyk-aciklama-metni)]`}>
        {formatIcerikTuruKisa(yayin.icerik_turu)}
      </span>
    );
  }

  const kapsulIcerigi = kapsulSegmentleri.map((seg, idx) => (
    <React.Fragment key={idx}>
      {idx > 0 && <span className="mx-1.5 text-[var(--tema-hoyk-ayirici)] select-none">|</span>}
      {seg}
    </React.Fragment>
  ));

  return (
    <div
      data-hoyk-kart
      className={`group relative cursor-pointer rounded-xl ${eclubGecenGun !== undefined ? "overflow-visible" : "overflow-hidden"} ${uyariCercevesi ? "border-[2px] border-[var(--tema-hoyk-sure-doldu)]" : tamamlandiCercevesi ? "border-[2px] border-[var(--tema-hoyk-tamamlandi)]" : eclubGecenGun !== undefined ? "border border-transparent" : "border border-[var(--tema-hoyk-cizgi)]"} bg-[var(--tema-hoyk-zemin)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
      style={{ backgroundColor: "var(--hoyk-kart-zemini, var(--tema-hoyk-zemin))" }}
      onClick={() => onClick?.(yayin)}
      aria-label={ariaLabel}
    >
      {eclubGecenGun !== undefined && <EclubHoykSureCercevesi gecenGun={eclubGecenGun} />}
      {/* ─── Medya Alanı (16:9 Thumbnail) ─── */}
      <div data-hoyk-kapak className={`relative aspect-video overflow-hidden bg-[var(--tema-hoyk-kapak-zemini)] ${eclubGecenGun !== undefined ? "rounded-t-xl" : ""}`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={yayin.urun_adi}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading={kapakOncelikli ? "eager" : "lazy"}
            fetchPriority={kapakOncelikli ? "high" : undefined}
          />
        ) : (
          <AracVarsayilanKapak
            aracTuru={yayin.arac_turu as OgrenmeAraciTuru}
            urunAdi={yayin.urun_adi}
          />
        )}

        {thumbnailSolUstRozet && (
          <div className="pointer-events-none absolute left-1.5 top-1.5 z-10 max-w-[65%]">
            {thumbnailSolUstRozet}
          </div>
        )}

        {/* Sağ Üst: Yayın Türü (Öğrenme Aracı) & Varsa Harici Ek Rozet */}
        <div data-hoyk-arac className="absolute right-1.5 top-1.5 flex items-center gap-1 pointer-events-none">
          {yayinTuruGoster && (
            <YayinTuruPill
              tur={(yayin.arac_turu as OgrenmeAraciTuru) ?? "video"}
              boyut="kart"
              fontNormal={pillMetniNormal}
            />
          )}
          {sagUstEkRozet}
        </div>

        {/* Hover Overlay */}
        {hoverOverlay}
      </div>

      {thumbnailAltBant && <div className="px-1.5 pt-1">{thumbnailAltBant}</div>}

      {/* ─── Kart Gövdesi (p-2.5 Standart) ─── */}
      <div className="p-2.5">
        {/* Birleşik Kapsül (Durum · Döngü · İçerik Türü) */}
        {kapsulSegmentleri.length > 0 && (
          <div className="mb-2">
            {kapsulZeminiGoster ? (
              <div
                data-hoyk-kapsul
                className="inline-flex items-center rounded-full leading-tight select-none py-0.5 px-3 sm:px-2.5 text-[11px] sm:text-[9px]"
                style={{
                  background: "var(--tema-hoyk-kapsul-zemini)",
                  boxShadow: "inset 0 0 0 0.5px var(--tema-hoyk-kapsul-cizgi)",
                }}
              >
                {kapsulIcerigi}
              </div>
            ) : kapsulIcerigi}
          </div>
        )}

        {/* 1. Satır: Başlık & Etkileşim Butonları */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h3
              className="line-clamp-2 text-base font-bold leading-[22px] text-[var(--tema-hoyk-baslik)] sm:text-xs sm:leading-normal"
              title={yayin.urun_adi}
            >
              {yayin.urun_adi}
            </h3>
            {yayin.gorunen_urun_id && (
              <span className="block text-[10px] font-normal leading-4 text-[var(--tema-hoyk-soluk-metin)]" aria-label={`Ürün ID: ${yayin.gorunen_urun_id}`}>
                {yayin.gorunen_urun_id}
              </span>
            )}
          </div>

          {baslikSagAksiyon}
          {etkilesimGoster && (
            <div className="flex flex-shrink-0 items-center gap-1 text-xs text-[var(--tema-hoyk-ikincil-metin)] sm:text-[10px]">
              <button
                type="button"
                disabled={!etkilesimAktif}
                onClick={(e) => {
                  e.stopPropagation();
                  onBegeni?.(e, yayin.yayin_id);
                }}
                aria-label="Beğen"
                className={`flex cursor-pointer items-center gap-0.5 rounded-full p-0.5 transition-colors ${
                  !etkilesimAktif
                    ? "cursor-default text-[var(--tema-hoyk-begeni)]"
                    : yayin.begeni_mi
                      ? "text-[var(--tema-hoyk-begeni)]"
                      : "text-[var(--tema-hoyk-soluk-metin)] hover:text-[var(--tema-hoyk-etkilesim-hover)]"
                }`}
              >
                <Heart
                  className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${yayin.begeni_mi ? "fill-current text-[var(--tema-hoyk-begeni)]" : ""}`}
                />
                <span>{yayin.begeni_sayisi ?? 0}</span>
              </button>

              <button
                type="button"
                disabled={!etkilesimAktif}
                onClick={(e) => {
                  e.stopPropagation();
                  onFavori?.(e, yayin.yayin_id);
                }}
                aria-label="Favoriye ekle"
                className={`flex cursor-pointer items-center gap-0.5 rounded-full p-0.5 transition-colors ${
                  !etkilesimAktif
                    ? "cursor-default text-[var(--tema-hoyk-favori)]"
                    : yayin.favori_mi
                      ? "text-[var(--tema-hoyk-favori)]"
                      : "text-[var(--tema-hoyk-soluk-metin)] hover:text-[var(--tema-hoyk-favori)]"
                }`}
              >
                <Star
                  className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${
                    yayin.favori_mi ? "fill-[var(--tema-hoyk-favori-dolgu)] text-[var(--tema-hoyk-favori-simge)]" : ""
                  }`}
                />
                <span>{yayin.favori_sayisi ?? 0}</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Satır: Yayın Tarihi & Talep Kimliği */}
        {(tarihGoster || talepNoGoster || tarihSatiriSagAksiyon) && (
          <div className="mt-1.5 flex items-center justify-between gap-1 text-xs text-[var(--tema-hoyk-ikincil-metin)] sm:text-[10px]">
            {tarihGoster ? (
              <span className="truncate">{formatTarihUzun(yayin.yayin_tarihi)}</span>
            ) : (
              <span />
            )}
            {tarihSatiriSagAksiyon ?? (talepNoGoster && yayin.talep_no != null ? (
              <span className="shrink-0 font-mono text-xs text-[var(--tema-hoyk-talep-metni)] sm:text-[10px]">
                {talepIdGoster(yayin.firma_adi, yayin.talep_no)}
              </span>
            ) : (
              <span />
            ))}
          </div>
        )}

        {/* 3. Satır: Puan / Ek Rozet & İzlenme Sayısı */}
        {(puanGoster || izlenmeGoster || puanYaniRozet || puanSatiriSagAksiyon) && (
          <div className="mt-1.5 flex items-center justify-between gap-1">
            <div className="flex shrink-0 items-center gap-1">
              {puanGoster && yayin.video_puani != null && (
                <span
                  data-hoyk-puan
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${pillMetniNormal ? "font-normal" : "font-extrabold"} text-[var(--tema-puan-metni)] shadow-xs sm:px-1.5 sm:text-[9px]`}
                  style={{
                    background: "var(--hoyk-puan-zemini, var(--tema-puan-zemini))",
                  }}
                >
                  {yayin.video_puani}{" "}
                  <span className="sm:hidden">P</span>
                  <span className="hidden sm:inline">Puan</span>
                </span>
              )}
              {puanGoster && extraPuanGoster && !!yayin.extra_puan && yayin.extra_puan > 0 && (
                <span
                  data-hoyk-ek-puan
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${pillMetniNormal ? "font-normal" : "font-extrabold"} text-[var(--tema-ek-puan-metni)] shadow-xs sm:px-1.5 sm:text-[9px]`}
                  style={{
                    background: "var(--tema-ek-puan-zemini)",
                  }}
                >
                  +{yayin.extra_puan} Extra
                </span>
              )}
              {puanYaniRozet}
            </div>

            {(izlenmeGoster || puanSatiriSagAksiyon) && (
              <div className="flex shrink-0 items-center gap-1">
                {izlenmeGoster && (
                  <span className="text-xs text-[var(--tema-hoyk-ikincil-metin)] sm:text-[10px]">
                    {yayin.izlenme_sayisi ?? 0} izlenme
                  </span>
                )}
                {puanSatiriSagAksiyon}
              </div>
            )}
          </div>
        )}

        {/* 4. Satır: Devam Eden Yayın İçin Baştan İzle Butonu */}
        {donguGoster && yayin.durum === "devam" && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-[var(--tema-hoyk-yeniden-zemin)] px-2 py-1.5 text-xs font-bold text-[var(--tema-hoyk-yeniden-metin)] sm:text-[10px]">
            <span>Baştan İzle</span>
            <span aria-hidden="true">→</span>
          </div>
        )}

        {/* En Alt Ek İçerik (Örn: Öneren bilgisi) */}
        {altEkIcerik}
      </div>
    </div>
  );
}
