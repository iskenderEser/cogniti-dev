"use client";

import { useEffect, useState } from "react";
import { partnerHakEdisListesiGecerli, type PartnerHakEdisListesi } from "@/lib/agora/hakedis";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import PartnerOdemeGunu from "./PartnerOdemeGunu";
import styles from "./partner-ozet.module.css";

const BASLIKLAR = [
  ["ID", ""], ["Eğitim Adı", ""], ["Sipariş Tarihi", ""],
  ["Satış Bedeli", "KDV hariç"], ["Cogniti Payı", "%15"],
  ["Hak Ediş", "KDV hariç"], ["KDV", "%20"],
  ["Ödenecek Tutar", "KDV dahil"], ["Planlanan Ödeme", ""], ["Ödenen Gün", ""],
];
const GENISLIKLER = [7, 15, 9, 10, 10, 10, 8, 11, 11, 9];
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const tarih = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul" });
const gun = (deger: string | null) => deger ? tarih.format(new Date(deger.length === 10 ? `${deger}T12:00:00+03:00` : deger)) : "—";
type Sonuc = { anahtar: string; veri: PartnerHakEdisListesi | null; hata: string };

export default function PartnerHakEdisTablosu({ partnerId, endpoint, anaBaslik = false, odemeDuzenlenebilir = false }: {
  partnerId: string; endpoint: string; anaBaslik?: boolean; odemeDuzenlenebilir?: boolean;
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
          const mesaj = data && typeof data === "object" && "hata" in data && typeof data.hata === "string" ? data.hata : "Hak edişler okunamadı.";
          throw new Error(mesaj);
        }
        if (!partnerHakEdisListesiGecerli(data, partnerId.toLowerCase(), sayfa)) throw new Error("Hak ediş bilgileri doğrulanamadı.");
        if (!controller.signal.aborted) setSonuc({ anahtar, veri: data, hata: "" });
      } catch (e) {
        if (!controller.signal.aborted) setSonuc({ anahtar, veri: null, hata: e instanceof Error ? e.message : "Hak edişler okunamadı." });
      }
    })();
    return () => controller.abort();
  }, [anahtar, endpoint, partnerId, sayfa]);

  const toplamSayfa = veri ? Math.max(1, Math.ceil(veri.toplam / veri.sayfa_boyutu)) : 1;
  return <section aria-label="Partner hak ediş kayıtları" aria-busy={yukleniyor}>
    <div className={styles.hakedisBaslik}>
      <Baslik>{anaBaslik ? "Hak Edişlerim" : "Hak Ediş Kayıtları"}</Baslik>
      <YenileButonu yenileniyor={yukleniyor} onYenile={() => setSurum(n => n + 1)} />
    </div>
    {hata && <p role="alert">{hata}</p>}
    <div className={styles.tabloAlani}><table className={styles.hakedisTablo} aria-label="Partner Hak Edişleri">
      <colgroup>{GENISLIKLER.map((genislik, i) => <col key={i} style={{ width: `${genislik}%` }} />)}</colgroup>
      <thead><tr>{BASLIKLAR.map(([baslik, aciklama], i) => <th key={baslik} scope="col" className={i >= 3 && i <= 7 ? styles.hakedisPara : undefined}>
        {baslik}{aciklama && <span className={styles.hakedisBaslikAciklama}>{aciklama}</span>}
      </th>)}</tr></thead>
      <tbody>
        {yukleniyor ? <tr><td colSpan={10} role="status">Hak edişler yükleniyor…</td></tr>
          : hata ? <tr><td colSpan={10}>Yenile düğmesiyle tekrar deneyebilirsiniz.</td></tr>
          : !veri?.kayitlar.length ? <tr><td colSpan={10}>{veri?.toplam ? "Bu sayfada kayıt bulunmuyor." : "Henüz hak ediş kaydı bulunmuyor."}</td></tr>
          : veri.kayitlar.map(r => <tr key={r.siparis_id}>
            <td className={styles.hakedisKimlik}>{r.partner_egitim_id}</td><td className={styles.hakedisEgitim}>{r.egitim_adi}</td><td className={styles.hakedisTarih}>{gun(r.siparis_tarihi)}</td>
            <td className={styles.hakedisPara}>{para.format(r.satin_alma_bedeli)}</td>
            <td className={styles.hakedisPara}>{para.format(r.hizmet_bedeli)}</td>
            <td className={styles.hakedisPara}>{para.format(r.hak_edis)}</td>
            <td className={styles.hakedisPara}>{para.format(r.kdv_tutari)}</td>
            <td className={`${styles.hakedisPara} ${styles.hakedisToplam}`}>{para.format(r.kdvli_odenecek_tutar)}</td>
            <td className={styles.hakedisTarih}>{odemeDuzenlenebilir ? <PartnerOdemeGunu key={`${r.siparis_id}:${r.planlanan_odeme_gunu ?? ""}`} endpoint={endpoint}
              siparisId={r.siparis_id} egitimId={r.partner_egitim_id} deger={r.planlanan_odeme_gunu} /> : gun(r.planlanan_odeme_gunu)}</td><td className={styles.hakedisTarih}>{gun(r.odenen_gun)}</td>
          </tr>)}
      </tbody>
    </table></div>
    {veri && <div className={styles.hakedisSayfalama}>
      <span>{veri.toplam.toLocaleString("tr-TR")} kayıt · Sayfa {sayfa} / {toplamSayfa}</span>
      <button type="button" disabled={sayfa <= 1} onClick={() => setSayfa(n => n - 1)}>Önceki</button>
      <button type="button" disabled={sayfa >= toplamSayfa || sayfa >= 100000} onClick={() => setSayfa(n => n + 1)}>Sonraki</button>
    </div>}
  </section>;
}
