"use client";

import { Fragment, useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { SATIN_ALIM_AYLARI, satinAlimAyi } from "@/lib/satinAlma/aylikSiparisler";
import BannerProformaAlani, { BANNER_ALIM_SUTUNLARI, BANNER_PROFORMA_SUTUNLARI, BANNER_SAYISAL_SUTUNLAR } from "./BannerProformaAlani";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import tablo from "./esnek-proforma.module.css";

const basliklar = [...BANNER_ALIM_SUTUNLARI, ...BANNER_PROFORMA_SUTUNLARI];
const tarih = (deger: string) => new Date(deger).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });

type Satir = {
  tuketim_id: string; baslangic: string; hafta_sayisi: number;
  haftalik_token: number; miktar: number; created_at: string; islem_turu: "banner_yayin" | "banner_iptal";
};
type Liste = { firma_id: string; ay: string; sayfa: number; toplam: number; sayfa_boyutu: number; satirlar: Satir[] };

export default function BannerAlimlari({ firmaId, basari, hata }: { firmaId: string; basari: (mesaj: string) => void; hata?: (mesaj: string) => void }) {
  const [ay, setAy] = useState(satinAlimAyi);
  const [sayfa, setSayfa] = useState(0);
  const [deneme, setDeneme] = useState(0);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri?: Liste; hata?: string } | null>(null);
  const anahtar = [firmaId, ay, sayfa, deneme].join(":");
  const guncel = sonuc?.anahtar === anahtar ? sonuc : null;
  const veri = guncel?.veri;

  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      try {
        const q = new URLSearchParams({ ay, sayfa: String(sayfa) });
        const yanit = await fetch(`/admin/api/firmalar/${firmaId}/banner-alimlari?${q}`, {
          cache: "no-store", signal: kontrol.signal,
        });
        const veri: Liste | null = await yanit.json();
        if (!yanit.ok || !veri || veri.firma_id !== firmaId || veri.ay !== ay || veri.sayfa !== sayfa
          || !Array.isArray(veri.satirlar)) throw Error("Banner alımları alınamadı.");
        if (!kontrol.signal.aborted) setSonuc({ anahtar, veri });
      } catch {
        if (!kontrol.signal.aborted) setSonuc({ anahtar, hata: "Banner alımları alınamadı." });
      }
    }
    void oku();
    return () => kontrol.abort();
  }, [anahtar, ay, firmaId, sayfa]);

  return <section className={styles.card} aria-label="Gerçekleşen Banner Alımları">
    <div className={styles.cardHeader}><div><h2><ShoppingBag />Gerçekleşen Banner Alımları</h2><p>Her ayın alımları sonraki ayın 1’inde faturalandırılır.</p></div></div>
    <div className={styles.cardBody}>
      <SadeKapsulFiltre etiket="Satın alım ayları" deger={ay}
        onDegistir={yeniAy => { setAy(yeniAy); setSayfa(0); }}
        secenekler={SATIN_ALIM_AYLARI.map((etiket, i) => ({ deger: ay.slice(0, 4) + "-" + String(i + 1).padStart(2, "0"), etiket }))} />
    </div>
    {!guncel && <p role="status" className={styles.cardBody}>Banner alımları yükleniyor…</p>}
    {guncel?.hata && <div role="alert" className={styles.cardBody}><p>{guncel.hata}</p>
      <Button variant="outline" onClick={() => setDeneme(n => n + 1)}>Yeniden Dene</Button></div>}
    {veri && <>
      <BannerProformaAlani key={ay} firmaId={firmaId} ay={ay} basari={basari} hata={hata} alimSutunSayisi={BANNER_ALIM_SUTUNLARI.length} tablo={(proformaSatiri, proformaHucreleri) => (
      <div className={styles.tableWrap}>
        <MobilUyumluTablo basliklar={basliklar} className={tablo.tablo} aria-label="Banner alımları">
          <thead><tr>{basliklar.map(b => <th key={b} scope="col" className={BANNER_SAYISAL_SUTUNLAR.has(b) ? tablo.rakam : undefined}>{b}</th>)}</tr></thead>
          <tbody>{veri.satirlar.map((s, i) => <Fragment key={s.tuketim_id}><tr>
            <td>{tarih(s.created_at)}</td>
            <td>{tarih(s.baslangic)}</td><td>{s.hafta_sayisi} hafta</td>
            <td className={tablo.rakam}>{s.haftalik_token.toLocaleString("tr-TR")}</td>
            <td className={tablo.rakam}>{s.miktar.toLocaleString("tr-TR")}</td>
            <td>{s.islem_turu === "banner_iptal" ? "İptal Bedeli" : "Banner Alımı"}</td>
            {i === 0 && proformaHucreleri ? proformaHucreleri : <td colSpan={BANNER_PROFORMA_SUTUNLARI.length} />}
          </tr>{i === 0 && proformaHucreleri && proformaSatiri}</Fragment>)}
          {!veri.satirlar.length && <tr><td colSpan={basliklar.length}>Bu ay gerçekleşen banner alımı bulunmuyor.</td></tr>}
          {!proformaHucreleri && proformaSatiri}</tbody>
        </MobilUyumluTablo>
      </div>)} />
      {veri.toplam > veri.sayfa_boyutu && <div className={styles.cardBody + " flex items-center justify-end gap-3"}>
        <Button variant="outline" disabled={sayfa === 0} onClick={() => setSayfa(n => n - 1)}>Önceki</Button>
        <span>Sayfa {sayfa + 1} / {Math.ceil(veri.toplam / veri.sayfa_boyutu)}</span>
        <Button variant="outline" disabled={(sayfa + 1) * veri.sayfa_boyutu >= veri.toplam} onClick={() => setSayfa(n => n + 1)}>Sonraki</Button>
      </div>}
    </>}
    <p className={tablo.bilgi}>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
  </section>;
}
