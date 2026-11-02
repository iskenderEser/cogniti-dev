"use client";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { Building2, Power, Trash2 } from "lucide-react";
import type { Firma } from "../_types";
import type { useAdminPanel } from "../_hooks/useAdminPanel";
import styles from "../admin.module.css";
import local from "./firma-ayarlari.module.css";

type AyarId = "firma" | "firma-sil";
type AyarIslemleri = Pick<ReturnType<typeof useAdminPanel>, "handleFirmaToggle" | "handleFirmaSil" | "hata" | "firmaBilgileriniYansit">;

interface Props { firma: Firma; admin: AyarIslemleri; firmaAdmin?: boolean }

export default function FirmaAyarlari({ firma, admin, firmaAdmin }: Props) {
  const saltOkunur = useFirmaSaltOkunur();
  const [bekleyen, setBekleyen] = useState<AyarId | null>(null);
  const [pasifOnay, setPasifOnay] = useState(false);
  const [firmaOnayi, setFirmaOnayi] = useState("");
  const kilit = useRef(false);
  const aktif = useRef(true);

  useEffect(() => {
    aktif.current = true;
    return () => { aktif.current = false; };
  }, []);

  async function degistir(id: AyarId, islem: (f: Firma) => Promise<void>) {
    if (kilit.current) return;
    kilit.current = true;
    setBekleyen(id);
    try {
      await islem(firma);
      if (aktif.current) setPasifOnay(false);
    } catch {
      admin.hata("Firma ayarı güncellenemedi. Tekrar deneyin.");
    } finally {
      kilit.current = false;
      if (aktif.current) setBekleyen(null);
    }
  }

  async function firmayiSil() {
    if (!firma.son_export_at || firmaOnayi !== firma.firma_adi || kilit.current) return;
    kilit.current = true;
    setBekleyen("firma-sil");
    try { await admin.handleFirmaSil(firma); }
    catch { admin.hata("Firma silinemedi. Tekrar deneyin."); }
    finally {
      kilit.current = false;
      if (aktif.current) setBekleyen(null);
    }
  }

  return <div className={styles.stack}>
    <section className={styles.card} aria-labelledby="admin-firma-durum-baslik">
      <div className={styles.cardHeader}>
        <div><h2 id="admin-firma-durum-baslik"><Building2 />Firma Durumu</h2><p>{firma.firma_adi} firmasının aktiflik ve kayıt durumu</p></div>
        <span className={`${styles.status} ${firma.aktif ? styles.statusActive : ""}`}>{firma.aktif ? "Aktif" : "Pasif"}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={local.access}>
          <div className={local.accessInfo}><h3><Power />Firmayı Pasife Alma</h3><p>Firma pasif olduğunda kullanıcıları sisteme giriş yapamaz. Modül erişimlerini Modüller sekmesinden yönetebilirsiniz.</p></div>
          {pasifOnay && firma.aktif ? <div className={local.confirm} role="group" aria-label="Firmayı pasifleştirme onayı">
            <p><strong>{firma.firma_adi}</strong> kullanıcılarının sisteme girişi kapatılsın mı?</p>
            <div className={styles.actions}>
              <button type="button" className={`${styles.button} ${styles.danger}`} disabled={saltOkunur || bekleyen !== null} onClick={() => void degistir("firma", admin.handleFirmaToggle)}><Power />{bekleyen === "firma" ? "Güncelleniyor…" : "Onayla, pasifleştir"}</button>
              <button type="button" className={styles.button} disabled={bekleyen !== null} onClick={() => setPasifOnay(false)}>Vazgeç</button>
            </div>
          </div> : <button type="button" className={`${styles.button} ${firma.aktif ? styles.danger : styles.primary}`} disabled={saltOkunur || bekleyen !== null} onClick={() => firma.aktif ? setPasifOnay(true) : void degistir("firma", admin.handleFirmaToggle)}><Power />{bekleyen === "firma" ? "Güncelleniyor…" : firma.aktif ? "Firmayı Pasife Al" : "Firmayı aktifleştir"}</button>}
        </div>
        {!firmaAdmin && <section className={local.deletion} aria-labelledby="admin-firma-sil-baslik">
          <div className={local.deletionInfo}>
            <h3 id="admin-firma-sil-baslik"><Trash2 />Firmayı Silme</h3>
            <p>Silmeden önce firma verilerini Excel olarak dışa aktarmak zorunludur. Firma ve firmaya ait bağlı kayıtlar birlikte silinir. Ortak eczane ve üyelerin diğer firma ilişkileri korunur. <strong>Bu işlem geri alınamaz.</strong></p>
          </div>
          <form className={local.deleteConfirm} onSubmit={e => { e.preventDefault(); void firmayiSil(); }}>
            {!firma.son_export_at && <p role="status">Önce Firma Verileri İşlemleri sekmesinden verileri dışa aktarın.</p>}
            <label className={styles.field} htmlFor="admin-firma-sil-onay">Firmayı silmeyi onaylamak için {firma.firma_adi} yazın<input id="admin-firma-sil-onay" className={styles.input} value={firmaOnayi} disabled={bekleyen !== null} autoComplete="off" onChange={e => setFirmaOnayi(e.target.value)} /></label>
            <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.danger}`} disabled={!firma.son_export_at || bekleyen !== null || firmaOnayi !== firma.firma_adi}><Trash2 />{bekleyen === "firma-sil" ? "Firma siliniyor…" : "Firmayı kalıcı olarak sil"}</button></div>
          </form>
        </section>}
      </div>
    </section>
  </div>;
}
