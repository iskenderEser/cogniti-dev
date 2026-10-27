"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import styles from "./musteri-talep.module.css";

export default function MusteriTalepFormu({ secim, onKapat }: { secim: string | null; onKapat: () => void }) {
  const [busy, setBusy] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  function kapat() { if (busy) return; setMesaj(""); setHata(""); onKapat(); }
  async function gonder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!secim || busy) return;
    setBusy(true); setHata("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/musteri-talebi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firma: f.get("firma"), ad: f.get("ad"), eposta: f.get("eposta"), telefon: f.get("telefon"), not: f.get("not"), website: f.get("website"), secim }) });
      const d = await r.json() as { mesaj?: string; hata?: string };
      if (!r.ok) throw new Error(d.hata || "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
      setMesaj(d.mesaj || "Talebiniz alındı, sizinle iletişime geçeceğiz.");
    } catch (err) { setHata(err instanceof Error ? err.message : "Talebiniz gönderilemedi. Lütfen tekrar deneyin."); }
    finally { setBusy(false); }
  }
  return <Dialog.Root open={secim !== null} onOpenChange={acik => { if (!acik) kapat(); }}><Dialog.Portal><Dialog.Overlay className={styles.overlay}/><Dialog.Content className={styles.dialog} onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onPointerDownOutside={e => { if (busy) e.preventDefault(); }}>
    <div className={styles.header}><Dialog.Title className={styles.title}>Müşteri talep formu</Dialog.Title><Dialog.Close className={styles.close} aria-label="Kapat" disabled={busy}><X size={20}/></Dialog.Close></div>
    {mesaj ? <div className={styles.success} role="status"><p>{mesaj}</p><button type="button" onClick={kapat}>Kapat</button></div> : <form onSubmit={gonder} className={styles.form}>
      <Dialog.Description className={styles.description}>Bilgilerinizi bırakın, sizinle iletişime geçelim.</Dialog.Description>
      <label>Firmanızın Adı<input name="firma" required maxLength={150} autoComplete="organization" /></label>
      <label>Adınız Soyadınız<input name="ad" required maxLength={150} autoComplete="name" /></label>
      <div className={styles.row}><label>E-postanız<input name="eposta" type="email" required maxLength={254} autoComplete="email" /></label><label>Cep Telefon Numaranız<input name="telefon" type="tel" required maxLength={30} minLength={10} autoComplete="tel" /></label></div>
      <label>İlgilenilen seçenek<input value={secim ?? ""} readOnly /></label>
      <label>Eklemek istediğiniz bilgi <span>(isteğe bağlı)</span><textarea name="not" maxLength={2000} rows={3}/></label>
      <div className={styles.trap} aria-hidden="true"><label>Web sitesi<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <p className={styles.contact}>Dilerseniz <a href="tel:+905324333145">0532 433 31 45</a> numaralı telefondan İskender’e ulaşabilirsiniz.</p>
      {hata && <p className={styles.error} role="alert">{hata}</p>}
      <div className={styles.actions}><Dialog.Close type="button" disabled={busy} className={styles.cancel}>Vazgeç</Dialog.Close><button type="submit" disabled={busy} className={styles.submit}>{busy ? "Gönderiliyor…" : "Gönder"}</button></div>
    </form>}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
