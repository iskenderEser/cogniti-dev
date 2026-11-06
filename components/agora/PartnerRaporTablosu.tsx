"use client";

import { useEffect, useState } from "react";
import { partnerRaporListesiGecerli, type PartnerRaporListesi } from "@/lib/agora/rapor";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import styles from "./partner-ozet.module.css";

const BASLIKLAR = [
  ["ID", ""], ["Eğitim Adı", ""], ["Satış Fiyatı", "Güncel · KDV hariç"],
  ["Satılan Adet", ""], ["Toplam Satış", "Gerçekleşen · KDV hariç"],
  ["Beğeni Sayısı", ""], ["Favori Sayısı", ""],
];
const GENISLIKLER = [10, 25, 15, 10, 18, 11, 11];
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const adet = new Intl.NumberFormat("tr-TR");
type Sonuc = { anahtar: string; veri: PartnerRaporListesi | null; hata: string };

export default function PartnerRaporTablosu({ partnerId, endpoint, anaBaslik = false }: {
  partnerId: string; endpoint: string; anaBaslik?: boolean;
}) {
  const [sayfa, setSayfa] = useState(1);
  const [surum, setSurum] = useState(0);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const anahtar = `${partnerId}:${endpoint}:${sayfa}:${surum}`;
  const yukleniyor = sonuc?.anahtar !== anahtar;
  const veri = yukleniyor ? null : sonuc?.veri;
  const hata = yukleniyor ? "" : sonuc?.hata;
  const Baslik = anaBaslik ? "h1" : "h2";

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const yanit = await fetch(`${endpoint}?sayfa=${sayfa}`, { cache: "no-store", signal: controller.signal });
        const data: unknown = await yanit.json();
        if (!yanit.ok) {
          const mesaj = data && typeof data === "object" && "hata" in data && typeof data.hata === "string" ? data.hata : "Raporlar okunamadı.";
          throw new Error(mesaj);
        }
        if (!partnerRaporListesiGecerli(data, partnerId.toLowerCase(), sayfa)) throw new Error("Rapor bilgileri doğrulanamadı.");
        if (!controller.signal.aborted) setSonuc({ anahtar, veri: data, hata: "" });
      } catch (e) {
        if (!controller.signal.aborted) setSonuc({ anahtar, veri: null, hata: e instanceof Error ? e.message : "Raporlar okunamadı." });
      }
    })();
    return () => controller.abort();
  }, [anahtar, endpoint, partnerId, sayfa]);

  const toplamSayfa = veri ? Math.max(1, Math.ceil(veri.toplam / veri.sayfa_boyutu)) : 1;
  return <section aria-label="Partner eğitim raporları" aria-busy={yukleniyor}>
    <div className={styles.hakedisBaslik}>
      <Baslik>{anaBaslik ? "Raporlarım" : "Eğitim Raporları"}</Baslik>
      <YenileButonu yenileniyor={yukleniyor} onYenile={() => setSurum(n => n + 1)} />
    </div>
    <p className={styles.raporAciklama}>Satışlar tüm zamanları kapsar; beğeni ve favoriler güncel sayılardır.</p>
    {hata && <p role="alert">{hata}</p>}
    <div className={styles.tabloAlani}><table className={`${styles.hakedisTablo} ${styles.raporTablo}`} aria-label="Partner Eğitim Raporları">
      <colgroup>{GENISLIKLER.map((genislik, i) => <col key={i} style={{ width: `${genislik}%` }} />)}</colgroup>
      <thead><tr>{BASLIKLAR.map(([baslik, aciklama], i) => <th key={baslik} scope="col" className={i >= 3 && i <= 7 ? styles.hakedisPara : undefined}>
        {baslik}{aciklama && <span className={styles.hakedisBaslikAciklama}>{aciklama}</span>}
      </th>)}</tr></thead>
      <tbody>
        {yukleniyor ? <tr><td colSpan={7} role="status">Raporlar yükleniyor…</td></tr>
          : hata ? <tr><td colSpan={7}>Yenile düğmesiyle tekrar deneyebilirsiniz.</td></tr>
          : !veri?.kayitlar.length ? <tr><td colSpan={7}>{veri?.toplam ? "Bu sayfada kayıt bulunmuyor." : "Henüz raporlanacak eğitim bulunmuyor."}</td></tr>
          : veri.kayitlar.map(r => <tr key={r.egitim_id}>
            <td className={styles.hakedisKimlik}>{r.partner_egitim_id}</td>
            <td className={styles.hakedisEgitim}>{r.egitim_adi}</td>
            <td className={styles.hakedisPara}>{r.satis_fiyati === null ? "—" : para.format(r.satis_fiyati)}</td>
            <td>{adet.format(r.satilan_adet)}</td>
            <td className={`${styles.hakedisPara} ${styles.hakedisToplam}`}>{para.format(r.toplam_satis)}</td>
            <td>{adet.format(r.begeni_sayisi)}</td><td>{adet.format(r.favori_sayisi)}</td>
          </tr>)}
      </tbody>
    </table></div>
    {veri && <div className={styles.hakedisSayfalama}>
      <span>{veri.toplam.toLocaleString("tr-TR")} eğitim · Sayfa {sayfa} / {toplamSayfa}</span>
      <button type="button" disabled={sayfa <= 1} onClick={() => setSayfa(n => n - 1)}>Önceki</button>
      <button type="button" disabled={sayfa >= toplamSayfa || sayfa >= 100000} onClick={() => setSayfa(n => n + 1)}>Sonraki</button>
    </div>}
  </section>;
}
