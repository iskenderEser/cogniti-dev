"use client";

import type { CanliYayinKapasitesi, CanliYayinSuresi } from "@/lib/agora/partnerCanliYayin";
import type { HedefRol } from "@/lib/utils/roller";
import type { CanliEgitimKaydi, CanliOturumKaydi } from "./CanliYayinHoykKabugu";
import { PartnerCanliYayinKarti } from "./PartnerCanliYayinKarti";

export interface CanliOnizlemeOturumu {
  id: string;
  baslangicMs: number;
  durum?: CanliOturumKaydi["durum"];
  satin_alan_firma_adi?: string | null;
}

interface CanliYayinAgoraOnizlemeProps {
  sirketAdi: string;
  logoSurumu?: number;
  egitimAdi: string;
  aciklama: string;
  sureDakika: CanliYayinSuresi;
  kapasite: CanliYayinKapasitesi;
  hedefRoller: HedefRol[];
  fiyatTl: number | null;
  aktifMi?: boolean;
  partnerEgitimId?: string;
  oturumlar: CanliOnizlemeOturumu[];
}

const BOS_ISLEM = () => {};

/** Planlama sırasında yayının Agora Canlı Yayınlar HOYK görünümünü birebir önizler. */
export function CanliYayinAgoraOnizleme({
  sirketAdi,
  logoSurumu,
  egitimAdi,
  aciklama,
  sureDakika,
  kapasite,
  hedefRoller,
  fiyatTl,
  aktifMi = true,
  partnerEgitimId,
  oturumlar,
}: CanliYayinAgoraOnizlemeProps) {
  const onizlemeEgitimi: CanliEgitimKaydi = {
    canli_egitim_id: "onizleme",
    partner_egitim_id: partnerEgitimId || "PE-…",
    egitim_adi: egitimAdi,
    kategori_kodu: "",
    kategori: "",
    hedef_roller: hedefRoller,
    aciklama,
    sure_dakika: sureDakika,
    kapasite,
    fiyat_tl: fiyatTl ?? 0,
    viva_maliyeti_tl: 0,
    hizmet_bedeli_tl: 0,
    net_hakedis_tl: 0,
    aktif_mi: aktifMi,
  };

  const onizlemeOturumlari: CanliOturumKaydi[] = [...oturumlar]
    .sort((a, b) => a.baslangicMs - b.baslangicMs)
    .map((o) => ({
      oturum_id: o.id,
      canli_egitim_id: "onizleme",
      baslangic_at: new Date(o.baslangicMs).toISOString(),
      bitis_at: new Date(o.baslangicMs + sureDakika * 60_000).toISOString(),
      durum: o.durum ?? "musait",
      satin_alan_firma_id: null,
      satin_alan_firma_adi: o.satin_alan_firma_adi ?? null,
    }));

  return (
    <aside
      aria-label="Agora Görünüşü"
      className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm lg:sticky lg:top-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tema-cizgi)] pb-3">
        <div>
          <h2 className="m-0 text-base font-bold text-[var(--tema-baslik)]">Agora Görünüşü</h2>
          <p className="m-0 text-xs text-[var(--tema-ikincil-metin)]">
            Yayının Agora’daki ilan kartı önizlemesi
          </p>
        </div>
        <span className="rounded-full bg-[var(--tema-kontrol-hover)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--tema-kontrol-eylem)]">
          Canlı Önizleme
        </span>
      </div>

      <PartnerCanliYayinKarti
        className="mx-auto w-full max-w-[320px]"
        onizlemeModu
        fiyatBelirlendiMi={fiyatTl !== null}
        egitim={onizlemeEgitimi}
        oturumlar={onizlemeOturumlari}
        sirketAdi={sirketAdi}
        logoSurumu={logoSurumu}
        simdiMs={0}
        baslatilanId={null}
        onDuzenle={BOS_ISLEM}
        onYayiniBaslat={BOS_ISLEM}
      />
    </aside>
  );
}
