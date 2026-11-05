"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { ilSecenekleri, ilinIlceleri } from "@/lib/firma/konumReferansi";
import { PARTNER_UYELIK_ETIKETLERI, partnerUyelikListesiGecerli, type PartnerUyelikBasvurusu, type PartnerUyelikDurumu, type PartnerUyelikListesi } from "@/lib/agora/partnerUyelikTipleri";
import styles from "../admin.module.css";

export default function PartnerUyelikOnayi() {
  const { mesajlar: bildirimler, basari } = useHataMesaji();
  const [durum, setDurum] = useState<PartnerUyelikDurumu | "tumu">("onay_bekliyor");
  const [sayfa, setSayfa] = useState(1);
  const [liste, setListe] = useState<PartnerUyelikListesi | null>(null);
  const [secili, setSecili] = useState<PartnerUyelikBasvurusu | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const kilit = useRef(false);
  const istek = useRef({ surum: 0, controller: null as AbortController | null });
  const yenile = useCallback(async () => {
    const kontrol = istek.current;
    kontrol.controller?.abort();
    const controller = new AbortController(); kontrol.controller = controller;
    const surum = ++kontrol.surum;
    setYukleniyor(true); setHata("");
    try {
      const r = await fetch(`/admin/api/partnerler/uyelik?${new URLSearchParams({ durum, sayfa: String(sayfa) })}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      const data: unknown = await r.json();
      if (!r.ok || !partnerUyelikListesiGecerli(data)) throw new Error();
      if (surum === kontrol.surum) setListe(data);
    } catch {
      if (surum === kontrol.surum && !controller.signal.aborted) { setListe(null); setSecili(null); setHata("Üyelik başvuruları okunamadı. Yenile ile tekrar deneyin."); }
    } finally { if (surum === kontrol.surum) setYukleniyor(false); }
  }, [durum, sayfa]);
  useEffect(() => { const kontrol = istek.current; void yenile(); return () => { kontrol.surum++; kontrol.controller?.abort(); }; }, [yenile]);

  async function karariKaydet(karar: "onaylandi" | "reddedildi") {
    if (!secili || kilit.current || yukleniyor || !liste) return;
    kilit.current = true; setKaydediliyor(true); setHata(""); setMesaj("");
    try {
      const r = await fetch("/admin/api/partnerler/uyelik", { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ partner_id: secili.partner_id, karar, uyelik_surum: secili.uyelik_surum, profil_surum: secili.profil.surum }) });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 409) { setSecili(null); await yenile(); }
        setHata(typeof data.hata === "string" ? data.hata : "Karar kaydedilemedi.");
        return;
      }
      if (karar === "onaylandi") basari(`${secili.ad_soyad} üyeliği onaylandı.`);
      setSecili(null); setMesaj(karar === "onaylandi" ? "Üyelik onaylandı. Partner eğitim alanına erişebilir." : "Üyelik reddedildi. Partner profilini düzeltip yeniden gönderebilir.");
      await yenile();
    } catch { setHata("İşlem sonucu doğrulanamadı. Yenile ile güncel durumu kontrol edin."); }
    finally { kilit.current = false; setKaydediliyor(false); }
  }
  const sayfaSec = (s: number) => { setSayfa(s); setListe(null); setSecili(null); };
  const tarih = (d: string) => new Date(d).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const profil = secili?.profil;
  const bilgiler = secili && profil ? [
    ["Ad Soyad", secili.ad_soyad], ["E-Posta", secili.eposta], ["Cep Telefonu", secili.cep_telefonu], ["Şirket Adı", profil.sirket_adi],
    ["İl", ilSecenekleri.find(i => i.deger === String(profil.il_id))?.etiket ?? String(profil.il_id)],
    ["İlçe", ilinIlceleri(profil.il_id).find(i => i.deger === String(profil.ilce_id))?.etiket ?? String(profil.ilce_id)],
    ["Adres", profil.adres], ["Vergi Dairesi", profil.vergi_dairesi], ["Vergi Numarası", profil.vergi_no], ["IBAN", profil.iban],
    ["Profil Güncelleme Tarihi", tarih(profil.guncellendi_at)], ["Üyelik Durumu", PARTNER_UYELIK_ETIKETLERI[secili.uyelik_durumu]],
    ...(secili.uyelik_karar_at ? [["Son Karar Tarihi", tarih(secili.uyelik_karar_at)]] : []),
  ] : [];
  return <section className={styles.card} aria-labelledby="partner-uyelik-baslik" aria-busy={yukleniyor || kaydediliyor}>
    <HataMesajiContainer mesajlar={bildirimler} />
    <header className={styles.cardHeader}><h2 id="partner-uyelik-baslik">Üyelik Onayı</h2><YenileButonu yenileniyor={yukleniyor} disabled={kaydediliyor} onYenile={() => { setSecili(null); return yenile(); }} /></header>
    <div className={styles.toolbar}><SadeKapsulFiltre etiket="Üyelik Durumu" deger={durum} onDegistir={v => { if (kaydediliyor) return; setDurum(v); sayfaSec(1); setMesaj(""); }} secenekler={[
      { deger: "onay_bekliyor", etiket: "Bekleyenler", disabled: kaydediliyor }, { deger: "onaylandi", etiket: "Onaylananlar", disabled: kaydediliyor }, { deger: "reddedildi", etiket: "Reddedilenler", disabled: kaydediliyor }, { deger: "tumu", etiket: "Tümü", disabled: kaydediliyor },
    ]} /></div>
    {hata && <p className={`${styles.notice} ${styles.partnerUyelikHata}`} role="alert">{hata}</p>}
    {mesaj && <p className={styles.notice} role="status">{mesaj}</p>}
    {yukleniyor && !liste && <p className={styles.empty} role="status">Üyelik başvuruları yükleniyor…</p>}
    {liste && <>
      <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th scope="col">Şirket Adı</th><th scope="col">Ad Soyad</th><th scope="col">E-Posta</th><th scope="col">Profil Tarihi</th><th scope="col">Durum</th><th scope="col">İşlem</th></tr></thead>
        <tbody>{liste.kayitlar.map(k => <tr key={k.partner_id} data-selected={secili?.partner_id === k.partner_id}>
          <td>{k.profil.sirket_adi}</td><td>{k.ad_soyad}</td><td>{k.eposta}</td><td>{tarih(k.profil.guncellendi_at)}</td><td>{PARTNER_UYELIK_ETIKETLERI[k.uyelik_durumu]}</td>
          <td><button type="button" className={styles.button} disabled={kaydediliyor || yukleniyor} aria-expanded={secili?.partner_id === k.partner_id} aria-controls="partner-uyelik-detay" onClick={() => { setSecili(k); setHata(""); setMesaj(""); }}>İncele</button></td>
        </tr>)}</tbody>
      </table></div>
      {!liste.kayitlar.length && <p className={styles.empty}>Bu seçimde üyelik başvurusu bulunamadı.</p>}
      <div className={styles.cardBody}><div className={styles.actions}><span>Toplam {liste.toplam} Başvuru · Sayfa {sayfa}</span>
        <button type="button" className={styles.button} disabled={sayfa === 1 || yukleniyor || kaydediliyor} onClick={() => sayfaSec(sayfa - 1)}>Önceki</button>
        <button type="button" className={styles.button} disabled={sayfa * 20 >= liste.toplam || yukleniyor || kaydediliyor} onClick={() => sayfaSec(sayfa + 1)}>Sonraki</button>
      </div></div>
    </>}
    {secili && profil && <section className={styles.cardBody} id="partner-uyelik-detay" aria-label="Partner Üyelik Bilgileri">
      <h3>{profil.sirket_adi} · {secili.ad_soyad}</h3>
      <Image unoptimized src={`/admin/api/partnerler/${secili.partner_id}/logo?v=${profil.surum}`} alt="Partner Şirket Logosu" width={300} height={100} className={styles.partnerUyelikLogo} />
      <dl className={styles.partnerUyelikDetay}>{bilgiler.map(([etiket, deger]) => <div key={etiket}><dt>{etiket}</dt><dd>{deger}</dd></div>)}</dl>
      <div className={styles.actions}>
        {secili.uyelik_durumu !== "onaylandi" && <button type="button" className={`${styles.button} ${styles.primary}`} disabled={kaydediliyor || yukleniyor} onClick={() => void karariKaydet("onaylandi")}>{kaydediliyor ? "Kaydediliyor…" : "Üyeliği Onayla"}</button>}
        {secili.uyelik_durumu !== "reddedildi" && <button type="button" className={styles.button} disabled={kaydediliyor || yukleniyor} onClick={() => void karariKaydet("reddedildi")}>{kaydediliyor ? "Kaydediliyor…" : "Üyeliği Reddet"}</button>}
        <button type="button" className={styles.button} disabled={kaydediliyor} onClick={() => { setSecili(null); }}>Kapat</button>
      </div>

    </section>}
  </section>;
}
