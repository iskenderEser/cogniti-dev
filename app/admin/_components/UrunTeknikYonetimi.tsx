"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useState } from "react";
import { Package, Plus, RefreshCw, Save, Tags, Trash2 } from "lucide-react";
import type { Firma, Takim } from "../_types";
import { useUrunTeknik } from "../_hooks/useUrunTeknik";
import styles from "../admin.module.css";
import local from "./urun-teknik.module.css";

interface Props {
  firma:Firma;
  takimlar:Takim[];
  organizasyonYukleniyor:boolean;
  organizasyonHatasi:boolean;
  hata:(mesaj:string,adim?:string,detay?:string)=>void;
  basari:(mesaj:string)=>void;
}

function UrunTeknikYonetimi(props:Props) {
  const p=useUrunTeknik({...props,seciliFirma:props.firma});
  const [urunSilOnay,setUrunSilOnay]=useState<string|null>(null);
  const [teknikSilOnay,setTeknikSilOnay]=useState<string|null>(null);
  const islemVar=p.urunEkleLoading || p.teknikEkleLoading || !!p.urunSilLoading || !!p.teknikSilLoading;
  const urunFormKapali=islemVar || p.urunYukleniyor || p.urunHatasi || props.organizasyonYukleniyor || props.organizasyonHatasi || !props.takimlar.length;
  const teknikFormKapali=islemVar || p.teknikYukleniyor || p.teknikHatasi;

  return <div className={local.columns}>
    <section className={styles.card} aria-labelledby="admin-urunler-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-urunler-baslik"><Package />Ürünler {!p.urunYukleniyor && !p.urunHatasi && <span className={styles.count}>{p.urunler.length}</span>}</h2><p>{props.firma.firma_adi} ürünleri ve bağlı oldukları takımlar</p></div><a className={styles.button} href="#admin-urun-ekleme"><Plus />Ürün ekle</a></div>
      {p.urunYukleniyor ? <p role="status" className={styles.empty}>Ürünler yükleniyor…</p>
        : p.urunHatasi ? <div role="alert" className={styles.empty}><p>Ürün listesi alınamadı.</p><button type="button" className={styles.button} onClick={()=>void p.urunleriCek()}><RefreshCw />Tekrar dene</button></div>
        : !p.urunler.length ? <p className={styles.empty}>Bu firmada henüz ürün tanımlanmamış.</p>
        : <div className={styles.tableWrap}><table className={local.table} aria-label={`${props.firma.firma_adi} ürün listesi`}>
          <thead><tr><th>Ürün adı</th><th>Takım</th><th className={local.actionHeading}>İşlem</th></tr></thead>
          <tbody>{p.urunler.map(u=><tr key={u.urun_id}><td><span className={styles.name}>{u.urun_adi}</span></td><td>{props.organizasyonYukleniyor ? "Yükleniyor…" : props.organizasyonHatasi ? "Takım bilgisi alınamadı" : p.takimAdi(u.takim_id)}</td><td className={local.actionCell}>
            {urunSilOnay===u.urun_id ? <div className={local.confirm} role="group" aria-label={`${u.urun_adi} silme onayı`}><span>{u.urun_adi} silinsin mi?</span><div className={styles.actions}><button type="button" className={`${styles.button} ${styles.danger}`} disabled={islemVar} onClick={async()=>{if(await p.handleUrunSil(u.urun_id))setUrunSilOnay(null);}}>{p.urunSilLoading===u.urun_id ? "Siliniyor…" : "Onayla, sil"}</button><button type="button" className={styles.button} disabled={islemVar} onClick={()=>setUrunSilOnay(null)}>Vazgeç</button></div></div>
            : <button type="button" className={`${styles.button} ${styles.danger}`} aria-label={`${u.urun_adi} ürününü sil`} disabled={islemVar} onClick={()=>setUrunSilOnay(u.urun_id)}><Trash2 />Sil</button>}
          </td></tr>)}</tbody>
        </table></div>}
      <form className={`${styles.cardBody} ${local.form}`} id="admin-urun-ekleme" onSubmit={p.handleUrunEkle}>
        <h3 className={local.formHeading}>Ürün Ekleme</h3>
        <fieldset className={local.fieldset} disabled={urunFormKapali}>
          <label className={styles.field} htmlFor="admin-yeni-urun">Ürün adı<input id="admin-yeni-urun" className={styles.input} value={p.yeniUrunAdi} onChange={e=>p.setYeniUrunAdi(e.target.value)} required minLength={2} placeholder="Ürün adı" /></label>
          <label className={styles.field} htmlFor="admin-urun-takim">Bağlı takım<select id="admin-urun-takim" className={styles.input} value={p.yeniUrunTakimId} onChange={e=>p.setYeniUrunTakimId(e.target.value)} required><option value="">Takım seçin</option>{props.takimlar.map(t=><option key={t.takim_id} value={t.takim_id}>{t.takim_adi}</option>)}</select></label>
          <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={urunFormKapali || p.yeniUrunAdi.trim().length<2 || !p.yeniUrunTakimId}><Save />{p.urunEkleLoading ? "Ekleniyor…" : "Ürünü kaydet"}</button></div>
        </fieldset>
        {!props.organizasyonYukleniyor && !props.organizasyonHatasi && !props.takimlar.length && <p className={styles.subtext}>Ürün eklemek için önce Organizasyon bölümünde bir takım tanımlayın.</p>}
      </form>
    </section>

    <section className={styles.card} aria-labelledby="admin-teknikler-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-teknikler-baslik"><Tags />Teknikler {!p.teknikYukleniyor && !p.teknikHatasi && <span className={styles.count}>{p.teknikler.length}</span>}</h2><p>{props.firma.firma_adi} için tanımlanmış teknikler</p></div><a className={styles.button} href="#admin-teknik-ekleme"><Plus />Teknik ekle</a></div>
      {p.teknikYukleniyor ? <p role="status" className={styles.empty}>Teknikler yükleniyor…</p>
        : p.teknikHatasi ? <div role="alert" className={styles.empty}><p>Teknik listesi alınamadı.</p><button type="button" className={styles.button} onClick={()=>void p.teknikleriCek()}><RefreshCw />Tekrar dene</button></div>
        : !p.teknikler.length ? <p className={styles.empty}>Bu firmada henüz teknik tanımlanmamış.</p>
        : <div className={styles.tableWrap}><table className={local.table} aria-label={`${props.firma.firma_adi} teknik listesi`}>
          <thead><tr><th>Teknik adı</th><th className={local.actionHeading}>İşlem</th></tr></thead>
          <tbody>{p.teknikler.map(t=><tr key={t.teknik_id}><td><span className={styles.name}>{t.teknik_adi}</span></td><td className={local.actionCell}>
            {teknikSilOnay===t.teknik_id ? <div className={local.confirm} role="group" aria-label={`${t.teknik_adi} silme onayı`}><span>{t.teknik_adi} silinsin mi?</span><div className={styles.actions}><button type="button" className={`${styles.button} ${styles.danger}`} disabled={islemVar} onClick={async()=>{if(await p.handleTeknikSil(t.teknik_id))setTeknikSilOnay(null);}}>{p.teknikSilLoading===t.teknik_id ? "Siliniyor…" : "Onayla, sil"}</button><button type="button" className={styles.button} disabled={islemVar} onClick={()=>setTeknikSilOnay(null)}>Vazgeç</button></div></div>
            : <button type="button" className={`${styles.button} ${styles.danger}`} aria-label={`${t.teknik_adi} tekniğini sil`} disabled={islemVar} onClick={()=>setTeknikSilOnay(t.teknik_id)}><Trash2 />Sil</button>}
          </td></tr>)}</tbody>
        </table></div>}
      <form className={`${styles.cardBody} ${local.form}`} id="admin-teknik-ekleme" onSubmit={p.handleTeknikEkle}>
        <h3 className={local.formHeading}>Teknik Ekleme</h3>
        <fieldset className={local.fieldset} disabled={teknikFormKapali}>
          <label className={styles.field} htmlFor="admin-yeni-teknik">Teknik adı<input id="admin-yeni-teknik" className={styles.input} value={p.yeniTeknikAdi} onChange={e=>p.setYeniTeknikAdi(e.target.value)} required minLength={2} placeholder="Teknik adı" /></label>
          <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={teknikFormKapali || p.yeniTeknikAdi.trim().length<2}><Save />{p.teknikEkleLoading ? "Ekleniyor…" : "Tekniği kaydet"}</button></div>
        </fieldset>
      </form>
    </section>
  </div>;
}

export default saltOkunurAlan(UrunTeknikYonetimi);
