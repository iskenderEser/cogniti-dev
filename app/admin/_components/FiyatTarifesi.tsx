"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { abonelikPaketTaslaklariGecerli } from "@/lib/fiyat/taahhut";
import { FIYAT_KALEMLERI, fiyatDegerleriGecerli, fiyatMetniniOku, fiyatTarifesiGecerli, type FiyatAnahtari, type FiyatTarifesi } from "@/lib/fiyat/tarife";
import { SM2_TOKEN_ADETLERI, ESNEK_UC_FIYAT_ANAHTARLARI, esnekBirimFiyati } from "@/lib/fiyat/sm2";
import styles from "../admin.module.css";
import local from "./fiyat-tarifesi.module.css";

const PAKETLER = [
  { ad:"Giriş Paketi", miktar:"kko_token_miktari", birim:"kko_token_tl", asim:"kko_asim_tl" },
] as const;

type PaketSatiri = { anahtar: string; id: number | null; ad: string; token: string; birim: string };
type Props = { hata: (mesaj: string) => void; basari: (mesaj: string) => void };
const para = new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY", maximumFractionDigits:6 });
export default function FiyatTarifesi({ hata, basari }: Props) {
  const [tarife, setTarife] = useState<FiyatTarifesi | null>(null);
  const [taslak, setTaslak] = useState<Partial<Record<FiyatAnahtari, string>>>({});
  const [paketSatirlari, setPaketSatirlari] = useState<PaketSatiri[]>([]);
  const yeniPaketSayaci = useRef(0);
  const [yukleniyor, setYukleniyor] = useState(true), [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const kilit = useRef(false), istek = useRef<AbortController | null>(null);
  const yerlestir = (d: FiyatTarifesi) => {
    setPaketSatirlari(d.abonelik_paketleri.map(p => ({
      anahtar: String(p.id), id: p.id, ad: p.ad, token: String(p.token), birim: String(p.birim).replace(".", ","),
    })));
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
    const abonelikPaketleri = paketSatirlari.map(p => ({
      id: p.id, ad: p.ad.trim(), token: fiyatMetniniOku(p.token), birim: fiyatMetniniOku(p.birim),
    }));
    if (!abonelikPaketTaslaklariGecerli(abonelikPaketleri)) {
      hata("Her abonelik için paket adı, en az 15 tam token ve geçerli bir birim fiyat girin.");
      return;
    }
    kilit.current = true; setKaydediliyor(true);
    const controller = new AbortController(); istek.current = controller;
    try {
      const r = await fetch("/admin/api/fiyat-tarifesi", { method:"PUT", headers:{"Content-Type":"application/json"}, signal:controller.signal,
        body:JSON.stringify({ surum:tarife.surum, degerler, abonelikPaketleri }) });
      const d: unknown = await r.json();
      if (!r.ok || !fiyatTarifesiGecerli(d)) throw new Error(d && typeof d === "object" && "hata" in d && typeof d.hata === "string" ? d.hata : "Fiyatlar kaydedilemedi.");
      if (!controller.signal.aborted) { yerlestir(d); basari("Fiyat tarifesi kaydedildi."); }
    } catch(e) { if (!controller.signal.aborted) hata(e instanceof Error ? e.message : "Fiyatlar kaydedilemedi."); }
    finally { kilit.current = false; if (!controller.signal.aborted) setKaydediliyor(false); }
  }
  const [ilkAnahtar, sonAnahtar] = ESNEK_UC_FIYAT_ANAHTARLARI;
  const ilkFiyat = fiyatMetniniOku(taslak[ilkAnahtar] ?? "");
  const sonFiyat = fiyatMetniniOku(taslak[sonAnahtar] ?? "");
  const onizleme = ilkFiyat !== null && ilkFiyat > 0 && sonFiyat !== null && sonFiyat > 0
    ? SM2_TOKEN_ADETLERI.map(adet => esnekBirimFiyati(adet, ilkFiyat, sonFiyat)) : null;
  const birimAzalir = onizleme?.every((fiyat, i) => i === 0 || fiyat < onizleme[i - 1]);
  const toplamArtar = onizleme?.every((fiyat, i) => i === 0
    || fiyat * SM2_TOKEN_ADETLERI[i] > onizleme[i - 1] * SM2_TOKEN_ADETLERI[i - 1]);
  const sm2Onizleme = !!tarife && (ilkFiyat !== tarife.degerler[ilkAnahtar] || sonFiyat !== tarife.degerler[sonAnahtar]);
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
          {sm2Onizleme && <p className={local.aciklama} role="status">
            {onizleme ? "Önizleme: Ara fiyatlar girdiğiniz iki uç fiyata göre hesaplandı." : "İki uç fiyat için de sıfırdan büyük bir değer girin."}
          </p>}
          <div className={styles.tableWrap}>
            <table className={`${local.tablo} ${local.sm2Tablo}`} aria-label="Paket 2 fiyat matrisi" aria-describedby="sm2-aciklama">
              <thead><tr><th scope="col">Toplam Token Adedi</th><th scope="col">Birim Fiyat (TL/token)</th><th scope="col">Toplam Tutar (TL)</th></tr></thead>
              <tbody>{SM2_TOKEN_ADETLERI.map((adet, i) => {
                const anahtar = adet === 2500 ? ilkAnahtar : adet === 50000 ? sonAnahtar : null;
                const fiyat = sm2Onizleme ? onizleme?.[i] : tarife.sm2.find(h => h.token_adedi === adet)?.birim_fiyat;
                return <tr key={adet}>
                  <th scope="row">{adet.toLocaleString("tr-TR")}</th>
                  <td>{anahtar ? <input id={`fiyat-${anahtar}`} aria-label={`${adet.toLocaleString("tr-TR")} token birim fiyatı`}
                    type="text" inputMode="decimal" maxLength={24} value={taslak[anahtar] ?? ""} disabled={kaydediliyor}
                    onChange={e => setTaslak(v => ({ ...v, [anahtar]: e.target.value }))} />
                    : fiyat?.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"}</td>
                  <td>{fiyat === undefined ? "—" : (fiyat * adet).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <div id="sm2-aciklama" className={local.ozet}>
            <p>2.500 ve 50.000 tokenın birim fiyatını düzenleyebilirsiniz. Ara fiyatlar logaritmik formülle hesaplanır ve kuruşa yuvarlanır.</p>
            {onizleme && <p>Birim fiyat her satırda azalıyor: {birimAzalir ? "Evet" : "Hayır"}. Toplam tutar her satırda artıyor: {toplamArtar ? "Evet" : "Hayır"}.</p>}
          </div>
        </div>
        <h4 className={local.tabloBasligi}>Paket 3</h4>
        <div className={styles.tableWrap}><table className={local.tablo} aria-label="Paket fiyatları">
          <thead><tr><th>Paket Adı</th><th>Aylık Token Miktarı</th><th>Birim Fiyat (TL/token)</th><th>Aylık Tutar (TL)</th><th>İşlem</th></tr></thead>
          <tbody>{paketSatirlari.map((p, i) => {
            const degistir = (alan: "ad" | "token" | "birim", deger: string) => {
              setPaketSatirlari(satirlar => satirlar.map(s => s.anahtar === p.anahtar ? { ...s, [alan]: deger } : s));
            };
            const token = fiyatMetniniOku(p.token), birim = fiyatMetniniOku(p.birim);
            return <tr key={p.anahtar}>
              <th scope="row"><input id={`abonelik-${p.anahtar}-ad`} aria-label={`${i + 1}. satır Paket adı`} value={p.ad} maxLength={80}
                disabled={kaydediliyor} onChange={e => degistir("ad", e.target.value)} /></th>
              <td><input id={`abonelik-${p.anahtar}-token`} aria-label={`${i + 1}. satır Aylık token miktarı`} inputMode="numeric" maxLength={24} value={p.token}
                disabled={kaydediliyor} onChange={e => degistir("token", e.target.value)} /></td>
              <td><input id={`abonelik-${p.anahtar}-birim`} aria-label={`${i + 1}. satır Birim fiyat`} inputMode="decimal" maxLength={24} value={p.birim}
                disabled={kaydediliyor} onChange={e => degistir("birim", e.target.value)} /></td>
              <td>{token !== null && Number.isInteger(token) && token > 0 && birim !== null && birim > 0
                ? `${(token * birim).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL` : "—"}</td>
              <td><AlertDialog>
                <AlertDialogTrigger asChild><Button type="button" variant="outline" disabled={kaydediliyor}
                  aria-label={`${p.ad || `${i + 1}. satır`} paketini kaldır`}>Kaldır</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{p.ad || "Bu paket"} kaldırılsın mı?</AlertDialogTitle>
                    <AlertDialogDescription>Tarife kaydedildiğinde paket yeni siparişlere kapanır. Mevcut abonelikler satın alındıkları koşullarla devam eder.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setPaketSatirlari(satirlar => satirlar.filter(s => s.anahtar !== p.anahtar))}>Kaldır</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog></td>
            </tr>;
          })}
          {paketSatirlari.length === 0 && <tr><td colSpan={5}>Listede abonelik paketi yok.</td></tr>}</tbody>
        </table></div>
        <p className={local.aciklama}>Tokenlar her ay yüklenir. Aylık tutar, aylık token miktarı × birim fiyat olarak hesaplanır.</p>
        <div className="-mt-[10px] flex justify-end">
          <Button type="button" variant="outline" disabled={kaydediliyor} onClick={() => {
            const anahtar = `yeni-${++yeniPaketSayaci.current}`;
            setPaketSatirlari(satirlar => [...satirlar, { anahtar, id: null, ad: "", token: "", birim: "" }]);
          }}>Paket Ekle</Button>
        </div>
        <div className={local.hizmetler}>
        <h3 className={local.tabloBasligi}>Hizmet Token-Fiyat Listesi</h3>
        <div className={styles.tableWrap}><table className={local.tablo} aria-label="Hizmet fiyatları">
          <thead><tr><th>Kalem</th><th>Hizmet / Parametre</th><th>Birim</th><th>Değer</th></tr></thead>
          <tbody>{FIYAT_KALEMLERI.filter(k => !k.anahtar.startsWith("paket_") && !k.anahtar.startsWith("kko_") && !k.anahtar.startsWith("viva_") && k.grup !== "Esnek Paket").map(k => <tr key={k.anahtar}><td>{k.grup}</td><th scope="row"><label htmlFor={`fiyat-${k.anahtar}`}>{k.ad}</label></th><td>{k.birim}</td><td><input id={`fiyat-${k.anahtar}`} type="text" inputMode="decimal" maxLength={24} value={taslak[k.anahtar] ?? ""} disabled={kaydediliyor}
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
          <p><strong>Kayıtlı aylık paketler:</strong> {tarife.abonelik_paketleri.map(p => `${p.ad}: ${para.format(p.aylik)}`).join(" · ") || "Satışta paket yok."}</p>
          <p>Fiyatlar KDV hariçtir. Hesap özeti kayıtlı değerlere aittir. Viva ve banner bu tarifeyi merkezi bağlantı SQL kurulumu tamamlandıktan sonra kullanır.</p>
        </div>
        <div className={local.eylemler}><span>Tarife sürümü: {tarife.surum}</span><Button type="button" disabled={kaydediliyor} onClick={() => void kaydet()}>{kaydediliyor ? "Kaydediliyor…" : "Fiyatları Kaydet"}</Button></div>
      </>}
    </div>
  </section>;
}
