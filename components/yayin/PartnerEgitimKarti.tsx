"use client";

import type { ReactNode } from "react";
import { YayinKarti } from "@/components/yayin/YayinKarti";
import { EGITIM_DURUMLARI, type PartnerEgitimi } from "@/lib/agora/partnerEgitimleri";
import styles from "./PartnerEgitimKarti.module.css";

interface Props {
  egitim: PartnerEgitimi;
  onIncele: () => void;
  islemler: ReactNode;
}

/** Partner eğitiminin tüm yönetim ekranlarındaki ortak HOYK tanımı. */
export function PartnerEgitimKarti({ egitim, onIncele, islemler }: Props) {
  return <YayinKarti
    yayin={{
      yayin_id: egitim.egitim_id,
      urun_adi: egitim.egitim_adi,
      icerik_turu: egitim.kategori,
      arac_turu: egitim.yayin_araci,
      video_url: egitim.yayin_araci === "video" ? egitim.kapak_video_guid : null,
      yayin_tarihi: egitim.olusturuldu_at,
    }}
    className={styles.kart}
    ariaLabel={`${egitim.egitim_adi} Eğitim Bilgileri`}
    onClick={onIncele}
    etkilesimGoster={false}
    izlenmeGoster={false}
    puanGoster={false}
    yayinKoduGoster={false}
    donguGoster={false}
    yayinTuruGoster={!!egitim.yayin_araci}
    solUstRozet={<span>{EGITIM_DURUMLARI[egitim.durum]}</span>}
    tarihSatiriSagAksiyon={egitim.partner_egitim_id ? <span
      aria-label={`Eğitim ID: ${egitim.partner_egitim_id}`}
      className="shrink-0 font-mono text-xs text-[var(--tema-hoyk-talep-metni)] sm:text-[10px]"
    >{egitim.partner_egitim_id}</span> : undefined}
    puanYaniRozet={<span className={styles.fiyat}>{egitim.fiyat_tl === null
      ? "Fiyat Belirlenmedi"
      : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(egitim.fiyat_tl)}</span>}
    altEkIcerik={<div className={styles.islemler}>{islemler}</div>}
  />;
}
