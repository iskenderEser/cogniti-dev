// app/admin/_components/FirmaSidebar.tsx
//
// Admin panel sol paneli: firma listesi + yeni firma ekleme formu.
// Her firma bir kart: ad + (Firma aktif/pasif · Mağaza · CC · E-Club · E-Club Store · Sil) +
// (Dışa aktar). Pasif firma soluk + "Pasif" rozeti; eksik bilgili kullanıcısı
// olan firmada amber "⚠ N eksik bilgili" rozeti (T-2 — aktivasyon kilidinin
// sebepli göstergesi).

"use client";

import type { Firma } from "../_types";
import { RENK_BORDO, RENK_BORDO_ZEMIN, RENK_BORDO_KENAR } from "../_constants";

interface FirmaSidebarProps {
  firmalar: Firma[];
  seciliFirma: Firma | null;
  yeniFirmaAdi: string;
  setYeniFirmaAdi: (v: string) => void;
  handleFirmaEkle: (e: React.FormEvent) => void | Promise<void>;
  handleFirmaSecildi: (f: Firma) => void;
  handleStoreToggle: (f: Firma) => void | Promise<void>;
  handleCcToggle: (f: Firma) => void | Promise<void>;
  handleEclubToggle: (f: Firma) => void | Promise<void>;
  handleEclubStoreToggle: (f: Firma) => void | Promise<void>;
  handleEczanemToggle: (f: Firma) => void | Promise<void>;
  handleFirmaToggle: (f: Firma) => void | Promise<void>;
  handleFirmaSil: (f: Firma) => Promise<boolean>;
  onVeriSil: (f: Firma) => void;
  handleExport: (f: Firma) => void | Promise<void>;
  loading: boolean;
}

// Kaydırmalı switch (toggle) — açık/kapalı görsel durum.
function Switch({
  acik,
  renk,
  onClick,
  baslik,
  disabled = false,
}: {
  acik: boolean;
  renk: string;
  onClick: () => void;
  baslik: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={baslik}
      disabled={disabled}
      style={{
        flexShrink: 0,
        width: "34px",
        height: "19px",
        borderRadius: "999px",
        border: "none",
        background: acik ? renk : "var(--tema-yerel-yonetim-sayfa-zemini-01)",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: acik ? "17px" : "2px",
          width: "15px",
          height: "15px",
          borderRadius: "50%",
          background: "var(--tema-yerel-yonetim-kart-01)",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}

export default function FirmaSidebar({
  firmalar,
  seciliFirma,
  yeniFirmaAdi,
  setYeniFirmaAdi,
  handleFirmaEkle,
  handleFirmaSecildi,
  handleStoreToggle,
  handleCcToggle,
  handleEclubToggle,
  handleEclubStoreToggle,
  handleEczanemToggle,
  handleFirmaToggle,
  handleFirmaSil,
  onVeriSil,
  handleExport,
  loading,
}: FirmaSidebarProps) {

  const silTikla = async (f: Firma) => {
    // Onay iste (geri alınamaz işlem). API ayrıca export koşulunu kontrol eder;
    // export edilmemişse hata mesajı döner (kullanıcı bilgilendirilir).
    const onay = window.confirm(
      `"${f.firma_adi}" firmasını silmek üzeresiniz. Bu işlem geri alınamaz.\n\nFirmanın verileri dışa aktarılmamışsa silme işlemi engellenir.\n\nDevam edilsin mi?`
    );
    if (!onay) return;
    await handleFirmaSil(f);
  };

  return (
    <div style={{ width: "300px", borderRight: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)", padding: "20px", flexShrink: 0 }}>
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--tema-yerel-yonetim-ana-metin-01)", marginBottom: "16px", fontFamily: "'Nunito', sans-serif" }}>
        Firmalar
      </h2>

      <form onSubmit={handleFirmaEkle} style={{ marginBottom: "20px", display: "flex", gap: "6px" }}>
        <input
          type="text"
          value={yeniFirmaAdi}
          onChange={(e) => setYeniFirmaAdi(e.target.value)}
          placeholder="Yeni firma adı..."
          style={{
            flex: 1,
            padding: "8px 10px",
            border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)",
            borderRadius: "6px",
            fontSize: "13px",
            outline: "none",
            fontFamily: "'Nunito', sans-serif",
            color: "var(--tema-yerel-yonetim-ana-metin-01)",
          }}
        />
        <button
          type="submit"
          disabled={!yeniFirmaAdi.trim()}
          style={{
            padding: "8px 14px",
            background: yeniFirmaAdi.trim() ? RENK_BORDO : "var(--tema-yerel-yonetim-sayfa-zemini-01)",
            color: "var(--tema-yerel-yonetim-ters-metin-01)",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: yeniFirmaAdi.trim() ? "pointer" : "not-allowed",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Ekle
        </button>
      </form>

      {loading ? (
        <p style={{ fontSize: "13px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)" }}>Yükleniyor...</p>
      ) : firmalar.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)" }}>Henüz firma yok.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {firmalar.map((f, i) => {
            const secili = seciliFirma?.firma_id === f.firma_id;
            const pasif = !f.aktif;
            // Zebra: dönüşümlü arka plan. Seçili firma vurgulanır.
            const zebraBg = i % 2 === 0 ? "#ffffff" : "#fafafa";
            const kartBg = secili ? RENK_BORDO_ZEMIN : zebraBg;
            const kartBorder = secili ? `0.5px solid ${RENK_BORDO_KENAR}` : "0.5px solid #e5e7eb";

            return (
              <div
                key={f.firma_id}
                style={{
                  background: kartBg,
                  border: kartBorder,
                  borderRadius: "10px",
                  padding: "12px",
                  opacity: pasif ? 0.65 : 1,
                }}
              >
                {/* Firma adı (seçim) + pasif rozeti */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <button
                    onClick={() => handleFirmaSecildi(f)}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      fontSize: "14px",
                      fontWeight: secili ? 700 : 500,
                      color: secili ? RENK_BORDO : "var(--tema-yerel-yonetim-ana-metin-01)",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {f.firma_adi}
                  </button>
                  {pasif && (
                    <span
                      style={{
                        fontSize: "11px",
                        background: "var(--tema-yerel-yonetim-islevsel-zemin-01)",
                        color: "var(--tema-yerel-yonetim-vurgu-metin-01)",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Pasif
                    </span>
                  )}
                  {/* T-2: eksik bilgili kullanıcı göstergesi — pasif firmada
                      aktivasyon kilidinin sebebi, aktif firmada uyarı (T-1). */}
                  {(f.eksik_sayisi ?? 0) > 0 && (
                    <span
                      title={
                        f.aktif
                          ? `${f.eksik_sayisi} kullanıcının eksik bilgisi var (takım/bölge/telefon) — kullanıcı listesinde "Eksik bilgili" filtresiyle görülebilir.`
                          : `Firma aktifleştirilemez — önce ${f.eksik_sayisi} kullanıcının eksik bilgisini (takım/bölge/telefon) tamamlayın.`
                      }
                      style={{
                        fontSize: "11px",
                        background: "var(--tema-yerel-yonetim-islevsel-zemin-02)",
                        border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-01)",
                        color: "var(--tema-yerel-yonetim-islevsel-metin-01)",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ⚠ {f.eksik_sayisi} eksik bilgili
                    </span>
                  )}
                </div>

                {/* Aksiyon satırı: Firma · Mağaza · CC · E-Club · E-Club Store · Sil */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    <Switch
                      acik={f.aktif}
                      renk="var(--tema-yerel-yonetim-islevsel-metin-02)"
                      onClick={() => handleFirmaToggle(f)}
                      baslik={f.aktif ? "Firma aktif — pasifleştirmek için tıkla" : "Firma pasif — aktifleştirmek için tıkla"}
                    />
                    Firma
                  </span>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    <Switch
                      acik={f.hbstore_aktif}
                      renk={RENK_BORDO}
                      onClick={() => handleStoreToggle(f)}
                      baslik={f.hbstore_aktif ? "Mağaza açık — kapatmak için tıkla" : "Mağaza kapalı — açmak için tıkla"}
                    />
                    Mağaza
                  </span>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    <Switch
                      acik={f.cc_aktif}
                      renk="var(--tema-yerel-yonetim-islevsel-metin-03)"
                      onClick={() => handleCcToggle(f)}
                      baslik={f.cc_aktif ? "Challenge Club açık — kapatmak için tıkla" : "Challenge Club kapalı — açmak için tıkla"}
                    />
                    CC
                  </span>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    <Switch
                      acik={f.eclub_aktif}
                      renk="var(--tema-yerel-yonetim-eylem-metin-01)"
                      onClick={() => handleEclubToggle(f)}
                      baslik={f.eclub_aktif ? "E-Club açık — kapatmak için tıkla" : "E-Club kapalı — açmak için tıkla"}
                    />
                    E-Club
                  </span>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    <Switch
                      acik={f.eclub_store_aktif}
                      renk="var(--tema-yerel-yonetim-islevsel-metin-04)"
                      onClick={() => handleEclubStoreToggle(f)}
                      baslik={f.eclub_store_aktif ? "E-Club Store açık — kapatmak için tıkla" : "E-Club Store kapalı — açmak için tıkla"}
                    />
                    E-Club Store
                  </span>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)", fontFamily: "'Nunito', sans-serif" }}>
                    <Switch
                      acik={f.eczanem_aktif}
                      renk="var(--tema-yerel-yonetim-islevsel-metin-05)"
                      onClick={() => handleEczanemToggle(f)}
                      disabled={!f.eclub_aktif && !f.eczanem_aktif}
                      baslik={f.eczanem_aktif ? "Eczanem açık — kapatmak için tıkla" : !f.eclub_aktif ? "Eczanem’i açmak için önce E-Club’ı açın" : "Eczanem kapalı — açmak için tıkla"}
                    />
                    Eczanem
                  </span>

                  <button
                    onClick={() => onVeriSil(f)}
                    title="Firmanın üretilen test verisini temizle (firma korunur)"
                    style={{
                      marginLeft: "auto",
                      flexShrink: 0,
                      padding: "5px 9px",
                      background: "transparent",
                      border: "0.5px solid var(--tema-yerel-yonetim-cizgi-02)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--tema-yerel-yonetim-ana-metin-02)",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    Veri Sil
                  </button>

                  <button
                    onClick={() => silTikla(f)}
                    title="Firmayı sil"
                    style={{
                      flexShrink: 0,
                      padding: "5px 9px",
                      background: "transparent",
                      border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--tema-yerel-yonetim-islevsel-metin-06)",
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    Sil
                  </button>
                </div>

                {/* Dışa aktar — firmanın verilerini Excel olarak indirir */}
                <div style={{ display: "flex" }}>
                  <button
                    onClick={() => handleExport(f)}
                    title="Firma verilerini Excel olarak dışa aktar"
                    style={{
                      flex: 1,
                      padding: "6px",
                      background: "var(--tema-yerel-yonetim-kart-02)",
                      border: `0.5px solid ${RENK_BORDO}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: RENK_BORDO,
                      cursor: "pointer",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    Dışa aktar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
