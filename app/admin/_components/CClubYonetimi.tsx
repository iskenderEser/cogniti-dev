"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { Power, Trophy } from "lucide-react";
import styles from "../admin.module.css";
import local from "./cclub-yonetimi.module.css";

interface Props { acik: boolean; onToggle: () => Promise<void> }

function CClubYonetimi({ acik, onToggle }: Props) {
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState("");
  const kilit = useRef(false);
  const canli = useRef(true);
  useEffect(() => { canli.current = true; return () => { canli.current = false; }; }, []);

  async function degistir() {
    if (kilit.current) return;
    kilit.current = true;
    setBekliyor(true);
    setHata("");
    try { await onToggle(); }
    catch { if (canli.current) setHata("C-Club durumu güncellenemedi. Tekrar deneyin."); }
    finally { kilit.current = false; if (canli.current) setBekliyor(false); }
  }

  return <section className={styles.card} aria-labelledby="admin-cclub-erisim-baslik">
    <div className={styles.cardHeader}>
      <h2 id="admin-cclub-erisim-baslik"><Trophy />Modül Erişimi</h2>
      <span className={`${styles.status} ${acik ? styles.statusActive : ""}`}>{acik ? "Açık" : "Kapalı"}</span>
    </div>
    <div className={styles.cardBody}>
      <div className={local.row}>
        <p className={local.description}>Değişim liderlerinin modülü. Challenge akışlarını ve CC Ligi’ni kapsar.</p>
        <button type="button" className={`${styles.button} ${!acik ? styles.primary : ""}`} disabled={bekliyor} onClick={() => void degistir()}><Power />{bekliyor ? "Güncelleniyor…" : acik ? "Modülü kapat" : "Modülü aç"}</button>
      </div>
      <p className={`${styles.notice} ${local.note}`}>Kapalıyken bu firmanın hiçbir kullanıcısı C-Club’a erişemez.</p>
      {hata && <p className={`${styles.notice} ${local.note} ${local.error}`} role="alert">{hata}</p>}
    </div>
  </section>;
}

export default saltOkunurAlan(CClubYonetimi);
