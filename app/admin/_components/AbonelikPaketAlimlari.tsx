"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Search, ShoppingBag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { abonelikProformaListesiGecerli, proformaOnayiGecerli, type AbonelikProformaKaydi, type AbonelikProformaListesi } from "@/lib/satinAlma/abonelikProforma";
import { SIPARIS_PAKET_ADLARI } from "@/lib/satinAlma/siparisListesi";
import AbonelikProformaBelgesi from "./AbonelikProformaBelgesi";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { SATIN_ALIM_AYLARI, satinAlimAyi, aylikSiparisleriOku } from "@/lib/satinAlma/aylikSiparisler";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import tokenStyles from "./token-yonetimi.module.css";
import local from "./esnek-proforma.module.css";

const basliklar = ["Sipariş Tarihi", "Sipariş Veren", "Token Hesabı", "Paket", "Token Adedi", "Birim Fiyat", "Toplam Tutar", "KDV", "Genel Tutar", "Proforma", "Onay"];
const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

export default function AbonelikPaketAlimlari({ firmaId, sadeceOnayli = false }: { firmaId: string; sadeceOnayli?: boolean }) {
  const [seciliAy,setSeciliAy]=useState(satinAlimAyi);
  const [sayfa, setSayfa] = useState(0);
  const [aramaMetni, setAramaMetni] = useState("");
  const [arama, setArama] = useState("");
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri?: AbonelikProformaListesi; hata?: string } | null>(null);
  const sorgu = new URLSearchParams({ sayfa: String(sayfa), q: arama, onayli: sadeceOnayli ? "1" : "0" });
  const anahtar = `${firmaId}:${sorgu}:${seciliAy}:${yenileme}`;
  const guncel = sonuc?.anahtar === anahtar ? sonuc : null;
  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      try {
        const veri=await aylikSiparisleriOku({yol:`/admin/api/firmalar/${firmaId}/abonelik-proformalar`,firmaId,ay:seciliAy,sayfa,arama,signal:kontrol.signal,dogrula:abonelikProformaListesiGecerli,sadeceOnayli});
        if(!kontrol.signal.aborted)setSonuc({anahtar,veri});
      } catch (hata) {
        if (!kontrol.signal.aborted) setSonuc({ anahtar, hata: hata instanceof Error ? hata.message : "Proforma bilgileri alınamadı." });
      }
    }
    void oku(); return () => kontrol.abort();
  }, [anahtar, firmaId, sayfa, arama, sadeceOnayli, seciliAy]);
  useEffect(() => {
    const yenile = () => setYenileme(v => v + 1);
    window.addEventListener("focus", yenile);
    return () => window.removeEventListener("focus", yenile);
  }, []);
  const veri = guncel?.veri;
  return <section className={styles.card} aria-label={sadeceOnayli ? "Abonelik · Proforma Faturalar" : "Abonelik Paket Alımları"}>
    <div className={styles.cardHeader}>
      <div><h2><ShoppingBag />{sadeceOnayli ? "Abonelik · Proforma Faturalar" : "Abonelik Paket Alımları"}</h2>
        <p>{sadeceOnayli ? "Firma veya admin tarafından onaylanan proformalar." : "Her ayın 1'inde seçilen paket tutarı kadar faturalanır."}</p>
      </div>
      <form className={tokenStyles.siparisArama} role="search" onSubmit={e => { e.preventDefault(); setArama(aramaMetni.trim()); setSayfa(0); setYenileme(v => v + 1); }}>
        <input className={styles.input} type="search" aria-label="Sipariş veren veya paket ara" placeholder="Sipariş veren veya paket ara…" maxLength={80} value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
        <button className={`${styles.button} ${styles.primary}`} type="submit"><Search />Ara</button>
      </form>
    </div>
    {<div className={styles.cardBody}><SadeKapsulFiltre etiket={sadeceOnayli?"Onaylı proforma ayları":"Satın alım ayları"} deger={seciliAy} onDegistir={ay=>{setSeciliAy(ay);setSayfa(0);}}
      secenekler={SATIN_ALIM_AYLARI.map((etiket,i)=>({deger:`${seciliAy.slice(0,4)}-${String(i+1).padStart(2,'0')}`,etiket}))}/></div>}
    {!guncel ? <p className={styles.cardBody} role="status">Kayıtlar yükleniyor…</p> : guncel.hata ? <div className={styles.cardBody} role="alert"><p>{guncel.hata}</p><Button type="button" variant="outline" onClick={() => setYenileme(v => v + 1)}>Yeniden Dene</Button></div> : veri && <>
      <div className={styles.tableWrap}><MobilUyumluTablo basliklar={basliklar} className={local.tablo} aria-label="Abonelik paket alımları ve proforma onayları">
        <thead><tr>{basliklar.map((b, i) => <th key={b} className={i >= 4 && i <= 8 ? local.rakam : undefined}>{b}</th>)}</tr></thead>
        <tbody>{veri.siparisler.map(s => <AbonelikSatiri key={s.kayit_id} kayit={s} firmaId={firmaId} adminOnayi={veri.admin_onayi} onYenile={() => setYenileme(v => v + 1)} />)}
          {!veri.siparisler.length && <tr><td colSpan={11}>{sadeceOnayli ? "Henüz onaylanan proforma bulunmuyor." : arama ? "Aramayla eşleşen kayıt bulunamadı." : "Henüz satın alma kaydı bulunmuyor."}</td></tr>}
        </tbody>
      </MobilUyumluTablo></div>
      {veri.toplam > veri.sayfa_boyutu && <div className={`${styles.cardBody} flex items-center justify-end gap-3`}>
        <Button variant="outline" disabled={sayfa === 0} onClick={() => setSayfa(v => v - 1)}>Önceki</Button><span>Sayfa {sayfa + 1} / {Math.ceil(veri.toplam / veri.sayfa_boyutu)}</span>
        <Button variant="outline" disabled={(sayfa + 1) * veri.sayfa_boyutu >= veri.toplam} onClick={() => setSayfa(v => v + 1)}>Sonraki</Button>
      </div>}
    </>}
    <p className={local.bilgi}>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
  </section>;
}

function AbonelikSatiri({ kayit: s, firmaId, adminOnayi, onYenile }: { kayit: AbonelikProformaKaydi; firmaId: string; adminOnayi: boolean; onYenile: () => void }) {
  const [proformaAcik, setProformaAcik] = useState(false);
  const [modalAcik, setModalAcik] = useState(false);
  const [aciklama, setAciklama] = useState("");
  const [hata, setHata] = useState("");
  const [kaydediyor, setKaydediyor] = useState(false);
  const kilit = useRef(false);
  const id = useId();
  async function onayla() {
    if (kilit.current || s.onay) return;
    if (adminOnayi && !aciklama.trim()) { setHata("Admin onayı için açıklama zorunludur."); return; }
    kilit.current = true; setKaydediyor(true); setHata("");
    try {
      const yanit = await fetch(`/admin/api/firmalar/${firmaId}/abonelik-proformalar`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ siparisId: s.kayit_id, aciklama: aciklama.trim() }),
      });
      const veri = await yanit.json();
      if (!yanit.ok) throw new Error(typeof veri.hata === "string" ? veri.hata : "Onay kaydedilemedi.");
      if (!proformaOnayiGecerli(veri)) throw new Error("Onay sonucu doğrulanamadı. Tekrar deneyin.");
      setModalAcik(false); onYenile();
    } catch (error) { setHata(error instanceof Error ? error.message : "Onay sonucu alınamadı. Tekrar deneyin."); }
    finally { kilit.current = false; setKaydediyor(false); }
  }
  return <Fragment>
    <tr>
      <td>{new Date(s.siparis_tarihi).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" })}</td>
      <td>{s.satin_alan_ad_soyad || "—"}</td><td>{s.bakiye_turu === "kisisel" ? "Kişisel Token Hesabı" : "Firma Token Hesabı"}</td><td>{SIPARIS_PAKET_ADLARI[s.paket_turu]}</td>
      <td className={local.rakam}>{s.token_adedi.toLocaleString("tr-TR")}</td><td className={local.rakam}>{para(s.birim_fiyat)}</td>
      <td className={local.rakam}>{para(s.toplam_tutar)}</td><td className={local.rakam}>{para(s.kdv)}</td><td className={local.rakam}>{para(s.toplam_tutar + s.kdv)}</td>
      <td className={local.islem}><button type="button" className={local.buton} aria-expanded={proformaAcik} aria-controls={id} onClick={() => setProformaAcik(v => !v)}>Proforma <ChevronDown size={14} aria-hidden="true" /></button></td>
      <td className={local.islem}>{s.onay ? <span className={local.durum}>✓ Onaylandı<small>{s.onay.tur === "admin" ? "Admin Onayı" : "Firma Onayı"}</small></span>
        : <button type="button" className={`${local.buton} ${local.onayla}`} onClick={() => { setHata(""); setModalAcik(true); }}>Onayla</button>}</td>
    </tr>
    {proformaAcik && <tr><td colSpan={11} className={local.belgeSatiri}><div id={id}><AbonelikProformaBelgesi kayit={s} /></div></td></tr>}
    <AlertDialog open={modalAcik} onOpenChange={v => { if (!kilit.current) setModalAcik(v); }}><AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{adminOnayi ? "Admin Onayı" : "Proforma Fatura Onayı"}</AlertDialogTitle>
        <AlertDialogDescription>{adminOnayi ? "Abonelik Paket proformasını firma adına onaylamak için açıklamanızı yazın." : "Onayınızdan sonra Cogniti tarafından resmi faturanız düzenlenecektir."}</AlertDialogDescription>
      </AlertDialogHeader>
      {adminOnayi && <label className={local.modalAlan} htmlFor={`${id}-aciklama`}>Açıklama *
        <textarea id={`${id}-aciklama`} required maxLength={2000} value={aciklama} onChange={e => setAciklama(e.target.value)} disabled={kaydediyor} placeholder="Firma adına onay verme gerekçenizi yazın." />
      </label>}
      {hata && <p className={local.hata} role="alert">{hata}</p>}
      <AlertDialogFooter><AlertDialogCancel disabled={kaydediyor}>Vazgeç</AlertDialogCancel>
        <Button type="button" disabled={kaydediyor || (adminOnayi && !aciklama.trim())} onClick={() => void onayla()}>{kaydediyor ? "Kaydediliyor…" : adminOnayi ? "Kaydet" : "Onayla"}</Button>
      </AlertDialogFooter>
    </AlertDialogContent></AlertDialog>
  </Fragment>;
}
