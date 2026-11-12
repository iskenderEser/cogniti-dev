"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import styles from "../admin.module.css";
import local from "./esnek-proforma.module.css";

export type Taraf = { unvan: string; adres: string; vergi_dairesi: string; vergi_numarasi: string };
const tarih = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" });

export default function CekProforma({ veri, belge, yol, donemAdi, baslik, yenile, children }: {
  veri: { onay_anahtari: string | null; onay: { ad: string; tarih: string } | null };
  belge: { belge_no: string; duzenleyen: Taraf; alici: Taraf };
  yol: string; donemAdi: string; baslik: string; yenile: () => void; children: ReactNode;
}) {
  const [belgeAcik, setBelgeAcik] = useState(false);
  const [onayAcik, setOnayAcik] = useState(false);
  const [hata, setHata] = useState("");
  const [kaydediyor, setKaydediyor] = useState(false);
  const kilit = useRef(false);

  async function onayla() {
    if (kilit.current || !veri.onay_anahtari) return;
    kilit.current = true;
    setKaydediyor(true);
    setHata("");
    try {
      const yanit = await fetch(yol, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ onayAnahtari: veri.onay_anahtari }),
      });
      const sonuc = await yanit.json();
      if (!yanit.ok || !sonuc.onay) throw new Error(sonuc.hata ?? "Onay doğrulanamadı.");
      setOnayAcik(false);
      yenile();
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Onay kaydedilemedi.");
    } finally {
      kilit.current = false;
      setKaydediyor(false);
    }
  }

  return <>
    <div className={`${styles.cardBody} flex flex-wrap items-center justify-end gap-3`}>
      {veri.onay && <span className={local.durum}>✓ Onaylandı<small>Firma Onayı</small></span>}
      <Button variant="outline" aria-expanded={belgeAcik} onClick={() => setBelgeAcik(acik => !acik)}>Proforma</Button>
    </div>
    {belgeAcik && <div className={styles.cardBody}>
    <section className={local.belge} aria-label={`${baslik} proforma faturası`}>
      <div className={local.belgeBaslik}>
        <div><h3>PROFORMA FATURA</h3><p>{baslik} · {donemAdi}</p></div>
        <div className={local.referans}><strong>{belge.belge_no}</strong>
          {veri.onay && <p>{tarih.format(new Date(veri.onay.tarih))}</p>}</div>
      </div>
      <div className={local.taraflar}>
        {[{ ad: "DÜZENLEYEN", taraf: belge.duzenleyen }, { ad: "ALICI", taraf: belge.alici }].map(({ ad, taraf }) =>
          <div key={ad}><h4>{ad}</h4><strong>{taraf.unvan}</strong><p>{taraf.adres}</p><p>{taraf.vergi_dairesi} / {taraf.vergi_numarasi}</p></div>)}
      </div>
      {children}
      <div className={`${local.notlar} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          {veri.onay && <p>{veri.onay.ad} · {tarih.format(new Date(veri.onay.tarih))}</p>}
          <p>Bilgi amaçlıdır, resmi belge yerine geçmez.</p>
        </div>
        {veri.onay_anahtari && <Button className="ml-auto" onClick={() => { setHata(""); setOnayAcik(true); }}>Onayla</Button>}
      </div>
    </section>
    </div>}
    <AlertDialog open={onayAcik} onOpenChange={acik => { if (!kilit.current) setOnayAcik(acik); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Proforma Fatura Onayı</AlertDialogTitle>
          <AlertDialogDescription>Onayınızdan sonra Cogniti tarafından resmi faturanız düzenlenecektir.</AlertDialogDescription>
        </AlertDialogHeader>
        {hata && <p role="alert" className={local.hata}>{hata}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={kaydediyor}>Vazgeç</AlertDialogCancel>
          <Button disabled={kaydediyor} onClick={() => void onayla()}>{kaydediyor ? "Kaydediliyor…" : "Onayla"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
