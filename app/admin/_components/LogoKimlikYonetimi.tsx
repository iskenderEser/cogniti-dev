"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { Eye, ImageIcon, Pause, Play, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { logoGorseliniOptimizeEt } from "@/lib/firma/logoOptimizasyonIstemci";
import type { Firma } from "../_types";
import styles from "../admin.module.css";
import local from "./logo-kimlik.module.css";

interface LogoKimlikYonetimiProps {
  firma: Firma;
  onGuncelle: (firma: Firma, logoUrl: string | null, ogrenmePlatformuAktif: boolean) => Promise<boolean>;
}

type Islem = "kaydet" | "durum" | "kaldir";
type Mesaj = { tur: "hata" | "basari"; metin: string };

function LogoKimlikYonetimi({ firma, onGuncelle }: LogoKimlikYonetimiProps) {
  const [logoUrl, setLogoUrl] = useState(firma.logo_url ?? "");
  const [islem, setIslem] = useState<Islem | null>(null);
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [mesaj, setMesaj] = useState<Mesaj | null>(null);
  const [gorselHatasiUrl, setGorselHatasiUrl] = useState<string | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const aktif = useRef(true);
  const islemKilidi = useRef(false);
  const yuklemeIptal = useRef<AbortController | null>(null);

  useEffect(() => {
    aktif.current = true;
    return () => {
      aktif.current = false;
      yuklemeIptal.current?.abort();
    };
  }, []);

  useEffect(() => {
    setLogoUrl(firma.logo_url ?? "");
  }, [firma.logo_url]);

  const kayitliUrl = firma.logo_url?.trim() ?? "";
  const onizlemeUrl = logoUrl.trim();
  const degisiklikVar = onizlemeUrl !== kayitliUrl;
  const yayinda = Boolean(kayitliUrl) && Boolean(firma.ogrenme_platformu_aktif);
  const mesgul = Boolean(islem) || dosyaYukleniyor;

  async function handleDosyaSec(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya || islemKilidi.current) return;
    islemKilidi.current = true;
    setDosyaYukleniyor(true);
    setMesaj(null);
    try {
      const yuklenecekDosya = await logoGorseliniOptimizeEt(dosya);
      if (!aktif.current) return;
      const kontrol = new AbortController();
      yuklemeIptal.current = kontrol;
      const formData = new FormData();
      formData.append("firma_id", firma.firma_id);
      formData.append("dosya", yuklenecekDosya);
      const res = await fetch("/admin/api/firmalar/upload", { method: "POST", body: formData, signal: kontrol.signal });
      const data = await res.json();
      if (!aktif.current) return;
      if (!res.ok || typeof data.url !== "string" || !data.url.trim()) {
        setMesaj({ tur: "hata", metin: data.hata ?? "Logo yüklenemedi. Tekrar deneyin." });
        return;
      }
      setLogoUrl(data.url);
      setSilOnay(false);
      setMesaj({ tur: "basari", metin: "Dosya yüklendi. Logoyu kullanıma açmak için kaydedin." });
    } catch {
      if (aktif.current) setMesaj({ tur: "hata", metin: "Dosya yüklenemedi. Bağlantınızı kontrol ederek tekrar deneyin." });
    } finally {
      islemKilidi.current = false;
      yuklemeIptal.current = null;
      if (aktif.current) {
        setDosyaYukleniyor(false);
        if (dosyaInputRef.current) dosyaInputRef.current.value = "";
      }
    }
  }

  async function guncelle(url: string | null, yeniDurum: boolean, tur: Islem) {
    if (islemKilidi.current) return;
    islemKilidi.current = true;
    setIslem(tur);
    setMesaj(null);
    try {
      const ok = await onGuncelle(firma, url, yeniDurum);
      if (!aktif.current) return;
      if (!ok) {
        setMesaj({ tur: "hata", metin: "Değişiklik kaydedilemedi. Tekrar deneyin." });
        return;
      }
      if (tur === "kaldir") setLogoUrl("");
      if (tur === "kaydet") setLogoUrl(url ?? "");
      setSilOnay(false);
      setMesaj({ tur: "basari", metin: tur === "kaldir" ? "Firma logosu ve resmi öğrenme platformu rozeti kaldırıldı." : yeniDurum ? "Firma logosu ve resmi öğrenme platformu rozeti yayında." : "Logo yayını durduruldu." });
    } catch {
      if (aktif.current) setMesaj({ tur: "hata", metin: "Değişiklik kaydedilemedi. Bağlantınızı kontrol ederek tekrar deneyin." });
    } finally {
      islemKilidi.current = false;
      if (aktif.current) setIslem(null);
    }
  }

  return <div className={styles.stack}>
    <section className={styles.card} aria-labelledby="admin-logo-onizleme-baslik">
      <div className={styles.cardHeader}>
        <div><h2 id="admin-logo-onizleme-baslik"><Eye />Görünüm Önizlemesi</h2><p>Kullanıcıların üst menüsündeki kurumsal kimlik alanı</p></div>
        <span className={`${styles.status} ${yayinda ? styles.statusActive : ""}`}>{kayitliUrl ? yayinda ? "Yayında" : "Durduruldu" : "Logo yok"}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={local.preview}>
          <CognitiLogo className={local.cognitiLogo} />
          <div className={local.company}>
            <div className={local.companyLogo}>
              {onizlemeUrl && gorselHatasiUrl !== onizlemeUrl
                // Kullanıcının yüklediği kurumsal logo, özgün oranıyla gösterilir.
                // eslint-disable-next-line @next/next/no-img-element
                ? <img key={onizlemeUrl} src={onizlemeUrl} alt={`${firma.firma_adi} logosu`} onError={() => setGorselHatasiUrl(onizlemeUrl)} />
                : <span className={local.placeholder}><ImageIcon />{onizlemeUrl ? "Görsel yüklenemedi" : "Firma logosu"}</span>}
            </div>
            <span className={local.partnership}>resmi öğrenme platformu</span>
          </div>
        </div>
        <p className={local.caption}>{degisiklikVar ? "Kaydedilmemiş önizleme. Değişikliği uygulamak için logoyu kaydedin." : yayinda ? "Kayıtlı logo ve rozet kullanıcılara gösteriliyor." : kayitliUrl ? "Kayıtlı logo ve rozetin yayını durduruldu; kullanıcılara gösterilmiyor." : "Bir logo yükleyerek veya görsel adresi girerek önizleyebilirsiniz."}</p>
      </div>
    </section>

    <section className={styles.card} aria-labelledby="admin-logo-yonetim-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-logo-yonetim-baslik"><ImageIcon />Logo Yönetimi</h2><p>{firma.firma_adi} logosu ve resmi öğrenme platformu rozeti</p></div></div>
      <div className={styles.cardBody}>
        {mesaj && <p className={`${styles.notice} ${local.message}`} role={mesaj.tur === "hata" ? "alert" : "status"} data-error={mesaj.tur === "hata"}>{mesaj.metin}</p>}
        <div className={local.management}>
          <form className={local.form} onSubmit={e => {
            e.preventDefault();
            if (!onizlemeUrl) { setMesaj({ tur: "hata", metin: "Bir logo adresi girin veya dosya yükleyin." }); return; }
            void guncelle(onizlemeUrl, true, "kaydet");
          }}>
            <h3 className={local.sectionHeading}>Logo Ekleme ve Güncelleme</h3>
            <label className={styles.field} htmlFor="admin-logo-url">Logo adresi
              <input id="admin-logo-url" className={styles.input} value={logoUrl} disabled={mesgul} onChange={e => { setLogoUrl(e.target.value); setMesaj(null); setSilOnay(false); }} placeholder="https://… veya /firma-logo.png" aria-describedby="admin-logo-yardim" />
            </label>
            <input ref={dosyaInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleDosyaSec} hidden disabled={mesgul} aria-label="Firma logosu dosyası" />
            <div className={styles.actions}><button type="button" className={styles.button} disabled={mesgul} onClick={() => dosyaInputRef.current?.click()}><Upload />{dosyaYukleniyor ? "Yükleniyor…" : "Dosya yükle"}</button><span className={local.fileHint}>PNG, JPEG, SVG veya WebP · En fazla 5 MB</span></div>
            <p id="admin-logo-yardim" className={local.caption}>Şeffaf zeminli bir logo kullanabilirsiniz. Görsel, oranı korunarak yükleme sırasında optimize edilir.</p>
            <div className={styles.formActions}>
              <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={mesgul || !onizlemeUrl}><Save />{islem === "kaydet" ? "Kaydediliyor…" : "Kaydet ve yayına al"}</button>
              {degisiklikVar && <button type="button" className={styles.button} disabled={mesgul} onClick={() => { setLogoUrl(kayitliUrl); setMesaj(null); setSilOnay(false); }}><RotateCcw />Değişikliği geri al</button>}
            </div>
          </form>

          <div className={local.publication}>
            <h3 className={local.sectionHeading}>Yayın Durumu</h3>
            <p className={local.caption}>{kayitliUrl ? "Kayıtlı logonun ve resmi öğrenme platformu rozetinin görünürlüğünü yönetin." : "Yayın durumunu yönetmek için önce bir logo kaydedin."}</p>
            {kayitliUrl && <>
              <div className={styles.actions}>
                <button type="button" className={styles.button} disabled={mesgul} onClick={() => void guncelle(kayitliUrl, !yayinda, "durum")}>{yayinda ? <Pause /> : <Play />}{islem === "durum" ? "Güncelleniyor…" : yayinda ? "Yayını durdur" : "Yayına al"}</button>
                {!silOnay && <button type="button" className={`${styles.button} ${styles.danger}`} disabled={mesgul} onClick={() => { setSilOnay(true); setMesaj(null); }}><Trash2 />Logoyu kaldır</button>}
              </div>
              {silOnay && <div className={local.confirm} role="group" aria-label="Firma logosunu kaldırma onayı">
                <p><strong>{firma.firma_adi}</strong> logosu ve resmi öğrenme platformu rozeti kaldırılsın mı?</p>
                <div className={styles.actions}><button type="button" className={`${styles.button} ${styles.danger}`} disabled={mesgul} onClick={() => void guncelle(null, false, "kaldir")}><Trash2 />{islem === "kaldir" ? "Kaldırılıyor…" : "Onayla, kaldır"}</button><button type="button" className={styles.button} disabled={mesgul} onClick={() => setSilOnay(false)}>Vazgeç</button></div>
              </div>}
            </>}
          </div>
        </div>
      </div>
    </section>
  </div>;
}

export default saltOkunurAlan(LogoKimlikYonetimi);
