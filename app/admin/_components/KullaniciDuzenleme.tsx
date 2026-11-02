"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { Pencil, Save } from "lucide-react";
import type { Kullanici, Takim } from "../_types";
import KullaniciFormAlanlari, { type KullaniciFormVerisi } from "./KullaniciFormAlanlari";
import styles from "../admin.module.css";

interface Props {
  kullanici: Kullanici; takimlar: Takim[]; firmaAdi: string; loading: boolean;
  onKapat: () => void; onKaydet: (veri: Record<string, unknown>) => void;
}
function KullaniciDuzenleme({ kullanici:k, takimlar, firmaAdi, loading, onKapat, onKaydet }: Props) {
  const [veri, setVeri] = useState<KullaniciFormVerisi>({
    ad:k.ad, soyad:k.soyad, rol:k.rol, eposta:k.eposta, telefon:k.telefon ?? "", sifre:"",
    takim_id:k.takim_id ?? "", bolge_id:k.bolge_id ?? "",
    yetki_kullanici_yonetim:k.yetki_kullanici_yonetim, yetki_aktif_pasif:k.yetki_aktif_pasif,
  });
  const [onay, setOnay] = useState(false);
  const alan = useRef<HTMLElement>(null);
  useEffect(() => { alan.current?.scrollIntoView({ block:"start" }); }, []);
  return <section ref={alan} className={styles.card} aria-label={`${firmaAdi} kullanıcı düzenleme`}>
    <div className={styles.cardHeader}><div><h2><Pencil />Kullanıcı Düzenleme</h2><p>{firmaAdi} · {k.ad} {k.soyad} · {k.eposta}</p></div><button type="button" className={styles.button} disabled={loading} onClick={onKapat}>Düzenlemeyi kapat</button></div>
    <form className={styles.cardBody} onSubmit={e => { e.preventDefault(); setOnay(true); }}>
      <KullaniciFormAlanlari veri={veri} degistir={patch => { setVeri(v => ({ ...v, ...patch })); setOnay(false); }} takimlar={takimlar} duzenleme disabled={loading} />
      {onay ? <div className={styles.notice} role="status"><p><strong>{firmaAdi} / {k.ad} {k.soyad}</strong> kaydı güncellenecek. Kullanıcının puan ve içerik kayıtları korunacak.{veri.eposta.trim().toLowerCase() !== k.eposta.toLowerCase() && " Kullanıcı yeni e-posta adresiyle giriş yapacak."}</p><div className={styles.formActions}>
        <button type="button" className={`${styles.button} ${styles.primary}`} disabled={loading} onClick={() => {
          const { sifre, ...alanlar } = veri;
          onKaydet({ ...alanlar, telefon:veri.telefon.replace(/\D/g,""), takim_id:veri.takim_id || null, bolge_id:veri.bolge_id || null, ...(sifre ? { sifre } : {}) });
        }}>{loading ? "Kaydediliyor…" : "Onayla ve kaydet"}</button>
        <button type="button" className={styles.button} disabled={loading} onClick={() => setOnay(false)}>Düzenlemeye dön</button>
      </div></div> : <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={loading}><Save />Değişiklikleri kaydet</button></div>}
    </form>
  </section>;
}

export default saltOkunurAlan(KullaniciDuzenleme);
