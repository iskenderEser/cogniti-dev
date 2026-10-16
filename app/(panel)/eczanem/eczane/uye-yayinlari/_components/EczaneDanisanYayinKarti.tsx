"use client";

import { YayinKarti } from "@/components/yayin/YayinKarti";
import { talepIdGoster } from "@/lib/utils/talepId";
import type { EczaneDagitimDanisani, EczaneDagitimOzeti, EczaneDagitimYayini } from "../_types";

interface Props {
  yayin: EczaneDagitimYayini;
  ozet: EczaneDagitimOzeti;
  secili: boolean;
  secilebilir: boolean;
  gonderilecekGoster: boolean;
  gonderimDetayiGoster: boolean;
  gonderimDetayiAcik: boolean;
  gonderimDetayiYukleniyor: boolean;
  gonderimDetayiHatasi: string | null;
  gonderilenDanisanlar: readonly EczaneDagitimDanisani[];
  onSecim: () => void;
  onOnizle: () => void;
  onGonderimDetayiAc: () => void;
  onGonderimDetayiKapat: () => void;
}

export function EczaneDanisanYayinKarti({
  yayin, ozet, secili, secilebilir, gonderilecekGoster, gonderimDetayiGoster, gonderimDetayiAcik,
  gonderimDetayiYukleniyor, gonderimDetayiHatasi, gonderilenDanisanlar,
  onSecim, onOnizle, onGonderimDetayiAc, onGonderimDetayiKapat,
}: Props) {
  const onizlenebilir = yayin.arac_turu !== "video" || Boolean(yayin.video_url);
  return <div className={`relative isolate h-full ${gonderimDetayiGoster ? "pb-4" : ""}`}>
    <div className={`relative h-full transition-[transform,opacity] duration-300 motion-reduce:transition-none ${gonderimDetayiAcik ? "pointer-events-none z-0 translate-x-1.5 translate-y-1.5" : "z-10"}`} aria-hidden={gonderimDetayiAcik}>
      <YayinKarti
        yayin={yayin}
        onClick={onizlenebilir ? onOnizle : undefined}
        ariaLabel={onizlenebilir ? `${yayin.urun_adi} öğrenme içeriğini önizle` : `${yayin.urun_adi} önizlemesi hazır değil`}
        className={`h-full ${secili ? "border-[#237ac8] ring-2 ring-[#237ac8]/20" : ""}`}
        durumGoster={ozet.gonderilen_uye_sayisi === 0}
        solUstRozet={ozet.gonderilen_uye_sayisi === 0 ? <span className="font-extrabold text-blue-600">Yeni</span> : undefined}
        etkilesimGoster={false}
        tarihGoster
        izlenmeGoster={false}
        puanGoster
        extraPuanGoster={false}
        talepNoGoster={false}
        baslikSagAksiyon={yayin.talep_no != null ? <span className="shrink-0 font-mono text-xs text-[#bc2d0d] sm:text-[10px]">{talepIdGoster(yayin.firma_adi, yayin.talep_no)}</span> : undefined}
        donguGoster={false}
        tarihSatiriSagAksiyon={(secilebilir || gonderilecekGoster) ? (
          <label onClick={(event) => event.stopPropagation()} className={`inline-flex shrink-0 items-center gap-1 text-xs font-normal sm:text-[10px] ${secili ? "text-[#1d65aa]" : "text-[#526780]"} ${secilebilir ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
            <input type="checkbox" checked={secili} disabled={!secilebilir} onChange={onSecim} aria-label={`${yayin.urun_adi} yayınını gönderim için seç`} className="size-3 accent-[#237ac8]" />
            Göndermek için seçin
          </label>
        ) : undefined}
        puanSatiriSagAksiyon={<span className="inline-flex shrink-0 rounded-md border border-[#dce7f2] bg-[#f2f7fc] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[#405976] sm:text-[9px]">
          {gonderilecekGoster ? ozet.gonderilebilir_uye_sayisi : ozet.gonderilen_uye_sayisi}/{ozet.aktif_uye_sayisi} {gonderilecekGoster ? "Gönderilecek" : "Gönderilen"}
        </span>}
        altEkIcerik={<div className="mt-2 border-t border-[#e8eef5] pt-2" aria-label="Danışan gönderim koşulu">
          <span className="max-w-full rounded-md border border-[#e1e9f3] bg-[#f5f8fc] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[#405976] sm:text-[8px]">Yalnız aktif danışanlar</span>
        </div>}
      />
    </div>
    {gonderimDetayiGoster && <>
      <div id={`eczanem-danisan-gonderim-detayi-${yayin.yayin_id}`} role="region" aria-label={`${yayin.urun_adi} gönderim detayları`} aria-hidden={!gonderimDetayiAcik}
        className={`absolute inset-x-0 bottom-4 top-0 overflow-hidden rounded-xl border border-[#b9d3e9] bg-[#f8fbff] shadow-[0_12px_28px_rgba(31,74,111,.18)] transition-[transform,opacity] duration-300 motion-reduce:transition-none ${gonderimDetayiAcik ? "z-30" : "pointer-events-none z-0 translate-x-1.5 translate-y-1.5"}`}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-[#e4ecf4] px-3 py-2 text-[10px] font-extrabold text-[#29445f]">{yayin.urun_adi} · {ozet.gonderilen_uye_sayisi} danışan</div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {gonderimDetayiYukleniyor ? <p className="p-3 text-center text-[10px] text-[#7b8da5]">Gönderimler yükleniyor…</p>
              : gonderimDetayiHatasi ? <p role="alert" className="p-3 text-center text-[10px] text-[#a2643c]">{gonderimDetayiHatasi}</p>
                : gonderilenDanisanlar.length === 0 ? <p className="p-3 text-center text-[10px] text-[#7b8da5]">Aktif danışanlarda gönderim bulunmuyor.</p>
                  : gonderilenDanisanlar.map((danisan) => <div key={danisan.musteri_id} className="mb-1.5 rounded-lg border border-[#dfe9f2] bg-white px-2.5 py-2 text-[10px] last:mb-0"><strong className="block truncate text-[#2e4663]">{danisan.ad_soyad}</strong><span className="text-[#7b8da5]">{danisan.telefon_maskeli}</span></div>)}
          </div>
        </div>
      </div>
      <button type="button" onClick={(event) => { event.stopPropagation(); if (gonderimDetayiAcik) onGonderimDetayiKapat(); else onGonderimDetayiAc(); }}
        aria-expanded={gonderimDetayiAcik} aria-controls={`eczanem-danisan-gonderim-detayi-${yayin.yayin_id}`}
        aria-label={gonderimDetayiAcik ? `${yayin.urun_adi} yayın kartına dön` : `${yayin.urun_adi} gönderim detaylarını göster`}
        className={`absolute bottom-0 left-2 right-[-6px] z-[5] flex h-7 translate-y-1/4 items-end justify-center rounded-b-xl border border-t-0 px-3 pb-1 text-[9px] font-extrabold shadow-sm ${gonderimDetayiAcik ? "border-[#d6e0ea] bg-white text-[#526a86]" : "border-[#9fc5e4] bg-[#dcecf8] text-[#24618f]"}`}>
        {gonderimDetayiAcik ? "Yayın kartına dön" : "Gönderim detayları"}
      </button>
    </>}
  </div>;
}
