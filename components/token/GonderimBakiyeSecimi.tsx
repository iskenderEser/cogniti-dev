"use client";

import { useEffect, useId, useState, useRef } from "react";
import { satinAlmaBakiyeOzetiGecerli, type SatinAlmaBakiyeOzeti } from "@/lib/satinAlma/bakiyeOzeti";
import { gonderimTokenOnizlemesiGecerli, type GonderimSecimi, type GonderimTokenOnizlemesi } from "@/lib/satinAlma/gonderimOnizleme";
import type { BakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import styles from "./gonderim-bakiye-secimi.module.css";
const num = (n: number) => n.toLocaleString("tr-TR");

/** Hesap seçimi ve sunucu önizlemesi. Gerçek gönderimi üst form başlatır. */
export default function GonderimBakiyeSecimi({ secim, onHazir }: { secim: GonderimSecimi; onHazir?: (hesap: BakiyeTuru | null) => void }) {
  const group = useId();
  const onHazirRef = useRef(onHazir);
  useEffect(() => { onHazirRef.current = onHazir; });
  const [bakiyeTuru, setBakiyeTuru] = useState<BakiyeTuru | null>(null);
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ surum: number; veri?: SatinAlmaBakiyeOzeti; hata?: string } | null>(null);
  const guncel = sonuc?.surum === yenileme ? sonuc : null;
  useEffect(() => {
    const controller = new AbortController();
    async function oku() {
      try {
        const r = await fetch("/api/token-bakiyeleri", { cache: "no-store", signal: controller.signal });
        if (!r.ok) throw new Error();
        const veri: unknown = await r.json();
        if (!satinAlmaBakiyeOzetiGecerli(veri)) throw new Error();
        if (!controller.signal.aborted) setSonuc({ surum: yenileme, veri });
      } catch {
        if (!controller.signal.aborted) setSonuc({ surum: yenileme, hata: "Bakiyeler alınamadı. Önizleme yapılamıyor." });
      }
    }
    void oku();
    return () => controller.abort();
  }, [yenileme]);
  if (!guncel) return <p role="status" className={styles.durum}>Bakiyeler yükleniyor…</p>;
  if (guncel.hata || !guncel.veri) return <p role="alert" className={styles.durum}>{guncel.hata ?? "Bakiyeler alınamadı."} <button type="button" className={styles.yenile} onClick={() => setYenileme(n => n + 1)}>Tekrar dene</button></p>;
  const veri = guncel.veri;
  const secili = bakiyeTuru === "kisisel" && !veri.kisisel ? null : bakiyeTuru;
  const anahtar = JSON.stringify({ ...secim, bakiyeTuru: secili, yenileme });
  return <section className={styles.alan} aria-label="Gönderim bakiyesi seçimi">
    <fieldset className={styles.secimler}>
      <legend>Hangi token hesabını kullanmak istersiniz?</legend>
      {veri.kisisel && veri.kisisel.toplam > 0 && <label><input type="radio" name={group} value="kisisel" checked={secili === "kisisel"} onChange={() => { onHazirRef.current?.(null); setBakiyeTuru("kisisel"); }} />Kişisel Token Hesabı {veri.kisisel.paket === "kko" && "· KKÖ"}<span>Şu an {num(veri.kisisel.kalan)} token</span></label>}
      <label><input type="radio" name={group} value="firma_ortak" checked={secili === "firma_ortak"} onChange={() => { onHazirRef.current?.(null); setBakiyeTuru("firma_ortak"); }} />Firma Token Hesabı {veri.firma_ortak.paket === "kko" && "· KKÖ"}<span>Şu an {num(veri.firma_ortak.kalan)} token</span></label>
    </fieldset>
    {secili ? <Onizleme key={anahtar} secim={secim} bakiyeTuru={secili} onHazir={onHazir} /> : <p className={styles.durum}>Önizleme için kullanmak istediğiniz bakiyeyi seçin.</p>}
    {!onHazir && <p className={styles.not}>Bu aşamada yalnız önizleme yapılır. Gönderim, token tüketimi veya rezervasyon oluşturulmaz.</p>}
  </section>;
}
function Onizleme({ secim, bakiyeTuru, onHazir }: { secim: GonderimSecimi; bakiyeTuru: BakiyeTuru; onHazir?: (hesap: BakiyeTuru | null) => void }) {
  const onHazirRef = useRef(onHazir);
  useEffect(() => { onHazirRef.current = onHazir; });
  const [yenileme, setYenileme] = useState(0);
  const [sonuc, setSonuc] = useState<{ surum: number; veri?: GonderimTokenOnizlemesi; hata?: string } | null>(null);
  const anahtar = JSON.stringify({ ...secim, bakiyeTuru });
  const guncel = sonuc?.surum === yenileme ? sonuc : null;
  useEffect(() => {
    onHazirRef.current?.(null);
    const controller = new AbortController();
    const istek = JSON.parse(anahtar);
    async function oku() {
      try {
        const r = await fetch("/api/gonderim-token-onizleme", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: controller.signal, body: anahtar });
        const veri: unknown = await r.json();
        if (!r.ok || !gonderimTokenOnizlemesiGecerli(veri) || veri.akis !== istek.akis || veri.bakiye_turu !== istek.bakiyeTuru || veri.planli !== Boolean(istek.planTarihi)) throw new Error();
        if (!controller.signal.aborted) {
          setSonuc({ surum: yenileme, veri });
          onHazirRef.current?.((veri.planli ? veri.plan_rezervasyonu_acik === true : veri.gercek_gonderim_acik) && veri.yeterli && veri.uygun_kayit > 0 ? bakiyeTuru : null);
        }
      } catch {
        if (!controller.signal.aborted) setSonuc({ surum: yenileme, hata: "Gönderim önizlemesi alınamadı. Seçiminizi kontrol edip yeniden deneyin." });
      }
    }
    void oku();
    return () => { controller.abort(); onHazirRef.current?.(null); };
  }, [anahtar, yenileme, bakiyeTuru]);
  if (!guncel) return <p className={styles.durum} role="status">Gönderim koşulları ve bakiye kontrol ediliyor…</p>;
  if (!guncel.veri) return <p className={styles.durum} role="alert">{guncel.hata} <button type="button" className={styles.yenile} onClick={() => setYenileme(n => n + 1)}>Tekrar dene</button></p>;
  const v = guncel.veri;
  return <div aria-label="Gönderim token önizlemesi">
    <dl className={styles.ozet}>
      <div><dt>Kullanılacak bakiye</dt><dd>{v.bakiye_turu === "kisisel" ? "Kişisel Token Hesabı" : "Firma Token Hesabı"}</dd></div>
      <div><dt>Uygun kayıt</dt><dd>{num(v.uygun_kayit)}</dd></div>
      <div><dt>Atlanan kayıt</dt><dd>{num(v.atlanan_kayit)}</dd></div>
      <div><dt>{v.planli ? "Ayrılacak token" : "Gereken token"}</dt><dd>{num(v.gereken_token)}</dd></div>
      <div><dt>{v.planli ? "Plan tarihinde kullanılabilir" : "Kullanılabilir bakiye"}</dt><dd>{num(v.kullanilabilir_token)}</dd></div>
      <div><dt>{v.yeterli ? "İşlem sonrası kalan" : "Eksik token"}</dt><dd>{num(v.yeterli ? v.islem_sonrasi : v.eksik_token)}</dd></div>
    </dl>
    {v.uygun_kayit === 0 && <p className={styles.durum} role="status">Seçiminizde gönderime uygun kayıt bulunmuyor.</p>}
    {!v.yeterli && <p className={styles.durum} role="status">Seçilen bakiye yetersiz. Gönderim kapsamını azaltabilir, diğer bakiyeyi seçebilir veya token satın alabilirsiniz.</p>}
    {onHazir && !(v.planli ? v.plan_rezervasyonu_acik : v.gercek_gonderim_acik) && <p className={styles.durum} role="status">Bu gönderim için hesap bağlantısı henüz etkin değil.</p>}
    <p className={styles.not}>{v.aciklama}</p>
  </div>;
}
