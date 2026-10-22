"use client";

import { YayinKarti } from "@/components/yayin/YayinKarti";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import type { OneriGecmisKaydi, OneriYayin } from "../../oneriler/_types";
import { EclubGonderimDetayKarti } from "./EclubGonderimDetayKarti";

interface Props {
  yayin: OneriYayin;
  yeni: boolean;
  secili: boolean;
  secilebilir: boolean;
  gonderilenSayisi: number;
  hedefKisiSayisi: number;
  gonderilecekGoster: boolean;
  gonderimDetayiGoster: boolean;
  gonderimDetayiAcik: boolean;
  gonderimKayitlari: readonly OneriGecmisKaydi[];
  simdi: number;
  onSecim: () => void;
  onOnizle?: () => void;
  onGonderimDetayiAc: () => void;
  onGonderimDetayiKapat: () => void;
  secimGoster?: boolean;
}

const bilgi = "max-w-full rounded-md border border-[var(--tema-hoyk-kosul-cizgi)] bg-[var(--tema-hoyk-kosul-zemin)] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[var(--tema-hoyk-gonderim-metin)] sm:text-[8px]";
const satisSartiBilgi = "max-w-full rounded-md border border-[var(--tema-hoyk-kosul-cizgi)] bg-[var(--tema-hoyk-kosul-zemin)] px-1.5 py-0.5 text-[9px] font-normal leading-tight text-[var(--tema-hoyk-gonderim-metin)] sm:text-[7px]";

export function EclubYayinGonderimKarti({ yayin, yeni, secili, secilebilir, gonderilenSayisi, hedefKisiSayisi, gonderilecekGoster, gonderimDetayiGoster, gonderimDetayiAcik, gonderimKayitlari, simdi, onSecim, onOnizle, onGonderimDetayiAc, onGonderimDetayiKapat, secimGoster = true }: Props) {
  const cekli = yayin.cek_karsiligi_var_mi === true;
  const incelemeTamamlandi = yayin.gonderim_incelemesi_tamamlandi;

  return (
    <div className={`relative isolate h-full ${gonderimDetayiGoster ? "pb-4" : ""}`}>
      <div className={`relative h-full transition-[transform,opacity] duration-300 motion-reduce:transition-none ${gonderimDetayiAcik ? "pointer-events-none z-0 translate-x-1.5 translate-y-1.5 opacity-100" : "z-10 translate-x-0 translate-y-0 opacity-100"}`} aria-hidden={gonderimDetayiAcik}>
      <YayinKarti
      yayin={yayin}
      onClick={onOnizle ? () => onOnizle() : undefined}
      ariaLabel={`${yayin.urun_adi} öğrenme içeriğini önizle`}
      className={`h-full ${secili ? "border-[var(--tema-hoyk-secim-cizgi)] ring-2 ring-[var(--tema-hoyk-secim-halka)]" : ""}`}
      durumGoster={yeni}
      solUstRozet={yeni ? <span className="font-extrabold text-[var(--tema-hoyk-durum-yeni)]">Yeni</span> : undefined}
      etkilesimGoster
      etkilesimAktif={false}
      tarihGoster
      izlenmeGoster={false}
      puanGoster
      extraPuanGoster={false}
      yayinKoduGoster={false}
      tarihSatiriSagAksiyon={yayin.talep_no != null ? <span className="shrink-0 font-mono text-xs text-[var(--tema-hoyk-talep-metni)] sm:text-[10px]">{yayin_kodu(yayin.firma_adi, yayin.talep_no)}</span> : undefined}
      donguGoster={false}
      thumbnailAltBant={!incelemeTamamlandi ? <span className="block w-full rounded-md bg-[var(--tema-hoyk-inceleme-uyari-zemin)] px-1.5 py-0.5 text-center text-[9px] font-medium leading-3 text-[var(--tema-hoyk-inceleme-uyari-metin)]">Göndermek için yayını tamamlayın</span> : undefined}
      puanSatiriSagAksiyon={<span className="inline-flex shrink-0 rounded-md border border-[var(--tema-hoyk-gonderim-cizgi)] bg-[var(--tema-hoyk-gonderim-zemin)] px-1.5 py-0.5 text-[10px] font-normal leading-tight text-[var(--tema-hoyk-gonderim-metin)] sm:text-[9px]">{gonderilecekGoster ? hedefKisiSayisi - gonderilenSayisi : gonderilenSayisi}/{hedefKisiSayisi} {gonderilecekGoster ? "Gönderilecek" : "Gönderilen"}</span>}
      altEkIcerik={
        <div className="mt-2 border-t border-[var(--tema-hoyk-ek-icerik-cizgi)] pt-2" aria-label="Yayın bilgileri ve koşulları">
          <div className="flex flex-wrap items-start justify-between gap-1">
            {yayin.cek_karsiligi_var_mi === false ? (
              <span className={bilgi}>Çeksiz Puan · Yalnız lig</span>
            ) : cekli ? (
              <>
                <span className={bilgi}>Çekli Puan</span>
                {yayin.satis_sarti_tipi === "satis_sartli" ? <span className={bilgi}>Sipariş zorunlu</span> : yayin.satis_sarti_tipi === "serbest_siparis" ? <span className={bilgi}>Siparişle çek tutarı artar</span> : yayin.satis_sarti_tipi === "siparissiz_cek" ? <span className={bilgi}>Sipariş yok</span> : <span className={bilgi}>Sipariş koşulu belirtilmemiş</span>}
                {yayin.satis_sarti_tipi === "serbest_siparis" && yayin.gizli_sart_katlama_orani != null && <span className={bilgi}>Siparişle çek tutarı +%{yayin.gizli_sart_katlama_orani}</span>}
              </>
            ) : <span className={bilgi}>Puan türü belirtilmemiş</span>}
          </div>
          {cekli && Array.isArray(yayin.barem_tablosu) && yayin.barem_tablosu.length > 0 && (
            <div className="mt-1 grid grid-cols-3 gap-1">
              {yayin.barem_tablosu.map((barem, index) => (
                <span key={index} className={`${satisSartiBilgi} flex min-w-0 flex-col items-center text-center`} title={`${barem.min_puan.toLocaleString("tr-TR")}–${barem.max_puan.toLocaleString("tr-TR")} puan${yayin.satis_sarti_tipi === "siparissiz_cek" ? "" : `: ${barem.adet}+${barem.mal_fazlasi}`}`}>
                  <span>{barem.min_puan.toLocaleString("tr-TR")}–{barem.max_puan.toLocaleString("tr-TR")}p</span>
                  {yayin.satis_sarti_tipi !== "siparissiz_cek" && <span>{barem.adet}+{barem.mal_fazlasi}</span>}
                </span>
              ))}
            </div>
          )}
          {secimGoster && <div className="mt-2 flex gap-1.5 border-t border-[var(--tema-hoyk-ek-icerik-cizgi)] pt-2" onClick={event => event.stopPropagation()}>
            <button type="button" onClick={onOnizle} className="min-w-0 flex-1 rounded-lg border border-[var(--tema-hoyk-onizleme-cizgi)] bg-[var(--tema-hoyk-zemin)] px-2 py-1.5 text-xs font-bold text-[var(--tema-hoyk-secim-pasif-metni)] hover:bg-[var(--tema-hoyk-kosul-zemin)] sm:text-[10px]">
              Önizle
            </button>
            <button type="button" onClick={onSecim} disabled={!secilebilir} aria-pressed={secili} aria-label={`${yayin.urun_adi} yayınını gönderim için ${secili ? "seçimden çıkar" : "seç"}`}
              className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs font-extrabold sm:text-[10px] ${secili ? "border-[var(--tema-hoyk-secim-cizgi)] bg-[var(--tema-hoyk-secim-zemin)] text-[var(--tema-hoyk-secim-metni)]" : "border-[var(--tema-hoyk-secim-cizgi)] bg-[var(--tema-hoyk-secim-eylemi)] text-[var(--tema-hoyk-ters-metin)]"} disabled:cursor-not-allowed disabled:border-[var(--tema-hoyk-onizleme-cizgi)] disabled:bg-[var(--tema-hoyk-secim-kapali-zemin)] disabled:text-[var(--tema-hoyk-secim-kapali-metin)]`}>
              {secili ? "✓ Seçildi" : "Seç"}
            </button>
          </div>}
        </div>
      }
    />
      </div>
      {gonderimDetayiGoster && <EclubGonderimDetayKarti
        yayinId={yayin.yayin_id}
        urunAdi={yayin.urun_adi}
        aracTuru={yayin.arac_turu}
        kayitlar={gonderimKayitlari}
        simdi={simdi}
        acik={gonderimDetayiAcik}
        onAc={onGonderimDetayiAc}
        onKapat={onGonderimDetayiKapat}
      />}
    </div>
  );
}
