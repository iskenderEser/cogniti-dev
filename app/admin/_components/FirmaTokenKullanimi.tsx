"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { esnekKullanimRaporuGecerli, type EsnekKullanimRaporu, type TokenHesabi } from "@/lib/satinAlma/kullanimRaporu";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import { ROL_ADLARI } from "@/lib/utils/roller";
import MobilUyumluTablo from "./MobilUyumluTablo";
import TokenYonetimi from "./TokenYonetimi";
import styles from "../admin.module.css";
import local from "./token-gonderileri.module.css";
const num = (v: number) => v.toLocaleString("tr-TR");
const tarih = (s: string) => new Date(s).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
const hesapAdi = (h: TokenHesabi) => h.bakiye_turu === "firma_ortak" ? "Firma Token Hesabı" : `${h.sahip_adi} · Kişisel Token Hesabı`;
const akislar = { saha: "UTT / BM Yayını", eclub: "E-Club Yayını", eczanem: "Eczanem Üye Gönderimi", onceki_eclub: "Önceki E-Club Dağıtımı" };
export default function FirmaTokenKullanimi({ firmaId }: { firmaId: string }) {
  const [filtre, setFiltre] = useState({ hesap: "", sayfa: 0 });
  const [yenileme, setYenileme] = useState(0);
  const [eskiAcik, setEskiAcik] = useState(false);
  const url = `/admin/api/firmalar/${firmaId}/esnek-token-kullanimi?${new URLSearchParams({ hesap: filtre.hesap, sayfa: String(filtre.sayfa), yenileme: String(yenileme) })}`;
  const [sonuc, setSonuc] = useState<{ key: string; veri?: EsnekKullanimRaporu; hata?: string } | null>(null);
  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      try {
        const r = await fetch(url, { cache: "no-store", signal: kontrol.signal }), d = await r.json();
        if (!r.ok) throw new Error(typeof d.hata === "string" ? d.hata : "Token kullanım raporu alınamadı.");
        if (!esnekKullanimRaporuGecerli(d) || d.firma_id !== firmaId || d.hesap_id !== (filtre.hesap || null) || d.sayfa !== filtre.sayfa) throw new Error("Token kullanım raporu doğrulanamadı.");
        if (!kontrol.signal.aborted) setSonuc({ key: url, veri: d });
      } catch (e) { if (!kontrol.signal.aborted) setSonuc({ key: url, hata: e instanceof Error ? e.message : "Token kullanım raporu alınamadı." }); }
    }
    void oku(); return () => kontrol.abort();
  }, [url, firmaId, filtre.hesap, filtre.sayfa]);
  const guncel = sonuc?.key === url ? sonuc : null, veri = guncel?.veri;
  return <div className={styles.stack} aria-label="Token Kullanımı">
    <section className={styles.card}>
      <div className={styles.cardHeader}><div><h2>Token Hesapları</h2><p>Kişisel ve firma hesaplarının tüm zamanlara ait durumu</p></div><Button variant="outline" disabled={!guncel} onClick={() => setYenileme(v => v + 1)}>Yenile</Button></div>
      {!guncel ? <p role="status" className={styles.empty}>Token hesapları yükleniyor…</p> : guncel.hata ? <div role="alert" className={styles.cardBody}><p>{guncel.hata}</p><Button variant="outline" onClick={() => setYenileme(v => v + 1)}>Yeniden Dene</Button></div> : veri && <div className={styles.tableWrap}>
        <MobilUyumluTablo basliklar={["Token Hesabı", "Toplam Tanımlanan", "Kullanılan", "Blokeli / Ayrılan", "Kullanılabilir", "Süresi Dolan"]} className={local.table} aria-label="Esnek token hesapları">
          <thead><tr><th>Token Hesabı</th>{["Toplam Tanımlanan", "Kullanılan", "Blokeli / Ayrılan", "Kullanılabilir", "Süresi Dolan"].map(b => <th key={b} className={local.number}>{b}</th>)}</tr></thead>
          <tbody>{veri.hesaplar.map(h => <tr key={h.bakiye_id}><td>{hesapAdi(h)}{h.paket_turu === 'kko' && <small> · KKÖ</small>}</td>{[h.toplam, h.kullanilan, h.ayrilan, h.kalan, h.suresi_dolan].map((n, i) => <td key={i} className={local.number}>{num(n)}</td>)}</tr>)}{!veri.hesaplar.length && <tr><td colSpan={6}>Henüz token hesabı bulunmuyor.</td></tr>}</tbody>
        </MobilUyumluTablo>
        <p className={local.note}>Blokeli / ayrılan tokenlar tüketilmiş sayılmaz. Süresi dolan tokenlar kullanılabilir bakiyeye dahil değildir.</p>
      </div>}
    </section>
    {veri && <section className={styles.card}>
      <div className={styles.cardHeader}><div><h2>Token Tüketimleri</h2><p>Aynı hesap, gönderen, yayın ve gönderim türü bir satırda toplanır.</p></div><label className={styles.field}>Token Hesabı<select className={styles.input} value={filtre.hesap} onChange={e => setFiltre({ hesap: e.target.value, sayfa: 0 })}><option value="">Tüm Hesaplar</option>{veri.hesaplar.map(h => <option key={h.bakiye_id} value={h.bakiye_id}>{hesapAdi(h)}</option>)}</select></label></div>
      <div className={styles.tableWrap}><MobilUyumluTablo basliklar={["Son Tüketim", "Token Hesabı", "Gönderen", "Yayın", "Gönderim Türü", "Tüketilen Token", "Detay"]} className={local.table} aria-label="Esnek paket tüketimleri">
        <thead><tr><th>Son Tüketim</th><th>Token Hesabı</th><th>Gönderen</th><th>Yayın</th><th>Gönderim Türü</th><th className={local.number}>Tüketilen Token</th><th>Detay</th></tr></thead>
        <tbody>{veri.satirlar.map(s => <tr key={s.id}><td>{tarih(s.son_tarih)}</td><td>{hesapAdi(veri.hesaplar.find(h => h.bakiye_id === s.bakiye_id)!)}</td><td>{s.gonderen}<br /><small>{ROL_ADLARI[s.gonderen_rol] ?? s.gonderen_rol}</small></td><td>{yayin_kodu(s.firma_adi, s.talep_no)}{s.urun_adi && <><br /><small>{s.urun_adi}</small></>}</td><td>{akislar[s.akis]}</td><td className={local.number}>{num(s.token)}</td><td><details><summary>Detay</summary><p>İlk Tüketim: {tarih(s.ilk_tarih)}</p><p>Son Tüketim: {tarih(s.son_tarih)}</p><p>Yayın No: {s.yayin_id}</p></details></td></tr>)}{!veri.satirlar.length && <tr><td colSpan={7}>Seçilen hesapta tüketim kaydı bulunmuyor.</td></tr>}</tbody>
        <tfoot><tr><th colSpan={5}>Seçilen Hesapların Tüketim Toplamı</th><td className={local.number}>{num(veri.tuketim_toplami)}</td><td /></tr></tfoot>
      </MobilUyumluTablo></div>
      {veri.kayit_sayisi > 50 && <div className={local.pagination}><span>Sayfa {filtre.sayfa + 1} / {Math.ceil(veri.kayit_sayisi / 50)}</span><div><Button variant="outline" disabled={!filtre.sayfa} onClick={() => setFiltre(v => ({ ...v, sayfa: v.sayfa - 1 }))}>Önceki</Button><Button variant="outline" disabled={(filtre.sayfa + 1) * 50 >= veri.kayit_sayisi} onClick={() => setFiltre(v => ({ ...v, sayfa: v.sayfa + 1 }))}>Sonraki</Button></div></div>}
    </section>}
    <details className={styles.card} onToggle={e => setEskiAcik(e.currentTarget.open)}><summary className={styles.cardHeader}>KKÖ ve Önceki Token Kayıtları</summary>{eskiAcik && <div className={styles.cardBody}><TokenYonetimi firmaId={firmaId} /></div>}</details>
  </div>;
}
