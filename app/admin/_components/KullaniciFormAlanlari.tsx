"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useId } from "react";
import { ROLLER } from "../_constants";
import { ROL_ADLARI } from "@/lib/utils/roller";
import { adSoyadCanliBicimle } from "@/lib/utils/adSoyadBicimle";
import { telefonBicimle, telefonRakam } from "@/lib/admin/telefonBicim";
import type { Bolge, Takim } from "../_types";
import styles from "../admin.module.css";

export interface KullaniciFormVerisi {
  ad: string; soyad: string; rol: string; eposta: string; telefon: string; sifre: string;
  takim_id: string; bolge_id: string;
  yetki_kullanici_yonetim: boolean; yetki_aktif_pasif: boolean;
}
interface Props {
  veri: KullaniciFormVerisi;
  degistir: (veri: Partial<KullaniciFormVerisi>) => void;
  takimlar: Takim[];
  bolgeler?: Bolge[];
  duzenleme?: boolean;
  disabled?: boolean;
}

function KullaniciFormAlanlari({ veri: v, degistir, takimlar, bolgeler, duzenleme, disabled }: Props) {
  const id = useId();
  const bolgeListesi = bolgeler ?? takimlar.find(t => t.takim_id === v.takim_id)?.bolgeler ?? [];
  return <fieldset disabled={disabled} style={{ border:0, padding:0, margin:0, minWidth:0 }}>
    <div className={styles.formGrid}>
      <label className={styles.field} htmlFor={`${id}-ad`}>Ad<input id={`${id}-ad`} className={styles.input} value={v.ad} required minLength={2} onChange={e => degistir({ ad:adSoyadCanliBicimle(e.target.value) })} /></label>
      <label className={styles.field} htmlFor={`${id}-soyad`}>Soyad<input id={`${id}-soyad`} className={styles.input} value={v.soyad} required minLength={2} onChange={e => degistir({ soyad:adSoyadCanliBicimle(e.target.value) })} /></label>
      <label className={styles.field} htmlFor={`${id}-rol`}>Rol<select id={`${id}-rol`} className={styles.input} value={v.rol} required onChange={e => degistir({ rol:e.target.value })}>
        <option value="">Rol seçin</option>
        {v.rol && !ROLLER.includes(v.rol) && <option value={v.rol}>{ROL_ADLARI[v.rol] ?? v.rol}</option>}
        {ROLLER.map(r => <option value={r} key={r}>{ROL_ADLARI[r] ?? r}</option>)}
      </select></label>
      <label className={styles.field} htmlFor={`${id}-eposta`}>E-posta<input id={`${id}-eposta`} type="email" className={styles.input} value={v.eposta} required onChange={e => degistir({ eposta:e.target.value })} /></label>
      <label className={styles.field} htmlFor={`${id}-telefon`}>Cep telefonu<input id={`${id}-telefon`} type="tel" className={styles.input} value={telefonBicimle(v.telefon)} required maxLength={12} placeholder="542 000 0000" onChange={e => degistir({ telefon:telefonRakam(e.target.value) })} /></label>
      <label className={styles.field} htmlFor={`${id}-sifre`}>{duzenleme ? "Yeni şifre (isteğe bağlı)" : "Şifre"}<input id={`${id}-sifre`} type="password" autoComplete="new-password" className={styles.input} value={v.sifre} required={!duzenleme} minLength={6} placeholder={duzenleme ? "Değişmeyecekse boş bırakın" : "En az 6 karakter"} onChange={e => degistir({ sifre:e.target.value })} /></label>
      <label className={styles.field} htmlFor={`${id}-takim`}>Takım<select id={`${id}-takim`} className={styles.input} value={v.takim_id} onChange={e => degistir({ takim_id:e.target.value, bolge_id:"" })}><option value="">Takım seçin</option>{takimlar.map(t => <option key={t.takim_id} value={t.takim_id}>{t.takim_adi}</option>)}</select></label>
      {!!v.takim_id && !!bolgeListesi.length && <label className={styles.field} htmlFor={`${id}-bolge`}>Bölge<select id={`${id}-bolge`} className={styles.input} value={v.bolge_id} onChange={e => degistir({ bolge_id:e.target.value })}><option value="">Bölge seçin</option>{bolgeListesi.map(b => <option key={b.bolge_id} value={b.bolge_id}>{b.bolge_adi}</option>)}</select></label>}
    </div>
    <div className={styles.permissions}>
      <label className={styles.check}><input type="checkbox" checked={v.yetki_kullanici_yonetim} onChange={e => degistir({ yetki_kullanici_yonetim:e.target.checked })} />Kullanıcı yönetim yetkisi</label>
      <label className={styles.check}><input type="checkbox" checked={v.yetki_aktif_pasif} onChange={e => degistir({ yetki_aktif_pasif:e.target.checked })} />Aktif/Pasif yetkisi</label>
    </div>
  </fieldset>;
}

export default saltOkunurAlan(KullaniciFormAlanlari);
