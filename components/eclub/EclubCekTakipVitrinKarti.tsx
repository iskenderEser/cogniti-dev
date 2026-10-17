"use client";

import { ArrowRight, Coins, Gift } from "lucide-react";
import type { CekTalebi } from "@/lib/eclub/store/cekTakipOnbellek";
import { CEK_TALEP_DURUM_META } from "@/lib/eclub/store/eclubStoreTipler";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { talepIdGoster } from "@/lib/utils/talepId";

type Props = {
  talep: CekTalebi;
  iptalEdiliyor: boolean;
  dogrulaniyor: boolean;
  onIptal: () => void;
};

export default function EclubCekTakipVitrinKarti({ talep, iptalEdiliyor, dogrulaniyor, onIptal }: Props) {
  const durum = CEK_TALEP_DURUM_META[talep.durum];
  const yayinTuru = talep.arac_turu
    ? YAYIN_TURU_SUNUMU[talep.arac_turu as OgrenmeAraciTuru]?.etiket ?? "—"
    : "—";
  const satisKosulu = talep.siparis_verildi_mi
    ? `${talep.siparis_tipi === "satis_sartli" ? "Sipariş zorunlu" : "Siparişle artan çek"} · ${talep.siparis_adet}+${talep.siparis_mal_fazlasi}`
    : talep.siparis_tipi === "serbest_siparis" ? "Tercihli · Siparişsiz" : "Siparişsiz çek";
  const baslikClass = "block text-[10.45px] font-extrabold uppercase tracking-[0.12em] text-[var(--tema-yerel-eclub-yardimci-metin-44)]";
  const kimlikDegeriClass = "mt-1 text-[9.576px] font-black leading-none tracking-[-0.055em] text-[var(--tema-yerel-eclub-ana-metin-27)] sm:text-[11.97px]";

  return (
    <article className="@container flex flex-col rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] p-4 shadow-[0_5px_16px_var(--tema-yerel-eclub-golge-04)] @[900px]:p-3">
      <div className="grid items-center gap-3 @[660px]:grid-cols-[minmax(0,1fr)_230px] @[900px]:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(220px,240px)]">
        <div className="grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 @[660px]:col-span-2 @[900px]:col-span-1">
          <div className="grid min-w-0 gap-2">
            <div className="min-w-0">
              <span className={baslikClass}>Yayın ID</span>
              <h2 className={kimlikDegeriClass}>{talepIdGoster(talep.firma_adi, talep.talep_no)}{talep.gorunum_testi_mi && <> <span className="text-[var(--tema-yerel-eclub-islevsel-metin-40)]">(F)</span></>}</h2>
            </div>
            <div className="min-w-0">
              <span className={baslikClass}>Yayın türü</span>
              <p className={kimlikDegeriClass}>{yayinTuru}</p>
            </div>
          </div>
          <div className="min-w-0 text-center">
            <span className={baslikClass}>Talep tarihi</span>
            <p className={kimlikDegeriClass}>{new Date(talep.created_at).toLocaleDateString("tr-TR")}</p>
          </div>
        </div>

        <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-stretch gap-2 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-40)] bg-[var(--tema-yerel-eclub-sayfa-zemini-03)] p-1.5 ${talep.durum === "beklemede" ? "min-h-24" : ""}`}>
          <div className="flex min-w-0 flex-col justify-center rounded-lg bg-[var(--tema-yerel-eclub-kart-01)] px-2 py-1">
            <div className="flex items-center gap-2 text-[var(--tema-yerel-eclub-yardimci-metin-45)]">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--tema-yerel-eclub-secim-zemin-13)] text-[var(--tema-yerel-eclub-eylem-metin-09)]"><Coins size={16} /></span>
              <span className="truncate text-[11.4px] font-bold">Toplam puan</span>
            </div>
            <strong className="mt-0.5 block whitespace-nowrap text-[17.1px] font-black leading-none tracking-[-0.065em] text-[var(--tema-yerel-eclub-ana-metin-06)] sm:text-[20.52px]">
              <span className="text-[19.665px] sm:text-[23.598px]">{talep.toplanan_puan.toLocaleString("tr-TR")}</span><span className="ml-1 text-[13.3px] font-bold tracking-normal">puan</span>
            </strong>
          </div>
          <ArrowRight aria-hidden="true" className="mx-auto self-center text-[var(--tema-yerel-eclub-yardimci-metin-46)]" size={24} strokeWidth={1.7} />
          <div className="flex min-w-0 flex-col justify-center rounded-lg bg-[var(--tema-yerel-eclub-kart-01)] px-2 py-1">
            <div className="flex items-center gap-2 text-[var(--tema-yerel-eclub-yardimci-metin-45)]">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--tema-yerel-eclub-secim-zemin-13)] text-[var(--tema-yerel-eclub-eylem-metin-09)]"><Gift size={16} /></span>
              <span className="truncate text-[11.4px] font-bold">Hediye çeki</span>
            </div>
            <strong className="mt-0.5 block whitespace-nowrap text-[17.1px] font-black leading-none tracking-[-0.06em] text-[var(--tema-yerel-eclub-eylem-metin-10)] sm:text-[20.52px]">
              <span className="text-[19.665px] sm:text-[23.598px]">{talep.talep_edilen_cek_tl.toLocaleString("tr-TR")}</span> TL
            </strong>
            <span className="mt-1 block text-[10px] font-semibold leading-tight text-[var(--tema-yerel-eclub-yardimci-metin-45)]">{satisKosulu}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-2">
          <span
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-center text-[13.3px] font-extrabold"
            style={{ color: durum.metin, background: durum.arka, borderColor: durum.kenar }}
          >
            {talep.durum === "iptal" ? "İptal Ettiniz" : durum.etiket}
          </span>
          {talep.durum === "beklemede" && (
            <button
              type="button"
              onClick={onIptal}
              disabled={dogrulaniyor || iptalEdiliyor || talep.gorunum_testi_mi}
              className="min-h-11 rounded-xl border border-[var(--tema-yerel-eclub-islevsel-cizgi-12)] bg-[var(--tema-yerel-eclub-kart-01)] px-4 text-[11.4px] font-extrabold text-[var(--tema-yerel-eclub-islevsel-metin-03)] hover:bg-[var(--tema-yerel-eclub-islevsel-zemin-24)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {iptalEdiliyor ? "İşleniyor..." : "Talebi İptal Et"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
