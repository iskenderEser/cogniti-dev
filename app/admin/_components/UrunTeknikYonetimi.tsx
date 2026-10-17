// app/admin/_components/UrunTeknikYonetimi.tsx
//
// Ürün & Teknik yönetimi: iki kolonlu UI. Solda ürünler (ad + takım select),
// sağda teknikler (ad). useUrunTeknik hook'unun return değerlerini prop alır.

"use client";

import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";

import { btnBase, inputStyle, labelStyle, RENK_BORDO, rowStyle } from "../_constants";
import type { Takim, Teknik, Urun } from "../_types";

interface UrunTeknikYonetimiProps {
  takimlar: Takim[];
  urunler: Urun[];
  teknikler: Teknik[];
  yeniUrunAdi: string;
  setYeniUrunAdi: (v: string) => void;
  yeniUrunTakimId: string;
  setYeniUrunTakimId: (v: string) => void;
  yeniTeknikAdi: string;
  setYeniTeknikAdi: (v: string) => void;
  urunEkleLoading: boolean;
  teknikEkleLoading: boolean;
  urunSilLoading: string | null;
  teknikSilLoading: string | null;
  handleUrunEkle: (e: React.FormEvent) => void;
  handleTeknikEkle: (e: React.FormEvent) => void;
  handleUrunSil: (urun_id: string) => void;
  handleTeknikSil: (teknik_id: string) => void;
  takimAdi: (takim_id: string) => string;
}

const baslikStyle: React.CSSProperties = {
  fontSize: "14px", fontWeight: 700, color: "var(--tema-yerel-yonetim-ana-metin-01)",
  marginBottom: "12px", fontFamily: "'Nunito', sans-serif",
};

const bosListeStyle: React.CSSProperties = {
  fontSize: "13px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", fontFamily: "'Nunito', sans-serif",
};

const listeSatirStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "8px",
  padding: "8px 10px", background: "var(--tema-yerel-yonetim-sayfa-zemini-07)",
  border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)", borderRadius: "6px",
};

const silButonStyle = (loading: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  background: loading ? "var(--tema-yerel-yonetim-sayfa-zemini-01)" : "var(--tema-yerel-yonetim-islevsel-zemin-06)",
  color: "var(--tema-yerel-yonetim-islevsel-metin-09)", border: "none", borderRadius: "4px",
  fontSize: "12px", fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer",
  fontFamily: "'Nunito', sans-serif",
});

export default function UrunTeknikYonetimi(p: UrunTeknikYonetimiProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", maxWidth: "1000px" }}>
      {/* Sol: Ürünler */}
      <div>
        <h3 style={baslikStyle}>Ürünler</h3>

        <form onSubmit={p.handleUrunEkle} style={{ marginBottom: "16px" }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Ürün Adı</span>
            <input
              type="text" value={p.yeniUrunAdi}
              onChange={(e) => p.setYeniUrunAdi(e.target.value)}
              placeholder="Ürün adı..." style={inputStyle} required minLength={2}
            />
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Takım</span>
            <SadeFormSecimi value={p.yeniUrunTakimId} onChange={(e) => p.setYeniUrunTakimId(e.target.value)} required aria-label="Takım" className="w-full">
              <option value="">Takım seçin...</option>
              {p.takimlar.map(t => <option key={t.takim_id} value={t.takim_id}>{t.takim_adi}</option>)}
            </SadeFormSecimi>
          </div>

          <button
            type="submit"
            disabled={!p.yeniUrunAdi.trim() || !p.yeniUrunTakimId || p.urunEkleLoading}
            style={{
              ...btnBase,
              background: !p.yeniUrunAdi.trim() || !p.yeniUrunTakimId || p.urunEkleLoading ? "var(--tema-yerel-yonetim-sayfa-zemini-01)" : RENK_BORDO,
              color: "var(--tema-yerel-yonetim-ters-metin-01)", border: "none", marginTop: "8px",
            }}
          >
            {p.urunEkleLoading ? "Ekleniyor..." : "Ürün Ekle"}
          </button>
        </form>

        {p.urunler.length === 0 ? (
          <p style={bosListeStyle}>Henüz ürün yok.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {p.urunler.map(u => (
              <div key={u.urun_id} style={listeSatirStyle}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--tema-yerel-yonetim-ana-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    {u.urun_adi}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", marginLeft: "8px", fontFamily: "'Nunito', sans-serif" }}>
                    ({p.takimAdi(u.takim_id)})
                  </span>
                </div>
                <button
                  onClick={() => p.handleUrunSil(u.urun_id)}
                  disabled={p.urunSilLoading === u.urun_id}
                  style={silButonStyle(p.urunSilLoading === u.urun_id)}
                >
                  {p.urunSilLoading === u.urun_id ? "..." : "Sil"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sağ: Teknikler */}
      <div>
        <h3 style={baslikStyle}>Teknikler</h3>

        <form onSubmit={p.handleTeknikEkle} style={{ marginBottom: "16px" }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Teknik Adı</span>
            <input
              type="text" value={p.yeniTeknikAdi}
              onChange={(e) => p.setYeniTeknikAdi(e.target.value)}
              placeholder="Teknik adı..." style={inputStyle} required minLength={2}
            />
          </div>

          <button
            type="submit"
            disabled={!p.yeniTeknikAdi.trim() || p.teknikEkleLoading}
            style={{
              ...btnBase,
              background: !p.yeniTeknikAdi.trim() || p.teknikEkleLoading ? "var(--tema-yerel-yonetim-sayfa-zemini-01)" : RENK_BORDO,
              color: "var(--tema-yerel-yonetim-ters-metin-01)", border: "none", marginTop: "8px",
            }}
          >
            {p.teknikEkleLoading ? "Ekleniyor..." : "Teknik Ekle"}
          </button>
        </form>

        {p.teknikler.length === 0 ? (
          <p style={bosListeStyle}>Henüz teknik yok.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {p.teknikler.map(t => (
              <div key={t.teknik_id} style={listeSatirStyle}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--tema-yerel-yonetim-ana-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    {t.teknik_adi}
                  </span>
                </div>
                <button
                  onClick={() => p.handleTeknikSil(t.teknik_id)}
                  disabled={p.teknikSilLoading === t.teknik_id}
                  style={silButonStyle(p.teknikSilLoading === t.teknik_id)}
                >
                  {p.teknikSilLoading === t.teknik_id ? "..." : "Sil"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}