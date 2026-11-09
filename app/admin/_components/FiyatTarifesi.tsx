"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { Button } from "@/components/ui/button";
import { FIYAT_KALEMLERI, fiyatDegerleriGecerli, fiyatMetniniOku, fiyatTarifesiGecerli, type FiyatAnahtari, type FiyatTarifesi } from "@/lib/fiyat/tarife";
import { SM2_TOKEN_ADETLERI, SM2_SURELERI } from "@/lib/fiyat/sm2";
import styles from "../admin.module.css";
import local from "./fiyat-tarifesi.module.css";

const PAKETLER = [
  { ad:"Giriş Paketi", miktar:"kko_token_miktari", birim:"kko_token_tl", asim:"kko_asim_tl" },
  { ad:"Paket 1", miktar:"paket_10k_token_miktari", birim:"paket_10k_token_tl", asim:"paket_10k_asim_tl" },
  { ad:"Paket 2", miktar:"paket_30k_token_miktari", birim:"paket_30k_token_tl", asim:"paket_30k_asim_tl" },
  { ad:"Paket 3", miktar:"paket_75k_token_miktari", birim:"paket_75k_token_tl", asim:"paket_75k_asim_tl" },
  { ad:"Paket 4", miktar:"paket_25k_token_miktari", birim:"paket_25k_token_tl" },
] as const;

type Props = { hata: (mesaj: string) => void; basari: (mesaj: string) => void };
const para = new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:6 });
export default function FiyatTarifesi({ hata, basari }: Props) {
  const [tarife, setTarife] = useState<FiyatTarifesi | null>(null);
  const [taslak, setTaslak] = useState<Partial<Record<FiyatAnahtari, string>>>({});
  const [yukleniyor, setYukleniyor] = useState(true), [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const kilit = useRef(false), istek = useRef<AbortController | null>(null);
  const yerlestir = (d: FiyatTarifesi) => {
    setTarife(d); setTaslak(Object.fromEntries(FIYAT_KALEMLERI.map(k => [k.anahtar, d.degerler[k.anahtar]?.toString().replace(".", ",") ?? ""])));
  };
  const yenile = useCallback(async () => {
    if (kilit.current) return;
    istek.current?.abort(); const controller = new AbortController(); istek.current = controller;
    setYukleniyor(true); setMesaj("");
    try {
      const r = await fetch("/admin/api/fiyat-tarifesi", { cache:"no-store", signal:controller.signal });
      const d: unknown = await r.json();
      if (!r.ok || !fiyatTarifesiGecerli(d)) throw new Error(d && typeof d === "object" && "hata" in d && typeof d.hata === "string" ? d.hata : "Fiyat tarifesi okunamadı.");
      if (!controller.signal.aborted) yerlestir(d);
    } catch(e) { if (!controller.signal.aborted) { setTarife(null); setMesaj(e instanceof Error ? e.message : "Fiyat tarifesi okunamadı."); } }
    finally { if (!controller.signal.aborted) setYukleniyor(false); }
  }, []);
  useEffect(() => { void yenile(); return () => istek.current?.abort(); }, [yenile]);
  async function kaydet() {
    if (kilit.current || !tarife) return;
    if (FIYAT_KALEMLERI.some(k => !(k.anahtar === "uretim_literatur_tl" && !taslak[k.anahtar]?.trim()) && fiyatMetniniOku(taslak[k.anahtar] ?? "") === null)) {
      hata("Geçerli bir fiyat girin. En fazla 6 ondalık basamak kullanın."); return;
    }
    const degerler = Object.fromEntries(FIYAT_KALEMLERI.map(k => [k.anahtar, k.anahtar === "uretim_literatur_tl" && !taslak[k.anahtar]?.trim() ? null : fiyatMetniniOku(taslak[k.anahtar] ?? "")]));
    if (!fiyatDegerleriGecerli(degerler)) { hata("Pozitif değer girin (en fazla 6 ondalık). Giriş Paketi aşım bedeli sıfır olabilir. Paket miktarları ve banner bedeli tam token olmalıdır. Literatür teklif usulü için boş kalabilir."); return; }
    kilit.current = true; setKaydediliyor(true);
    const controller = new AbortController(); istek.current = controller;
    try {
      const r = await fetch("/admin/api/fiyat-tarifesi", { method:"PUT", headers:{"Content-Type":"application/json"}, signal:controller.signal,
        body:JSON.stringify({ surum:tarife.surum, degerler }) });
      const d: unknown = await r.json();
      if (!r.ok || !fiyatTarifesiGecerli(d)) throw new Error(d && typeof d === "object" && "hata" in d && typeof d.hata === "string" ? d.hata : "Fiyatlar kaydedilemedi.");
      if (!controller.signal.aborted) { yerlestir(d); basari("Fiyat tarifesi kaydedildi."); }
    } catch(e) { if (!controller.signal.aborted) hata(e instanceof Error ? e.message : "Fiyatlar kaydedilemedi."); }
    finally { kilit.current = false; if (!controller.signal.aborted) setKaydediliyor(false); }
  }
  const kkoTaslak = fiyatMetniniOku(taslak.kko_token_tl ?? "");
  const sm2Onizleme = !!tarife && kkoTaslak !== tarife.degerler.kko_token_tl;
  return <section className={styles.card} aria-label="Cogniti Fiyat Tarifesi" aria-busy={yukleniyor || kaydediliyor}>
    <div className={styles.cardHeader}><div><h2>Cogniti Fiyat Tarifesi</h2><p>Agora hariç hizmet fiyatları ve hesaplama parametreleri.</p></div><YenileButonu yenileniyor={yukleniyor} disabled={kaydediliyor} onYenile={yenile} /></div>
    <div className={styles.cardBody}>
      {yukleniyor ? <p role="status">Fiyatlar yükleniyor…</p> : mesaj ? <p role="alert">{mesaj}</p> : tarife && <>
        <h3 className={local.tabloBasligi}>Gönderi Token-Fiyat Listesi</h3>
        <div className={local.hizmetler}>
          <h4 className={local.tabloBasligi}>Paket 1</h4>
        <div className={styles.tableWrap}><table className={local.tablo} aria-label="Giriş Paketi fiyatları">
          <thead><tr><th>Paket Adı</th><th>Aylık Token Miktarı</th><th>Birim Fiyat (TL/token)</th><th>Aşım Fiyatı (TL/token)</th></tr></thead>
          <tbody>{PAKETLER.filter(p => p.ad === "Giriş Paketi").map(p => <tr key={p.ad}>
            <th scope="row">{p.ad}</th>
            {([{ anahtar:p.miktar, etiket:"Aylık token miktarı" }, { anahtar:p.birim, etiket:"Birim fiyat" }, { anahtar:p.asim, etiket:"Aşım fiyatı" }]).map(a => <td key={a.anahtar}>
              <input id={`fiyat-${a.anahtar}`} aria-label={`${p.ad} ${a.etiket}`} type="text" inputMode={a.anahtar === p.miktar ? "numeric" : "decimal"} maxLength={24}
                value={taslak[a.anahtar] ?? ""} disabled={kaydediliyor} onChange={e => setTaslak(v => ({...v,[a.anahtar]:e.target.value}))} />
            </td>)}
          </tr>)}</tbody>
        </table></div>
          <h4 className={`${local.tabloBasligi} ${local.hizmetler}`}>Paket 2</h4>
          {sm2Onizleme && <p className={local.aciklama} role="status">{kkoTaslak !== null && kkoTaslak > 0
            ? "Önizleme: Paket 2 fiyatları girdiğiniz KKÖ değerine göre güncellendi. DB’ye işlemek için Fiyatları Kaydet düğmesini kullanın."
            : "Paket 2 fiyatlarını görmek için geçerli, sıfırdan büyük bir KKÖ birim fiyatı girin."}</p>}
          <div className={styles.tableWrap}>
            <table className={`${local.tablo} ${local.sm2Tablo}`} aria-label="Paket 2 adet ve süre fiyat matrisi" aria-describedby="sm2-aciklama">
              <thead><tr><th scope="col">Toplam Token Adedi</th>{SM2_SURELERI.map(ay => <th scope="col" key={ay}>{ay === 0 ? "Peşin" : `${ay + 1} Ay`}</th>)}</tr></thead>
              <tbody>{SM2_TOKEN_ADETLERI.map(adet => <tr key={adet}>
                <th scope="row">{adet.toLocaleString("tr-TR")}</th>
                {SM2_SURELERI.map(ay => {
                  const hucre = tarife.sm2.find(h => h.token_adedi === adet && h.ay === ay)!;
                  const fiyat = sm2Onizleme
                    ? kkoTaslak !== null && kkoTaslak > 0 ? Math.round(kkoTaslak * hucre.katsayi * 100) / 100 : null
                    : hucre.birim_fiyat;
                  return <td key={ay}>{fiyat === null ? "—" : fiyat.toLocaleString("tr-TR", { minimumFractionDigits:2, maximumFractionDigits:2 })}</td>;
                })}
              </tr>)}</tbody>
            </table>
          </div>
          <div id="sm2-aciklama" className={local.ozet}>
            <p>Fiyatlar güncel kayıtlı KKÖ birim fiyatı × veritabanında sabitlenen hücre katsayısı ile hesaplanır. KKÖ değiştiğinde tüm tablo aynı oranda güncellenir.</p>
            <p>Tokenlar başlangıçta tek seferde yüklenir. Toplam bedel = token adedi × peşin birim fiyat. Ödeme tek seferde yapılır; sipariş verildiğinde fatura kesilir.</p>
          </div>
          <h4 className={`${local.tabloBasligi} ${local.hizmetler}`}>Paket 3</h4>
        </div>
        <div className={styles.tableWrap}><table className={local.tablo} aria-label="Paket fiyatları">
          <thead><tr><th>Paket Adı</th><th>Aylık Token Miktarı</th><th>Birim Fiyat (TL/token)</th><th>Aylık Tutar (TL)</th></tr></thead>
          <tbody>{PAKETLER.filter(p => p.ad !== "Giriş Paketi").map(p => <tr key={p.ad}>
            <th scope="row">{p.ad}</th>
            <td><input id={`fiyat-${p.miktar}`} aria-label={`${p.ad} Aylık token miktarı`} type="text" inputMode="numeric" maxLength={24}
              value={taslak[p.miktar] ?? ""} disabled={kaydediliyor} onChange={e => setTaslak(v => ({...v,[p.miktar]:e.target.value}))} /></td>
            {([{ anahtar:p.birim, etiket:"Birim fiyat" }]).map(a => <td key={a.anahtar}>
              <input id={`fiyat-${a.anahtar}`} aria-label={`${p.ad} ${a.etiket}`} type="text" inputMode="decimal" maxLength={24}
                value={taslak[a.anahtar] ?? ""} disabled={kaydediliyor} onChange={e => setTaslak(v => ({...v,[a.anahtar]:e.target.value}))} />
            </td>)}
            <td>{(() => { const miktar = fiyatMetniniOku(taslak[p.miktar] ?? ""), birim = fiyatMetniniOku(taslak[p.birim] ?? ""); return miktar !== null && Number.isInteger(miktar) && miktar > 0 && birim !== null && birim > 0 ? `${(miktar * birim).toLocaleString("tr-TR", {maximumFractionDigits:2})} TL` : "—"; })()}</td>
          </tr>)}</tbody>
        </table></div>
        <p className={local.aciklama}>Tokenlar her ay yüklenir. Aylık tutar, aylık token miktarı × birim fiyat olarak hesaplanır.</p>
        <div className={local.hizmetler}>
        <h3 className={local.tabloBasligi}>Hizmet Token-Fiyat Listesi</h3>
        <div className={styles.tableWrap}><table className={local.tablo} aria-label="Hizmet fiyatları">
          <thead><tr><th>Kalem</th><th>Hizmet / Parametre</th><th>Birim</th><th>Değer</th></tr></thead>
          <tbody>{FIYAT_KALEMLERI.filter(k => !k.anahtar.startsWith("paket_") && !k.anahtar.startsWith("kko_") && !k.anahtar.startsWith("viva_")).map(k => <tr key={k.anahtar}><td>{k.grup}</td><th scope="row"><label htmlFor={`fiyat-${k.anahtar}`}>{k.ad}</label></th><td>{k.birim}</td><td><input id={`fiyat-${k.anahtar}`} type="text" inputMode="decimal" maxLength={24} value={taslak[k.anahtar] ?? ""} disabled={kaydediliyor}
            placeholder={k.anahtar === "uretim_literatur_tl" ? "Teklif usulü" : undefined} onChange={e => setTaslak(v => ({...v,[k.anahtar]:e.target.value}))} /></td></tr>)}</tbody>
        </table></div>
        </div>
        <h3 className={`${local.tabloBasligi} ${local.hizmetler}`}>Canlı Yayın Token-Fiyat Listesi</h3>
        <div className={styles.tableWrap}>
          <table className={`${local.tablo} ${local.vivaTablo}`} aria-label="Viva fiyat hesabı">
            <thead><tr><th>Kalem</th><th>Maliyet (USD/kişi-dakika)</th><th>USD/TL Kuru</th><th>Satış Katsayısı</th><th>KKÖ (TL/token)</th><th>TL / kişi-dk.</th><th>Token / kişi-dk.</th></tr></thead>
            <tbody><tr><th scope="row">Viva</th>
              {(["viva_kisi_dakika_usd", "viva_usd_tl", "viva_satis_katsayisi"] as const).map(anahtar => <td key={anahtar}>
                <input id={`fiyat-${anahtar}`} aria-label={FIYAT_KALEMLERI.find(k => k.anahtar === anahtar)?.ad} type="text" inputMode="decimal" maxLength={24}
                  value={taslak[anahtar] ?? ""} disabled={kaydediliyor} onChange={e => setTaslak(v => ({...v,[anahtar]:e.target.value}))} />
              </td>)}
              <td>{tarife.degerler.kko_token_tl?.toLocaleString("tr-TR")}</td>
              <td>{tarife.hesaplar.viva_kisi_dakika_tl.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              <td>
                {tarife.hesaplar.viva_kisi_dakika_token.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            </tr></tbody>
          </table>
        </div>
        <div className={local.ozet}>
          <p><strong>Viva hesabı:</strong> Kişi-dakika × USD maliyeti × kur × satış katsayısı ÷ KKÖ token fiyatı. Toplam kullanım sonunda tam tokena yuvarlanır.</p>
          <p><strong>Banner hesabı:</strong> Hafta sayısı × kayıtlı haftalık token bedeli.</p>
          <p><strong>Kayıtlı aylık paketler:</strong> {tarife.degerler.paket_10k_token_miktari?.toLocaleString("tr-TR")} token: {para.format(tarife.hesaplar.paket_10k_aylik_tl)} · {tarife.degerler.paket_30k_token_miktari?.toLocaleString("tr-TR")} token: {para.format(tarife.hesaplar.paket_30k_aylik_tl)} · {tarife.degerler.paket_75k_token_miktari?.toLocaleString("tr-TR")} token: {para.format(tarife.hesaplar.paket_75k_aylik_tl)} · {tarife.degerler.paket_25k_token_miktari?.toLocaleString("tr-TR")} token: {para.format(tarife.hesaplar.paket_25k_aylik_tl)}.</p>
          <p>Fiyatlar KDV hariçtir. Hesap özeti kayıtlı değerlere aittir. Viva ve banner bu tarifeyi merkezi bağlantı SQL kurulumu tamamlandıktan sonra kullanır.</p>
        </div>
        <div className={local.eylemler}><span>Tarife sürümü: {tarife.surum}</span><Button type="button" disabled={kaydediliyor} onClick={() => void kaydet()}>{kaydediliyor ? "Kaydediliyor…" : "Fiyatları Kaydet"}</Button></div>
      </>}
    </div>
  </section>;
}
