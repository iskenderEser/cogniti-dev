"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Building2, Calendar, Clock, Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanliYayinKapasitesi, CanliYayinSuresi } from "@/lib/agora/partnerCanliYayin";
import { ROL_ADLARI, type HedefRol } from "@/lib/utils/roller";

export interface CanliEgitimKaydi {
  canli_egitim_id: string;
  partner_egitim_id?: string;
  egitim_adi: string;
  kategori_kodu: string;
  kategori: string;
  hedef_roller: HedefRol[];
  aciklama: string;
  sure_dakika: CanliYayinSuresi;
  kapasite: CanliYayinKapasitesi;
  fiyat_tl: number;
  viva_maliyeti_tl: number;
  hizmet_bedeli_tl: number;
  net_hakedis_tl: number;
  aktif_mi: boolean;
}

export interface CanliOturumKaydi {
  oturum_id: string;
  canli_egitim_id: string;
  baslangic_at: string;
  bitis_at: string;
  durum: "musait" | "siparis_verildi" | "tamamlandi" | "iptal";
  satin_alan_firma_id: string | null;
  satin_alan_firma_adi: string | null;
}

export const UZUN_TARIH_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
  timeZone: "Europe/Istanbul",
});

export const KISA_TARIH_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Istanbul",
});

export const SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

export const TL_BICIMI = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
});

export function hedefRolKisaEtiketi(rol: HedefRol): string {
  if (rol === "utt") return "Temsilci";
  if (rol === "eczanem") return "Eczanem";
  return ROL_ADLARI[rol] ?? rol;
}

export function saatAraligiFormatla(baslangicMs: number, sureDakika: number): string {
  const bas = new Date(baslangicMs);
  const bit = new Date(baslangicMs + sureDakika * 60_000);
  return `${SAAT_BICIMI.format(bas)} – ${SAAT_BICIMI.format(bit)}`;
}

interface CanliYayinHoykKabuguProps {
  sirketAdi: string;
  logoSurumu?: number;
  logoSrc?: string | null;
  egitimAdi: string;
  sureDakika: number;
  kapasite: number;
  baslangicMs?: number | null;
  bosTarihMetni?: string;
  pasifMi?: boolean;
  sagRozet?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Canlı yayın önizleme ve yönetim HOYK kartlarının ortak üst Viva bandı ve firma şeridi kabuğu. */
export function CanliYayinHoykKabugu({
  sirketAdi,
  logoSurumu,
  logoSrc,
  egitimAdi,
  sureDakika,
  kapasite,
  baslangicMs = null,
  bosTarihMetni = "Tarih ve saat eklenmedi",
  pasifMi = false,
  sagRozet,
  className,
  children,
}: CanliYayinHoykKabuguProps) {
  const [hataliLogoSrc, setHataliLogoSrc] = useState<string | null>(null);
  const logoUrl =
    logoSrc !== undefined
      ? logoSrc
      : logoSurumu !== undefined
        ? `/partner/api/logo?v=${logoSurumu}`
        : "/partner/api/logo";
  const logoGoster = Boolean(logoUrl) && hataliLogoSrc !== logoUrl;
  const gecerliTarih = typeof baslangicMs === "number" && Number.isFinite(baslangicMs);

  return (
    <article
      className={cn(
        "flex w-full flex-col justify-between overflow-hidden rounded-2xl border bg-[var(--tema-hoyk-zemin)] shadow-sm transition",
        pasifMi
          ? "border-dashed border-[var(--tema-cizgi)] opacity-90"
          : "border-[var(--tema-hoyk-cizgi)] hover:shadow-md",
        className,
      )}
    >
      <div>
        {/* 1. Üst Viva İlan Bandı */}
        <div
          className={cn(
            "px-3.5 py-2.5 text-white",
            pasifMi
              ? "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-500"
              : "bg-gradient-to-br from-slate-900 via-[#152c4a] to-[#1d4ed8]",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" aria-hidden="true" />
              <Radio size={11} aria-hidden="true" />
              Viva Canlı Yayın
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
              <span className="inline-flex items-center gap-1">
                <Clock size={11} aria-hidden="true" />
                {sureDakika} dk
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Users size={11} aria-hidden="true" />
                {kapasite} Kişi
              </span>
            </span>
          </div>

          <h3 className="m-0 mt-2 line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-white">
            {egitimAdi.trim() || "Canlı Yayın Başlığı"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-200">
              <Calendar size={12} aria-hidden="true" />
              {gecerliTarih
                ? UZUN_TARIH_BICIMI.format(new Date(baslangicMs))
                : bosTarihMetni}
            </span>
            <span className="text-xs font-extrabold tracking-tight text-white">
              {gecerliTarih ? saatAraligiFormatla(baslangicMs, sureDakika) : "—"}
            </span>
          </div>
        </div>

        {/* 2. Orta Firma Logosu + Firma Adı Şeridi */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-3 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-8 w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] px-1.5">
              {logoGoster && logoUrl ? (
                <Image
                  unoptimized
                  src={logoUrl}
                  alt={`${sirketAdi} logosu`}
                  width={64}
                  height={28}
                  className="h-6 w-auto max-w-full object-contain"
                  onError={() => setHataliLogoSrc(logoUrl)}
                />
              ) : (
                <Building2 size={15} className="text-[var(--tema-ikincil-metin)]" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 truncate text-xs font-extrabold text-[var(--tema-baslik)]">
              {sirketAdi}
            </div>
          </div>
          {sagRozet ? <div className="shrink-0">{sagRozet}</div> : null}
        </div>
      </div>

      {/* 3. Alt HOYK Gövdesi */}
      <div className="flex flex-1 flex-col p-3">{children}</div>
    </article>
  );
}
