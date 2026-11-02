"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { HeartHandshake, Power } from "lucide-react";
import styles from "../../admin.module.css";
import local from "./eczanem-yonetimi.module.css";

interface Props { acik: boolean; eclubAcik: boolean; onToggle: () => Promise<void> }

function EczanemErisim({ acik, eclubAcik, onToggle }: Props) {
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState("");
  const kilit = useRef(false);
  const canli = useRef(true);
  const kapali = !eclubAcik && !acik;
  useEffect(() => { canli.current = true; return () => { canli.current = false; }; }, []);

  async function degistir() {
    if (kilit.current || kapali) return;
    kilit.current = true; setBekliyor(true); setHata("");
    try { await onToggle(); }
    catch { if (canli.current) setHata("Eczanem durumu güncellenemedi. Tekrar deneyin."); }
    finally { kilit.current = false; if (canli.current) setBekliyor(false); }
  }

  return <section className={styles.card} aria-labelledby="admin-eczanem-erisim-baslik">
    <div className={styles.cardHeader}><h2 id="admin-eczanem-erisim-baslik"><HeartHandshake />Modül Erişimi</h2><span className={`${styles.status} ${acik ? styles.statusActive : ""}`}>{acik ? "Açık" : "Kapalı"}</span></div>
    <div className={styles.cardBody}><div className={local.row}><p className={local.description}>Eczane üyelerinin bilgilenme modülü. Davetleri, gönderimleri, üyelikleri ve indirim akışlarını kapsar.</p><button type="button" className={`${styles.button} ${!acik ? styles.primary : ""}`} disabled={bekliyor || kapali} onClick={() => void degistir()}><Power />{bekliyor ? "Güncelleniyor…" : acik ? "Modülü kapat" : "Modülü aç"}</button></div><p className={`${styles.notice} ${local.note}`}>Eczanem yalnız E-Club açıkken açılabilir. E-Club kapatılınca Eczanem de kapanır; E-Club yeniden açıldığında Eczanem ayrıca açılmalıdır.</p>{hata && <p className={local.error} role="alert">{hata}</p>}</div>
  </section>;
}

export default saltOkunurAlan(EczanemErisim);
