"use client";

import { ArrowRight, CircleCheck, Coins, Gift, Package, Sparkles } from "lucide-react";
import { talepIdGoster } from "@/lib/utils/talepId";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import {
  CEK_TALEP_DURUM_META,
  type BaremSatiri,
  type CekTalepDurumu,
  type EclubEczaneStoreOzetItem,
} from "@/lib/eclub/store/eclubStoreTipler";

type Props = {
  item: EclubEczaneStoreOzetItem;
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
  item,
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
  const baremler: BaremSatiri[] = Array.isArray(item.barem_tablosu) ? item.barem_tablosu : [];
  const puanTabani = baremler[0]?.min_puan ?? 0;
  const puanTavani = baremler.at(-1)?.max_puan ?? puanTabani;
  const puanAraligi = Math.max(1, puanTavani - puanTabani);
  const puanKonumu = Math.max(0, Math.min(100, ((toplananPuan - puanTabani) / puanAraligi) * 100));
  const aktifBarem = baremler.find((barem) => toplananPuan >= barem.min_puan && toplananPuan <= barem.max_puan);
  const aktifBaremSonu = aktifBarem
    ? Math.max(0, Math.min(100, ((aktifBarem.max_puan - puanTabani) / puanAraligi) * 100))
    : 0;
  const tiklar = baremler.length > 0
    ? [...new Set([baremler[0].min_puan, ...baremler.map((barem) => barem.max_puan)])]
    : [];
  const cekTutari = isSerbest && testSiparisSecimi === true ? katlanmisCek : bazCek;
  const yayinNo = talepIdGoster(item.firma_adi, item.talep_no);
  const yayinTuru = item.gorunum_testi_mi
    ? "Video"
    : item.arac_turu ? YAYIN_TURU_SUNUMU[item.arac_turu]?.etiket ?? "—" : "—";
  const baslikClass = "block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8494ad]";
  const kimlikDegeriClass = "mt-1 text-[14.4px] font-black leading-none tracking-[-0.055em] text-[#111d35] sm:text-[18px]";
  const tipMetni = isSerbest
    ? `Siparişle artan çek (+%${katlamaOrani})`
    : "Sipariş zorunlu hediye çeki";

  return (
    <article
      className="@container flex flex-col rounded-[24px] border border-[#e1e9f2] bg-[radial-gradient(ellipse_at_55%_0%,rgba(235,247,255,0.72),transparent_42%),linear-gradient(135deg,#fff,#fcfdff)] p-5 shadow-[0_14px_38px_rgba(31,54,89,0.09)]"
    >
      <div className="grid items-center gap-4 @[660px]:grid-cols-[minmax(0,1fr)_200px] @[900px]:grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(170px,200px)]">
        <div className="grid min-w-0 grid-cols-2 items-start gap-4 @[660px]:col-span-2 @[900px]:col-span-1 @[900px]:grid-cols-[minmax(170px,1.25fr)_minmax(110px,0.75fr)]">
          <div className="min-w-0">
            <span className={baslikClass}>Yayın ID</span>
            <h3 className={kimlikDegeriClass}>{yayinNo}</h3>
            {!siparissiz && (
              <div className={"mt-2 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold " + (
                isSerbest
                  ? "border-purple-200 bg-purple-50 text-purple-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              )}>
                {isSerbest ? <Sparkles size={16} /> : <Package size={16} />}
                <span>{tipMetni}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className={baslikClass}>Yayın türü</span>
            <p className={kimlikDegeriClass}>{yayinTuru}</p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-2 rounded-[22px] border border-[#edf2f8] bg-gradient-to-r from-[#f0fbf7] via-[#f6fbfb] to-[#f1f6ff] p-2">
          <div className="min-w-0 rounded-2xl border border-white/80 bg-white/80 px-2 py-2">
            <div className="flex items-center gap-2 text-[#16815f]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dcf9ed]"><Coins size={16} /></span>
              <span className="truncate text-xs font-bold">Toplam puan</span>
            </div>
            <strong className="mt-1 block whitespace-nowrap text-[18px] font-black leading-none tracking-[-0.065em] text-[#07986a] sm:text-[21.6px]">
              <span className="text-[20.7px] sm:text-[24.84px]">{toplananPuan.toLocaleString("tr-TR")}</span><span className="ml-1 text-sm font-bold tracking-normal">puan</span>
            </strong>
          </div>
          <ArrowRight aria-hidden="true" className="mx-auto text-[#a3b2c8]" size={24} strokeWidth={1.7} />
          <div className="min-w-0 rounded-2xl border border-white/80 bg-white/80 px-2 py-2">
            <div className="flex items-center gap-2 text-[#2864e8]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e7efff]"><Gift size={16} /></span>
              <span className="truncate text-xs font-bold">Hediye çeki</span>
            </div>
            <strong className="mt-1 block whitespace-nowrap text-[18px] font-black leading-none tracking-[-0.06em] text-[#2462e8] sm:text-[21.6px]">
              <span className="text-[20.7px] sm:text-[24.84px]">{cekTutari.toLocaleString("tr-TR")}</span> TL
            </strong>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-2">
          {item.talep_durumu ? (
            <span
              className="inline-flex min-h-[58px] items-center justify-center rounded-2xl border px-4 text-center text-sm font-extrabold"
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
                <p className="m-0 rounded-xl bg-slate-100 px-3 py-2 text-center text-[11px] font-bold text-slate-700">Talebi yalnız ana eczacı oluşturabilir.</p>
              ) : !yeterliPuanVarMi ? (
                <p className="m-0 rounded-xl bg-amber-50 px-3 py-2 text-center text-[11px] font-bold text-amber-800">Çek için en az {minimumPuan.toLocaleString("tr-TR")} puan gerekir.</p>
              ) : null}
              {siparissiz ? (
                <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} className="inline-flex min-h-[58px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#3477f2] to-[#205de9] px-4 text-sm font-extrabold text-white shadow-[0_8px_17px_rgba(37,96,226,0.2)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none">
                  <Gift size={19} />{islemde ? "İşleniyor..." : "Çek Talep Edin"}<ArrowRight size={19} />
                </button>
              ) : isSerbest ? (
                <div className="grid gap-2">
                  <button type="button" onClick={() => onTalepVer(false)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === false : undefined} className="min-h-11 rounded-xl border border-[#cbd7e7] bg-white px-3 text-xs font-bold text-[#344966] transition hover:bg-[#f7faff] disabled:cursor-not-allowed disabled:opacity-50">
                    Siparişsiz {bazCek.toLocaleString("tr-TR")} TL çek talep et
                  </button>
                  <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} aria-pressed={etkilesimliTest ? testSiparisSecimi === true : undefined} className="min-h-11 rounded-xl bg-gradient-to-r from-[#8b22ec] to-[#6414d4] px-3 text-xs font-extrabold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
                    {uygunAdet}+{uygunMf} siparişle {katlanmisCek.toLocaleString("tr-TR")} TL çek talep et
                  </button>
                  {etkilesimliTest && testSiparisSecimi !== undefined && <span aria-live="polite" className="text-center text-[11px] font-semibold text-purple-800">Test seçimi; gerçek talep oluşturulmadı.</span>}
                </div>
              ) : (
                <button type="button" onClick={() => onTalepVer(true)} disabled={talepPasif} className="min-h-[58px] rounded-2xl bg-gradient-to-r from-[#3477f2] to-[#205de9] px-3 text-xs font-extrabold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none">
                  {islemde ? "İşleniyor..." : uygunAdet + "+" + uygunMf + " siparişle çeki talep et"}
                </button>
              )}
            </>
          )}
          {islemLoading && !islemde && <span className="text-center text-[11px] font-semibold text-slate-500">Talep gönderiliyor…</span>}
        </div>
      </div>

      <div className="mt-3 grid items-center gap-x-5 gap-y-3 border-t border-[#edf1f6] pt-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="order-2 flex flex-col items-start gap-1.5 sm:items-end">
          <span className="text-xs font-bold text-[#7889a5]">Puan bareminiz</span>
          {aktifBarem ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c8f0e0] bg-[#edfbf5] px-3 py-2 text-xs font-extrabold text-[#087d58]">
              <CircleCheck size={16} /> Mevcut barem&nbsp; {aktifBarem.min_puan.toLocaleString("tr-TR")}–{aktifBarem.max_puan.toLocaleString("tr-TR")} puan
            </span>
          ) : (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              {toplananPuan < puanTabani ? "Başlangıç: " + puanTabani.toLocaleString("tr-TR") + " puan" : "Üst barem tamamlandı"}
            </span>
          )}
        </div>
        <div className="order-1 px-1.5 pt-5">
          <div className="relative h-2.5 rounded-full bg-[#e5eaf2] shadow-inner" role="progressbar" aria-label="Puan baremindeki konum" aria-valuenow={toplananPuan} aria-valuemin={puanTabani} aria-valuemax={puanTavani}>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-[#e4f8ef]" style={{ width: aktifBaremSonu + "%" }} />
            <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#08ae78] to-[#41c89a]" style={{ width: puanKonumu + "%" }} />
            {tiklar.slice(1).map((tik, index) => {
              const konum = ((tik - puanTabani) / puanAraligi) * 100;
              return <span key={"marker-" + tik + "-" + index} aria-hidden="true" className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#d1d9e6] bg-white" style={{ left: konum + "%" }} />;
            })}
            <span aria-hidden="true" className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#078f64] bg-white shadow-[0_2px_7px_rgba(18,71,59,0.2)]" style={{ left: puanKonumu + "%" }}>
              <span className="absolute bottom-[calc(100%+9px)] left-1/2 -translate-x-1/2 rounded-lg bg-[#263d56] px-2 py-1 text-[11px] font-extrabold leading-none text-white shadow">{toplananPuan.toLocaleString("tr-TR")}</span>
            </span>
          </div>
          <div className="relative mt-2 h-5 text-[11px] font-semibold text-[#7789a5] sm:text-xs">
            {tiklar.map((tik, index) => {
              const konum = ((tik - puanTabani) / puanAraligi) * 100;
              const kenarClass = index === 0 ? "translate-x-0" : index === tiklar.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
              return <span key={"label-" + tik + "-" + index} className={"absolute top-0 " + kenarClass} style={{ left: konum + "%" }}>{tik.toLocaleString("tr-TR")}</span>;
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
