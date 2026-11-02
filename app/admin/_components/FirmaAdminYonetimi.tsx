"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, ShieldCheck, Users } from "lucide-react";
import styles from "../admin.module.css";
import local from "./firma-admin-yonetimi.module.css";
import controls from "./firma-ayarlari.module.css";

type Durum = { aktif: boolean; aktif_admin_sayisi: number };
export default function FirmaAdminYonetimi({ firmaId, onDegisti }: { firmaId: string; onDegisti?: (aktif: boolean) => void }) {
  const [durum, setDurum] = useState<Durum | null>(null);
  const [hata, setHata] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const [yenileme, setYenileme] = useState(0);
  const kilit = useRef(false), canli = useRef(true);
  const url = `/admin/api/firmalar/${firmaId}/firma-admin`;
  useEffect(() => {
    canli.current = true;
    const c = new AbortController();
    setDurum(null); setHata("");
    void (async () => {
      try {
        const r = await fetch(url, { cache: "no-store", signal: c.signal });
        const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Firma admini ayarı alınamadı.");
        if (!c.signal.aborted) setDurum(d);
      } catch (e) { if (!c.signal.aborted) setHata(e instanceof Error ? e.message : "Firma admini ayarı alınamadı."); }
    })();
    return () => { canli.current = false; c.abort(); };
  }, [url, yenileme]);
  async function degistir() {
    if (kilit.current || !durum) return;
    kilit.current = true; setBekliyor(true); setHata("");
    try {
      const r = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktif: !durum.aktif, beklenen_aktif: durum.aktif }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Firma admini ayarı kaydedilemedi.");
      if (canli.current) { setDurum({ ...durum, aktif: d.aktif }); onDegisti?.(d.aktif); }
    } catch (e) { if (canli.current) setHata(e instanceof Error ? e.message : "Firma admini ayarı kaydedilemedi."); }
    finally { kilit.current = false; if (canli.current) setBekliyor(false); }
  }
  return <section className={`${styles.card} ${local.panel}`} aria-labelledby="firma-admin-baslik" aria-busy={bekliyor}>
    <div className={local.header}>
      <div className={local.title}><span className={local.icon}><ShieldCheck aria-hidden="true" /></span><div><h2 id="firma-admin-baslik">Yönetim erişimi</h2><p>Firmanın yönetimini kim yürütecek?</p></div></div>
      <button type="button" className={local.refresh} disabled={bekliyor} onClick={() => setYenileme(n => n + 1)} aria-label="Firma admini durumunu yenile"><RefreshCw aria-hidden="true" /><span>Yenile</span></button>
    </div>
    <div className={local.access}>
      <div className={local.description}><h3>Firma admini erişimi</h3><p id="firma-admin-aciklama">Açıldığında atanan firma adminleri kendi firma ekranlarını yönetebilir.</p></div>
      {durum && <button type="button" role="switch" aria-checked={durum.aktif} aria-label="Firma admini erişimi" aria-describedby="firma-admin-aciklama" className={controls.toggle} disabled={bekliyor || (!durum.aktif && durum.aktif_admin_sayisi === 0)} onClick={() => void degistir()}>
        <span className={controls.toggleTrack} aria-hidden="true"><span className={controls.toggleThumb} /></span><span className={controls.toggleText}>{bekliyor ? "Kaydediliyor…" : durum.aktif ? "Açık" : "Kapalı"}</span>
      </button>}
    </div>
    {!durum && !hata && <p className={local.loading} role="status">Yükleniyor…</p>}
    {hata && <p role="alert" className={`${styles.notice} ${local.error}`}>{hata}</p>}
    {durum && <div className={local.details}>
      <div className={local.metric}><Users aria-hidden="true" /><div><span>Atanmış aktif admin</span><strong>{durum.aktif_admin_sayisi} <small>kişi</small></strong></div></div>
      <div className={local.ownership}><span>Yönetim yetkisi</span><strong>{durum.aktif ? "Firma admininde" : "Cogniti’de"}</strong><p>{durum.aktif ? "Cogniti firma ekranlarını yalnız görüntüler." : "Firma işlemlerini Cogniti yönetir."}</p></div>
    </div>}
    <div className={local.footer}><p>{durum?.aktif_admin_sayisi === 0 ? "Erişimi açmak için önce Kullanıcılar sayfasından bir kişiye Firma Admini rolü atayın." : "Admin atamalarını Kullanıcılar sayfasından yapabilirsiniz."}</p><span>Bu erişimi yalnız Cogniti değiştirir.</span></div>
  </section>;
}
