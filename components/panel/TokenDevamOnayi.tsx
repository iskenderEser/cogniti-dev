"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";

type Durum = { onay_gerekli: boolean; bakiye?: number; onay_surumu?: string };
export default function TokenDevamOnayi({ kullaniciId, pathname }: { kullaniciId: string; pathname: string }) {
  const [durum, setDurum] = useState<Durum | null>(null);
  const [acik, setAcik] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hata, setHata] = useState("");
  const ertelenen = useRef<string | null>(null);
  const guncel = useRef(true);
  const istekSurumu = useRef(0);
  const kontrol = useCallback(async () => {
    const istek = ++istekSurumu.current;
    try {
      const res = await fetch("/token/api/kko", { cache: "no-store" });
      if (!res.ok || !guncel.current) return;
      const veri = await res.json() as Durum;
      if (!guncel.current || istek !== istekSurumu.current) return;
      setDurum(veri);
      if (veri.onay_gerekli && veri.onay_surumu && ertelenen.current !== veri.onay_surumu) setAcik(true);
      if (!veri.onay_gerekli) setAcik(false);
    } catch { /* Sonraki kontrolde yeniden denenir. */ }
  }, []);
  useEffect(() => {
    guncel.current = true;
    void kontrol();
    const gorunur = () => { if (document.visibilityState === "visible") void kontrol(); };
    const timer = window.setInterval(gorunur, 30000);
    document.addEventListener("visibilitychange", gorunur);
    return () => { guncel.current = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", gorunur); };
  }, [kontrol, kullaniciId]);
  useEffect(() => { void kontrol(); }, [kontrol, pathname]);
  function ertele() {
    if (busy) return;
    ertelenen.current = durum?.onay_surumu ?? null;
    setAcik(false); setHata("");
  }
  async function onayla() {
    if (busy || !durum?.onay_surumu) return;
    setBusy(true); setHata(""); istekSurumu.current++;
    try {
      const res = await fetch("/token/api/kko", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onay_surumu: durum.onay_surumu }) });
      const data = await res.json() as { hata?: string };
      if (!res.ok) { setHata(data.hata ?? "Onay alınamadı. Lütfen tekrar deneyin."); return; }
      setAcik(false); setDurum(null); ertelenen.current = null;
    } catch { setHata("Bağlantı kurulamadı. Lütfen tekrar deneyin."); }
    finally { setBusy(false); }
  }
  const button = { borderRadius: 10, padding: "10px 16px", fontWeight: 700 } as const;
  return <>
    {durum?.onay_gerekli && !acik && <button type="button" onClick={() => { setHata(""); setAcik(true); }} style={{ position: "fixed", bottom: 20, right: 20, zIndex: 40, background: "#237ac8", color: "white", border: 0, ...button }}>Kalan {durum.bakiye} token · Devam onayı</button>}
    <Dialog.Root open={acik} onOpenChange={v => { if (!v) ertele(); }}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 100 }} />
        <Dialog.Content onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onPointerDownOutside={e => { if (busy) e.preventDefault(); }} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(440px, calc(100vw - 32px))", background: "var(--tema-pencere-zemini, white)", color: "var(--tema-metin, #172033)", padding: 24, borderRadius: 16, zIndex: 101, boxShadow: "0 14px 48px rgba(0,0,0,.2)" }}>
          <Dialog.Title style={{ fontSize: 21, fontWeight: 700 }}>Token kullanımına devam edin</Dialog.Title>
          <Dialog.Description style={{ marginTop: 12, lineHeight: 1.5 }}>Firmanızın kalan bakiyesi {durum?.bakiye} tokendır. Onayınızla birlikte hemen, 1500 token daha yüklenebilir.</Dialog.Description>
          {hata && <p role="alert" style={{ color: "#b42318", marginTop: 12 }}>{hata}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
            <button type="button" disabled={busy} onClick={ertele} style={{ ...button, background: "transparent", border: "1px solid #cbd5e1", color: "inherit" }}>Şimdi değil</button>
            <button type="button" disabled={busy} onClick={onayla} style={{ ...button, background: "#237ac8", border: 0, color: "white" }}>{busy ? "İşleniyor…" : "Onayla"}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
