"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Coins, CreditCard, History, RefreshCw, Wallet } from "lucide-react";
import styles from "../admin.module.css";
import local from "./token-yonetimi.module.css";
import TokenGonderileri from "./TokenGonderileri";

type Data = {
  hesap: { paket_turu: string; aylik_paket_miktari: number | null; onay_yetkili_id: string | null; token_pasif_at: string | null; token_pasif_neden: string | null } | null;
  bakiye: { net_bakiye: number; paket_asimi: number } | null;
};
const num = (value: number) => value.toLocaleString("tr-TR");

export default function TokenYonetimi({ firmaId }: { firmaId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [yenileme, setYenileme] = useState(0);
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
      if (active.current && !controller.signal.aborted) { setData(result); setYenileme(n => n + 1); }
    } catch { if (active.current && !controller.signal.aborted) { setError("Token bilgileri alınamadı. Tekrar deneyin."); } }
    finally { if (readController.current === controller) { locked.current = false; if (active.current) setLoading(false); } }
  }, [load]);

  useEffect(() => {
    active.current = true;
    void refresh();
    return () => { active.current = false; readController.current?.abort(); locked.current = false; };
  }, [refresh]);

  return <div className={styles.stack} aria-label="Token Kullanım Listesi" aria-busy={loading}>
    <section className={styles.card} aria-labelledby="admin-token-hesap-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-token-hesap-baslik"><Wallet />Hesap Özeti</h2><p>Seçili firmanın önceki token hesabı ve bakiye kayıtları</p></div><button type="button" className={styles.button} disabled={loading} onClick={() => void refresh()}><RefreshCw />{loading ? "Yenileniyor…" : "Yenile"}</button></div>
      <div className={styles.cardBody}>
        {error && <p role="alert" className={`${styles.notice} ${local.message} ${local.error}`}>{error}</p>}
        {!data ? loading ? <p className={local.description} role="status">Token bilgileri yükleniyor…</p> : <p className={local.description}>Bilgileri yeniden almak için Yenile düğmesini kullanın.</p> : !data.hesap ? (
          <p className={local.description}>Bu firma için önceki token hesabı kaydı bulunmuyor.</p>
        ) : <>
          <dl className={local.summary}>
            <div><dt><CreditCard />Paket</dt><dd className={local.package}>{data.hesap.paket_turu === "aylik" ? `Aylık ${num(data.hesap.aylik_paket_miktari ?? 0)} token` : "Kullandığın Kadar Öde"}</dd><dd className={local.detail}>{data.hesap.paket_turu === "aylik" ? "Aylık token paketi" : "Aylık 1.500 token · Kalan devretmez"}</dd></div>
            <div><dt><Coins />Mevcut bakiye</dt><dd>{data.bakiye ? num(data.bakiye.net_bakiye) : "—"}<span> token</span></dd><dd className={local.detail}>Net token bakiyesi</dd></div>
            <div><dt><History />Paket aşımı</dt><dd>{data.bakiye ? num(data.bakiye.paket_asimi) : "—"}<span> token</span></dd><dd className={local.detail}>Hesaba yansıyan paket aşımı</dd></div>
          </dl>
          {data.hesap.token_pasif_neden === "token_bitti" && <p role="status" className={`${styles.notice} ${local.message} ${local.error}`}>Firma önceki token kuralıyla pasife alındı. Yeni aylık kural kurulduktan sonra durumunu kontrol edin.</p>}
        </>}
      </div>
    </section>

    {data?.hesap && <TokenGonderileri key={firmaId} firmaId={firmaId} yenileme={yenileme} />}
  </div>;
}
