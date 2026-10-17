// app/admin/_components/FirmaVeriSilModal.tsx
//
// Toplu/Tekil Silme — Aşama 5 (docs/toplu_tekil_silme_is_plani.md).
// Firma kartındaki "Veri Sil" butonunun modalı — TopluTekilSilModal'in firma-modu ikizi.
//   Kapsam: yalnız o firmanın ÜRETİLEN verisi (mod='firma', firma_id bağlamdan).
//   Firmanın kendisi, ürün içeriği ve bitmiş siparişleri KORUNUR.
// (Firmayı tümüyle silen "Sil" butonu ayrıdır; bu onunla karıştırılmamalı.)
// Akış: aç → Önizle (sayım) → son onay (firma adını yaz) → Sil.
// API: POST /admin/api/veri-sil  { islem:'sayim'|'sil', mod:'firma', firma_id }

"use client";

import { useState } from "react";
import type { Firma } from "../_types";
import { RENK_BORDO } from "../_constants";

interface Props {
  firma: Firma | null;
  onKapat: () => void;
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

interface Onizleme {
  yayin: number; izleme: number; puan_kaydi: number; oneri: number; challenge: number;
  gonderim: number; push: number; bildirim: number; siparis_silinecek: number; siparis_korunacak: number;
}

const SATIRLAR: [keyof Onizleme, string][] = [
  ["yayin", "Kapsamdaki yayın"],
  ["izleme", "İzleme kaydı"],
  ["puan_kaydi", "Puan/kayıp kaydı"],
  ["oneri", "Öneri"],
  ["challenge", "Challenge"],
  ["gonderim", "Eczanem gönderim"],
  ["push", "Push kaydı"],
  ["bildirim", "Bildirim"],
  ["siparis_silinecek", "Silinecek sipariş"],
];

export default function FirmaVeriSilModal({ firma, onKapat, hata, basari }: Props) {
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const [onayMetni, setOnayMetni] = useState("");
  const [loading, setLoading] = useState(false);

  if (!firma) return null;

  const sifirla = () => { setOnizleme(null); setOnayMetni(""); };
  const kapat = () => { sifirla(); onKapat(); };

  const cagir = async (islem: "sayim" | "sil") => {
    const res = await fetch("/admin/api/veri-sil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ islem, mod: "firma", firma_id: firma.firma_id }),
    });
    const d = await res.json();
    if (!res.ok) throw { d };
    return d;
  };

  const onizle = async () => {
    setLoading(true); setOnizleme(null); setOnayMetni("");
    try {
      setOnizleme(await cagir("sayim"));
    } catch (e) {
      const d = (e as { d?: { hata?: string; adim?: string; detay?: string } }).d;
      hata(d?.hata ?? "Önizleme alınamadı.", d?.adim, d?.detay);
    } finally { setLoading(false); }
  };

  const sil = async () => {
    setLoading(true);
    try {
      const d = await cagir("sil");
      basari(`"${firma.firma_adi}" verisi silindi — yayın: ${d.yayin_sayisi ?? 0}, sipariş: ${d.silinen_siparis ?? 0}.`);
      kapat();
    } catch (e) {
      const d = (e as { d?: { hata?: string; adim?: string; detay?: string } }).d;
      hata(d?.hata ?? "Silme başarısız.", d?.adim, d?.detay);
    } finally { setLoading(false); }
  };

  const onayGecerli = onayMetni.trim() === firma.firma_adi.trim();
  const silAktif = !!onizleme && onayGecerli && !loading;

  return (
    <div
      onClick={kapat}
      style={{
        position: "fixed", inset: 0, background: "var(--tema-yerel-yonetim-ortu-01)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "460px", maxHeight: "90vh", overflow: "auto",
          background: "var(--tema-yerel-yonetim-kart-01)", borderRadius: "12px", padding: "20px",
          fontFamily: "'Nunito', sans-serif", boxShadow: "0 10px 40px var(--tema-yerel-yonetim-golge-01)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--tema-yerel-yonetim-ana-metin-01)" }}>Veri Sil — {firma.firma_adi}</span>
          <button onClick={kapat} style={{ background: "transparent", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--tema-yerel-yonetim-yardimci-metin-01)" }}>×</button>
        </div>

        <div style={{ background: "var(--tema-yerel-yonetim-islevsel-zemin-01)", border: "1px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)", borderRadius: "8px", padding: "8px 12px", marginBottom: "14px" }}>
          <span style={{ fontSize: "12px", color: RENK_BORDO }}>
            Yalnız <b>{firma.firma_adi}</b> firmasının üretilen verisi silinir; firma, ürün içeriği ve bitmiş siparişler korunur. <b>Geri alınamaz.</b>
          </span>
        </div>

        {/* 1) Önizle */}
        <button onClick={onizle} disabled={loading}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--tema-yerel-yonetim-cizgi-03)", background: "var(--tema-yerel-yonetim-kart-01)", fontSize: "13px", fontWeight: 700, color: "var(--tema-yerel-yonetim-ana-metin-01)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, marginBottom: "14px", fontFamily: "'Nunito', sans-serif" }}>
          {loading ? "…" : "Önizle (kaç kayıt?)"}
        </button>

        {/* 2) Önizleme sonucu + son onay + Sil */}
        {onizleme && (
          <div style={{ borderTop: "1px solid var(--tema-yerel-yonetim-cizgi-04)", paddingTop: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: "4px", columnGap: "10px", fontSize: "12.5px", marginBottom: "10px" }}>
              {SATIRLAR.map(([k, etiket]) => (
                <div key={k} style={{ display: "contents" }}>
                  <span style={{ color: "var(--tema-yerel-yonetim-ana-metin-02)" }}>{etiket}</span>
                  <span style={{ textAlign: "right", fontWeight: 700, color: "var(--tema-yerel-yonetim-ana-metin-01)" }}>{onizleme[k]}</span>
                </div>
              ))}
              <span style={{ color: "var(--tema-yerel-yonetim-islevsel-metin-07)" }}>Korunacak sipariş</span>
              <span style={{ textAlign: "right", fontWeight: 700, color: "var(--tema-yerel-yonetim-islevsel-metin-07)" }}>{onizleme.siparis_korunacak}</span>
            </div>

            <input
              value={onayMetni}
              onChange={(e) => setOnayMetni(e.target.value)}
              placeholder={`Onay için firma adını yazın: "${firma.firma_adi}"`}
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: "13px", border: "1px solid var(--tema-yerel-yonetim-islevsel-cizgi-03)", borderRadius: "8px", marginBottom: "10px", fontFamily: "'Nunito', sans-serif" }}
            />

            <button onClick={sil} disabled={!silAktif}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "var(--tema-yerel-yonetim-hata-vurgu)", color: "var(--tema-yerel-yonetim-islevsel-metin-08)", fontSize: "13px", fontWeight: 800, cursor: silAktif ? "pointer" : "not-allowed", opacity: silAktif ? 1 : 0.5, fontFamily: "'Nunito', sans-serif" }}>
              {loading ? "Siliniyor…" : "Kalıcı olarak sil"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
