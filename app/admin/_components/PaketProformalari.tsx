"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { SIPARIS_PAKET_ADLARI, siparisListesiGecerli, type SiparisKaydi, type SiparisListesi } from "@/lib/satinAlma/siparisListesi";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import local from "./firma-faturalari.module.css";

const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const tarih = (s: string) => new Date(s).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" });
const donem = (s: string) => new Date(s).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", month: "long", year: "numeric" });
const basliklar = ["Proforma No", "Tarih", "Dönem", "Tür", "Genel Tutar", "Durum", "İşlem"];
const referansOnekleri = { esnek: "PF-E", abonelik_baslangic: "PF-AB", abonelik_devam: "PF-AD", kko: "PF-K" };

export default function PaketProformalari({ firmaId, paket }: { firmaId: string; paket: "esnek" | "abonelik" }) {
  const [sayfa, setSayfa] = useState(0);
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri?: SiparisListesi; hata?: string } | null>(null);
  const sorgu = new URLSearchParams({ paket, sayfa: String(sayfa) });
  const anahtar = `${firmaId}:${sorgu}:${yenileme}`;
  const guncel = sonuc?.anahtar === anahtar ? sonuc : null;
  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      try {
        const yanit = await fetch(`/admin/api/firmalar/${firmaId}/satin-alinan-paketler?paket=${paket}&sayfa=${sayfa}`, { cache: "no-store", signal: kontrol.signal });
        const veri: unknown = await yanit.json();
        if (!yanit.ok) throw new Error("Proforma bilgileri alınamadı. Yeniden deneyin.");
        if (!siparisListesiGecerli(veri) || veri.firma_id !== firmaId || veri.sayfa !== sayfa
          || veri.siparisler.some(s => paket === "esnek" ? s.paket_turu !== "esnek" : !s.paket_turu.startsWith("abonelik_"))) {
          throw new Error("Proforma bilgileri doğrulanamadı.");
        }
        if (!kontrol.signal.aborted) setSonuc({ anahtar, veri });
      } catch (hata) {
        if (!kontrol.signal.aborted) setSonuc({ anahtar, hata: hata instanceof Error ? hata.message : "Proforma bilgileri alınamadı." });
      }
    }
    void oku();
    return () => kontrol.abort();
  }, [anahtar, firmaId, paket, sayfa]);
  useEffect(() => {
    const yenile = () => setYenileme(v => v + 1);
    window.addEventListener("focus", yenile);
    return () => window.removeEventListener("focus", yenile);
  }, []);
  const veri = guncel?.veri;
  return <section className={styles.card} aria-label={`${paket === "esnek" ? "Esnek" : "Abonelik"} · Proforma Faturalar`}>
    <div className={styles.cardHeader}>
      <div><h2>{paket === "esnek" ? "Esnek" : "Abonelik"} · Proforma Faturalar</h2><p>Satın alma kayıtlarınıza ait faturalama öncesi bilgiler.</p></div>
      <Button type="button" variant="outline" disabled={!guncel} onClick={() => setYenileme(v => v + 1)}>Yenile</Button>
    </div>
    {!guncel ? <p role="status" className={styles.cardBody}>Proforma bilgileri yükleniyor…</p>
      : guncel.hata ? <div role="alert" className={styles.cardBody}><p>{guncel.hata}</p><Button type="button" variant="outline" onClick={() => setYenileme(v => v + 1)}>Yeniden Dene</Button></div>
      : veri && <>
        <div className={styles.tableWrap}><MobilUyumluTablo basliklar={basliklar} className={`${local.tablo} ${local.paketListe}`} aria-label="Paket proforma listesi">
          <thead><tr>{basliklar.map(b => <th key={b}>{b}</th>)}</tr></thead>
          <tbody>{veri.siparisler.map(s => <PaketProformaSatiri key={`${s.paket_turu}:${s.kayit_id}`} siparis={s} />)}
            {!veri.siparisler.length && <tr><td colSpan={7}>Henüz proformaya yansıyacak satın alma kaydı bulunmuyor.</td></tr>}
          </tbody>
        </MobilUyumluTablo></div>
        {veri.toplam > veri.sayfa_boyutu && <div className={`${styles.cardBody} flex items-center justify-end gap-3`}>
          <Button type="button" variant="outline" disabled={sayfa === 0} onClick={() => setSayfa(v => v - 1)}>Önceki</Button>
          <span>Sayfa {sayfa + 1} / {Math.ceil(veri.toplam / veri.sayfa_boyutu)}</span>
          <Button type="button" variant="outline" disabled={(sayfa + 1) * veri.sayfa_boyutu >= veri.toplam} onClick={() => setSayfa(v => v + 1)}>Sonraki</Button>
        </div>}
      </>}
  </section>;
}

function PaketProformaSatiri({ siparis: s }: { siparis: SiparisKaydi }) {
  const [acik, setAcik] = useState(false);
  const detayId = useId();
  const tur = SIPARIS_PAKET_ADLARI[s.paket_turu];
  const kalemler = ["Kalem", "Fatura Kalemi", "Miktar", "Birim", "Birim Bedel (KDV Hariç)", "Tutar (KDV Hariç)"];
  return <>
    <tr>
      <td className={local.referans}>{referansOnekleri[s.paket_turu]}-{s.kayit_id}</td>
      <td>{tarih(s.siparis_tarihi)}</td><td>{donem(s.siparis_tarihi)}</td><td>{tur}</td>
      <td>{para(s.toplam_tutar + s.kdv)}</td><td>Faturalama Öncesi</td>
      <td><button type="button" className={local.listeButonu} aria-expanded={acik} aria-controls={detayId} onClick={() => setAcik(v => !v)}>Detay</button></td>
    </tr>
    {acik && <tr className={local.detaySatiri}><td colSpan={7}><div id={detayId} className={styles.cardBody}>
      <p>Sipariş Veren: {s.satin_alan_ad_soyad || "—"} · {s.bakiye_turu === "kisisel" ? "Kişisel Token Hesabı" : "Firma Token Hesabı"}</p>
      <MobilUyumluTablo basliklar={kalemler} className={local.tablo} aria-label="Paket proforma kalemleri">
        <thead><tr>{kalemler.map(k => <th key={k}>{k}</th>)}</tr></thead>
        <tbody><tr><td>Paket Alımları</td><td>{tur} Bedeli</td><td>{s.token_adedi.toLocaleString("tr-TR")}</td><td>Token</td><td>{para(s.birim_fiyat)}</td><td>{para(s.toplam_tutar)}</td></tr></tbody>
        <tfoot><tr><th colSpan={5}>Ara Toplam</th><td>{para(s.toplam_tutar)}</td></tr><tr><th colSpan={5}>KDV (%20)</th><td>{para(s.kdv)}</td></tr><tr><th colSpan={5}>Genel Toplam</th><td>{para(s.toplam_tutar + s.kdv)}</td></tr></tfoot>
      </MobilUyumluTablo>
    </div></td></tr>}
  </>;
}
