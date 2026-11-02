"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { RefreshCw, Save } from "lucide-react";
import { firmaCekDegerleriGecerli, type EclubFirmaTanimiSatiri, type FirmaCekTanimi } from "@/lib/eclub/store/firmaCekTanimi";
import s from "../../store/_components/katalog.module.css";
const endpoint = "/admin/eclub-cek-teslimat/api/firma-tanimlari";
const n = (v: number) => v.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
function EclubFirmaCekTanimlari({ firmaId }: { firmaId: string }) {
 const [firma,setFirma]=useState<EclubFirmaTanimiSatiri|null>(null),[loading,setLoading]=useState(true),[hata,setHata]=useState(""),[mesaj,setMesaj]=useState("");
 const istek=useRef<AbortController|null>(null);
 const yukle=useCallback(async()=>{
  istek.current?.abort();const c=new AbortController();istek.current=c;setLoading(true);setHata("");
  try{const r=await fetch(`${endpoint}?${new URLSearchParams({firma:firmaId})}`,{cache:"no-store",signal:c.signal});const d=await r.json();if(!r.ok)throw new Error(d.hata||"Firma tanımı alınamadı.");const f=d.firmalar?.find((f:EclubFirmaTanimiSatiri)=>f.firma_id===firmaId);if(!f)throw new Error("Firma bulunamadı.");if(!c.signal.aborted)setFirma(f);}
  catch(e){if(!c.signal.aborted)setHata(e instanceof Error?e.message:"Firma tanımı alınamadı.");}
  finally{if(!c.signal.aborted)setLoading(false);}
 },[firmaId]);
 useEffect(()=>{void yukle();return()=>istek.current?.abort();},[yukle]);
 if(loading)return <p role="status">Firma tanımı yükleniyor…</p>;
 if(hata)return <section className={s.card}><div className={s.form}><p role="alert" className={s.error}>{hata}</p><button type="button" className={s.button} onClick={()=>void yukle()}><RefreshCw/>Tekrar dene</button></div></section>;
 return firma&&<div className={s.panel}>{mesaj&&<p role="status" className={s.feedback}>{mesaj}</p>}<FirmaTanimiFormu key={`${firma.firma_id}/${firma.tanim?.surum??0}`} firma={firma} onSaved={tanim=>{setFirma({...firma,tanim});setMesaj("Puan–TL karşılığı kaydedildi.");}}/></div>;
}
function FirmaTanimiFormu({ firma, onSaved }: { firma: EclubFirmaTanimiSatiri; onSaved: (tanim: FirmaCekTanimi) => void }) {
  const [puan, setPuan] = useState(firma.tanim ? String(firma.tanim.karsilik_puan) : "");
  const [tl, setTl] = useState(firma.tanim ? String(firma.tanim.karsilik_tl) : "");
  const [busy, setBusy] = useState(false), [hata, setHata] = useState("");
  const kilit = useRef(false), canli = useRef(true);
  useEffect(() => { canli.current = true; return () => { canli.current = false; }; }, []);
  async function kaydet(e: FormEvent) {
    e.preventDefault(); if (kilit.current) return;
    if (!firmaCekDegerleriGecerli(Number(puan), Number(tl))) { setHata("Pozitif tam sayı puan ve en fazla iki ondalıklı TL tutarı girin."); return; }
    kilit.current = true; setBusy(true); setHata("");
    try {
      const r = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firma_id: firma.firma_id, karsilik_puan: Number(puan), karsilik_tl: Number(tl), surum: firma.tanim?.surum ?? 0 }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.hata || "Firma tanımı kaydedilemedi.");
      if (d.tanim?.firma_id !== firma.firma_id) throw new Error("Firma tanımı doğrulanamadı. Listeyi yenileyin.");
      if (canli.current) onSaved(d.tanim);
    } catch (e) { if (canli.current) setHata(e instanceof Error ? e.message : "Firma tanımı kaydedilemedi."); }
    finally { kilit.current = false; if (canli.current) setBusy(false); }
  }
  return <section className={s.card} aria-labelledby="eclub-secili-firma">
    <div className={s.header}><div><h2 id="eclub-secili-firma">Eclub Çek Yönetimi</h2><p>{firma.firma_adi} · Hediye çeki puan–TL karşılığı</p></div></div>
    <form className={s.form} onSubmit={kaydet} noValidate aria-busy={busy}>
      <div className={s.formGrid}>
        <label className={s.field}>Puan<input className={s.input} type="number" inputMode="numeric" min="1" max="2147483647" step="1" value={puan} disabled={busy} onChange={e => { setPuan(e.target.value); setHata(""); }} required /></label>
        <label className={s.field}>Çek tutarı (TL)<input className={s.input} type="number" inputMode="decimal" min="0.01" max="999999999.99" step="0.01" value={tl} disabled={busy} onChange={e => { setTl(e.target.value); setHata(""); }} required /></label>
      </div>
      {firmaCekDegerleriGecerli(Number(puan), Number(tl)) && <p className={s.hint}>{n(Number(puan))} Puan = {n(Number(tl))} TL</p>}
      {hata && <p role="alert" className={`${s.feedback} ${s.error}`}>{hata}</p>}
      <div className={s.formFooter}><button className={`${s.button} ${s.primary}`} disabled={busy || (Number(puan) === firma.tanim?.karsilik_puan && Number(tl) === firma.tanim?.karsilik_tl)}><Save />{busy ? "Kaydediliyor…" : "Kaydet"}</button></div>
    </form>
  </section>;
}

export default saltOkunurAlan(EclubFirmaCekTanimlari);
