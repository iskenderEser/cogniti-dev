"use client";

import { ArrowRight, Coins, Gift } from "lucide-react";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import { eclubUxTestYayiniMi } from "@/lib/eclub/store/uxGorunumTesti";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import EclubHaftalikPuanBirikimi, { type HaftalikPuanBirikimi } from "./EclubHaftalikPuanBirikimi";
import {
  CEK_TALEP_DURUM_META,
  type CekTalepDurumu,
  type EclubEczaneStoreOzetItem,
} from "@/lib/eclub/store/eclubStoreTipler";

type Props = {
  platformStili?: boolean;
  item: EclubEczaneStoreOzetItem;
  haftalikBirikim?: HaftalikPuanBirikimi;
  toplananPuan: number;
  bazCek: number;
  katlanmisCek: number;
  uygunAdet: number;
  uygunMf: number;
  minimumPuan: number;
  yeterliPuanVarMi: boolean;
  talepPasif: boolean;
  islemde: boolean;
  islemLoading: boolean;
  siparissiz: boolean;
  isSerbest: boolean;
  katlamaOrani: number;
  etkilesimliTest: boolean;
  testSiparisSecimi?: boolean;
  cekTalebiOlusturabilir: boolean;
  onTalepVer: (siparisVerilsinMi: boolean) => void;
};

export default function EclubCekTalepVitrinKarti({
  platformStili = false,
  item,
  haftalikBirikim,
  toplananPuan,
  bazCek,
  katlanmisCek,
  uygunAdet,
  uygunMf,
  minimumPuan,
  yeterliPuanVarMi,
  talepPasif,
  islemde,
  islemLoading,
  siparissiz,
  isSerbest,
  katlamaOrani,
  etkilesimliTest,
  testSiparisSecimi,
  cekTalebiOlusturabilir,
  onTalepVer,
}: Props) {
  const yayin_kodu_degeri = yayin_kodu(item.firma_adi, item.talep_no);
  const yayinTuru = item.gorunum_testi_mi
    ? "Video"
    : item.arac_turu ? YAYIN_TURU_SUNUMU[item.arac_turu]?.etiket ?? "—" : "—";
  const ikiSecenekliCek = isSerbest && !item.talep_durumu;
  const baslikClass = "block text-[10.45px] font-extrabold uppercase tracking-[0.12em] text-[var(--tema-yerel-eclub-yardimci-metin-44)]";
  const kimlikDegeriClass = "mt-1 text-[9.576px] font-black leading-none tracking-[-0.055em] text-[var(--tema-yerel-eclub-ana-metin-27)] sm:text-[11.97px]";
  return (
    <article
      className={`@container flex flex-col p-4 @[900px]:p-3 ${platformStili
        ? "rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] shadow-[0_5px_16px_var(--tema-yerel-eclub-golge-04)]"
        : "rounded-[24px] border border-[var(--tema-yerel-eclub-cizgi-34)] bg-[radial-gradient(ellipse_at_55%_0%,var(--tema-yerel-eclub-secim-zemin-14),transparent_42%),linear-gradient(135deg,var(--tema-yerel-eclub-kart-03),var(--tema-yerel-eclub-sayfa-zemini-20))] shadow-[0_14px_38px_var(--tema-yerel-eclub-golge-12)]"}`}
    >
      <div className="grid items-center gap-3 @[660px]:grid-cols-[minmax(0,1fr)_230px] @[900px]:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(220px,240px)]">
        <div className="grid min-w-0 grid-cols-2 items-start gap-2 @[660px]:col-span-2 @[900px]:col-span-1 @[900px]:grid-cols-1">
          <div className="min-w-0">
            <span className={baslikClass}>Yayın Kodu</span>
            <h3 className={kimlikDegeriClass}>{yayin_kodu_degeri}{item.gorunum_testi_mi && eclubUxTestYayiniMi(item.yayin_id) && <> <span className="text-[var(--tema-yerel-eclub-islevsel-metin-40)]">(F)</span></>}</h3>
          </div>
          <div className="min-w-0">
            <span className={baslikClass}>Yayın türü</span>
            <p className={kimlikDegeriClass}>{yayinTuru}</p>
          </div>
        </div>

        {ikiSecenekliCek ? (
          <div className="grid min-w-0 gap-2 @[660px]:col-span-2 @[900px]:grid-cols-[minmax(0,0.8fr)_24px_minmax(0,2fr)]">
            <div className="flex min-w-0 flex-col justify-center rounded-xl border border-[var(--tema-yerel-eclub-cizgi-40)] bg-[var(--tema-yerel-eclub-sayfa-zemini-03)] p-1.5">
              <div className="rounded-lg bg-[var(--tema-yerel-eclub-kart-01)] px-3 py-2">
                <div className="flex items-center gap-2 text-[var(--tema-yerel-eclub-yardimci-metin-45)]">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--tema-yerel-eclub-secim-zemin-13)] text-[var(--tema-yerel-eclub-eylem-metin-09)]"><Coins size={16} /></span>
                  <span className="text-[11.4px] font-bold">Toplam puan</span>
                </div>
                <strong className="mt-1 block whitespace-nowrap text-[23.598px] font-black leading-none tracking-[-0.065em] text-[var(--tema-yerel-eclub-ana-metin-06)]">
                  {toplananPuan.toLocaleString("tr-TR")}<span className="ml-1 text-[13.3px] font-bold tracking-normal">puan</span>
                </strong>
              </div>
            </div>
            <ArrowRight aria-hidden="true" className="mx-auto hidden self-center text-[var(--tema-yerel-eclub-yardimci-metin-46)] @[900px]:block" size={24} strokeWidth={1.7} />
            <div className="grid min-w-0 gap-2">
              {!cekTalebiOlusturabilir ? (
                <p className="m-0 rounded-xl bg-[var(--tema-yerel-eclub-sayfa-zemini-16)] px-3 py-2 text-center text-[10.45px] font-bold text-[var(--tema-yerel-eclub-ana-metin-22)]">Talebi yalnız ana eczacı oluşturabilir.</p>
              ) : !yeterliPuanVarMi ? (
                <p className="m-0 rounded-xl bg-[var(--tema-yerel-eclub-islevsel-zemin-07)] px-3 py-2 text-center text-[10.45px] font-bold text-[var(--tema-yerel-eclub-islevsel-metin-09)]">Çek için en az {minimumPuan.toLocaleString("tr-TR")} puan gerekir.</p>
              ) : null}
              <div className="grid min-w-0 gap-2 @[500px]:grid-cols-[minmax(0,1fr)_230px]">
                <div className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-40)] bg-[var(--tema-yerel-eclub-sayfa-zemini-03)] px-3">
                  <span className="text-[11.4px] font-bold text-[var(--tema-yerel-eclub-yardimci-metin-45)]">Siparişsiz hediye çeki</span>
                  <strong className="whitespace-nowrap text-[17.1px] font-black text-[var(--tema-yerel-eclub-eylem-metin-10)]">{bazCek.toLocaleString("tr-TR")} TL</strong>
                </div>
                <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === false : undefined} className="min-h-11 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-41)] bg-[var(--tema-yerel-eclub-kart-01)] px-3 text-[11.4px] font-bold text-[var(--tema-yerel-eclub-ana-metin-28)] transition hover:bg-[var(--tema-yerel-eclub-sayfa-zemini-07)] disabled:cursor-not-allowed disabled:opacity-50">
                  {islemde ? "İşleniyor..." : "Siparişsiz talep et"}
                </button>
              </div>
              <div className="grid min-w-0 gap-2 @[500px]:grid-cols-[minmax(0,1fr)_230px]">
                <div className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-40)] bg-[var(--tema-yerel-eclub-sayfa-zemini-03)] px-3">
                  <span className="text-[11.4px] font-bold leading-tight text-[var(--tema-yerel-eclub-yardimci-metin-45)]">Siparişle %{katlamaOrani} artan çek</span>
                  <strong className="whitespace-nowrap text-[17.1px] font-black text-[var(--tema-yerel-eclub-eylem-metin-10)]">{katlanmisCek.toLocaleString("tr-TR")} TL</strong>
                </div>
                <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === true : undefined} aria-label={`${uygunAdet} kutu + ${uygunMf} mal fazlası siparişle ${katlanmisCek.toLocaleString("tr-TR")} TL çek talep et`} className="min-h-11 whitespace-nowrap rounded-xl bg-[var(--tema-yerel-eclub-eylem-zemin-14)] px-2 text-[11px] font-extrabold text-[var(--tema-yerel-eclub-ters-metin-01)] transition hover:bg-[var(--tema-yerel-eclub-eylem-zemin-15)] disabled:cursor-not-allowed disabled:opacity-50">
                  {islemde ? "İşleniyor..." : `${uygunAdet}+${uygunMf} MF · Çek talep et`}
                </button>
              </div>
              {etkilesimliTest && testSiparisSecimi !== undefined && <span aria-live="polite" className="text-center text-[10.45px] font-semibold text-[var(--tema-yerel-eclub-islevsel-metin-32)]">Test seçimi; gerçek talep oluşturulmadı.</span>}
              {islemLoading && !islemde && <span className="text-center text-[10.45px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-30)]">Talep gönderiliyor…</span>}
            </div>
          </div>
        ) : (
          <>
        <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2 border p-1.5 ${platformStili
          ? "rounded-xl border-[var(--tema-yerel-eclub-cizgi-40)] bg-[var(--tema-yerel-eclub-sayfa-zemini-03)]"
          : "rounded-[22px] border-[var(--tema-yerel-eclub-cizgi-42)] bg-gradient-to-r from-[var(--tema-yerel-eclub-islevsel-zemin-25)] via-[var(--tema-yerel-eclub-sayfa-zemini-21)] to-[var(--tema-yerel-eclub-secim-zemin-15)]"}`}>
          <div className={`min-w-0 px-2 py-1 ${platformStili ? "rounded-lg bg-[var(--tema-yerel-eclub-kart-01)]" : "rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-43)]/80 bg-[var(--tema-yerel-eclub-kart-01)]/80"}`}>
            <div className={`flex items-center gap-2 ${platformStili ? "text-[var(--tema-yerel-eclub-yardimci-metin-45)]" : "text-[var(--tema-yerel-eclub-islevsel-metin-41)]"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${platformStili ? "bg-[var(--tema-yerel-eclub-secim-zemin-13)] text-[var(--tema-yerel-eclub-eylem-metin-09)]" : "bg-[var(--tema-yerel-eclub-islevsel-zemin-26)]"}`}><Coins size={16} /></span>
              <span className="truncate text-[11.4px] font-bold">Toplam puan</span>
            </div>
            <strong className={`mt-0.5 block whitespace-nowrap text-[17.1px] font-black leading-none tracking-[-0.065em] sm:text-[20.52px] ${platformStili ? "text-[var(--tema-yerel-eclub-ana-metin-06)]" : "text-[var(--tema-yerel-eclub-islevsel-metin-42)]"}`}>
              <span className="text-[19.665px] sm:text-[23.598px]">{toplananPuan.toLocaleString("tr-TR")}</span><span className="ml-1 text-[13.3px] font-bold tracking-normal">puan</span>
            </strong>
          </div>
          <ArrowRight aria-hidden="true" className="mx-auto text-[var(--tema-yerel-eclub-yardimci-metin-46)]" size={24} strokeWidth={1.7} />
          <div className={`min-w-0 px-2 py-1 ${platformStili ? "rounded-lg bg-[var(--tema-yerel-eclub-kart-01)]" : "rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-43)]/80 bg-[var(--tema-yerel-eclub-kart-01)]/80"}`}>
            <div className={`flex items-center gap-2 ${platformStili ? "text-[var(--tema-yerel-eclub-yardimci-metin-45)]" : "text-[var(--tema-yerel-eclub-eylem-metin-11)]"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${platformStili ? "bg-[var(--tema-yerel-eclub-secim-zemin-13)] text-[var(--tema-yerel-eclub-eylem-metin-09)]" : "bg-[var(--tema-yerel-eclub-secim-zemin-16)]"}`}><Gift size={16} /></span>
              <span className="truncate text-[11.4px] font-bold">Hediye çeki</span>
            </div>
            <strong className={`mt-0.5 block whitespace-nowrap text-[17.1px] font-black leading-none tracking-[-0.06em] sm:text-[20.52px] ${platformStili ? "text-[var(--tema-yerel-eclub-eylem-metin-10)]" : "text-[var(--tema-yerel-eclub-eylem-metin-12)]"}`}>
              <span className="text-[19.665px] sm:text-[23.598px]">{bazCek.toLocaleString("tr-TR")}</span> TL
            </strong>
            {isSerbest ? (
              <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2 border-t border-[var(--tema-yerel-eclub-cizgi-40)] pt-1.5">
                <span className="text-[10.45px] font-semibold leading-tight text-[var(--tema-yerel-eclub-yardimci-metin-45)]">Siparişle %{katlamaOrani} artan çek</span>
                <strong className="whitespace-nowrap text-[13.3px] font-extrabold text-[var(--tema-yerel-eclub-eylem-metin-10)]">{katlanmisCek.toLocaleString("tr-TR")} TL</strong>
              </div>
            ) : !siparissiz ? (
              <div className="mt-1.5 border-t border-[var(--tema-yerel-eclub-cizgi-40)] pt-1.5 text-[10.45px] font-semibold leading-tight text-[var(--tema-yerel-eclub-yardimci-metin-45)]">Sipariş zorunlu</div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-2">
          {item.talep_durumu ? (
            <span
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 text-center text-[13.3px] font-extrabold"
              style={{
                color: CEK_TALEP_DURUM_META[item.talep_durumu as CekTalepDurumu].metin,
                background: CEK_TALEP_DURUM_META[item.talep_durumu as CekTalepDurumu].arka,
                borderColor: CEK_TALEP_DURUM_META[item.talep_durumu as CekTalepDurumu].kenar,
              }}
            >
              {CEK_TALEP_DURUM_META[item.talep_durumu as CekTalepDurumu].etiket}
            </span>
          ) : (
            <>
              {!cekTalebiOlusturabilir ? (
                <p className="m-0 rounded-xl bg-[var(--tema-yerel-eclub-sayfa-zemini-16)] px-3 py-2 text-center text-[10.45px] font-bold text-[var(--tema-yerel-eclub-ana-metin-22)]">Talebi yalnız ana eczacı oluşturabilir.</p>
              ) : !yeterliPuanVarMi ? (
                <p className="m-0 rounded-xl bg-[var(--tema-yerel-eclub-islevsel-zemin-07)] px-3 py-2 text-center text-[10.45px] font-bold text-[var(--tema-yerel-eclub-islevsel-metin-09)]">Çek için en az {minimumPuan.toLocaleString("tr-TR")} puan gerekir.</p>
              ) : null}
              {siparissiz ? (
                <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} className={`inline-flex min-h-11 items-center justify-center gap-3 px-4 text-[13.3px] font-extrabold text-[var(--tema-yerel-eclub-ters-metin-01)] transition disabled:cursor-not-allowed ${platformStili
                  ? "rounded-xl bg-[var(--tema-yerel-eclub-eylem-zemin-14)] hover:bg-[var(--tema-yerel-eclub-eylem-zemin-15)] disabled:bg-[var(--tema-yerel-eclub-secim-zemin-17)]"
                  : "rounded-2xl bg-gradient-to-r from-[var(--tema-yerel-eclub-dekoratif-zemin-12)] to-[var(--tema-yerel-eclub-dekoratif-zemin-13)] shadow-[0_8px_17px_var(--tema-yerel-eclub-golge-13)] hover:-translate-y-0.5 hover:shadow-lg disabled:from-[var(--tema-yerel-eclub-sayfa-zemini-17)] disabled:to-[var(--tema-yerel-eclub-sayfa-zemini-17)] disabled:shadow-none"}`}>
                  <Gift size={19} />{islemde ? "İşleniyor..." : "Çek Talep Edin"}<ArrowRight size={19} />
                </button>
              ) : isSerbest ? (
                <div className="grid gap-2">
                  <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === false : undefined} className="min-h-11 rounded-xl border border-[var(--tema-yerel-eclub-cizgi-41)] bg-[var(--tema-yerel-eclub-kart-01)] px-3 text-[11.4px] font-bold text-[var(--tema-yerel-eclub-ana-metin-28)] transition hover:bg-[var(--tema-yerel-eclub-sayfa-zemini-07)] disabled:cursor-not-allowed disabled:opacity-50">
                    Siparişsiz {bazCek.toLocaleString("tr-TR")} TL çek talep et
                  </button>
                  <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === true : undefined} aria-label={`${uygunAdet} kutu + ${uygunMf} mal fazlası siparişle ${katlanmisCek.toLocaleString("tr-TR")} TL çek talep et`} className={`min-h-11 whitespace-nowrap rounded-xl px-2 text-[11px] font-extrabold text-[var(--tema-yerel-eclub-ters-metin-01)] transition disabled:cursor-not-allowed disabled:opacity-50 ${platformStili ? "bg-[var(--tema-yerel-eclub-eylem-zemin-14)] hover:bg-[var(--tema-yerel-eclub-eylem-zemin-15)]" : "bg-gradient-to-r from-[var(--tema-yerel-eclub-islevsel-zemin-27)] to-[var(--tema-yerel-eclub-islevsel-zemin-28)] shadow-sm hover:brightness-105"}`}>
                    {uygunAdet}+{uygunMf} MF · {katlanmisCek.toLocaleString("tr-TR")} TL çek talep et
                  </button>
                  {etkilesimliTest && testSiparisSecimi !== undefined && <span aria-live="polite" className="text-center text-[10.45px] font-semibold text-[var(--tema-yerel-eclub-islevsel-metin-32)]">Test seçimi; gerçek talep oluşturulmadı.</span>}
                </div>
              ) : (
                <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} aria-label={`${uygunAdet} kutu + ${uygunMf} mal fazlası siparişle çek talep et`} className={`min-h-11 whitespace-nowrap px-2 text-[11px] font-extrabold text-[var(--tema-yerel-eclub-ters-metin-01)] transition disabled:cursor-not-allowed ${platformStili
                  ? "rounded-xl bg-[var(--tema-yerel-eclub-eylem-zemin-14)] hover:bg-[var(--tema-yerel-eclub-eylem-zemin-15)] disabled:bg-[var(--tema-yerel-eclub-secim-zemin-17)]"
                  : "rounded-2xl bg-gradient-to-r from-[var(--tema-yerel-eclub-dekoratif-zemin-12)] to-[var(--tema-yerel-eclub-dekoratif-zemin-13)] shadow-md hover:brightness-105 disabled:from-[var(--tema-yerel-eclub-sayfa-zemini-17)] disabled:to-[var(--tema-yerel-eclub-sayfa-zemini-17)] disabled:shadow-none"}`}>
                  {islemde ? "İşleniyor..." : `${uygunAdet}+${uygunMf} MF · Çek talep et`}
                </button>
              )}
            </>
          )}
          {islemLoading && !islemde && <span className="text-center text-[10.45px] font-semibold text-[var(--tema-yerel-eclub-yardimci-metin-30)]">Talep gönderiliyor…</span>}
        </div>
          </>
        )}
      </div>

      <EclubHaftalikPuanBirikimi birikim={haftalikBirikim} />
    </article>
  );
}
