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
        className={`h-full ${secili ? "border-[var(--tema-hoyk-secim-cizgi)] ring-2 ring-[var(--tema-hoyk-secim-halka)]" : ""}`}
        durumGoster={ozet.gonderilen_uye_sayisi === 0}
        solUstRozet={ozet.gonderilen_uye_sayisi === 0 ? <span className="font-extrabold text-[var(--tema-hoyk-durum-yeni)]">Yeni</span> : undefined}
        etkilesimGoster={false}
        tarihGoster
        izlenmeGoster={false}
        puanGoster
        extraPuanGoster={false}
        talepNoGoster={false}
        baslikSagAksiyon={yayin.talep_no != null ? <span className="shrink-0 font-mono text-xs text-[var(--tema-hoyk-talep-metni)] sm:text-[10px]">{talepIdGoster(yayin.firma_adi, yayin.talep_no)}</span> : undefined}
        donguGoster={false}
        tarihSatiriSagAksiyon={(secilebilir || gonderilecekGoster) ? (
          <label onClick={(event) => event.stopPropagation()} className={`inline-flex shrink-0 items-center gap-1 text-xs font-normal sm:text-[10px] ${secili ? "text-[var(--tema-hoyk-secim-metni)]" : "text-[var(--tema-hoyk-secim-pasif-metni)]"} ${secilebilir ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
            <input type="checkbox" checked={secili} disabled={!secilebilir} onChange={onSecim} aria-label={`${yayin.urun_adi} yayınını gönderim için seç`} className="size-3 accent-[var(--tema-hoyk-secim-kontrolu)]" />
            Göndermek için seçin
          </label>
        ) : undefined}
        puanSatiriSagAksiyon={<span className="inline-flex shrink-0 rounded-md border border-[var(--tema-hoyk-gonderim-cizgi)] bg-[var(--tema-hoyk-gonderim-zemin)] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[var(--tema-hoyk-gonderim-metin)] sm:text-[9px]">
          {gonderilecekGoster ? ozet.gonderilebilir_uye_sayisi : ozet.gonderilen_uye_sayisi}/{ozet.aktif_uye_sayisi} {gonderilecekGoster ? "Gönderilecek" : "Gönderilen"}
        </span>}
        altEkIcerik={<div className="mt-2 border-t border-[var(--tema-hoyk-ek-icerik-cizgi)] pt-2" aria-label="Danışan gönderim koşulu">
          <span className="max-w-full rounded-md border border-[var(--tema-hoyk-kosul-cizgi)] bg-[var(--tema-hoyk-kosul-zemin)] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[var(--tema-hoyk-gonderim-metin)] sm:text-[8px]">Yalnız aktif danışanlar</span>
        </div>}
      />
    </div>
    {gonderimDetayiGoster && <>
      <div id={`eczanem-danisan-gonderim-detayi-${yayin.yayin_id}`} role="region" aria-label={`${yayin.urun_adi} gönderim detayları`} aria-hidden={!gonderimDetayiAcik}
        className={`absolute inset-x-0 bottom-4 top-0 overflow-hidden rounded-xl border border-[var(--tema-gonderim-detay-panel-cizgi)] bg-[var(--tema-gonderim-detay-zemin)] shadow-[0_12px_28px_var(--tema-gonderim-detay-golge)] transition-[transform,opacity] duration-300 motion-reduce:transition-none ${gonderimDetayiAcik ? "z-30" : "pointer-events-none z-0 translate-x-1.5 translate-y-1.5"}`}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-[var(--tema-gonderim-detay-baslik-cizgi)] px-3 py-2 text-[10px] font-extrabold text-[var(--tema-gonderim-detay-baslik)]">{yayin.urun_adi} · {ozet.gonderilen_uye_sayisi} danışan</div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {gonderimDetayiYukleniyor ? <p className="p-3 text-center text-[10px] text-[var(--tema-gonderim-detay-eczane-metni)]">Gönderimler yükleniyor…</p>
              : gonderimDetayiHatasi ? <p role="alert" className="p-3 text-center text-[10px] text-[var(--tema-gonderim-detay-hata-metni)]">{gonderimDetayiHatasi}</p>
                : gonderilenDanisanlar.length === 0 ? <p className="p-3 text-center text-[10px] text-[var(--tema-gonderim-detay-eczane-metni)]">Aktif danışanlarda gönderim bulunmuyor.</p>
                  : gonderilenDanisanlar.map((danisan) => <div key={danisan.musteri_id} className="mb-1.5 rounded-lg border border-[var(--tema-gonderim-detay-satir-cizgi)] bg-[var(--tema-gonderim-detay-yuzey)] px-2.5 py-2 text-[10px] last:mb-0"><strong className="block truncate text-[var(--tema-gonderim-detay-kisi-metni)]">{danisan.ad_soyad}</strong><span className="text-[var(--tema-gonderim-detay-eczane-metni)]">{danisan.telefon_maskeli}</span></div>)}
          </div>
        </div>
      </div>
      <button type="button" onClick={(event) => { event.stopPropagation(); if (gonderimDetayiAcik) onGonderimDetayiKapat(); else onGonderimDetayiAc(); }}
        aria-expanded={gonderimDetayiAcik} aria-controls={`eczanem-danisan-gonderim-detayi-${yayin.yayin_id}`}
        aria-label={gonderimDetayiAcik ? `${yayin.urun_adi} yayın kartına dön` : `${yayin.urun_adi} gönderim detaylarını göster`}
        className={`absolute bottom-0 left-2 right-[-6px] z-[5] flex h-7 translate-y-1/4 items-end justify-center rounded-b-xl border border-t-0 px-3 pb-1 text-[9px] font-extrabold shadow-sm ${gonderimDetayiAcik ? "border-[var(--tema-gonderim-detay-acik-sekme-cizgi)] bg-[var(--tema-gonderim-detay-yuzey)] text-[var(--tema-gonderim-detay-baslik-yardimci)]" : "border-[var(--tema-gonderim-detay-kapali-sekme-cizgi)] bg-[var(--tema-gonderim-detay-kapali-sekme-zemin)] text-[var(--tema-gonderim-detay-kapali-sekme-metin)]"}`}>
        {gonderimDetayiAcik ? "Yayın kartına dön" : "Gönderim detayları"}
      </button>
    </>}
  </div>;
}
