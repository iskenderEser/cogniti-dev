"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SadeKapsulFiltre } from "@/components/kontrol/SadeKontroller";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { satinAlimAyi, SATIN_ALIM_AYLARI } from "@/lib/satinAlma/aylikSiparisler";
import { proformaOnayiGecerli } from "@/lib/satinAlma/esnekProforma";
import { icerikAlimListesiGecerli, type IcerikAlimi, type IcerikAlimListesi } from "@/lib/satinAlma/icerikProforma";
import { SUREC4_TOAST } from "@/lib/bildirimler/toastMesajlari";
import MobilUyumluTablo from "./MobilUyumluTablo";
import styles from "../admin.module.css";
import local from "./esnek-proforma.module.css";

const basliklar = ["Tahsilat Tarihi", "İçerik", "Üretici", "Token Hesabı", "Token", "KDV Hariç Tutar", "Proforma", "Onay"];
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const tarih = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" });

export default function IcerikUretimiAlimlari({
  firmaId,
  sadeceOnayli = false,
  basari,
  hata: hataToast,
}: {
  firmaId: string;
  sadeceOnayli?: boolean;
  basari?: (mesaj: string) => void;
  hata?: (mesaj: string) => void;
}) {
  const [ay, setAy] = useState(satinAlimAyi);
  const [sayfa, setSayfa] = useState(0);
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ anahtar: string; veri: IcerikAlimListesi | null } | null>(null);
  const yol = `/admin/api/firmalar/${firmaId}/icerik-proformalar`;
  const sorgu = new URLSearchParams({ ay, sayfa: String(sayfa), onayli: sadeceOnayli ? "1" : "0" }).toString();
  const anahtar = `${yol}?${sorgu}:${yenileme}`;
  const guncel = sonuc?.anahtar === anahtar ? sonuc : null;

  useEffect(() => {
    const kontrol = new AbortController();
    async function oku() {
      try {
        const yanit = await fetch(`${yol}?${sorgu}`, { cache: "no-store", signal: kontrol.signal });
        const veri: unknown = await yanit.json();
        if (!yanit.ok || !icerikAlimListesiGecerli(veri) || veri.firma_id !== firmaId || veri.sayfa !== sayfa) throw new Error();
        if (!kontrol.signal.aborted) setSonuc({ anahtar, veri });
      } catch {
        if (!kontrol.signal.aborted) setSonuc({ anahtar, veri: null });
      }
    }
    void oku();
    return () => kontrol.abort();
  }, [anahtar, firmaId, sayfa, sorgu, yol]);

  const yenile = () => setYenileme(n => n + 1);
  const baslik = sadeceOnayli ? "İçerik Üretimi Alımı · Onaylı Proforma Faturalar" : "İçerik Üretimi Alımı";
  const veri = guncel?.veri;
  return <section className={styles.card} aria-label={baslik}>
    <div className={styles.cardHeader}><h2>{baslik}</h2></div>
    <div className={styles.cardBody}>
      <SadeKapsulFiltre etiket="Tahsilat ayları" deger={ay} onDegistir={a => { setAy(a); setSayfa(0); }}
        secenekler={SATIN_ALIM_AYLARI.map((etiket, i) => ({ etiket, deger: `${ay.slice(0, 4)}-${String(i + 1).padStart(2, "0")}` }))} />
    </div>
    {!guncel && <p className={styles.cardBody} role="status">Kayıtlar yükleniyor…</p>}
    {guncel && !veri && <div className={styles.cardBody} role="alert"><p>İçerik alımları alınamadı.</p><Button variant="outline" onClick={yenile}>Yeniden Dene</Button></div>}
    {veri && <>
      <div className={styles.tableWrap}>
        <MobilUyumluTablo basliklar={basliklar} className={local.tablo} aria-label={baslik}>
          <thead><tr>{basliklar.map(b => <th key={b} scope="col">{b}</th>)}</tr></thead>
          <tbody>
            {veri.alimlar.map(alim => <AlimSatiri key={alim.talep_id} alim={alim} yol={yol} adminOnayi={veri.admin_onayi} basari={basari} hataToast={hataToast} onYenile={yenile} />)}
            {veri.alimlar.length === 0 && <tr><td colSpan={basliklar.length}>{sadeceOnayli ? "Bu ay için onaylı proforma bulunmuyor." : "Bu ay için içerik alımı bulunmuyor."}</td></tr>}
          </tbody>
        </MobilUyumluTablo>
      </div>
      {veri.toplam > 20 && <div className={`${styles.cardBody} flex justify-end gap-3`}>
        <Button variant="outline" disabled={sayfa === 0} onClick={() => setSayfa(n => n - 1)}>Önceki</Button>
        <span>Sayfa {sayfa + 1} / {Math.ceil(veri.toplam / 20)}</span>
        <Button variant="outline" disabled={(sayfa + 1) * 20 >= veri.toplam} onClick={() => setSayfa(n => n + 1)}>Sonraki</Button>
      </div>}
    </>}
  </section>;
}

function AlimSatiri({ alim, yol, adminOnayi, basari, hataToast, onYenile }: {
  alim: IcerikAlimi; yol: string; adminOnayi: boolean;
  basari?: (mesaj: string) => void; hataToast?: (mesaj: string) => void; onYenile: () => void;
}) {
  const [belgeAcik, setBelgeAcik] = useState(false);
  const [onayAcik, setOnayAcik] = useState(false);
  const [aciklama, setAciklama] = useState("");
  const [hata, setHata] = useState("");
  const [kaydediyor, setKaydediyor] = useState(false);
  const kilit = useRef(false);
  const belge = alim.belge;

  async function onayla() {
    if (kilit.current || alim.onay || !belge || (adminOnayi && !aciklama.trim())) return;
    kilit.current = true;
    setKaydediyor(true);
    setHata("");
    try {
      const yanit = await fetch(yol, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ talepId: alim.talep_id, aciklama: aciklama.trim() }),
      });
      const veri = await yanit.json();
      if (!yanit.ok || !proformaOnayiGecerli(veri)) throw new Error(veri?.hata ?? "Onay sonucu doğrulanamadı.");
      setOnayAcik(false);
      basari?.(SUREC4_TOAST.proformaOnaylandi("icerik", veri.tur === "admin"));
      onYenile();
    } catch (error) {
      const mesaj = error instanceof Error ? error.message : "Onay kaydedilemedi.";
      if (hataToast) hataToast(mesaj); else setHata(mesaj);
    } finally {
      kilit.current = false;
      setKaydediyor(false);
    }
  }

  return <Fragment>
    <tr>
      <td>{tarih.format(new Date(alim.tarih))}</td><td>{alim.icerik}</td><td>{alim.uretici || "—"}</td>
      <td>{alim.bakiye_turu === "kisisel" ? "Kişisel Token Hesabı" : "Firma Ortak Token Hesabı"}</td>
      <td>{alim.token_adedi.toLocaleString("tr-TR")}</td><td>{belge ? para.format(belge.toplam_tutar) : "—"}</td>
      <td>{belge ? <button type="button" className={local.buton} aria-expanded={belgeAcik} onClick={() => setBelgeAcik(v => !v)}>Proforma</button> : "Tahsilat fiyatı kayıtlı değil"}</td>
      <td className={local.islem}>{alim.onay ? <span className={local.durum}>✓ Onaylandı<small>{alim.onay.tur === "admin" ? "Admin Onayı" : "Firma Onayı"}</small></span>
        : belge && <button type="button" className={`${local.buton} ${local.onayla}`} onClick={() => { setHata(""); setOnayAcik(true); }}>Onayla</button>}</td>
    </tr>
    {belgeAcik && belge && <tr><td colSpan={basliklar.length} className={local.belgeSatiri}>
      <section className={local.belge} aria-label="İçerik üretimi proforma faturası">
        <div className={local.belgeBaslik}><div><h3>PROFORMA FATURA</h3><p>{belge.hizmet} · {belge.icerik}</p></div>
          <div className={local.referans}><strong>{belge.belge_no}</strong><p>{tarih.format(new Date(belge.tarih))}</p></div>
        </div>
        <div className={local.taraflar}>
          {([{ ad: "DÜZENLEYEN", taraf: belge.duzenleyen }, { ad: "ALICI", taraf: belge.alici }]).map(({ ad, taraf }) =>
            <div key={ad}><h4>{ad}</h4><strong>{taraf.unvan}</strong><p>{taraf.adres}</p><p>{taraf.vergi_dairesi} / {taraf.vergi_numarasi}</p></div>)}
        </div>
        <dl className={local.toplamlar}>
          <div><dt>Tahsil edilen token</dt><dd>{belge.token_adedi.toLocaleString("tr-TR")}</dd></div>
          <div><dt>KKÖ birim fiyatı</dt><dd>{para.format(belge.birim_fiyat)}</dd></div>
          <div><dt>KDV hariç tutar</dt><dd>{para.format(belge.toplam_tutar)}</dd></div>
          <div><dt>KDV (%20)</dt><dd>{para.format(belge.kdv)}</dd></div>
          <div className={local.genel}><dt>Genel tutar</dt><dd>{para.format(belge.toplam_tutar + belge.kdv)}</dd></div>
        </dl>
        <div className={local.notlar}>
          {alim.onay ? <><p>{alim.onay.onaylayan} · {tarih.format(new Date(alim.onay.tarih))}</p>{alim.onay.aciklama && <p className={local.aciklama}>{alim.onay.aciklama}</p>}</> : <p>Firma onayı bekleniyor.</p>}
          <p>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
        </div>
      </section>
    </td></tr>}
    <AlertDialog open={onayAcik} onOpenChange={acik => { if (!kilit.current) setOnayAcik(acik); }}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{adminOnayi ? "Admin Onayı" : "Proforma Fatura Onayı"}</AlertDialogTitle>
          <AlertDialogDescription>{adminOnayi ? "Firma adına onay verme gerekçenizi yazın." : "Onayınızdan sonra Cogniti tarafından resmi faturanız düzenlenecektir."}</AlertDialogDescription>
        </AlertDialogHeader>
        {adminOnayi && <label className={local.modalAlan}>Açıklama *
          <textarea required maxLength={2000} value={aciklama} disabled={kaydediyor} onChange={e => setAciklama(e.target.value)} />
        </label>}
        {!hataToast && hata && <p role="alert" className={local.hata}>{hata}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={kaydediyor}>Vazgeç</AlertDialogCancel>
          <Button disabled={kaydediyor || (adminOnayi && !aciklama.trim())} onClick={() => void onayla()}>{kaydediyor ? "Kaydediliyor…" : "Onayla"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Fragment>;
}
