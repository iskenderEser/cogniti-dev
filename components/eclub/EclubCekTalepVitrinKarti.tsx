"use client";

import { ArrowRight, Coins, Gift } from "lucide-react";
import { talepIdGoster } from "@/lib/utils/talepId";
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
  const yayinNo = talepIdGoster(item.firma_adi, item.talep_no);
  const yayinTuru = item.gorunum_testi_mi
    ? "Video"
    : item.arac_turu ? YAYIN_TURU_SUNUMU[item.arac_turu]?.etiket ?? "—" : "—";
  const ikiSecenekliCek = isSerbest && !item.talep_durumu;
  const baslikClass = "block text-[10.45px] font-extrabold uppercase tracking-[0.12em] text-[#8494ad]";
  const kimlikDegeriClass = "mt-1 text-[9.576px] font-black leading-none tracking-[-0.055em] text-[#111d35] sm:text-[11.97px]";
  return (
    <article
      className={`@container flex flex-col p-4 @[900px]:p-3 ${platformStili
        ? "rounded-2xl border border-[#dfe7f1] bg-white shadow-[0_5px_16px_rgba(31,55,90,0.035)]"
        : "rounded-[24px] border border-[#e1e9f2] bg-[radial-gradient(ellipse_at_55%_0%,rgba(235,247,255,0.72),transparent_42%),linear-gradient(135deg,#fff,#fcfdff)] shadow-[0_14px_38px_rgba(31,54,89,0.09)]"}`}
    >
      <div className="grid items-center gap-3 @[660px]:grid-cols-[minmax(0,1fr)_230px] @[900px]:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(220px,240px)]">
        <div className="grid min-w-0 grid-cols-2 items-start gap-2 @[660px]:col-span-2 @[900px]:col-span-1 @[900px]:grid-cols-1">
          <div className="min-w-0">
            <span className={baslikClass}>Yayın ID</span>
            <h3 className={kimlikDegeriClass}>{yayinNo}</h3>
          </div>
          <div className="min-w-0">
            <span className={baslikClass}>Yayın türü</span>
            <p className={kimlikDegeriClass}>{yayinTuru}</p>
          </div>
        </div>

        {ikiSecenekliCek ? (
          <div className="grid min-w-0 gap-2 @[660px]:col-span-2 @[900px]:grid-cols-[minmax(0,0.8fr)_24px_minmax(0,2fr)]">
            <div className="flex min-w-0 flex-col justify-center rounded-xl border border-[#e3eaf2] bg-[#f7f9fc] p-1.5">
              <div className="rounded-lg bg-white px-3 py-2">
                <div className="flex items-center gap-2 text-[#526a86]">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eaf2fb] text-[#3978ae]"><Coins size={16} /></span>
                  <span className="text-[11.4px] font-bold">Toplam puan</span>
                </div>
                <strong className="mt-1 block whitespace-nowrap text-[23.598px] font-black leading-none tracking-[-0.065em] text-[#203653]">
                  {toplananPuan.toLocaleString("tr-TR")}<span className="ml-1 text-[13.3px] font-bold tracking-normal">puan</span>
                </strong>
              </div>
            </div>
            <ArrowRight aria-hidden="true" className="mx-auto hidden self-center text-[#a3b2c8] @[900px]:block" size={24} strokeWidth={1.7} />
            <div className="grid min-w-0 gap-2">
              {!cekTalebiOlusturabilir ? (
                <p className="m-0 rounded-xl bg-slate-100 px-3 py-2 text-center text-[10.45px] font-bold text-slate-700">Talebi yalnız ana eczacı oluşturabilir.</p>
              ) : !yeterliPuanVarMi ? (
                <p className="m-0 rounded-xl bg-amber-50 px-3 py-2 text-center text-[10.45px] font-bold text-amber-800">Çek için en az {minimumPuan.toLocaleString("tr-TR")} puan gerekir.</p>
              ) : null}
              <div className="grid min-w-0 gap-2 @[500px]:grid-cols-[minmax(0,1fr)_230px]">
                <div className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-[#e3eaf2] bg-[#f7f9fc] px-3">
                  <span className="text-[11.4px] font-bold text-[#526a86]">Siparişsiz hediye çeki</span>
                  <strong className="whitespace-nowrap text-[17.1px] font-black text-[#24618f]">{bazCek.toLocaleString("tr-TR")} TL</strong>
                </div>
                <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === false : undefined} className="min-h-11 rounded-xl border border-[#cbd7e7] bg-white px-3 text-[11.4px] font-bold text-[#344966] transition hover:bg-[#f7faff] disabled:cursor-not-allowed disabled:opacity-50">
                  {islemde ? "İşleniyor..." : "Siparişsiz talep et"}
                </button>
              </div>
              <div className="grid min-w-0 gap-2 @[500px]:grid-cols-[minmax(0,1fr)_230px]">
                <div className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-xl border border-[#e3eaf2] bg-[#f7f9fc] px-3">
                  <span className="text-[11.4px] font-bold leading-tight text-[#526a86]">Siparişle %{katlamaOrani} artan çek</span>
                  <strong className="whitespace-nowrap text-[17.1px] font-black text-[#24618f]">{katlanmisCek.toLocaleString("tr-TR")} TL</strong>
                </div>
                <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === true : undefined} aria-label={`${uygunAdet} kutu + ${uygunMf} mal fazlası siparişle ${katlanmisCek.toLocaleString("tr-TR")} TL çek talep et`} className="min-h-11 whitespace-nowrap rounded-xl bg-[#2a80d7] px-2 text-[11px] font-extrabold text-white transition hover:bg-[#216fbf] disabled:cursor-not-allowed disabled:opacity-50">
                  {islemde ? "İşleniyor..." : `${uygunAdet}+${uygunMf} MF · Çek talep et`}
                </button>
              </div>
              {etkilesimliTest && testSiparisSecimi !== undefined && <span aria-live="polite" className="text-center text-[10.45px] font-semibold text-purple-800">Test seçimi; gerçek talep oluşturulmadı.</span>}
              {islemLoading && !islemde && <span className="text-center text-[10.45px] font-semibold text-slate-500">Talep gönderiliyor…</span>}
            </div>
          </div>
        ) : (
          <>
        <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2 border p-1.5 ${platformStili
          ? "rounded-xl border-[#e3eaf2] bg-[#f7f9fc]"
          : "rounded-[22px] border-[#edf2f8] bg-gradient-to-r from-[#f0fbf7] via-[#f6fbfb] to-[#f1f6ff]"}`}>
          <div className={`min-w-0 px-2 py-1 ${platformStili ? "rounded-lg bg-white" : "rounded-2xl border border-white/80 bg-white/80"}`}>
            <div className={`flex items-center gap-2 ${platformStili ? "text-[#526a86]" : "text-[#16815f]"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${platformStili ? "bg-[#eaf2fb] text-[#3978ae]" : "bg-[#dcf9ed]"}`}><Coins size={16} /></span>
              <span className="truncate text-[11.4px] font-bold">Toplam puan</span>
            </div>
            <strong className={`mt-0.5 block whitespace-nowrap text-[17.1px] font-black leading-none tracking-[-0.065em] sm:text-[20.52px] ${platformStili ? "text-[#203653]" : "text-[#07986a]"}`}>
              <span className="text-[19.665px] sm:text-[23.598px]">{toplananPuan.toLocaleString("tr-TR")}</span><span className="ml-1 text-[13.3px] font-bold tracking-normal">puan</span>
            </strong>
          </div>
          <ArrowRight aria-hidden="true" className="mx-auto text-[#a3b2c8]" size={24} strokeWidth={1.7} />
          <div className={`min-w-0 px-2 py-1 ${platformStili ? "rounded-lg bg-white" : "rounded-2xl border border-white/80 bg-white/80"}`}>
            <div className={`flex items-center gap-2 ${platformStili ? "text-[#526a86]" : "text-[#2864e8]"}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${platformStili ? "bg-[#eaf2fb] text-[#3978ae]" : "bg-[#e7efff]"}`}><Gift size={16} /></span>
              <span className="truncate text-[11.4px] font-bold">Hediye çeki</span>
            </div>
            <strong className={`mt-0.5 block whitespace-nowrap text-[17.1px] font-black leading-none tracking-[-0.06em] sm:text-[20.52px] ${platformStili ? "text-[#24618f]" : "text-[#2462e8]"}`}>
              <span className="text-[19.665px] sm:text-[23.598px]">{bazCek.toLocaleString("tr-TR")}</span> TL
            </strong>
            {isSerbest ? (
              <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2 border-t border-[#e3eaf2] pt-1.5">
                <span className="text-[10.45px] font-semibold leading-tight text-[#526a86]">Siparişle %{katlamaOrani} artan çek</span>
                <strong className="whitespace-nowrap text-[13.3px] font-extrabold text-[#24618f]">{katlanmisCek.toLocaleString("tr-TR")} TL</strong>
              </div>
            ) : !siparissiz ? (
              <div className="mt-1.5 border-t border-[#e3eaf2] pt-1.5 text-[10.45px] font-semibold leading-tight text-[#526a86]">Sipariş zorunlu</div>
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
                <p className="m-0 rounded-xl bg-slate-100 px-3 py-2 text-center text-[10.45px] font-bold text-slate-700">Talebi yalnız ana eczacı oluşturabilir.</p>
              ) : !yeterliPuanVarMi ? (
                <p className="m-0 rounded-xl bg-amber-50 px-3 py-2 text-center text-[10.45px] font-bold text-amber-800">Çek için en az {minimumPuan.toLocaleString("tr-TR")} puan gerekir.</p>
              ) : null}
              {siparissiz ? (
                <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} className={`inline-flex min-h-11 items-center justify-center gap-3 px-4 text-[13.3px] font-extrabold text-white transition disabled:cursor-not-allowed ${platformStili
                  ? "rounded-xl bg-[#2a80d7] hover:bg-[#216fbf] disabled:bg-[#cbd5e1]"
                  : "rounded-2xl bg-gradient-to-r from-[#3477f2] to-[#205de9] shadow-[0_8px_17px_rgba(37,96,226,0.2)] hover:-translate-y-0.5 hover:shadow-lg disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"}`}>
                  <Gift size={19} />{islemde ? "İşleniyor..." : "Çek Talep Edin"}<ArrowRight size={19} />
                </button>
              ) : isSerbest ? (
                <div className="grid gap-2">
                  <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === false : undefined} className="min-h-11 rounded-xl border border-[#cbd7e7] bg-white px-3 text-[11.4px] font-bold text-[#344966] transition hover:bg-[#f7faff] disabled:cursor-not-allowed disabled:opacity-50">
                    Siparişsiz {bazCek.toLocaleString("tr-TR")} TL çek talep et
                  </button>
                  <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === true : undefined} aria-label={`${uygunAdet} kutu + ${uygunMf} mal fazlası siparişle ${katlanmisCek.toLocaleString("tr-TR")} TL çek talep et`} className={`min-h-11 whitespace-nowrap rounded-xl px-2 text-[11px] font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${platformStili ? "bg-[#2a80d7] hover:bg-[#216fbf]" : "bg-gradient-to-r from-[#8b22ec] to-[#6414d4] shadow-sm hover:brightness-105"}`}>
                    {uygunAdet}+{uygunMf} MF · {katlanmisCek.toLocaleString("tr-TR")} TL çek talep et
                  </button>
                  {etkilesimliTest && testSiparisSecimi !== undefined && <span aria-live="polite" className="text-center text-[10.45px] font-semibold text-purple-800">Test seçimi; gerçek talep oluşturulmadı.</span>}
                </div>
              ) : (
                <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} aria-label={`${uygunAdet} kutu + ${uygunMf} mal fazlası siparişle çek talep et`} className={`min-h-11 whitespace-nowrap px-2 text-[11px] font-extrabold text-white transition disabled:cursor-not-allowed ${platformStili
                  ? "rounded-xl bg-[#2a80d7] hover:bg-[#216fbf] disabled:bg-[#cbd5e1]"
                  : "rounded-2xl bg-gradient-to-r from-[#3477f2] to-[#205de9] shadow-md hover:brightness-105 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"}`}>
                  {islemde ? "İşleniyor..." : `${uygunAdet}+${uygunMf} MF · Çek talep et`}
                </button>
              )}
            </>
          )}
          {islemLoading && !islemde && <span className="text-center text-[10.45px] font-semibold text-slate-500">Talep gönderiliyor…</span>}
        </div>
          </>
        )}
      </div>

      <EclubHaftalikPuanBirikimi birikim={haftalikBirikim} />
    </article>
  );
}
