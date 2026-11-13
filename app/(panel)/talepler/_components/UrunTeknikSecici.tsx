// app/talepler/_components/UrunTeknikSecici.tsx
//
"use client";

import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";

import { type TalepTuruKurali } from "@/lib/uretici/yetenekler";
import { useState } from "react";
import type { Teknik, Urun } from "../_types";

interface UrunTeknikSeciciProps {
  urunler: Urun[];
  teknikler: Teknik[];
  seciliUrunId: string;
  seciliTeknikId: string;
  urunGosterilsin: boolean;
  teknikGosterilsin: boolean;
  turKurali: TalepTuruKurali;
  onUrunSec: (id: string) => void;
  onTeknikSec: (id: string) => void;
  onTeknikEkle: (teknik_adi: string) => Promise<void>;
}

export function UrunTeknikSecici({
  urunler,
  teknikler,
  seciliUrunId,
  seciliTeknikId,
  urunGosterilsin,
  teknikGosterilsin,
  turKurali,
  onUrunSec,
  onTeknikSec,
  onTeknikEkle,
}: UrunTeknikSeciciProps) {
  // Yeni teknik ekleme — lokal UI durumları
  const [yeniTeknikGoster, setYeniTeknikGoster] = useState(false);
  const [yeniTeknikAdi, setYeniTeknikAdi] = useState("");
  const [teknikEkleniyor, setTeknikEkleniyor] = useState(false);

  const handleTeknikSelectChange = (deger: string) => {
    if (deger === "yeni") {
      setYeniTeknikGoster(true);
      onTeknikSec("");
    } else {
      setYeniTeknikGoster(false);
      setYeniTeknikAdi("");
      onTeknikSec(deger);
    }
  };

  const handleTeknikEkleClick = async () => {
    if (!yeniTeknikAdi.trim()) return;
    setTeknikEkleniyor(true);
    try {
      await onTeknikEkle(yeniTeknikAdi.trim());
      setYeniTeknikGoster(false);
      setYeniTeknikAdi("");
    } finally {
      setTeknikEkleniyor(false);
    }
  };

  if (!urunGosterilsin && !teknikGosterilsin) return null;

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {urunGosterilsin && (
        <div className="flex-1">
          <label className="text-xs text-[var(--tema-yerel-uretim-yardimci-metin-01)] block mb-1">
            Ürün Adı
            {turKurali.urun === "tercihli" && (
              <span className="text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-normal ml-1">(tercihli)</span>
            )}
          </label>
          <SadeFormSecimi value={seciliUrunId} onChange={e => onUrunSec(e.target.value)} aria-label="Ürün" className="w-full">
            <option value="">Ürün seçin...</option>
            {urunler.map((u) => (
              <option key={u.urun_id} value={u.urun_id}>{u.urun_adi}</option>
            ))}
          </SadeFormSecimi>
        </div>
      )}

      {teknikGosterilsin && (
        <div className="flex-1">
          <label className="text-xs text-[var(--tema-yerel-uretim-yardimci-metin-01)] block mb-1">
            Teknik Adı
            {turKurali.teknik === "tercihli" && (
              <span className="text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-normal ml-1">(tercihli)</span>
            )}
          </label>
          <SadeFormSecimi value={yeniTeknikGoster ? "yeni" : seciliTeknikId} onChange={(e) => handleTeknikSelectChange(e.target.value)} aria-label="Teknik" className="w-full">
            <option value="">Teknik seçin...</option>
            {teknikler.map((t) => (
              <option key={t.teknik_id} value={t.teknik_id}>{t.teknik_adi}</option>
            ))}
            <option value="yeni">+ Yeni Teknik Ekle</option>
          </SadeFormSecimi>
          {yeniTeknikGoster && (
            <div className="flex gap-1.5 mt-1.5">
              <input
                value={yeniTeknikAdi}
                onChange={(e) => setYeniTeknikAdi(e.target.value)}
                placeholder="Yeni teknik adı..."
                className="flex-1 border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-lg px-2.5 py-1.5 text-xs outline-none"
                style={{ borderColor: "var(--tema-yerel-uretim-cizgi-04)", fontFamily: "'Nunito', sans-serif" }}
              />
              <button
                type="button"
                onClick={handleTeknikEkleClick}
                disabled={!yeniTeknikAdi.trim() || teknikEkleniyor}
                className="text-[var(--tema-yerel-uretim-ters-metin-01)] border-none rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap"
                style={{
                  background: "var(--tema-yerel-uretim-eylem-zemin-01)",
                  opacity: !yeniTeknikAdi.trim() || teknikEkleniyor ? 0.6 : 1,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {teknikEkleniyor ? "..." : "Ekle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setYeniTeknikGoster(false);
                  setYeniTeknikAdi("");
                }}
                className="bg-transparent border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--tema-yerel-uretim-yardimci-metin-01)] cursor-pointer"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                İptal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}