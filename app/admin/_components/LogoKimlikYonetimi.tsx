// app/admin/_components/LogoKimlikYonetimi.tsx
//
// FİRMA sekme grubundaki "Logo ve Kimlik" sekmesi:
// Bu firmanın çalışanlarına özel iç panelinde Cogniti logosunun yanında
// yer alan firma logosunu ve "resmi öğrenme platformu" ortaklığını yönetir.
//
// 3 Aksiyon Butonu:
// 1. Ekle / Güncelle (Logoyu kaydeder / günceller)
// 2. Durdur / Yayına Al (ogrenme_platformu_aktif durumunu açar/kapatır)
// 3. Kaldır (Logoyu tamamen siler ve yayını kapatır)

"use client";

import CognitiLogo from "@/components/marka/CognitiLogo";
import { useState, useEffect, useRef } from "react";
import type { Firma } from "../_types";
import { RENK_BORDO, RENK_CIZGI, btnBase } from "../_constants";
import { logoGorseliniOptimizeEt } from "@/lib/firma/logoOptimizasyonIstemci";

interface LogoKimlikYonetimiProps {
  firma: Firma;
  onGuncelle: (
    f: Firma,
    logoUrl: string | null,
    ogrenmePlatformuAktif: boolean
  ) => Promise<boolean>;
}

export default function LogoKimlikYonetimi({ firma, onGuncelle }: LogoKimlikYonetimiProps) {
  const [logoUrl, setLogoUrl] = useState(firma.logo_url ?? "");
  const [ogrenmeAktif, setOgrenmeAktif] = useState(firma.ogrenme_platformu_aktif ?? false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosyaYukleniyor, setDosyaYukleniyor] = useState(false);
  const dosyaInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLogoUrl(firma.logo_url ?? "");
    setOgrenmeAktif(firma.ogrenme_platformu_aktif ?? false);
  }, [firma.firma_id, firma.logo_url, firma.ogrenme_platformu_aktif]);

  // Görsel yükleme (Store upload endpoint'i üzerinden)
  const handleDosyaSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;

    try {
      setDosyaYukleniyor(true);
      // İstemci tarafında akıllı optimizasyon:
      // - SVG vektörel olduğu için olduğu gibi bırakılır.
      // - PNG, WebP ve JPEG dosyaları şeffaflığı korunarak Retina netliğinde (maks 800x240 px) ölçeklenir ve sıkıştırılır.
      const yuklenecekDosya = await logoGorseliniOptimizeEt(dosya);

      const formData = new FormData();
      formData.append("dosya", yuklenecekDosya);

      const res = await fetch("/admin/api/firmalar/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.hata ?? "Görsel yüklenemedi.");
        return;
      }
      if (data.url) {
        setLogoUrl(data.url);
      }
    } catch {
      alert("Dosya yüklenirken bir bağlantı hatası oluştu.");
    } finally {
      setDosyaYukleniyor(false);
      if (dosyaInputRef.current) dosyaInputRef.current.value = "";
    }
  };

  // 1. Ekle / Güncelle
  const handleKaydet = async () => {
    const temizUrl = logoUrl.trim();
    if (!temizUrl) {
      alert("Lütfen bir logo URL'si girin veya dosya yükleyin.");
      return;
    }
    setYukleniyor(true);
    // Yeni logo eklenirken otomatik olarak yayın durumunu açık yapar (veya mevcut durumu korur)
    const yeniAktif = true;
    const ok = await onGuncelle(firma, temizUrl, yeniAktif);
    if (ok) {
      setOgrenmeAktif(yeniAktif);
    }
    setYukleniyor(false);
  };

  // 2. Durdur / Yayına Al
  const handleDurdurToggle = async () => {
    if (!logoUrl.trim()) {
      alert("Yayın durumunu değiştirmeden önce bir logo eklemelisiniz.");
      return;
    }
    setYukleniyor(true);
    const yeniDurum = !ogrenmeAktif;
    const ok = await onGuncelle(firma, logoUrl.trim(), yeniDurum);
    if (ok) {
      setOgrenmeAktif(yeniDurum);
    }
    setYukleniyor(false);
  };

  // 3. Kaldır
  const handleKaldir = async () => {
    const onay = window.confirm(
      `"${firma.firma_adi}" firmasının kurumsal logosu ve resmi öğrenme platformu rozeti tamamen kaldırılsın mı?`
    );
    if (!onay) return;

    setYukleniyor(true);
    const ok = await onGuncelle(firma, null, false);
    if (ok) {
      setLogoUrl("");
      setOgrenmeAktif(false);
    }
    setYukleniyor(false);
  };

  const yayindaMi = ogrenmeAktif && Boolean(logoUrl.trim());
  const durdurulduMu = !ogrenmeAktif && Boolean(logoUrl.trim());

  return (
    <div
      style={{
        border: `0.5px solid ${RENK_CIZGI}`,
        borderRadius: "14px",
        padding: "24px",
        maxWidth: "760px",
        background: "var(--tema-yerel-yonetim-kart-01)",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Üst Başlık & Durum Rozeti */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--tema-yerel-yonetim-ana-metin-04)", margin: 0 }}>
            {firma.firma_adi} · Logo ve Kimlik Yönetimi
          </h2>
          <p style={{ fontSize: "12.5px", color: "var(--tema-yerel-yonetim-yardimci-metin-02)", marginTop: "3px", margin: 0 }}>
            İç müşteri panelinde (UTT, üretici vb.) Cogniti logosu yanında görünecek kurumsal logo ve resmi öğrenme ortaklığı.
          </p>
        </div>

        {/* Durum Rozeti */}
        <div>
          {yayindaMi && (
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                padding: "3px 12px",
                borderRadius: "999px",
                background: "var(--tema-yerel-yonetim-islevsel-zemin-07)",
                color: "var(--tema-yerel-yonetim-islevsel-metin-10)",
                border: "1px solid var(--tema-yerel-yonetim-islevsel-cizgi-04)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--tema-yerel-yonetim-islevsel-zemin-08)" }} />
              Yayında
            </span>
          )}
          {durdurulduMu && (
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                padding: "3px 12px",
                borderRadius: "999px",
                background: "var(--tema-yerel-yonetim-sayfa-zemini-03)",
                color: "var(--tema-yerel-yonetim-islevsel-metin-11)",
                border: "1px solid var(--tema-yerel-yonetim-islevsel-cizgi-05)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--tema-yerel-yonetim-islevsel-zemin-09)" }} />
              Durduruldu
            </span>
          )}
          {!logoUrl.trim() && (
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                padding: "3px 12px",
                borderRadius: "999px",
                background: "var(--tema-yerel-yonetim-sayfa-zemini-04)",
                color: "var(--tema-yerel-yonetim-yardimci-metin-02)",
                border: "1px solid var(--tema-yerel-yonetim-cizgi-01)",
                whiteSpace: "nowrap",
              }}
            >
              Logo Yok
            </span>
          )}
        </div>
      </div>

      {/* Canlı Simülasyon / Önizleme Kutusu */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "var(--tema-yerel-yonetim-yardimci-metin-02)", letterSpacing: "0.5px", marginBottom: "8px" }}>
          Header Görünüm Önizlemesi
        </div>
        <div
          style={{
            background: "var(--tema-yerel-yonetim-kart-02)",
            border: "1px solid var(--tema-yerel-yonetim-cizgi-01)",
            borderRadius: "10px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 2px 8px var(--tema-yerel-yonetim-golge-02)",
            minHeight: "68px",
          }}
        >
          {/* Cogniti Logo */}
          <CognitiLogo
            style={{ height: "42px", width: "74.725px", display: "block", objectFit: "contain" }}
          />

          <div style={{ height: "28px", width: "1.5px", background: "var(--tema-yerel-yonetim-secim-zemin-01)", margin: "0 16px" }} />

          {/* Firma Logo & Metin */}
          {logoUrl.trim() ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", opacity: ogrenmeAktif ? 1 : 0.45 }}>
              <div style={{ width: "115px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={logoUrl.trim()}
                  alt={firma.firma_adi}
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", display: "block" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--tema-yerel-yonetim-yardimci-metin-03)", whiteSpace: "nowrap" }}>
                resmi öğrenme platformu
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--tema-yerel-yonetim-yardimci-metin-04)", fontSize: "12px", fontStyle: "italic" }}>
              <div
                style={{
                  width: "115px",
                  height: "32px",
                  border: "1px dashed var(--tema-yerel-yonetim-cizgi-02)",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "var(--tema-yerel-yonetim-yardimci-metin-04)",
                }}
              >
                Firma Logosu
              </div>
              <span>resmi öğrenme platformu</span>
            </div>
          )}

          {!ogrenmeAktif && logoUrl.trim() && (
            <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--tema-yerel-yonetim-yardimci-metin-04)", fontStyle: "italic" }}>
              (Yayın durdurulduğu için kullanıcılara gizlidir)
            </span>
          )}
        </div>
      </div>

      {/* Logo Ekleme / Düzenleme Alanı */}
      <div style={{ background: "var(--tema-yerel-yonetim-sayfa-zemini-02)", padding: "16px", borderRadius: "10px", border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)", marginBottom: "20px" }}>
        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "var(--tema-yerel-yonetim-ana-metin-03)", marginBottom: "6px" }}>
          Logo URL veya Dosya Yükleme
        </label>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Örn: /hepifarma_logo_dark.png veya https://..."
            style={{
              flex: 1,
              padding: "9px 12px",
              fontSize: "13px",
              border: "1px solid var(--tema-yerel-yonetim-cizgi-02)",
              borderRadius: "8px",
              background: "var(--tema-yerel-yonetim-kart-01)",
              outline: "none",
              fontFamily: "'Nunito', sans-serif",
            }}
          />

          <input
            ref={dosyaInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleDosyaSec}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => dosyaInputRef.current?.click()}
            disabled={dosyaYukleniyor || yukleniyor}
            style={{
              ...btnBase,
              background: "var(--tema-yerel-yonetim-kart-02)",
              color: "var(--tema-yerel-yonetim-ana-metin-03)",
              borderColor: "var(--tema-yerel-yonetim-cizgi-02)",
              whiteSpace: "nowrap",
            }}
          >
            {dosyaYukleniyor ? "Yükleniyor..." : "Dosya Seç"}
          </button>
        </div>
        <p style={{ fontSize: "11.5px", color: "var(--tema-yerel-yonetim-yardimci-metin-02)", marginTop: "6px", margin: 0 }}>
          💡 Tavsiye: Beyaz/açık header zemininde net görünmesi için şeffaf zeminli (PNG veya SVG) koyu renkli logo kullanınız (Maks. 5 MB - yüklenirken Retina netliğinde otomatik optimize edilir).
        </p>
      </div>

      {/* Alt Buton Grubu: Ekle, Durdur, Kaldır */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--tema-yerel-yonetim-cizgi-05)" }}>
        {/* Sol Grup: Ekle / Güncelle ve Durdur / Yayına Al */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleKaydet}
            disabled={yukleniyor || dosyaYukleniyor}
            style={{
              ...btnBase,
              background: RENK_BORDO,
              color: "var(--tema-yerel-yonetim-ters-metin-01)",
              border: "none",
              opacity: yukleniyor ? 0.7 : 1,
            }}
          >
            {yayindaMi ? "Logoyu Güncelle" : "Ekle ve Yayına Al"}
          </button>

          {Boolean(firma.logo_url) && (
            <button
              type="button"
              onClick={handleDurdurToggle}
              disabled={yukleniyor || dosyaYukleniyor}
              style={{
                ...btnBase,
                background: ogrenmeAktif ? "var(--tema-yerel-yonetim-islevsel-zemin-10)" : "var(--tema-yerel-yonetim-islevsel-zemin-05)",
                color: ogrenmeAktif ? "var(--tema-yerel-yonetim-islevsel-metin-01)" : "var(--tema-yerel-yonetim-islevsel-metin-10)",
                borderColor: ogrenmeAktif ? "var(--tema-yerel-yonetim-islevsel-cizgi-06)" : "var(--tema-yerel-yonetim-islevsel-cizgi-04)",
                opacity: yukleniyor ? 0.7 : 1,
              }}
            >
              {ogrenmeAktif ? "Yayını Durdur" : "Tekrar Yayına Al"}
            </button>
          )}
        </div>

        {/* Sağ Grup: Kaldır */}
        {Boolean(firma.logo_url) && (
          <button
            type="button"
            onClick={handleKaldir}
            disabled={yukleniyor || dosyaYukleniyor}
            style={{
              ...btnBase,
              background: "var(--tema-yerel-yonetim-islevsel-zemin-06)",
              color: "var(--tema-yerel-yonetim-islevsel-metin-12)",
              borderColor: "var(--tema-yerel-yonetim-islevsel-cizgi-02)",
              opacity: yukleniyor ? 0.7 : 1,
            }}
          >
            Logoyu Kaldır
          </button>
        )}
      </div>
    </div>
  );
}
