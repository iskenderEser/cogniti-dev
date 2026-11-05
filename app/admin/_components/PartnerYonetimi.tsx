"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { SadeKapsulFiltre, SadeSekmeler } from "@/components/kontrol/SadeKontroller";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { Input } from "@/components/ui/input";
import { PARTNER_DURUM_ETIKETLERI, partnerListesiGecerli, type PartnerBasvuruListesi, type PartnerBasvurusu, type PartnerIlkGirisDurumu } from "@/lib/agora/partnerOnayTipleri";
import PartnerUyelikOnayi from "./PartnerUyelikOnayi";
import styles from "../admin.module.css";

function IlkGirisOnayi() {
  const [durum, setDurum] = useState<PartnerIlkGirisDurumu | "tumu">("bekliyor");
  const [sayfa, setSayfa] = useState(1);
  const [liste, setListe] = useState<PartnerBasvuruListesi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [islem, setIslem] = useState<{ kisi: PartnerBasvurusu; karar: "onaylandi" | "reddedildi" } | null>(null);
  const [sifre, setSifre] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const kilit = useRef(false);
  const istekDurumu = useRef({ surum: 0, controller: null as AbortController | null });

  const yenile = useCallback(async () => {
    const kontrol = istekDurumu.current;
    kontrol.controller?.abort();
    const controller = new AbortController(); kontrol.controller = controller;
    const surum = ++kontrol.surum;
    setYukleniyor(true); setHata("");
    try {
      const r = await fetch(`/admin/api/partnerler?${new URLSearchParams({ durum, sayfa: String(sayfa) })}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      const data: unknown = await r.json();
      if (!r.ok || !partnerListesiGecerli(data)) throw new Error("Başvurular okunamadı.");
      if (surum === kontrol.surum) setListe(data);
    } catch {
      if (surum === kontrol.surum && !controller.signal.aborted) { setListe(null); setHata("Partner başvuruları okunamadı. Yenile ile tekrar deneyin."); }
    } finally { if (surum === kontrol.surum) setYukleniyor(false); }
  }, [durum, sayfa]);
  useEffect(() => { const kontrol = istekDurumu.current; void yenile(); return () => { kontrol.surum++; kontrol.controller?.abort(); }; }, [yenile]);

  async function kararKaydet(event: FormEvent) {
    event.preventDefault(); if (!islem || kilit.current) return;
    kilit.current = true; setKaydediliyor(true); setHata(""); setMesaj("");
    try {
      const r = await fetch("/admin/api/partnerler", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ partner_id: islem.kisi.partner_id, karar: islem.karar, giris_surum: islem.kisi.giris_surum, ...(islem.karar === "onaylandi" ? { test_sifre: sifre } : {}) }),
      });
      const data: unknown = await r.json();
      if (!r.ok) {
        if (r.status === 409) { setIslem(null); setSifre(""); await yenile(); }
        setHata(data && typeof data === "object" && "hata" in data && typeof data.hata === "string" ? data.hata : "Karar kaydedilemedi. Listeyi yenileyip tekrar deneyin.");
        return;
      }
      setIslem(null); setSifre("");
      setMesaj(islem.karar === "onaylandi" ? "İlk giriş onaylandı. Partner belirlediğiniz test şifresiyle giriş yapabilir." : "Başvuru reddedildi; partner girişi kapatıldı.");
      await yenile();
    } catch { setHata("İşlem sonucu doğrulanamadı. Yenile ile güncel durumu kontrol edin."); }
    finally { kilit.current = false; setKaydediliyor(false); }
  }
  const sec = (kisi: PartnerBasvurusu, karar: "onaylandi" | "reddedildi") => { setIslem({ kisi, karar }); setSifre(""); setHata(""); setMesaj(""); };
  return <section className={styles.card} aria-labelledby="partner-ilk-giris-baslik" aria-busy={yukleniyor || kaydediliyor}>
    <header className={styles.cardHeader}><div><h2 id="partner-ilk-giris-baslik">İlk Giriş Onayı</h2></div><YenileButonu yenileniyor={yukleniyor} disabled={kaydediliyor} onYenile={yenile} /></header>
    <div className={styles.toolbar}><SadeKapsulFiltre etiket="Başvuru durumu" deger={durum} onDegistir={v => { if (kaydediliyor) return; setDurum(v); setSayfa(1); setListe(null); setIslem(null); setSifre(""); setMesaj(""); }} secenekler={[
      { deger: "bekliyor", etiket: "Bekleyenler", disabled: kaydediliyor }, { deger: "onaylandi", etiket: "Onaylananlar", disabled: kaydediliyor }, { deger: "reddedildi", etiket: "Reddedilenler", disabled: kaydediliyor }, { deger: "tumu", etiket: "Tümü", disabled: kaydediliyor },
    ]} /></div>
    {mesaj && <p className={styles.notice} role="status">{mesaj}</p>}
    {hata && <p className={styles.notice} role="alert">{hata}</p>}
    {yukleniyor && !liste && <p className={styles.empty} role="status">Başvurular yükleniyor…</p>}
    {liste && <>
      <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th scope="col">Ad Soyad</th><th scope="col">E-Posta</th><th scope="col">Cep Telefonu</th><th scope="col">Başvuru Tarihi</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>
        <tbody>{liste.kayitlar.map(k => <tr key={k.partner_id}>
          <td>{k.ad_soyad}</td><td>{k.eposta}</td><td>{k.cep_telefonu}</td>
          <td>{new Date(k.olusturuldu_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</td>
          <td>{PARTNER_DURUM_ETIKETLERI[k.ilk_giris_durumu]}</td>
          <td><div className={styles.rowActions}>
            {k.ilk_giris_durumu !== "onaylandi" && <button type="button" className={styles.button} disabled={kaydediliyor || yukleniyor} onClick={() => sec(k, "onaylandi")}>Onayla</button>}
            {k.ilk_giris_durumu !== "reddedildi" && <button type="button" className={styles.button} disabled={kaydediliyor || yukleniyor} onClick={() => sec(k, "reddedildi")}>Reddet</button>}
          </div></td>
        </tr>)}</tbody>
      </table></div>
      {!liste.kayitlar.length && <p className={styles.empty}>Bu seçimde başvuru bulunamadı.</p>}
      <div className={styles.cardBody}><div className={styles.actions}>
        <span>Toplam {liste.toplam} başvuru · Sayfa {sayfa}</span>
        <button type="button" className={styles.button} disabled={sayfa === 1 || yukleniyor || kaydediliyor} onClick={() => { setSayfa(sayfa - 1); setListe(null); setIslem(null); setSifre(""); }}>Önceki</button>
        <button type="button" className={styles.button} disabled={sayfa * 20 >= liste.toplam || yukleniyor || kaydediliyor} onClick={() => { setSayfa(sayfa + 1); setListe(null); setIslem(null); setSifre(""); }}>Sonraki</button>
      </div></div>
    </>}
    {islem && <form className={styles.cardBody} onSubmit={kararKaydet}>
      <p className={styles.name}>{islem.kisi.ad_soyad} · {islem.karar === "onaylandi" ? "İlk girişi onayla" : "Başvuruyu reddet"}</p>
      {islem.karar === "onaylandi" && <label className={styles.field}>Test Şifresi<Input type="password" autoComplete="new-password" minLength={6} maxLength={128} required value={sifre} disabled={kaydediliyor} onChange={e => setSifre(e.target.value)} /></label>}
      <div className={styles.actions}><button className={`${styles.button} ${styles.primary}`} type="submit" disabled={kaydediliyor || yukleniyor || !liste}>{kaydediliyor ? "Kaydediliyor…" : "Kararı Kaydet"}</button><button className={styles.button} type="button" disabled={kaydediliyor} onClick={() => { setIslem(null); setSifre(""); }}>Vazgeç</button></div>
    </form>}
  </section>;
}

export default function PartnerYonetimi() {
  const [sekme, setSekme] = useState<"ilk-giris" | "uyelik">("ilk-giris");
  return <section aria-label="Partner onay yönetimi"><SadeSekmeler deger={sekme} onDegistir={setSekme} etiket="Partner onay aşaması" secenekler={[
    { deger: "ilk-giris", etiket: "İlk Giriş Onayı", icerik: <IlkGirisOnayi /> },
    { deger: "uyelik", etiket: "Üyelik Onayı", icerik: <PartnerUyelikOnayi /> },
  ]} /></section>;
}
