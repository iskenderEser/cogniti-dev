"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import { satinAlimAyi } from "@/lib/satinAlma/aylikSiparisler";
import CekProforma, { type Taraf } from "./CekProforma";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import local from "./esnek-proforma.module.css";

type Talep = { id: string; tarih: string; tm_onayi: string; eczane: string; urun: string; tl: number | null };
type Liste = { talepler: Talep[]; adet: number; toplam_tl: number | null };
type Belge = Liste & { belge_no: string; duzenleyen: Taraf; alici: Taraf };
type Sonuc = {
  liste: Liste | null;
  belge: Belge | null;
  onay_anahtari: string | null;
  onay: { ad: string; tarih: string } | null;
};

const donemler = ["Ocak–Şubat", "Mart–Nisan", "Mayıs–Haziran", "Temmuz–Ağustos", "Eylül–Ekim", "Kasım–Aralık"];
const baslik = "Eczane Çekleri";
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const tarih = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeZone: "Europe/Istanbul" });

function varsayilanDonem() {
  const [yil, ay] = satinAlimAyi().split("-").map(Number);
  const onceki = Math.floor((ay - 1) / 2);
  return onceki === 0 ? `${yil - 1}-P6` : `${yil}-P${onceki}`;
}

export default function EczaneCekAlimlari({ firmaId, sadeceOnayli = false }: { firmaId: string; sadeceOnayli?: boolean }) {
  const [donem, setDonem] = useState(varsayilanDonem);
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri: Sonuc | null }>();
  const yil = Number(donem.slice(0, 4));
  const guncelYil = Number(satinAlimAyi().slice(0, 4));
  const donemAdi = `${donemler[Number(donem.slice(-1)) - 1]} ${yil}`;
  const sayfaBasligi = sadeceOnayli ? `${baslik} · Onaylı Proforma Faturalar` : baslik;
  const yol = `/admin/api/firmalar/${firmaId}/eczane-cek-proformalar?${new URLSearchParams({ donem, onayli: sadeceOnayli ? "1" : "0" })}`;
  const anahtar = `${yol}:${yenileme}`;
  const guncel = sonuc?.anahtar === anahtar ? sonuc : null;
  const veri = guncel?.veri;
  const yenile = () => setYenileme(n => n + 1);

  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      try {
        const yanit = await fetch(yol, { cache: "no-store", signal: kontrol.signal });
        if (!yanit.ok) throw new Error();
        const veri: Sonuc = await yanit.json();
        if (!kontrol.signal.aborted) setSonuc({ anahtar, veri });
      } catch {
        if (!kontrol.signal.aborted) setSonuc({ anahtar, veri: null });
      }
    }
    void oku();
    return () => kontrol.abort();
  }, [anahtar, yol]);

  const onayliTalepler = veri?.onay && veri.belge ? new Set(veri.belge.talepler.map(t => t.id)) : null;

  return <section className={styles.card} aria-label={sayfaBasligi}>
    <div className={styles.cardHeader}><h2>{sayfaBasligi}</h2></div>
    <div className={`${styles.cardBody} flex flex-wrap items-center gap-3`}>
      <label>Yıl{" "}
        <select value={yil} onChange={e => setDonem(`${e.target.value}${donem.slice(4)}`)}>
          {Array.from({ length: Math.max(1, guncelYil - 2025 + 1) }, (_, i) => guncelYil - i)
            .map(y => <option key={y}>{y}</option>)}
        </select>
      </label>
      <SadeKapsulFiltre etiket="Kazanım dönemi" deger={donem} onDegistir={setDonem}
        secenekler={donemler.map((etiket, i) => ({ etiket, deger: `${yil}-P${i + 1}` }))} />
      <Button variant="outline" onClick={yenile}>Yenile</Button>
    </div>
    {!guncel && <p className={styles.cardBody} role="status">Kayıtlar yükleniyor…</p>}
    {guncel && !veri && <p className={styles.cardBody} role="alert">Eczane çekleri alınamadı.</p>}
    {veri?.liste && <TalepTablosu liste={veri.liste} onayliTalepler={onayliTalepler} />}
    {veri?.liste?.toplam_tl === null && <p className={styles.cardBody}>Bazı taleplerin TL tutarı eksik veya geçersiz.</p>}
    {sadeceOnayli && veri && !veri.belge && <p className={styles.cardBody}>Bu dönem için onaylı proforma bulunmuyor.</p>}
    {veri?.belge && <CekProforma key={yol} veri={veri} belge={veri.belge} yol={yol}
      donemAdi={donemAdi} baslik={baslik} yenile={yenile}>
      <div className={styles.tableWrap}>
        <MobilUyumluTablo basliklar={["Kalem", "Adet", "Toplam Tutar"]} className={local.tablo} aria-label="Proforma kalemleri">
          <thead><tr><th scope="col">Kalem</th><th scope="col">Adet</th><th scope="col">Toplam Tutar</th></tr></thead>
          <tbody><tr><td>Eczane Hediye Çeki</td><td>{veri.belge.adet.toLocaleString("tr-TR")}</td>
            <td>{tutar(veri.belge.toplam_tl)}</td></tr></tbody>
          <tfoot className={local.toplamSatiri}><tr><th scope="row" colSpan={2}>Toplam TL</th>
            <td>{tutar(veri.belge.toplam_tl)}</td></tr></tfoot>
        </MobilUyumluTablo>
      </div>
    </CekProforma>}
  </section>;
}

function tutar(tl: number | null) {
  return tl === null ? "—" : para.format(tl);
}

function TalepTablosu({ liste, onayliTalepler }: { liste: Liste; onayliTalepler: Set<string> | null }) {
  const basliklar = ["Talep Tarihi", "TM Onay Tarihi", "Eczane", "Ürün", "Çek Tutarı"];
  return <div className={styles.tableWrap}>
    <MobilUyumluTablo basliklar={basliklar} className={local.tablo} aria-label="TM onaylı eczane çekleri">
      <thead><tr>{basliklar.map(b => <th key={b} scope="col">{b}</th>)}</tr></thead>
      <tbody>
        {liste.talepler.map(t => <tr key={t.id}>
          <td>{tarih.format(new Date(t.tarih))}</td><td>{tarih.format(new Date(t.tm_onayi))}</td>
          <td>{t.eczane}</td><td>{t.urun}</td>
          <td>{tutar(t.tl)}{onayliTalepler && !onayliTalepler.has(t.id) && <small className="block">Onaylı proformaya dahil değil</small>}</td>
        </tr>)}
        {liste.talepler.length === 0 && <tr><td colSpan={basliklar.length}>Bu dönemde TM onaylı çek talebi bulunmuyor.</td></tr>}
      </tbody>
      <tfoot className={local.toplamSatiri}><tr><th scope="row" colSpan={basliklar.length - 1}>Toplam TL</th>
        <td>{tutar(liste.toplam_tl)}</td></tr></tfoot>
    </MobilUyumluTablo>
  </div>;
}
