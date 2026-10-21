// app/admin/_components/ModulDurumKarti.tsx
//
// M2 — Modül sekmelerinin durum kartı: modülün bu firmadaki açık/kapalı
// durumu + aç/kapa aksiyonu (FirmaSidebar toggle'larının sekme içi karşılığı).
// İçerik yönetimi (görünürlük + müdahale katmanları) M4'te bu kartın altına
// gelecek; kart o güne kadar sekmenin "boş ama dürüst" durumunu anlatır.
//
// acik === null → modülün firma bayrağı yok (T-Club ana modüldür, hep açık).

"use client";

import { RENK_BORDO, RENK_CIZGI } from "../_constants";

interface ModulDurumKartiProps {
  baslik: string;
  aciklama: string;
  acik: boolean | null;
  toggleLoading?: boolean;
  toggleDisabled?: boolean;
  onToggle?: () => void;
  // İçeriği henüz M4'te gelecek sekmelerde true (varsayılan); içerik
  // taşınmış sekmelerde (E-Club) false — not gösterilmez.
  m4NotuGoster?: boolean;
}

export default function ModulDurumKarti(p: ModulDurumKartiProps) {
  return (
    <div
      style={{
        border: `0.5px solid ${RENK_CIZGI}`,
        borderRadius: "12px",
        padding: "20px",
        maxWidth: "640px",
        fontFamily: "'Nunito', sans-serif",
        background: "var(--tema-yerel-yonetim-kart-01)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--tema-yerel-yonetim-ana-metin-01)" }}>{p.baslik}</span>
          {p.acik !== null && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: "999px",
                background: p.acik ? "var(--tema-yerel-yonetim-islevsel-zemin-07)" : "var(--tema-yerel-yonetim-islevsel-zemin-01)",
                color: p.acik ? "var(--tema-yerel-yonetim-islevsel-metin-10)" : "var(--tema-yerel-yonetim-hata-vurgu)",
                border: `1px solid ${p.acik ? "var(--tema-yerel-yonetim-islevsel-cizgi-04)" : "var(--tema-yerel-yonetim-islevsel-cizgi-02)"}`,
              }}
            >
              {p.acik ? "Açık" : "Kapalı"}
            </span>
          )}
        </div>

        {p.acik !== null && p.onToggle && (
          <button
            onClick={p.onToggle}
            disabled={p.toggleLoading || p.toggleDisabled}
            style={{
              padding: "6px 14px",
              background: p.acik ? "transparent" : RENK_BORDO,
              border: p.acik ? `0.5px solid ${RENK_CIZGI}` : "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: p.acik ? "var(--tema-yerel-yonetim-yardimci-metin-01)" : "var(--tema-yerel-yonetim-ters-metin-01)",
              cursor: p.toggleLoading || p.toggleDisabled ? "not-allowed" : "pointer",
              opacity: p.toggleDisabled ? 0.5 : 1,
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {p.acik ? "Modülü Kapat" : "Modülü Aç"}
          </button>
        )}
      </div>

      <p style={{ fontSize: "13px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", margin: "10px 0 0 0", lineHeight: 1.6 }}>
        {p.aciklama}
      </p>

      {(p.m4NotuGoster ?? true) && (
        <p style={{ fontSize: "12px", color: "var(--tema-yerel-yonetim-yardimci-metin-04)", margin: "12px 0 0 0" }}>
          Bu modülün içerik görünümü ve müdahale araçları M4 fazında bu sekmeye eklenecek
          (admin_modernizasyon_is_plani.md — B.3).
        </p>
      )}
    </div>
  );
}
