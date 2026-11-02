"use client";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState } from "react";
import { Database, Download, RefreshCw, Trash2 } from "lucide-react";
import type { Firma } from "../_types";
import type { useAdminPanel } from "../_hooks/useAdminPanel";
import styles from "../admin.module.css";
import local from "./firma-islemleri.module.css";

const SAYIM_SATIRLARI = [
  ["yayin", "Kapsamdaki yayın"],
  ["izleme", "İzleme kaydı"],
  ["puan_kaydi", "Puan / kayıp kaydı"],
  ["oneri", "Öneri"],
  ["challenge", "Challenge"],
  ["gonderim", "Eczanem gönderimi"],
  ["push", "Push kaydı"],
  ["bildirim", "Bildirim"],
  ["siparis_silinecek", "Silinecek sipariş"],
] as const;

type Sayim = Record<(typeof SAYIM_SATIRLARI)[number][0] | "siparis_korunacak", number>;
type Islem = "export" | "sayim" | "temizlik";
type AdminIslemleri = Pick<ReturnType<typeof useAdminPanel>, "handleExport" | "hata" | "basari">;
interface Props { firma: Firma; admin: AdminIslemleri }

export default function FirmaIslemleri({ firma, admin }: Props) {
  const saltOkunur = useFirmaSaltOkunur();
  const [islem, setIslem] = useState<Islem | null>(null);
  const [onizleme, setOnizleme] = useState<Sayim | null>(null);
  const [veriOnayi, setVeriOnayi] = useState("");
  const [mesaj, setMesaj] = useState<{ hata: boolean; metin: string } | null>(null);
  const aktif = useRef(true);
  const kilit = useRef(false);
  const sayimIptal = useRef<AbortController | null>(null);

  useEffect(() => {
    aktif.current = true;
    return () => { aktif.current = false; sayimIptal.current?.abort(); };
  }, []);

  function baslat(tur: Islem) {
    if (kilit.current) return false;
    kilit.current = true;
    setIslem(tur);
    return true;
  }

  function bitir() {
    kilit.current = false;
    if (aktif.current) setIslem(null);
  }

  async function veriIslemi(tur: "sayim" | "sil", signal?: AbortSignal) {
    const res = await fetch("/admin/api/veri-sil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ islem: tur, mod: "firma", firma_id: firma.firma_id }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw { d: data };
    if (data.durum !== (tur === "sayim" ? "onizleme" : "silindi")) throw new Error("İşlem sonucu doğrulanamadı.");
    return data;
  }

  function hatayiGoster(error: unknown, varsayilan: string) {
    if (!aktif.current) return;
    const d = (error as { d?: { hata?: string; adim?: string; detay?: string } })?.d;
    const metin = d?.hata ?? (error instanceof Error ? error.message : varsayilan);
    setMesaj({ hata: true, metin });
    admin.hata(metin, d?.adim, d?.detay);
  }

  async function onizle() {
    if (!baslat("sayim")) return;
    setOnizleme(null);
    setVeriOnayi("");
    setMesaj(null);
    const kontrol = new AbortController();
    sayimIptal.current = kontrol;
    try {
      const data = await veriIslemi("sayim", kontrol.signal);
      if (!aktif.current) return;
      const alanlar = [...SAYIM_SATIRLARI.map(([alan]) => alan), "siparis_korunacak"] as const;
      if (!alanlar.every(alan => Number.isSafeInteger(data[alan]) && data[alan] >= 0)) throw new Error("Kayıt sayıları alınamadı. Önizlemeyi tekrar deneyin.");
      setOnizleme(data);
    } catch (error) {
      hatayiGoster(error, "Önizleme alınamadı. Tekrar deneyin.");
    } finally {
      sayimIptal.current = null;
      bitir();
    }
  }

  async function verileriSil() {
    if (!onizleme || veriOnayi.trim() !== firma.firma_adi.trim() || !baslat("temizlik")) return;
    setMesaj(null);
    try {
      const data = await veriIslemi("sil");
      if (!aktif.current) return;
      const metin = `${firma.firma_adi} verileri temizlendi. Kapsamdaki yayın: ${data.yayin_sayisi ?? 0}, silinen sipariş: ${data.silinen_siparis ?? 0}.`;
      setOnizleme(null);
      setVeriOnayi("");
      setMesaj({ hata: false, metin });
      admin.basari(metin);
    } catch (error) {
      hatayiGoster(error, "Veriler silinemedi. Tekrar deneyin.");
    } finally { bitir(); }
  }

  async function disaAktar() {
    if (!baslat("export")) return;
    try { await admin.handleExport(firma); }
    catch { admin.hata("Firma verileri dışa aktarılamadı. Tekrar deneyin."); }
    finally { bitir(); }
  }

  const mesgul = islem !== null;

  return <div className={styles.stack}>
    <section className={styles.card} aria-labelledby="admin-firma-export-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-firma-export-baslik"><Download />Dışa Aktarma</h2><p>{firma.firma_adi} verilerini Excel dosyası olarak indirin</p></div></div>
      <div className={`${styles.cardBody} ${local.export}`}>
        <p className={local.description}>Firma ve organizasyon bilgileri, yayın ve öğrenme geçmişi, kişi ve eczane bazında kalan haklar, siparişler, mutabakatlar, Viva ve token kayıtları ayrı çalışma sayfalarında yer alır.</p>
        <button type="button" className={`${styles.button} ${styles.primary}`} disabled={saltOkunur || mesgul} onClick={() => void disaAktar()}><Download />{islem === "export" ? "Hazırlanıyor…" : "Excel’e aktar"}</button>
      </div>
    </section>

    <section className={styles.card} aria-labelledby="admin-firma-temizlik-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-firma-temizlik-baslik"><Database />Firma Verilerini Temizleme</h2><p>Seçili firmanın üretilen verileri için kapsam önizlemesi ve silme</p></div></div>
      <div className={styles.cardBody}>
        <p className={local.scope}>Yalnız <strong>{firma.firma_adi}</strong> firmasının kapsamdaki üretilen verileri silinir. Firma kaydı, kullanıcı ve organizasyon yapısı, ürün içeriği ve bitmiş siparişler korunur. <strong>Silme işlemi geri alınamaz.</strong></p>
        <div className={styles.formActions}><button type="button" className={styles.button} disabled={saltOkunur || mesgul} onClick={() => void onizle()}><RefreshCw />{islem === "sayim" ? "Kayıtlar sayılıyor…" : onizleme ? "Önizlemeyi yenile" : "Silinecek kayıtları önizle"}</button></div>
        {mesaj && <p className={`${styles.notice} ${local.message}`} data-error={mesaj.hata} role={mesaj.hata ? "alert" : "status"}>{mesaj.metin}</p>}
        {onizleme && <div className={local.preview}>
          <h3>İşlem Kapsamı</h3>
          <dl className={local.counts}>{SAYIM_SATIRLARI.map(([alan, ad]) => <div key={alan}><dt>{ad}</dt><dd>{onizleme[alan].toLocaleString("tr-TR")}</dd></div>)}<div className={local.preserved}><dt>Korunacak sipariş</dt><dd>{onizleme.siparis_korunacak.toLocaleString("tr-TR")}</dd></div></dl>
          <form className={local.confirm} onSubmit={e => { e.preventDefault(); void verileriSil(); }}>
            <label className={styles.field} htmlFor="admin-firma-veri-onay">Veri temizliğini onaylamak için {firma.firma_adi} yazın<input id="admin-firma-veri-onay" className={styles.input} value={veriOnayi} disabled={saltOkunur || mesgul} autoComplete="off" onChange={e => setVeriOnayi(e.target.value)} /></label>
            <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.danger}`} disabled={saltOkunur || mesgul || veriOnayi.trim() !== firma.firma_adi.trim()}><Trash2 />{islem === "temizlik" ? "Veriler siliniyor…" : "Firma verilerini kalıcı olarak sil"}</button><button type="button" className={styles.button} disabled={saltOkunur || mesgul} onClick={() => { setOnizleme(null); setVeriOnayi(""); setMesaj(null); }}>Vazgeç</button></div>
          </form>
        </div>}
      </div>
    </section>

  </div>;
}
