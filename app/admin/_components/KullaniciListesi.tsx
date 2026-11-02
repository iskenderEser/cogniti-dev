"use client";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { Users, UserPlus, Upload, Pencil, Trash2, Search } from "lucide-react";
import { kullaniciEksikMi } from "@/lib/admin/kullaniciDogrulama";
import { telefonBicimle } from "@/lib/admin/telefonBicim";
import { ROL_ADLARI } from "@/lib/utils/roller";
import { SadeTabloSecimi } from "@/components/kontrol/SadeKontroller";
import { KULLANICI_SUTUNLARI, type KullaniciSutunu } from "../_hooks/useKullaniciListesi";
import { ROLLER } from "../_constants";
import type { Kullanici, Takim } from "../_types";
import styles from "../admin.module.css";

interface KullaniciListesiProps {
  toplam: number;
  aramaMetni: string;
  setAramaMetni: (v: string) => void;
  handleAra: () => void;
  sutunFiltreleri: Record<KullaniciSutunu, string>;
  sutunSecenekleri: Record<KullaniciSutunu, { deger:string; etiket:string }[]>;
  handleSutunFiltrele: (sutun: KullaniciSutunu, deger: string) => void;
  filtrelenmisKullanicilar: Kullanici[];
  tumSeciliMi: boolean;

  acikRolId: string | null;
  setAcikRolId: (v: string | null) => void;
  rolDegistirLoading: string | null;
  aktifToggleLoading: string | null;
  silOnayId: string | null;
  setSilOnayId: (v: string | null) => void;
  silLoading: string | null;
  seciliKullanicilar: Set<string>;
  topluSilOnay: boolean;
  setTopluSilOnay: (v: boolean) => void;
  topluIslemLoading: boolean;
  yetkiLoading: string | null;

  // K-A6: tamamlama akışı için firmanın tam takım/bölge yapısı
  takimlar: Takim[];
  eksikTamamlaLoading: string | null;
  handleEksikTamamla: (kullanici_id: string, atama: { takim_id?: string; bolge_id?: string }) => void;
  telefonEkleLoading: string | null;
  handleTelefonEkle: (kullanici_id: string, telefon: string) => void;
  duzenlenenId: string | null;
  setDuzenlenenId: (v: string | null) => void;
  duzenleLoading: boolean;
  handleKullaniciGuncelle: (kullanici_id: string, veri: Record<string, unknown>) => void;

  handleRolDegistir: (kullanici_id: string, yeniRol: string) => void;
  handleAktifToggle: (kullanici_id: string, mevcutDurum: boolean) => void;
  handleYetkiDegistir: (kullanici_id: string, alan: "yetki_kullanici_yonetim" | "yetki_aktif_pasif", mevcutDeger: boolean) => void;
  handleSil: (kullanici_id: string) => void;
  handleTopluPasif: () => void;
  handleTopluSil: () => void;
  toggleSecim: (kullanici_id: string, secildi: boolean) => void;
  toggleTumSecim: (secildi: boolean) => void;
}

export default function KullaniciListesi(p: KullaniciListesiProps) {
  const saltOkunur = useFirmaSaltOkunur();
  const islemVar = p.topluIslemLoading || p.duzenleLoading;
  return <section className={styles.card} aria-label="Kullanıcı listesi">
    <div className={styles.cardHeader}><div><h2><Users />Kullanıcı Listesi <span className={styles.count}>{p.toplam}</span></h2><p>{p.filtrelenmisKullanicilar.length} kayıt gösteriliyor</p></div><div className={styles.actions}>
      <a className={`${styles.button} ${styles.primary}`} href="#admin-kullanici-ekle"><UserPlus />Kullanıcı ekle</a>
      <a className={styles.button} href="#admin-toplu-yukle"><Upload />Toplu yükle</a>
    </div>
      <form className={styles.userSearch} role="search" onSubmit={e => { e.preventDefault(); p.handleAra(); }}>
        <input type="search" className={styles.input} aria-label="Kullanıcı ara" placeholder="Kullanıcı ara…" value={p.aramaMetni} onChange={e => p.setAramaMetni(e.target.value)} />
        <button type="submit" className={`${styles.button} ${styles.primary}`}><Search />Ara</button>
      </form>
    </div>
    {p.seciliKullanicilar.size > 0 && <div className={styles.toolbar} role="group" aria-label="Toplu kullanıcı işlemleri">
      <strong>{p.seciliKullanicilar.size} kullanıcı seçili</strong>
      <button type="button" className={styles.button} disabled={saltOkunur || islemVar} onClick={p.handleTopluPasif}>Toplu pasife al</button>
      {p.topluSilOnay ? <><span>Seçili kullanıcılar silinsin mi?</span><button type="button" className={`${styles.button} ${styles.danger}`} disabled={saltOkunur || islemVar} onClick={p.handleTopluSil}>Onayla, sil</button><button type="button" className={styles.button} disabled={saltOkunur || islemVar} onClick={() => p.setTopluSilOnay(false)}>Vazgeç</button></> : <button type="button" className={`${styles.button} ${styles.danger}`} disabled={saltOkunur || islemVar} onClick={() => p.setTopluSilOnay(true)}>Toplu sil</button>}
    </div>}
    <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr>{KULLANICI_SUTUNLARI.map(([sutun, baslik]) => <th key={sutun}><SadeTabloSecimi etiket={`${baslik} filtresi`} aramaEtiketi={`${baslik} ara…`} className={styles.userColumnSelect} menuClassName={styles.userColumnMenu} deger={p.sutunFiltreleri[sutun]} disabled={islemVar} secenekler={[{ deger:"", etiket:baslik }, ...p.sutunSecenekleri[sutun]]} onDegistir={deger => p.handleSutunFiltrele(sutun, deger)} /></th>)}<th>İşlemler</th></tr></thead>
      <tbody>{!p.filtrelenmisKullanicilar.length ? <tr><td colSpan={8} className={styles.empty}>Arama ve filtrelerle eşleşen kullanıcı bulunamadı.</td></tr> : p.filtrelenmisKullanicilar.map(k => {
        const adSoyad = `${k.ad} ${k.soyad}`;
        const eksik = kullaniciEksikMi(k.rol, k.takim_id ?? null, k.bolge_id ?? null, k.telefon ?? null);
        return <tr key={k.kullanici_id} data-selected={p.seciliKullanicilar.has(k.kullanici_id)}>
          <td><span className={styles.name}>{adSoyad}</span>{eksik.eksik && <span className={styles.subtext}>Eksik bilgi</span>}</td>
          <td>{p.acikRolId === k.kullanici_id ? <select className={styles.input} aria-label={`${adSoyad} rolü`} value={k.rol} onChange={e => p.handleRolDegistir(k.kullanici_id,e.target.value)} onBlur={() => p.setAcikRolId(null)}>{!ROLLER.includes(k.rol) && <option value={k.rol}>{ROL_ADLARI[k.rol] ?? k.rol}</option>}{ROLLER.map(r => <option key={r} value={r}>{ROL_ADLARI[r] ?? r}</option>)}</select> : <button type="button" className={styles.roleButton} disabled={saltOkunur || islemVar || !!p.rolDegistirLoading} onClick={() => p.setAcikRolId(k.kullanici_id)} aria-label={`${adSoyad} rolünü değiştir`}>{p.rolDegistirLoading === k.kullanici_id ? "Kaydediliyor…" : ROL_ADLARI[k.rol] ?? k.rol}</button>}</td>
          <td>{k.eposta}</td>
          <td>{k.telefon ? telefonBicimle(k.telefon) : "Telefon eksik"}</td>
          <td>{k.takim_adi ?? "—"}</td>
          <td>{k.bolge_adi ?? "—"}</td>
          <td><button type="button" aria-label={`${adSoyad} durumunu değiştir: ${k.aktif_mi ? "Aktif" : "Pasif"}`} className={`${styles.status} ${k.aktif_mi ? styles.statusActive : ""}`} disabled={saltOkunur || islemVar || p.aktifToggleLoading === k.kullanici_id} onClick={() => p.handleAktifToggle(k.kullanici_id,k.aktif_mi)}>{p.aktifToggleLoading === k.kullanici_id ? "…" : k.aktif_mi ? "Aktif" : "Pasif"}</button></td>
          <td><div className={styles.rowActions}><button type="button" className={styles.button} disabled={saltOkunur || islemVar} onClick={() => p.setDuzenlenenId(k.kullanici_id)} aria-label={`${adSoyad} düzenle`}><Pencil />Düzenle</button>
          {p.silOnayId === k.kullanici_id ? <><button type="button" className={`${styles.button} ${styles.danger}`} disabled={saltOkunur || islemVar || p.silLoading === k.kullanici_id} onClick={() => p.handleSil(k.kullanici_id)}>Onayla, sil</button><button type="button" className={styles.button} disabled={saltOkunur || islemVar} onClick={() => p.setSilOnayId(null)}>Vazgeç</button></> : <button type="button" className={`${styles.button} ${styles.danger}`} disabled={saltOkunur || islemVar || p.silLoading === k.kullanici_id} onClick={() => p.setSilOnayId(k.kullanici_id)} aria-label={`${adSoyad} sil`}><Trash2 /></button>}
          </div></td>
        </tr>;
      })}</tbody>
    </table></div>
  </section>;
}
