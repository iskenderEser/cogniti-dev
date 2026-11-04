"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import CognitiLogo from "@/components/marka/CognitiLogo";
import styles from "../admin.module.css";

export default function FirmaAdminBaslangic() {
  const { cikisYap } = useAuth();
  const [firma, setFirma] = useState<{ firma_id: string; firma_adi: string } | null>(null);
  const [hata, setHata] = useState("");
  useEffect(() => {
    const c = new AbortController();
    void (async () => {
      try {
        const r = await fetch("/admin/api/firma-oturum", { cache: "no-store", signal: c.signal });
        const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Firma bilgisi alınamadı.");
        if (!c.signal.aborted) setFirma(d.firma);
      } catch (e) { if (!c.signal.aborted) setHata(e instanceof Error ? e.message : "Firma bilgisi alınamadı."); }
    })();
    return () => c.abort();
  }, []);
  return <div className={styles.shell}>
    <header className={styles.navbar}><CognitiLogo className={styles.logo} /><span>Firma Yönetimi</span><button type="button" className={styles.button} onClick={() => void cikisYap()}>Çıkış</button></header>
    <main className={styles.main}><div className={styles.content}>
      {hata ? <p role="alert">{hata}</p> : firma ? <div className={styles.heading}><h1>{firma.firma_adi}</h1></div> : <p role="status">Firma bilgisi yükleniyor…</p>}
    </div></main>
  </div>;
}
