"use client";

import { useEffect, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIPARIS_PAKET_ADLARI, siparisListesiGecerli, type SiparisListesi } from "@/lib/satinAlma/siparisListesi";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import local from "./token-yonetimi.module.css";

const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const tarih = (s: string) => new Date(s).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" });
const donem = (s: string) => new Date(s).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", month: "long", year: "numeric" });
const tutarBasliklari = ["Birim Fiyat", "Toplam Tutar", "KDV", "Genel Tutar"];
const siparisBasliklari = ["Sipariş Tarihi", "Sipariş Veren", "Token Hesabı", "Paket", "Token Adedi", ...tutarBasliklari];
const kkoBasliklari = ["Dönem", "Token Hesabı", "Tüketilen Token", ...tutarBasliklari];
const sayfaBasliklari = { esnek: "Esnek Paket Alımları", abonelik: "Abonelik Paket Alımları", kko: "Kullandığın Kadar Öde" };
export default function SatinAlinanPaketler({ firmaId, paket }: { firmaId: string; paket?: keyof typeof sayfaBasliklari }) {
  const kko = paket === "kko";
  const baslik = paket ? sayfaBasliklari[paket] : "Paket Alımları";
  const basliklar = kko ? kkoBasliklari : siparisBasliklari;
  const aramaEtiketi = kko ? "Token hesabı ara" : "Sipariş veren veya paket ara";
  const [sayfa, setSayfa] = useState(0);
  const [aramaMetni, setAramaMetni] = useState("");
  const [arama, setArama] = useState("");
  const [deneme, setDeneme] = useState(0);
  const [veri, setVeri] = useState<SiparisListesi | null>(null);
  const [hata, setHata] = useState("");
  const [kkoBirimFiyat, setKkoBirimFiyat] = useState<number | null>(null);
  useEffect(() => {
    if (!kko) return;
    const kontrol = new AbortController();
    async function fiyatOku() {
      try {
        const yanit = await fetch("/fiyatlar/api", { cache: "no-store", signal: kontrol.signal });
        if (!yanit.ok) return;
        const { kko: tarife } = await yanit.json();
        const birim = tarife?.birim;
        if (!kontrol.signal.aborted && typeof birim === "number" && Number.isFinite(birim) && birim > 0) {
          setKkoBirimFiyat(birim);
        }
      } catch { /* Tarife okunamazsa açıklama fiyat belirtmeden gösterilir. */ }
    }
    void fiyatOku();
    return () => kontrol.abort();
  }, [kko]);
  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      setVeri(null); setHata("");
      try {
        const sorgu = new URLSearchParams({ sayfa: String(sayfa), q: arama });
        if (paket) sorgu.set("paket", paket);
        const r = await fetch(`/admin/api/firmalar/${firmaId}/satin-alinan-paketler?${sorgu}`, { cache: "no-store", signal: kontrol.signal });
        const d = await r.json();
        if (!r.ok) throw new Error(typeof d.hata === "string" ? d.hata : "Satın alma kayıtları alınamadı.");
        if (!siparisListesiGecerli(d) || d.firma_id !== firmaId || d.sayfa !== sayfa) throw new Error("Satın alma kayıtları doğrulanamadı.");
        if (!kontrol.signal.aborted) setVeri(d);
      } catch (e) { if (!kontrol.signal.aborted) setHata(e instanceof Error ? e.message : "Satın alma kayıtları alınamadı."); }
    }
    void oku(); return () => kontrol.abort();
  }, [firmaId, sayfa, arama, deneme, paket]);
  return <div className={styles.stack} aria-label={baslik}>
    <section className={styles.card} aria-labelledby="satin-alinan-paketler-baslik">
      <div className={styles.cardHeader}>
        <div><h2 id="satin-alinan-paketler-baslik"><ShoppingBag />{baslik}</h2><p>{kko
          ? `Her ayın 1'inde kullanılan tokenlar ${kkoBirimFiyat === null ? "tarifedeki birim fiyattan" : `${para(kkoBirimFiyat)}'den`} işlem görür.`
          : paket === "esnek" ? "Satın alma sonrası faturalanır. 31 Aralık'a kadar kullanılabilir."
          : paket === "abonelik" ? "Her ayın 1'inde seçilen paket tutarı kadar faturalanır."
          : "Firmanın satın alma geçmişi"}</p></div>
        <form className={local.siparisArama} role="search" onSubmit={e => {
          e.preventDefault();
          setArama(aramaMetni.trim());
          setSayfa(0);
          setDeneme(v => v + 1);
        }}>
          <input type="search" className={styles.input} aria-label={aramaEtiketi} placeholder={`${aramaEtiketi}…`} maxLength={80} value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} />
          <button type="submit" className={`${styles.button} ${styles.primary}`}><Search />Ara</button>
        </form>
      </div>
      {hata ? <div role="alert" className={styles.cardBody}><p>{hata}</p><Button variant="outline" onClick={() => setDeneme(v => v + 1)}>Yeniden Dene</Button></div>
        : !veri ? <p role="status" className={styles.cardBody}>Satın alma kayıtları yükleniyor…</p>
        : <>
          <div className={styles.tableWrap}>
            <MobilUyumluTablo basliklar={basliklar} className={local.table} aria-label={kko ? "KKÖ kullanım bedelleri" : "Paket alımları listesi"}>
              <thead><tr>{basliklar.map((b, i) => <th key={b} className={i >= (kko ? 2 : 4) ? local.number : undefined}>{b}</th>)}</tr></thead>
              <tbody>{veri.siparisler.length === 0 ? <tr><td colSpan={basliklar.length}>{arama ? "Aramayla eşleşen kayıt bulunamadı." : kko ? "Henüz KKÖ tüketimi bulunmuyor." : "Henüz satın alma kaydı bulunmuyor."}</td></tr> : veri.siparisler.map(s => (
                <tr key={`${s.paket_turu}:${s.kayit_id}`}>
                  <td>{kko ? donem(s.siparis_tarihi) : tarih(s.siparis_tarihi)}</td>
                  {!kko && <td>{s.satin_alan_ad_soyad || "—"}</td>}
                  <td>{s.bakiye_turu === "kisisel"
                    ? kko && s.satin_alan_ad_soyad ? `${s.satin_alan_ad_soyad} · Kişisel Token Hesabı` : "Kişisel Token Hesabı"
                    : "Firma Token Hesabı"}</td>
                  {!kko && <td>{SIPARIS_PAKET_ADLARI[s.paket_turu]}</td>}
                  <td className={local.number}>{s.token_adedi.toLocaleString("tr-TR")}</td>
                  <td className={local.number}>{para(s.birim_fiyat)}</td>
                  <td className={local.number}>{para(s.toplam_tutar)}</td>
                  <td className={local.number}>{para(s.kdv)}</td>
                  <td className={local.number}>{para(s.toplam_tutar + s.kdv)}</td>
                </tr>
              ))}</tbody>
            </MobilUyumluTablo>
          </div>
          {veri.toplam > veri.sayfa_boyutu && <div className={`${styles.cardBody} flex items-center justify-end gap-3`}>
            <Button variant="outline" disabled={sayfa === 0} onClick={() => setSayfa(v => v - 1)}>Önceki</Button>
            <span>Sayfa {sayfa + 1} / {Math.ceil(veri.toplam / veri.sayfa_boyutu)}</span>
            <Button variant="outline" disabled={(sayfa + 1) * veri.sayfa_boyutu >= veri.toplam} onClick={() => setSayfa(v => v + 1)}>Sonraki</Button>
          </div>}
        </>}
      <div className={styles.cardBody}><p className={local.description}>Toplam Tutar KDV hariç, Genel Tutar KDV dahildir. {kko ? "Tutarlar gerçekleşen tüketim üzerinden hesaplanır." : "Manuel token yüklemeleri satın alma olarak listelenmez."}</p></div>
    </section>
  </div>;
}
