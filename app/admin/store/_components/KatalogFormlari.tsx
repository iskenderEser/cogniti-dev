"use client";

/* eslint-disable @next/next/no-img-element -- Yönetim ekranındaki yüklenen görsel önizlemesi. */
import { Dialog } from "radix-ui";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ImagePlus, Save, X } from "lucide-react";
import { minimumSiparisTlGecerliMi } from "@/lib/tclub/store/katalog";
import type { UrunGosterim } from "../_types";
import { katalogIstegi } from "../_hooks/useFirmaStoreKatalogu";
import s from "./katalog.module.css";

export function KatalogPenceresi({ title, description, busy = false, onClose, children }: {
  title: string; description: string; busy?: boolean; onClose: () => void; children: ReactNode;
}) {
  const previousFocus = useRef<Element | null>(typeof document === "undefined" ? null : document.activeElement);
  const content = useRef<HTMLDivElement>(null);
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className={s.overlay} />
      <Dialog.Content ref={content} className={s.dialog} onOpenAutoFocus={event => { const field = content.current?.querySelector<HTMLInputElement>("form input:not([type=file]):not([type=checkbox]), form textarea, form select"); if (field) { event.preventDefault(); field.focus(); } }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}
        onInteractOutside={event => event.preventDefault()}
        onCloseAutoFocus={event => { event.preventDefault(); if (previousFocus.current instanceof HTMLElement && previousFocus.current.isConnected) previousFocus.current.focus(); }}>
        <div className={s.header}><div><Dialog.Title className={s.dialogTitle}>{title}</Dialog.Title>
          <Dialog.Description className={s.dialogDescription}>{description}</Dialog.Description></div>
          <button type="button" className={s.button} disabled={busy} aria-label="Pencereyi kapat" onClick={onClose}><X /></button>
        </div>{children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function CekFormu({ urun, onClose, onSaved }: {
  urun: UrunGosterim | null; onClose: () => void; onSaved: (message: string) => Promise<void>;
}) {
  const id = useId();
  const [form, setForm] = useState({ ad: urun?.ad ?? "", aciklama: urun?.aciklama ?? "", minimum: String(urun?.minimum_siparis_tl ?? ""), stok: String(urun?.stok ?? 0), aktif_mi: urun?.aktif_mi ?? true, gorsel_url: urun?.gorsel_url ?? null });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(urun?.gorsel_url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState("");
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  const change = (key: keyof typeof form, value: string | boolean | null) => { setForm(old => ({ ...old, [key]: value })); setError(""); setInvalid(""); };
  function chooseFile(selected?: File) {
    if (!selected || lock.current) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 2 * 1024 * 1024 || selected.size === 0) { setError("JPEG, PNG veya WebP biçiminde, en fazla 2 MB bir görsel seçin."); return; }
    setFile(selected); setPreview(URL.createObjectURL(selected)); setError("");
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const minimum = Number(form.minimum), stok = Number(form.stok);
    const bad = !form.ad.trim() ? ["ad", "Çek adı zorunludur."] : !minimumSiparisTlGecerliMi(minimum) ? ["minimum", "Minimum tutarı sıfırdan büyük, en fazla iki ondalık haneli girin."] : !Number.isInteger(stok) || stok < 0 || stok > 2147483647 ? ["stok", "Stok için geçerli bir sıfır veya pozitif tam sayı girin."] : null;
    if (bad) { setInvalid(bad[0]); setError(bad[1]); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      let url = form.gorsel_url;
      if (file) {
        const body = new FormData(); body.append("dosya", file);
        const upload = await katalogIstegi("/admin/store/api/upload", { method: "POST", body });
        if (typeof upload.url !== "string" || !upload.url) throw new Error("Görsel yüklenemedi.");
        url = upload.url;
        // Kayıt başarısız olursa aynı görseli ikinci kez yükleme.
        setForm(old => ({ ...old, gorsel_url: url })); setFile(null);
      }
      await katalogIstegi("/admin/store/api/urun", { method: urun ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(urun ? { urun_id: urun.urun_id } : {}), ad: form.ad.trim(), aciklama: form.aciklama.trim(), minimum_siparis_tl: minimum, stok, aktif_mi: form.aktif_mi, gorsel_url: url }) });
      await onSaved(urun ? "Çek güncellendi." : "Çek kataloğa eklendi."); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Kayıt tamamlanamadı. Tekrar deneyin."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <KatalogPenceresi title={urun ? "Çeki düzenle" : "Yeni hediye çeki"} description="Çekin merkezî bilgilerini tanımlayın. Firmalar bu katalogdan seçim yapar ve kendi Baz Puanını belirler." busy={busy} onClose={onClose}>
    <form className={s.form} onSubmit={save} aria-busy={busy}>
      <div className={s.upload} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); chooseFile(e.dataTransfer.files[0]); }}>
        <div className={s.preview}>{preview ? <img src={preview} alt="Çek görseli önizlemesi" /> : <ImagePlus size={32} />}</div>
        <div><div className={s.actions}><button type="button" className={s.button} disabled={busy} onClick={() => input.current?.click()}><ImagePlus />{preview ? "Görseli değiştir" : "Görsel seç"}</button>
          {preview && <button type="button" className={`${s.button} ${s.danger}`} disabled={busy} onClick={() => { setFile(null); setPreview(""); change("gorsel_url", null); }}>Kaldır</button>}</div>
          <p className={s.hint}>JPEG, PNG, WebP · En fazla 2 MB<br />Dosya seçin veya bu alana sürükleyin.</p>
        </div><input ref={input} type="file" hidden aria-label="Çek görseli dosyası" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      <label className={s.field} htmlFor={`${id}-name`}>Çek adı *<input id={`${id}-name`} className={s.input} value={form.ad} maxLength={200} required disabled={busy} aria-invalid={invalid === "ad" || undefined} onChange={e => change("ad", e.target.value)} placeholder="Örn. Migros Hediye Çeki" /></label>
      <label className={s.field} htmlFor={`${id}-description`}>Açıklama<textarea id={`${id}-description`} className={s.textarea} maxLength={4000} value={form.aciklama} disabled={busy} onChange={e => change("aciklama", e.target.value)} placeholder="Çekin kullanımına ilişkin kısa açıklama" /></label>
      <div className={s.formGrid}>
        <label className={s.field} htmlFor={`${id}-minimum`}>Minimum sipariş tutarı (TL) *<input id={`${id}-minimum`} className={s.input} type="number" inputMode="decimal" min="0.01" max="9999999999.99" step="0.01" value={form.minimum} required disabled={busy} aria-invalid={invalid === "minimum" || undefined} onChange={e => change("minimum", e.target.value)} /><small>Firmanın Baz Puanına karşılık gelen çek tutarı.</small></label>
        <label className={s.field} htmlFor={`${id}-stock`}>Stok (adet) *<input id={`${id}-stock`} className={s.input} type="number" inputMode="numeric" min="0" max="2147483647" step="1" value={form.stok} required disabled={busy} aria-invalid={invalid === "stok" || undefined} onChange={e => change("stok", e.target.value)} /><small>Stok sıfır olduğunda yeni sipariş alınamaz.</small></label>
      </div>
      <label className={s.check}><input type="checkbox" checked={form.aktif_mi} disabled={busy} onChange={e => change("aktif_mi", e.target.checked)} />Firmaların seçimine açık</label>
      <p className={s.hint}>Vitrinde görünmesi için firmanın ayrıca bu çeki seçmesi ve Baz Puanını tanımlaması gerekir.</p>
      {error && <p role="alert" className={`${s.feedback} ${s.error}`}>{error}</p>}
      <div className={s.formFooter}><button type="button" className={s.button} disabled={busy} onClick={onClose}>İptal</button><button type="submit" className={`${s.button} ${s.primary}`} disabled={busy}><Save />{busy ? "Kaydediliyor…" : "Kaydet"}</button></div>
    </form>
  </KatalogPenceresi>;
}

