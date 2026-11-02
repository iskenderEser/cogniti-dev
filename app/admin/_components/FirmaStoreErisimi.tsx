"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import styles from "../admin.module.css";
import local from "./firma-ayarlari.module.css";

interface Props { acik: boolean; onToggle: () => Promise<void> }

function FirmaStoreErisimi({ acik, onToggle }: Props) {
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
    catch { if (canli.current) setHata("FirmaStore erişimi güncellenemedi. Tekrar deneyin."); }
    finally { kilit.current = false; if (canli.current) setBekliyor(false); }
  }

  return <section className={styles.card} aria-labelledby="admin-firmastore-erisim-baslik">
    <div className={styles.cardHeader}><h2 id="admin-firmastore-erisim-baslik"><ShoppingBag />Modül Erişimi</h2></div>
    <div className={local.row}>
      <div className={local.info}><p id="admin-firmastore-aciklama">Temsilcilerin ve Bölge Müdürlerinin FirmaStore erişimini yönetir.</p></div>
      <button type="button" className={local.toggle} role="switch" aria-checked={acik} aria-label="FirmaStore erişimi" aria-describedby="admin-firmastore-aciklama" aria-busy={bekliyor} disabled={bekliyor} onClick={() => void degistir()}>
        <span className={local.toggleTrack} aria-hidden="true"><span className={local.toggleThumb} /></span>
        <span className={local.toggleText}>{bekliyor ? "Güncelleniyor…" : acik ? "Açık" : "Kapalı"}</span>
      </button>
    </div>
    {hata && <p className={styles.notice} role="alert">{hata}</p>}
  </section>;
}

export default saltOkunurAlan(FirmaStoreErisimi);
