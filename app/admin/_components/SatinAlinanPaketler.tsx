"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siparisListesiGecerli, type SiparisListesi } from "@/lib/satinAlma/siparisListesi";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import local from "./token-yonetimi.module.css";

const para = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
const tarih = (s: string) => new Date(s).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" });
const basliklar = ["Satın Alma Tarihi", "Paket", "Satın Alan", "Token Hesabı", "Token", "Birim Fiyat", "Paket Tutarı", "Detay"];
export default function SatinAlinanPaketler({ firmaId }: { firmaId: string }) {
  const [sayfa, setSayfa] = useState(0);
  const [deneme, setDeneme] = useState(0);
  const [veri, setVeri] = useState<SiparisListesi | null>(null);
  const [hata, setHata] = useState("");
  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      setVeri(null); setHata("");
      try {
        const r = await fetch(`/admin/api/firmalar/${firmaId}/satin-alinan-paketler?sayfa=${sayfa}`, { cache: "no-store", signal: kontrol.signal });
        const d = await r.json();
        if (!r.ok) throw new Error(typeof d.hata === "string" ? d.hata : "Satın alma kayıtları alınamadı.");
        if (!siparisListesiGecerli(d) || d.firma_id !== firmaId || d.sayfa !== sayfa) throw new Error("Satın alma kayıtları doğrulanamadı.");
        if (!kontrol.signal.aborted) setVeri(d);
      } catch (e) { if (!kontrol.signal.aborted) setHata(e instanceof Error ? e.message : "Satın alma kayıtları alınamadı."); }
    }
    void oku(); return () => kontrol.abort();
  }, [firmaId, sayfa, deneme]);
  return <div className={styles.stack} aria-label="Satın Alınan Paketler">
    <section className={styles.card} aria-labelledby="satin-alinan-paketler-baslik">
      <div className={styles.cardHeader}><div><h2 id="satin-alinan-paketler-baslik"><ShoppingBag />Satın Alınan Paketler</h2><p>Firmanın satın alma geçmişi</p></div></div>
      {hata ? <div role="alert" className={styles.cardBody}><p>{hata}</p><Button variant="outline" onClick={() => setDeneme(v => v + 1)}>Yeniden Dene</Button></div>
        : !veri ? <p role="status" className={styles.cardBody}>Satın alma kayıtları yükleniyor…</p>
        : <>
          <div className={styles.tableWrap}>
            <MobilUyumluTablo basliklar={basliklar} className={local.table} aria-label="Satın alınan paketler listesi">
              <thead><tr>{basliklar.map((b, i) => <th key={b} className={i >= 4 && i <= 6 ? local.number : undefined}>{b}</th>)}</tr></thead>
              <tbody>{veri.siparisler.length === 0 ? <tr><td colSpan={8}>Henüz satın alma kaydı bulunmuyor.</td></tr> : veri.siparisler.map(s => {
                const netKurus = Math.round(s.toplam_tutar * 100), kdvKurus = Math.round(netKurus * 20 / 100);
                return <tr key={s.siparis_id}>
                  <td>{tarih(s.siparis_tarihi)}</td><td>Esnek Paket</td><td>{s.satin_alan_ad_soyad || "—"}</td>
                  <td>{s.bakiye_turu === "kisisel" ? "Kişisel Token Hesabı" : "Firma Token Hesabı"}</td>
                  <td className={local.number}>{s.token_adedi.toLocaleString("tr-TR")}</td>
                  <td className={local.number}>{para(s.birim_fiyat)}</td><td className={local.number}>{para(s.toplam_tutar)}</td>
                  <td><details><summary>Detay</summary><dl className="mt-2 grid gap-1 text-sm">
                    <dt>Sipariş No</dt><dd className="break-all">{s.siparis_id}</dd>
                    <dt>Paket Tutarı</dt><dd>{para(netKurus / 100)}</dd>
                    <dt>KDV (%20)</dt><dd>{para(kdvKurus / 100)}</dd>
                    <dt>Genel Tutar</dt><dd>{para((netKurus + kdvKurus) / 100)}</dd>
                    <dt>Son Kullanım</dt><dd>{tarih(new Date(Date.parse(s.son_kullanim_at) - 1).toISOString())}</dd>
                  </dl></details></td>
                </tr>;
              })}</tbody>
            </MobilUyumluTablo>
          </div>
          {veri.toplam > veri.sayfa_boyutu && <div className={`${styles.cardBody} flex items-center justify-end gap-3`}>
            <Button variant="outline" disabled={sayfa === 0} onClick={() => setSayfa(v => v - 1)}>Önceki</Button>
            <span>Sayfa {sayfa + 1} / {Math.ceil(veri.toplam / veri.sayfa_boyutu)}</span>
            <Button variant="outline" disabled={(sayfa + 1) * veri.sayfa_boyutu >= veri.toplam} onClick={() => setSayfa(v => v + 1)}>Sonraki</Button>
          </div>}
        </>}
      <div className={styles.cardBody}><p className={local.description}>Paket tutarları KDV hariçtir. Manuel token yüklemeleri satın alma olarak listelenmez.</p></div>
    </section>
  </div>;
}
