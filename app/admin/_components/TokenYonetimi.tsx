"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnBase, inputStyle, labelStyle, rowStyle } from "../_constants";

type Data = {
  hesap: { paket_turu: string; aylik_paket_miktari: number | null; onay_yetkili_id: string | null; token_pasif_at: string | null; token_pasif_neden: string | null } | null;
  bakiye: { net_bakiye: number; paket_asimi: number } | null;
  yuklemeler: { yukleme_id: string; miktar: number; yukleme_turu: string; aciklama: string | null; created_at: string }[];
  tuketimler: { tuketim_id: string; gonderen_turu: string; gonderen_id: string; alici_turu: string; alici_kimligi: string; islem_turu: string; kaynak_id: string; asim_miktari: number; created_at: string }[];
  kullanicilar: { kullanici_id: string; ad: string; soyad: string; rol: string }[];
};
const num = (value: number) => value.toLocaleString("tr-TR");
const date = (value: string) => new Date(value).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

export default function TokenYonetimi({ firmaId }: { firmaId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [paket, setPaket] = useState("kullandigin_kadar_ode");
  const [paketMiktari, setPaketMiktari] = useState(10000);
  const [miktar, setMiktar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [yetkili, setYetkili] = useState("");
  const pending = useRef<{ fingerprint: string; key: string } | null>(null);
  const url = `/admin/api/firmalar/${firmaId}/token`;
  const load = useCallback(async () => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Token bilgileri alınamadı.");
    const result = await response.json() as Data;
    setData(result); setYetkili(result.hesap?.onay_yetkili_id ?? "");
  }, [url]);
  useEffect(() => { load().catch(() => setError("Token bilgileri alınamadı.")); }, [load]);
  async function submit(payload: Record<string, unknown>) {
    setError(""); setInfo(""); setBusy(true);
    try {
      const fingerprint = JSON.stringify(payload);
      if (!pending.current || pending.current.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() };
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, anahtar: pending.current.key }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.hata ?? result.mesaj ?? "İşlem tamamlanamadı.");
      pending.current = null;
      setInfo("İşlem kaydedildi.");
      if (payload.islem === "yukle") { setMiktar(""); setAciklama(""); }
      try { await load(); }
      catch { setError("İşlem kaydedildi, ancak bilgiler yenilenemedi. Sayfayı yenileyin."); }
    } catch (e) { setError(e instanceof Error ? e.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Token yönetimi" style={{ maxWidth: 900 }}>
    <h3>Token yönetimi</h3>
    {error && <p role="alert" style={{ color: "var(--tema-hata-metin, #b42318)" }}>{error}</p>}
    {info && <p role="status">{info}</p>}
    {!data ? <p>Bilgiler yükleniyor...</p> : !data.hesap ? <>
      <p>Bu firma için henüz token hesabı açılmadı.</p>
      <div style={rowStyle}><label style={labelStyle} htmlFor="token-paket">Paket</label><select id="token-paket" style={inputStyle} value={paket} onChange={e => setPaket(e.target.value)}><option value="kullandigin_kadar_ode">Kullandığın Kadar Öde</option><option value="aylik">Aylık paket</option></select></div>
      {paket === "aylik" && <div style={rowStyle}><label style={labelStyle} htmlFor="token-paket-miktar">Aylık token</label><select id="token-paket-miktar" style={inputStyle} value={paketMiktari} onChange={e => setPaketMiktari(Number(e.target.value))}>{[10000,30000,75000].map(n => <option key={n} value={n}>{num(n)}</option>)}</select></div>}
      <p>{paket === "aylik" ? "Seçilen miktar ilk dönem için yüklenir." : "Başlangıçta 1.500 süresiz token yüklenir."}</p>
      <button style={btnBase} disabled={busy} onClick={() => submit({ islem: "hesap_ac", paket, miktar: paket === "aylik" ? paketMiktari : null })}>Hesabı aç</button>
    </> : <>
      <p>Paket: <strong>{data.hesap.paket_turu === "aylik" ? `Aylık ${num(data.hesap.aylik_paket_miktari ?? 0)} token` : "Kullandığın Kadar Öde"}</strong></p>
      {data.hesap.token_pasif_neden === "token_bitti" && <p role="status" style={{ color: "#b42318" }}>Firma, token bakiyesi bittiği için {data.hesap.token_pasif_at ? date(data.hesap.token_pasif_at) : ""} tarihinde pasife alındı. Yeniden açmak için token yükleyip firma anahtarını etkinleştirin.</p>}
      <p>Bakiye: <strong>{data.bakiye ? num(data.bakiye.net_bakiye) : "—"} token</strong>{data.bakiye && data.bakiye.paket_asimi > 0 ? ` · Paket aşımı: ${num(data.bakiye.paket_asimi)}` : ""}</p>
      {data.hesap.paket_turu === "kullandigin_kadar_ode" && <><div style={rowStyle}><label style={labelStyle} htmlFor="token-yetkili">Devam onayı</label><select id="token-yetkili" style={inputStyle} value={yetkili} onChange={e => setYetkili(e.target.value)}><option value="">Yetkili seçin</option>{data.kullanicilar.map(k => <option key={k.kullanici_id} value={k.kullanici_id}>{k.ad} {k.soyad} ({k.rol})</option>)}</select></div><button style={btnBase} disabled={busy || !yetkili || yetkili === data.hesap.onay_yetkili_id} onClick={() => submit({ islem: "yetkili", kullanici_id: yetkili })}>Yetkiliyi kaydet</button></>}
      <h4>Token yükle</h4>
      <div style={rowStyle}><label style={labelStyle} htmlFor="token-miktar">Miktar</label><input id="token-miktar" style={inputStyle} type="number" min="1" max="10000000" step="1" value={miktar} onChange={e => setMiktar(e.target.value)} /></div>
      <div style={rowStyle}><label style={labelStyle} htmlFor="token-aciklama">Açıklama</label><input id="token-aciklama" style={inputStyle} maxLength={500} value={aciklama} onChange={e => setAciklama(e.target.value)} /></div>
      <button style={btnBase} disabled={busy || !miktar || !aciklama.trim()} onClick={() => submit({ islem: "yukle", miktar: Number(miktar), aciklama })}>Token yükle</button>
      <h4>Son yüklemeler</h4>{data.yuklemeler.length ? <ul>{data.yuklemeler.map(y => <li key={y.yukleme_id}>{date(y.created_at)} · {num(y.miktar)} token · {y.aciklama || y.yukleme_turu}</li>)}</ul> : <p>Yükleme kaydı yok.</p>}
      <h4>Son tüketimler</h4>{data.tuketimler.length ? <ul>{data.tuketimler.map(t => <li key={t.tuketim_id}>{date(t.created_at)} · {t.islem_turu} · Gönderen: {t.gonderen_id} · Alıcı: {t.alici_kimligi}{t.asim_miktari ? " · Paket aşımı" : ""}</li>)}</ul> : <p>Tüketim kaydı yok.</p>}
    </>}
  </section>;
}
