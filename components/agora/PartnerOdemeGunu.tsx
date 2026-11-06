"use client";

import { useRef, useState } from "react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";

export default function PartnerOdemeGunu({ endpoint, siparisId, egitimId, deger }: {
  endpoint: string; siparisId: string; egitimId: string; deger: string | null;
}) {
  const [gun, setGun] = useState(deger ?? "");
  const [kayitli, setKayitli] = useState(deger);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const kilit = useRef(false);
  const { mesajlar, basari, hata } = useHataMesaji();
  async function kaydet() {
    if (kilit.current) return;
    kilit.current = true;
    setKaydediliyor(true);
    try {
      const yanit = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siparis_id: siparisId, planlanan_odeme_gunu: gun || null, onceki_odeme_gunu: kayitli }) });
      const data: unknown = await yanit.json();
      if (!yanit.ok) throw new Error(data && typeof data === "object" && "hata" in data && typeof data.hata === "string" ? data.hata : "Ödeme günü kaydedilemedi.");
      if (!data || typeof data !== "object" || !("siparis_id" in data) || data.siparis_id !== siparisId
        || !("planlanan_odeme_gunu" in data) || data.planlanan_odeme_gunu !== (gun || null)) {
        throw new Error("Kayıt sonucu doğrulanamadı. Listeyi yenileyin.");
      }
      setKayitli(gun || null);
      basari("Planlanan ödeme günü kaydedildi.");
    } catch (e) { hata(e instanceof Error ? e.message : "Ödeme günü kaydedilemedi."); }
    finally { kilit.current = false; setKaydediliyor(false); }
  }
  return <>
    <HataMesajiContainer mesajlar={mesajlar} />
    <form onSubmit={e => { e.preventDefault(); void kaydet(); }} style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input type="date" min="0001-01-01" max="9999-12-31" value={gun} disabled={kaydediliyor}
        aria-label={`${egitimId} planlanan ödeme günü`} onChange={e => setGun(e.target.value)} />
      <button type="submit" disabled={kaydediliyor || (gun || null) === kayitli}>{kaydediliyor ? "Kaydediliyor…" : "Kaydet"}</button>
    </form>
  </>;
}
