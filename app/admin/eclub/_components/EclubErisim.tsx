"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { Power, Stethoscope } from "lucide-react";
import styles from "../../admin.module.css";
import local from "./eclub-yonetimi.module.css";

function EclubErisim({ acik, onToggle }: { acik: boolean; onToggle: () => Promise<void> }) {
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState("");
  const kilit = useRef(false);
  const canli = useRef(true);
  useEffect(() => { canli.current = true; return () => { canli.current = false; }; }, []);
  async function degistir() {
    if (kilit.current) return;
    kilit.current = true; setBekliyor(true); setHata("");
    try { await onToggle(); }
    catch { if (canli.current) setHata("E-Club durumu güncellenemedi. Tekrar deneyin."); }
    finally { kilit.current = false; if (canli.current) setBekliyor(false); }
  }
  return <section className={styles.card} aria-labelledby="admin-eclub-erisim-baslik">
    <div className={styles.cardHeader}><h2 id="admin-eclub-erisim-baslik"><Stethoscope />Modül Erişimi</h2><span className={`${styles.status} ${acik ? styles.statusActive : ""}`}>{acik ? "Açık" : "Kapalı"}</span></div>
    <div className={styles.cardBody}><div className={local.row}><p className={local.description}>Eczanelere özel tanıtım modülü. Eczacı ve eczane teknisyeni üyeliklerini ve öneri akışlarını kapsar.</p><button type="button" className={`${styles.button} ${!acik ? styles.primary : ""}`} disabled={bekliyor} onClick={() => void degistir()}><Power />{bekliyor ? "Güncelleniyor…" : acik ? "Modülü kapat" : "Modülü aç"}</button></div><p className={`${styles.notice} ${local.note}`}>E-Club kapatıldığında Eczanem de kapanır. E-Club yeniden açıldığında Eczanem ayrıca açılmalıdır.</p>{hata && <p role="alert" className={local.error}>{hata}</p>}</div>
  </section>;
}

export default saltOkunurAlan(EclubErisim);
