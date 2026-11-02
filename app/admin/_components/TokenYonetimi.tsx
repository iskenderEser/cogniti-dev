"use client";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useAuth } from "@/app/providers/AuthProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, Coins, CreditCard, History, Plus, RefreshCw, Wallet } from "lucide-react";
import styles from "../admin.module.css";
import local from "./token-yonetimi.module.css";
import TokenGonderileri from "./TokenGonderileri";

type Data = {
  hesap: { paket_turu: string; aylik_paket_miktari: number | null; onay_yetkili_id: string | null; token_pasif_at: string | null; token_pasif_neden: string | null } | null;
  bakiye: { net_bakiye: number; paket_asimi: number } | null;
  yuklemeler: { yukleme_id: string; miktar: number; yukleme_turu: string; aciklama: string | null; created_at: string }[];
  tuketimler: { tuketim_id: string; gonderen_turu: string; gonderen_id: string; alici_turu: string; alici_kimligi: string; islem_turu: string; kaynak_id: string; miktar: number; asim_miktari: number; created_at: string }[];
  kullanicilar: { kullanici_id: string; ad: string; soyad: string; rol: string }[];
};
const num = (value: number) => value.toLocaleString("tr-TR");
const date = (value: string) => new Date(value).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
const PAKET_MIKTARLARI = [10000, 30000, 75000];
const YUKLEME_ADLARI: Record<string, string> = { aylik_paket: "Aylık paket", kko: "KKÖ", admin_duzeltme: "Admin yüklemesi" };

export default function TokenYonetimi({ firmaId, gorunum = "paketler" }: { firmaId: string; gorunum?: "paketler" | "kullanim" }) {
  const saltOkunur = useFirmaSaltOkunur();
  const { kullanici } = useAuth();
  const hesapYazabilir = !saltOkunur && kullanici?.rol === "admin";
  const paketSayfasi = gorunum === "paketler";
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [yenileme, setYenileme] = useState(0);
  const [paket, setPaket] = useState("kullandigin_kadar_ode");
  const [paketMiktari, setPaketMiktari] = useState(10000);
  const [miktar, setMiktar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const pending = useRef<{ fingerprint: string; key: string } | null>(null);
  const active = useRef(true);
  const locked = useRef(false);
  const readController = useRef<AbortController | null>(null);
  const url = `/admin/api/firmalar/${firmaId}/token`;

  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch(url, { cache: "no-store", signal });
    if (!response.ok) throw new Error("Token bilgileri alınamadı. Tekrar deneyin.");
    const result = await response.json() as Data;
    return result;
  }, [url]);

  const refresh = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    const controller = new AbortController();
    readController.current = controller;
    setLoading(true);
    setError("");
    try {
      const result = await load(controller.signal);
      if (active.current && !controller.signal.aborted) { setData(result); setLoadFailed(false); setYenileme(n => n + 1); }
    } catch { if (active.current && !controller.signal.aborted) { setLoadFailed(true); setError("Token bilgileri alınamadı. Tekrar deneyin."); } }
    finally { if (readController.current === controller) { locked.current = false; if (active.current) setLoading(false); } }
  }, [load]);

  useEffect(() => {
    active.current = true;
    void refresh();
    return () => { active.current = false; readController.current?.abort(); locked.current = false; };
  }, [refresh]);

  async function submit(payload: Record<string, unknown>) {
    if (!paketSayfasi || locked.current || loadFailed || !data) return;
    locked.current = true;
    setError(""); setInfo(""); setBusy(true);
    try {
      const fingerprint = JSON.stringify(payload);
      if (!pending.current || pending.current.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() };
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, anahtar: pending.current.key }) });
      const result = await response.json();
      if (!active.current) return;
      if (!response.ok) throw new Error(result.hata ?? result.mesaj ?? "İşlem tamamlanamadı.");
      pending.current = null;
      setInfo("İşlem kaydedildi.");
      if (payload.islem === "yukle") { setMiktar(""); setAciklama(""); }
      const controller = new AbortController();
      readController.current = controller;
      try {
        const refreshed = await load(controller.signal);
        if (active.current && !controller.signal.aborted) { setData(refreshed); setLoadFailed(false); }
      } catch { if (active.current && !controller.signal.aborted) { setLoadFailed(true); setError("İşlem kaydedildi, ancak bilgiler yenilenemedi. Yenile düğmesiyle tekrar deneyin."); } }
    } catch (e) { if (active.current) setError(e instanceof Error ? e.message : "İşlem tamamlanamadı."); }
    finally { locked.current = false; if (active.current) setBusy(false); }
  }

  const disabled = busy || loading || loadFailed;
  const tokenMiktari = Number(miktar);
  const yuklemeGecerli = Number.isSafeInteger(tokenMiktari) && tokenMiktari >= 1 && tokenMiktari <= 10000000 && Boolean(aciklama.trim()) && aciklama.length <= 500;
  return <div className={styles.stack} aria-label={paketSayfasi ? "Abonelik Paketleri" : "Token Kullanım Listesi"} aria-busy={busy || loading}>
    <section className={styles.card} aria-labelledby="admin-token-hesap-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-token-hesap-baslik"><Wallet />Hesap Özeti</h2><p>Seçili firmanın abonelik paketi ve mevcut token bakiyesi</p></div><button type="button" className={styles.button} disabled={busy || loading} onClick={() => void refresh()}><RefreshCw />{loading ? "Yenileniyor…" : "Yenile"}</button></div>
      <div className={styles.cardBody}>
        {error && <p role="alert" className={`${styles.notice} ${local.message} ${local.error}`}>{error}</p>}
        {info && <p role="status" className={`${styles.notice} ${local.message}`}>{info}</p>}
        {!data ? loading ? <p className={local.description} role="status">Token bilgileri yükleniyor…</p> : <p className={local.description}>Bilgileri yeniden almak için Yenile düğmesini kullanın.</p> : !data.hesap ? <>
          <p className={local.description}>Bu firma için henüz token hesabı açılmadı.</p>
          {paketSayfasi && hesapYazabilir && <form className={local.form} onSubmit={e => { e.preventDefault(); if (!disabled) void submit({ islem: "hesap_ac", paket, miktar: paket === "aylik" ? paketMiktari : null }); }}>
            <div className={styles.formGrid}><label className={styles.field} htmlFor="token-paket">Paket<select id="token-paket" className={styles.input} disabled={disabled} value={paket} onChange={e => setPaket(e.target.value)}><option value="kullandigin_kadar_ode">Kullandığın Kadar Öde</option><option value="aylik">Aylık paket</option></select></label>
              {paket === "aylik" && <label className={styles.field} htmlFor="token-paket-miktar">Aylık token<select id="token-paket-miktar" className={styles.input} disabled={disabled} value={paketMiktari} onChange={e => setPaketMiktari(Number(e.target.value))}>{PAKET_MIKTARLARI.map(n => <option key={n} value={n}>{num(n)}</option>)}</select></label>}</div>
            <p className={local.description}>{paket === "aylik" ? "Seçilen miktar ilk dönem için yüklenir." : "Her ay 1.500 token tanımlanır. Kullanılmayan tokenlar sonraki aya devretmez."}</p>
            <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={disabled}><Plus />{busy ? "Hesap açılıyor…" : "Token hesabını aç"}</button></div>
          </form>}
        </> : <>
          <dl className={local.summary}>
            <div><dt><CreditCard />Paket</dt><dd className={local.package}>{data.hesap.paket_turu === "aylik" ? `Aylık ${num(data.hesap.aylik_paket_miktari ?? 0)} token` : "Kullandığın Kadar Öde"}</dd><dd className={local.detail}>{data.hesap.paket_turu === "aylik" ? "Aylık token paketi" : "Aylık 1.500 token · Kalan devretmez"}</dd></div>
            <div><dt><Coins />Mevcut bakiye</dt><dd>{data.bakiye ? num(data.bakiye.net_bakiye) : "—"}<span> token</span></dd><dd className={local.detail}>Net token bakiyesi</dd></div>
            <div><dt><History />Paket aşımı</dt><dd>{data.bakiye ? num(data.bakiye.paket_asimi) : "—"}<span> token</span></dd><dd className={local.detail}>Hesaba yansıyan paket aşımı</dd></div>
          </dl>
          {data.hesap.token_pasif_neden === "token_bitti" && <p role="status" className={`${styles.notice} ${local.message} ${local.error}`}>Firma önceki token kuralıyla pasife alındı. Yeni aylık kural kurulduktan sonra durumunu kontrol edin.</p>}
        </>}
      </div>
    </section>

    {data?.hesap && <>
      {paketSayfasi && hesapYazabilir && data.hesap.paket_turu === "aylik" && <section className={styles.card} aria-labelledby="admin-token-yukle-baslik">
        <div className={styles.cardHeader}><div><h2 id="admin-token-yukle-baslik"><Plus />Token Yükleme</h2><p>Yükleme miktarını ve işlem açıklamasını kaydedin</p></div></div>
        <form className={`${styles.cardBody} ${local.form}`} onSubmit={e => { e.preventDefault(); if (!disabled && yuklemeGecerli) void submit({ islem: "yukle", miktar: tokenMiktari, aciklama }); }}>
          <div className={styles.formGrid}><label className={styles.field} htmlFor="token-miktar">Token miktarı<input id="token-miktar" className={styles.input} type="number" min="1" max="10000000" step="1" required value={miktar} disabled={disabled} onChange={e => setMiktar(e.target.value)} /></label><label className={styles.field} htmlFor="token-aciklama">Açıklama<input id="token-aciklama" className={styles.input} maxLength={500} required value={aciklama} disabled={disabled} onChange={e => setAciklama(e.target.value)} /></label></div>
          <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={disabled || !yuklemeGecerli}><Plus />{busy ? "Yükleniyor…" : "Token yükle"}</button></div>
        </form>
      </section>}

      {paketSayfasi && <section className={styles.card} aria-labelledby="admin-token-yuklemeler-baslik">
        <div className={styles.cardHeader}><div><h2 id="admin-token-yuklemeler-baslik"><ArrowDownToLine />Son Yüklemeler <span className={styles.count}>{data.yuklemeler.length}</span></h2><p>En fazla son 50 yükleme kaydı</p></div></div>
        {!data.yuklemeler.length ? <p className={styles.empty}>Yükleme kaydı yok.</p> : <div className={styles.tableWrap}><table className={`${local.table} ${local.loads}`} aria-label="Son token yüklemeleri"><thead><tr><th>Tarih</th><th>Yükleme türü</th><th>Açıklama</th><th className={local.number}>Token</th></tr></thead><tbody>{data.yuklemeler.map(y => <tr key={y.yukleme_id}><td className={local.date}>{date(y.created_at)}</td><td>{YUKLEME_ADLARI[y.yukleme_turu] ?? y.yukleme_turu}</td><td>{y.aciklama || "—"}</td><td className={local.number}>{num(y.miktar)}</td></tr>)}</tbody></table></div>}
      </section>}

      {!paketSayfasi && <TokenGonderileri key={firmaId} firmaId={firmaId} yenileme={yenileme} />}
    </>}
  </div>;
}
