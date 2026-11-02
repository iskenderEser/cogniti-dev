// app/admin/_components/TakimBolgeFormu.tsx
//
// Takım/Bölge toplu oluşturma formu. Birden fazla takım bloğu, her blokta
// takım adı + bölge satırları. useTakimBolgeForm hook'unun return değerlerini
// prop alır.

"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { GitBranch, Plus, Save, Trash2 } from "lucide-react";
import type { Takim, TakimBlok } from "../_types";
import styles from "../admin.module.css";
import org from "./organizasyon.module.css";

interface TakimBolgeFormuProps {
  firmaAdi: string;
  takimlar: Takim[];
  yukleniyor: boolean;
  veriHatasi: boolean;
  bloklar: TakimBlok[];
  kaydetLoading: boolean;
  handleTakimAdiDegis: (id: number, deger: string) => void;
  handleBolgeAdiDegis: (blok_id: number, bolgeIndex: number, deger: string) => void;
  handleYeniBlokEkle: () => void;
  handleBlokSil: (id: number) => void;
  handleKaydet: () => void;
  formGecerliMi: () => boolean;
  handleMevcutTakimaBolgeEkle: (takimId: string, bolgeAdi: string) => Promise<boolean>;
}

function TakimBolgeFormu(p: TakimBolgeFormuProps) {
  const gecerli = p.formGecerliMi();

  return <div className={org.layout}>
    <section className={styles.card} aria-labelledby="organizasyon-kayitli-baslik">
      <div className={styles.cardHeader}><div>
        <h2 id="organizasyon-kayitli-baslik"><GitBranch />Kayıtlı Takımlar ve Bölgeler</h2>
        <p>{p.firmaAdi} firmasının mevcut organizasyon yapısı</p>
      </div>{!p.yukleniyor && !p.veriHatasi && <div className={org.summary}><span className={styles.badge}>{p.takimlar.length} takım · {p.takimlar.reduce((n,t) => n+t.bolgeler.length,0)} bölge</span>{p.takimlar.length > 0 && <MevcutTakimaBolge key={p.takimlar[0].takim_id} takimlar={p.takimlar} disabled={p.kaydetLoading} onKaydet={p.handleMevcutTakimaBolgeEkle} />}</div>}</div>
      {p.yukleniyor ? <p role="status" className={styles.empty}>Organizasyon yükleniyor…</p>
        : p.veriHatasi ? <p role="alert" className={styles.empty}>Organizasyon bilgileri alınamadı. Yeniden yüklemek için firmayı tekrar seçin.</p>
        : !p.takimlar.length ? <p className={styles.empty}>Bu firmada henüz takım tanımlanmamış.</p>
        : <ul className={org.teamList}>{p.takimlar.map(takim => <li key={takim.takim_id} className={org.teamRow}>
          <div className={org.teamHeading}><div className={org.teamName}><h3>{takim.takim_adi}</h3><span className={org.unitType}>Takım</span></div></div>
          {takim.bolgeler.length ? <ul className={org.regionList} aria-label={`${takim.takim_adi} bölgeleri`}>{takim.bolgeler.map(bolge => <li key={bolge.bolge_id}><span className={org.regionName}>{bolge.bolge_adi}</span><span className={org.unitType}>Bölge</span></li>)}</ul> : <span className={styles.subtext}>Bölge tanımlanmamış.</span>}
        </li>)}</ul>}
    </section>

    <section className={styles.card} aria-labelledby="organizasyon-ekleme-baslik">
      <div className={styles.cardHeader}><div>
        <h2 id="organizasyon-ekleme-baslik"><Plus />Takım ve Bölge Ekleme</h2>
        <p>Yeni takımları ve her takıma bağlı bölgeleri {p.firmaAdi} için tanımlayın.</p>
      </div></div>
      <form className={styles.cardBody} onSubmit={event => { event.preventDefault(); if (gecerli && !p.kaydetLoading && !p.yukleniyor && !p.veriHatasi) p.handleKaydet(); }}>
        <fieldset className={org.fieldset} disabled={p.kaydetLoading || p.yukleniyor || p.veriHatasi}>
          <div className={org.draftList}>{p.bloklar.map((blok, index) => <section key={blok.id} className={org.draft} aria-labelledby={`org-takim-${blok.id}-baslik`}>
            <h3 className={org.draftTitle} id={`org-takim-${blok.id}-baslik`}>Takım {index+1}</h3>
            <div className={org.draftFields}>
              <label className={styles.field} htmlFor={`org-takim-${blok.id}`}>Takım adı
                <input id={`org-takim-${blok.id}`} className={styles.input} placeholder="Takım adı (en az 3 harf)" value={blok.takim_adi} onChange={e => p.handleTakimAdiDegis(blok.id,e.target.value)} />
              </label>
              <div className={org.regions}><p className={org.fieldLabel}>Bağlı bölgeler</p>
                {blok.bolgeler.map((bolge, bolgeIndex) => <label className={org.regionField} key={bolgeIndex} htmlFor={`org-bolge-${blok.id}-${bolgeIndex}`}>
                  <span>Bölge {bolgeIndex+1}</span><input id={`org-bolge-${blok.id}-${bolgeIndex}`} className={styles.input} placeholder="Bölge adı" value={bolge} onChange={e => p.handleBolgeAdiDegis(blok.id,bolgeIndex,e.target.value)} />
                </label>)}
                <span className={styles.subtext}>Bölge adı yazıldıkça yeni bir bölge alanı açılır.</span>
              </div>
            </div>
            {p.bloklar.length > 1 && <button type="button" className={`${styles.button} ${styles.danger} ${org.remove}`} aria-label={`Takım ${index+1} alanını kaldır`} onClick={() => p.handleBlokSil(blok.id)}><Trash2 />Kaldır</button>}
          </section>)}</div>
          <div className={org.formFooter}>
            <button type="button" className={styles.button} onClick={p.handleYeniBlokEkle}><Plus />Takım Ekle</button>
            <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={!gecerli || p.kaydetLoading || p.yukleniyor || p.veriHatasi}><Save />{p.kaydetLoading ? "Kaydediliyor…" : "Kaydet"}</button>
          </div>
        </fieldset>
      </form>
    </section>
  </div>;
}

function MevcutTakimaBolge({ takimlar, disabled, onKaydet }: { takimlar: Takim[]; disabled: boolean; onKaydet: (takimId: string, bolgeAdi: string) => Promise<boolean> }) {
  const [takimId, setTakimId] = useState(takimlar[0]?.takim_id ?? "");
  const takim = takimlar.find(t => t.takim_id === takimId);
  const [acik, setAcik] = useState(false);
  const [ad, setAd] = useState("");
  const [kaydediyor, setKaydediyor] = useState(false);
  const kilit = useRef(false);
  const aktif = useRef(true);
  useEffect(() => { aktif.current = true; return () => { aktif.current = false; }; }, []);

  async function kaydet() {
    if (disabled || kilit.current || !ad.trim() || !takim) return;
    kilit.current = true;
    setKaydediyor(true);
    try {
      if (await onKaydet(takim.takim_id, ad.trim()) && aktif.current) { setAd(""); setAcik(false); }
    } finally {
      kilit.current = false;
      if (aktif.current) setKaydediyor(false);
    }
  }

  return <>
    <button type="button" className={`${styles.button} ${org.addRegionButton}`} disabled={disabled || kaydediyor} aria-label="Mevcut takıma bölge ekle" aria-expanded={acik} aria-controls={"org-mevcut-bolge"} onClick={() => { setAcik(!acik); setAd(""); }}><Plus />Bölge Ekle</button>
    {acik && <form id={"org-mevcut-bolge"} className={org.addRegionForm} onSubmit={e => { e.preventDefault(); void kaydet(); }}>
      {takimlar.length > 1 && <label className={styles.field}>Takım<select className={styles.select} value={takimId} disabled={disabled || kaydediyor} onChange={e => setTakimId(e.target.value)}>{takimlar.map(t => <option key={t.takim_id} value={t.takim_id}>{t.takim_adi}</option>)}</select></label>}
      <label className={styles.field} htmlFor={"org-mevcut-bolge-adi"}>Yeni Bölge Adı<input id={"org-mevcut-bolge-adi"} className={styles.input} value={ad} disabled={disabled || kaydediyor} onChange={e => setAd(e.target.value)} /></label>
      <div className={styles.actions}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={disabled || kaydediyor || !ad.trim() || !takim}><Save />{kaydediyor ? "Kaydediliyor…" : "Kaydet"}</button><button type="button" className={styles.button} disabled={kaydediyor} onClick={() => { setAcik(false); setAd(""); }}>Vazgeç</button></div>
    </form>}
  </>;
}

export default saltOkunurAlan(TakimBolgeFormu);
