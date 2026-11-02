"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { puanAraliklariGecerliMi, type PuanAraliklari } from "@/lib/uretici/puanAraliklari";
import styles from "../admin.module.css";
import local from "./puan-yonetimi.module.css";

const PUAN_TURLERI = [
  { id: "yayin", ad: "Yayın Tamamlama Puanı", aciklama: "Yayını ilk kez tamamladığınızda kazanılan puandır." },
  { id: "cevap", ad: "Doğru Cevap Puanı", aciklama: "Yayına ait her soruya doğru cevap verdiğinizde kazanılan puandır." },
  { id: "extra", ad: "Extra Tamamlama Puanı", aciklama: "Yayını ay içinde üç kez tam olarak tekrar tamamladığınızda kazanılan ek puandır." },
] as const;
const ALANLAR = [
  { id: "minimum", ad: "En Düşük Puan" },
  { id: "maksimum", ad: "En Yüksek Puan" },
  { id: "artis", ad: "Artış" },
] as const;

function PuanYonetimi({ firmaId }: { firmaId: string }) {
  const [degerler, setDegerler] = useState<Record<string, string>>({});
  const [yuklendi, setYuklendi] = useState(false);
  const [deneme, setDeneme] = useState(0);
  const [hata, setHata] = useState("");
  const [kirli, setKirli] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);
  const kilit = useRef(false);
  const canli = useRef(false);
  useEffect(() => { canli.current = true; return () => { canli.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/admin/api/firmalar/${firmaId}/puan-yonetimi`, { cache: "no-store", signal: controller.signal })
      .then(async res => { const d = await res.json(); if (!res.ok) throw new Error(d.hata ?? "Puan aralıkları alınamadı.");
        if (d.firma_id !== firmaId || (d.ayar !== null && !puanAraliklariGecerliMi(d.ayar))) throw new Error("Firma puan bilgisi geçersiz.");
        if (!controller.signal.aborted) {
          const kayit: Record<string, string> = {};
          for (const tur of PUAN_TURLERI) for (const alan of ALANLAR) kayit[`${tur.id}_${alan.id}`] = d.ayar == null ? "" : String(d.ayar[tur.id][alan.id]);
          setDegerler(kayit); setYuklendi(true);
        }
      }).catch(error => { if (!controller.signal.aborted) setHata(error instanceof Error ? error.message : "Puan aralıkları alınamadı."); });
    return () => controller.abort();
  }, [firmaId, deneme]);
  async function kaydet(event: FormEvent) {
    event.preventDefault(); if (kilit.current || !yuklendi || !kirli) return;
    const ayar = Object.fromEntries(PUAN_TURLERI.map(t => [t.id, Object.fromEntries(ALANLAR.map(a => [a.id, degerler[`${t.id}_${a.id}`]?.trim() ? Number(degerler[`${t.id}_${a.id}`]) : NaN]))])) as PuanAraliklari;
    if (!puanAraliklariGecerliMi(ayar)) { setHata("Tüm alanlara pozitif tam sayı girin. En yüksek puan en düşükten küçük olamaz; her türde en fazla 1000 seçenek olabilir."); return; }
    kilit.current = true; setKaydediliyor(true); setHata(""); setKaydedildi(false);
    try {
      const res = await fetch(`/admin/api/firmalar/${firmaId}/puan-yonetimi`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ayar }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.hata ?? "Puan aralıkları kaydedilemedi.");
      if (canli.current) { setKirli(false); setKaydedildi(true); }
    } catch (error) { if (canli.current) setHata(error instanceof Error ? error.message : "Kaydedilemedi."); }
    finally { kilit.current = false; if (canli.current) setKaydediliyor(false); }
  }
  return <form onSubmit={kaydet} noValidate aria-busy={kaydediliyor}>
  <section className={`${styles.card} ${local.card}`} aria-label="Puan aralıkları">
    <div className={local.header} aria-hidden="true">
      <span />
      {ALANLAR.map(alan => <span key={alan.id}>{alan.ad}</span>)}
    </div>
    {PUAN_TURLERI.map(tur => <div className={local.row} key={tur.id}>
      <div className={local.info}><h2>{tur.ad}</h2><p>{tur.aciklama}</p></div>
      {ALANLAR.map(alan => <label key={alan.id} className={local.field}>
        <span>{alan.ad}</span>
        <input className={styles.input} type="number" inputMode="numeric"
          name={`${tur.id}_${alan.id}`} min={1} max={2147483647} step={1}
          value={degerler[`${tur.id}_${alan.id}`] ?? ""} disabled={!yuklendi || kaydediliyor}
          onChange={e => { if (kilit.current) return; setDegerler(v => ({ ...v, [`${tur.id}_${alan.id}`]: e.target.value })); setKirli(true); setKaydedildi(false); setHata(""); }}
          aria-label={`${tur.ad} — ${alan.ad}`} />
      </label>)}
    </div>)}
  </section>
  <div className={local.actions}>
    <div>{!yuklendi && !hata && <span role="status">Puan aralıkları yükleniyor…</span>}
      {hata && <span role="alert">{hata}</span>}{kaydedildi && <span role="status">Kaydedildi.</span>}
      {!yuklendi && hata && <button type="button" className={styles.button} onClick={() => { setHata(""); setDeneme(n => n + 1); }}>Tekrar Dene</button>}
    </div>
    <button className={styles.button} type="submit" disabled={!yuklendi || !kirli || kaydediliyor}>{kaydediliyor ? "Kaydediliyor…" : "Kaydet"}</button>
  </div>
  <p className={local.note}>Ay içinde değiştirilmesi önerilmez</p>
  </form>;
}

export default saltOkunurAlan(PuanYonetimi);
