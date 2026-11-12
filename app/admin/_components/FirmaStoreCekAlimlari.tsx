"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import CekProforma, { type Taraf } from "./CekProforma";
import { satinAlimAyi } from "@/lib/satinAlma/aylikSiparisler";
import { ROL_ADLARI } from "@/lib/utils/roller";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import local from "./esnek-proforma.module.css";

type Liste = {
  cekler: { urun_id: string; ad: string }[];
  siparisler: { id: string; tarih: string; ad: string; rol: string; adetler: Record<string, number>; puan: number; tl: number | null }[];
  toplam_tl: number | null;
};
type MarkaKalemi = { urun_id: string; ad: string; adet: number; tl: number };
type Belge = Liste & { belge_no: string; duzenleyen: Taraf; alici: Taraf; marka_kalemleri?: MarkaKalemi[] };
type Sonuc = { liste: Liste | null; belge: Belge | null; onay_anahtari: string | null; onay: { ad: string; tarih: string } | null };

const donemler = [
  { ay: "01", etiket: "Ocak–Mart" }, { ay: "04", etiket: "Nisan–Haziran" },
  { ay: "07", etiket: "Temmuz–Eylül" }, { ay: "10", etiket: "Ekim–Aralık" },
];
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const tarih = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" });

function varsayilanDonem() {
  const [yil, ay] = satinAlimAyi().split("-").map(Number);
  const oncekiCeyrek = Math.floor((ay - 1) / 3) - 1;
  return oncekiCeyrek < 0 ? `${yil - 1}-10-01` : `${yil}-${donemler[oncekiCeyrek].ay}-01`;
}

export default function FirmaStoreCekAlimlari({ firmaId, sadeceOnayli = false }: { firmaId: string; sadeceOnayli?: boolean }) {
  const [donem, setDonem] = useState(varsayilanDonem);
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri: Sonuc | null }>();
  const yol = `/admin/api/firmalar/${firmaId}/firmastore-proformalar?${new URLSearchParams({ donem, onayli: sadeceOnayli ? "1" : "0" })}`;
  const anahtar = `${yol}:${yenileme}`;
  const guncel = sonuc?.anahtar === anahtar ? sonuc : null;
  const yil = Number(donem.slice(0, 4));
  const guncelYil = Number(satinAlimAyi().slice(0, 4));
  const ilkYil = 2025;
  const donemAdi = `${donemler.find(d => d.ay === donem.slice(5, 7))?.etiket} ${yil}`;
  const baslik = sadeceOnayli ? "FirmaStore Çekleri · Onaylı Proforma Faturalar" : "FirmaStore Çekleri";

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

  const yenile = () => setYenileme(n => n + 1);
  const veri = guncel?.veri;
  return <section className={styles.card} aria-label={baslik}>
    <div className={styles.cardHeader}><h2>{baslik}</h2></div>
    <div className={`${styles.cardBody} flex flex-wrap items-center gap-3`}>
      <label>Yıl{" "}
        <select value={yil} onChange={e => setDonem(`${e.target.value}${donem.slice(4)}`)}>
          {Array.from({ length: guncelYil - ilkYil + 1 }, (_, i) => guncelYil - i).map(y => <option key={y}>{y}</option>)}
        </select>
      </label>
      <SadeKapsulFiltre etiket="Kazanım dönemi" deger={donem} onDegistir={setDonem}
        secenekler={donemler.map(({ ay, etiket }) => ({ etiket, deger: `${yil}-${ay}-01` }))} />
      <Button variant="outline" onClick={yenile}>Yenile</Button>
    </div>
    {!guncel && <p className={styles.cardBody} role="status">Kayıtlar yükleniyor…</p>}
    {guncel && !veri && <p className={styles.cardBody} role="alert">FirmaStore çek alımları alınamadı.</p>}
    {veri?.liste && <SiparisTablosu liste={veri.liste} />}
    {veri?.belge && <CekProforma key={yol} veri={veri} belge={veri.belge} yol={yol} donemAdi={donemAdi} baslik="FirmaStore Çekleri" yenile={yenile}>
      <ProformaKalemleri belge={veri.belge} />
    </CekProforma>}
    {veri && !veri.belge && <div className={styles.cardBody}>
      {sadeceOnayli ? <p>Bu dönem için onaylı proforma bulunmuyor.</p>
        : veri.liste?.toplam_tl === null ? <p>Bazı siparişlerin TL tutarı kayıtlı olmadığı için proforma hazırlanamadı.</p>
        : <p className="rounded-md bg-[#eaf5ff] px-3 py-2 text-xs leading-relaxed text-[#17456b]">
          Proforma, sipariş dönemi kapandıktan ve son siparişin iptal süresi dolduktan sonra açılır.
        </p>}
    </div>}
  </section>;
}

function SiparisTablosu({ liste }: { liste: Liste }) {
  const basliklar = ["Talep Tarihi", "Ad Soyad", "Unvan", ...liste.cekler.map(c => c.ad), "Kullanılan Puan", "TL"];
  return <div className={styles.tableWrap}>
    <MobilUyumluTablo basliklar={basliklar} className={local.tablo} aria-label="FirmaStore çek siparişleri">
      <thead><tr>{basliklar.map((b, i) => <th key={i} scope="col">{b}</th>)}</tr></thead>
      <tbody>
        {liste.siparisler.map(s => <tr key={s.id}>
          <td>{tarih.format(new Date(s.tarih))}</td><td>{s.ad || "—"}</td><td>{(ROL_ADLARI[s.rol] ?? s.rol) || "—"}</td>
          {liste.cekler.map(c => <td key={c.urun_id}>{s.adetler[c.urun_id] ?? "—"}</td>)}
          <td>{s.puan.toLocaleString("tr-TR")}</td><td>{s.tl === null ? "Kayıt yok" : para.format(s.tl)}</td>
        </tr>)}
        {liste.siparisler.length === 0 && <tr><td colSpan={basliklar.length}>Bu dönemde kesinleşmiş sipariş bulunmuyor.</td></tr>}
      </tbody>
      <tfoot className={local.toplamSatiri}><tr><th scope="row" colSpan={basliklar.length - 1}>Toplam TL</th>
        <td>{liste.toplam_tl === null ? "Hesaplanamadı" : para.format(liste.toplam_tl)}</td></tr></tfoot>
    </MobilUyumluTablo>
  </div>;
}

function ProformaKalemleri({ belge }: { belge: Belge }) {
  const basliklar = ["Çek Markası", "Toplam Adet", "Toplam Tutar"];
  const kalemler = belge.marka_kalemleri ?? eskiBelgeKalemleri(belge);
  return <div className={styles.tableWrap}>
    <MobilUyumluTablo basliklar={basliklar} className={local.tablo} aria-label="Proforma çek kalemleri">
      <thead><tr>{basliklar.map(b => <th key={b} scope="col">{b}</th>)}</tr></thead>
      <tbody>
        {kalemler?.map(k => <tr key={k.urun_id}>
          <td>{k.ad}</td><td>{k.adet.toLocaleString("tr-TR")}</td><td>{para.format(k.tl)}</td>
        </tr>)}
        {!kalemler && <tr><td colSpan={3}>Bu belgede marka bazında tutarlar kayıtlı değil.</td></tr>}
      </tbody>
      <tfoot className={local.toplamSatiri}><tr><th scope="row" colSpan={2}>Toplam TL</th>
        <td>{belge.toplam_tl === null ? "—" : para.format(belge.toplam_tl)}</td></tr></tfoot>
    </MobilUyumluTablo>
  </div>;
}

function eskiBelgeKalemleri(belge: Belge): MarkaKalemi[] | null {
  const toplamlar = new Map<string, { adet: number; kurus: number }>();
  for (const siparis of belge.siparisler) {
    const adetler = Object.entries(siparis.adetler);
    if (adetler.length !== 1 || siparis.tl === null) return null;
    const [urunId, adet] = adetler[0];
    const toplam = toplamlar.get(urunId) ?? { adet: 0, kurus: 0 };
    toplamlar.set(urunId, { adet: toplam.adet + adet, kurus: toplam.kurus + Math.round(siparis.tl * 100) });
  }
  return belge.cekler.flatMap(cek => {
    const toplam = toplamlar.get(cek.urun_id);
    return toplam ? [{ ...cek, adet: toplam.adet, tl: toplam.kurus / 100 }] : [];
  });
}
