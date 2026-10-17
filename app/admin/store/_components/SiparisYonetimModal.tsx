// app/admin/store/_components/SiparisYonetimModal.tsx
//
// Admin için sipariş yönetim modalı. İki mod:
//   - "kargola" — kargo firması + takip no gir (beklemede → kargoda)
//   - "iptal" — admin manuel iptal (sebep zorunlu)
//
// Mod prop ile dışarıdan geçilir. Mevcut sipariş referansı kalır,
// modal kapandığında temizlenir.

"use client";

import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";

import { KARGO_FIRMA_ADLARI } from "@/lib/tclub/store/kargo";
import { useEffect, useState } from "react";
import { RENK_BORDO } from "../../_constants";

export type SiparisYonetimModu = "kargola" | "iptal";

interface MevcutSiparis {
  siparis_id: string;
  urun_adi: string;
  durum: string;
}

interface Props {
  acik: boolean;
  mod: SiparisYonetimModu;
  mevcutSiparis: MevcutSiparis | null;
  onKapat: () => void;
  onKaydedildi: () => void | Promise<void>;
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

const KOYU_METIN = "var(--tema-yerel-yonetim-ana-metin-03)";
const GRI_METIN = "var(--tema-yerel-yonetim-yardimci-metin-01)";

export default function SiparisYonetimModal({
  acik,
  mod,
  mevcutSiparis,
  onKapat,
  onKaydedildi,
  hata,
  basari,
}: Props) {
  const [kargoFirmasi, setKargoFirmasi] = useState("");
  const [kargoTakipNo, setKargoTakipNo] = useState("");
  const [iptalSebebi, setIptalSebebi] = useState("");
  const [islemSuruyor, setIslemSuruyor] = useState(false);

  // Modal her açılışta state sıfırla
  useEffect(() => {
    if (!acik) return;
    setKargoFirmasi(KARGO_FIRMA_ADLARI[0] ?? "");
    setKargoTakipNo("");
    setIptalSebebi("");
  }, [acik, mevcutSiparis]);

  const handleKargola = async () => {
    if (!mevcutSiparis) return;
    if (!kargoFirmasi) {
      hata("Kargo firması seçilmedi.", "validasyon", undefined);
      return;
    }
    if (!kargoTakipNo || kargoTakipNo.trim() === "") {
      hata("Kargo takip numarası zorunludur.", "validasyon", undefined);
      return;
    }

    setIslemSuruyor(true);
    try {
      const res = await fetch("/admin/store/api/siparis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siparis_id: mevcutSiparis.siparis_id,
          action: "kargola",
          kargo_firmasi: kargoFirmasi,
          kargo_takip_no: kargoTakipNo.trim(),
        }),
      });
      const d = await res.json();

      if (!res.ok) {
        hata(d.hata ?? "Sipariş kargoya verilemedi.", d.adim, d.detay);
        setIslemSuruyor(false);
        return;
      }

      basari("Sipariş kargoya verildi.");
      setIslemSuruyor(false);
      await onKaydedildi();
      onKapat();
    } catch (err) {
      hata("İşlem sırasında hata oluştu.", "fetch", String(err));
      setIslemSuruyor(false);
    }
  };

  const handleIptal = async () => {
    if (!mevcutSiparis) return;
    if (!iptalSebebi || iptalSebebi.trim() === "") {
      hata("İptal sebebi zorunludur.", "validasyon", undefined);
      return;
    }

    setIslemSuruyor(true);
    try {
      const res = await fetch("/admin/store/api/siparis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siparis_id: mevcutSiparis.siparis_id,
          action: "iptal",
          sebep: iptalSebebi.trim(),
        }),
      });
      const d = await res.json();

      if (!res.ok) {
        hata(d.hata ?? "Sipariş iptal edilemedi.", d.adim, d.detay);
        setIslemSuruyor(false);
        return;
      }

      basari("Sipariş iptal edildi.");
      setIslemSuruyor(false);
      await onKaydedildi();
      onKapat();
    } catch (err) {
      hata("İşlem sırasında hata oluştu.", "fetch", String(err));
      setIslemSuruyor(false);
    }
  };

  if (!acik || !mevcutSiparis) return null;

  const inputStili: React.CSSProperties = {
    border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)",
    fontFamily: "'Nunito', sans-serif",
    color: KOYU_METIN,
  };

  const baslik = mod === "kargola" ? "Kargoya Ver" : "Siparişi İptal Et";
  // T-3: iki mod da tek vurgu dilinde (bordo); ayrım başlık/etiketle yapılır.
  const aksiyonRenk = RENK_BORDO;
  const aksiyonEtiket = mod === "kargola" ? "Kargoya Ver" : "İptal Et";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "var(--tema-yerel-yonetim-ortu-04)" }}
    >
      <div className="bg-[var(--tema-yerel-yonetim-kart-04)] rounded-xl border border-[var(--tema-yerel-yonetim-cizgi-08)] shadow-lg w-full max-w-sm flex flex-col">
        {/* Başlık */}
        <div className="px-5 py-4 border-b border-[var(--tema-yerel-yonetim-cizgi-09)] flex items-center justify-between">
          <div className="text-base font-semibold text-[var(--tema-yerel-yonetim-ana-metin-05)]">{baslik}</div>
          <button
            onClick={onKapat}
            disabled={islemSuruyor}
            className="text-[var(--tema-yerel-yonetim-yardimci-metin-06)] text-lg cursor-pointer border-none bg-transparent p-1"
            style={{ opacity: islemSuruyor ? 0.4 : 1 }}
          >
            ✕
          </button>
        </div>

        {/* İçerik */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {/* Sipariş özet */}
          <div
            className="rounded-lg px-3 py-2.5 text-xs"
            style={{ background: "var(--tema-yerel-yonetim-sayfa-zemini-02)", color: GRI_METIN }}
          >
            <div className="font-semibold mb-0.5" style={{ color: KOYU_METIN }}>
              {mevcutSiparis.urun_adi}
            </div>
            <div>Mevcut durum: {mevcutSiparis.durum}</div>
          </div>

          {/* Mod bazlı form */}
          {mod === "kargola" && (
            <>
              <div>
                <label className="text-xs font-semibold text-[var(--tema-yerel-yonetim-ana-metin-08)] block mb-1.5">
                  Kargo Firması
                </label>
                <SadeFormSecimi value={kargoFirmasi} onChange={(e) => setKargoFirmasi(e.target.value)} disabled={islemSuruyor} aria-label="Kargo Firması" className="w-full">
                  {KARGO_FIRMA_ADLARI.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </SadeFormSecimi>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--tema-yerel-yonetim-ana-metin-08)] block mb-1.5">
                  Takip Numarası
                </label>
                <input
                  type="text"
                  value={kargoTakipNo}
                  onChange={(e) => setKargoTakipNo(e.target.value)}
                  disabled={islemSuruyor}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--tema-yerel-yonetim-kart-04)]"
                  style={inputStili}
                  placeholder="örn. 1234567890"
                  autoFocus
                />
              </div>
            </>
          )}

          {mod === "iptal" && (
            <>
              <div>
                <label className="text-xs font-semibold text-[var(--tema-yerel-yonetim-ana-metin-08)] block mb-1.5">
                  İptal Sebebi
                </label>
                <textarea
                  value={iptalSebebi}
                  onChange={(e) => setIptalSebebi(e.target.value)}
                  disabled={islemSuruyor}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--tema-yerel-yonetim-kart-04)] resize-none"
                  style={{ ...inputStili, minHeight: "70px" }}
                  placeholder="Örn. Stok güncellenemedi, müşteri talebi..."
                  autoFocus
                />
              </div>
              <div className="text-xs" style={{ color: GRI_METIN }}>
                İptal sonrası: puan iade edilir, stok geri eklenir, kullanıcı bilgilendirilir.
              </div>
            </>
          )}
        </div>

        {/* Aksiyon */}
        <div className="px-5 py-4 border-t border-[var(--tema-yerel-yonetim-cizgi-09)] flex gap-2.5 justify-end">
          <button
            onClick={onKapat}
            disabled={islemSuruyor}
            className="px-4 py-2 rounded-lg border bg-transparent text-[var(--tema-yerel-yonetim-yardimci-metin-06)] text-xs cursor-pointer"
            style={{
              border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)",
              fontFamily: "'Nunito', sans-serif",
              opacity: islemSuruyor ? 0.4 : 1,
            }}
          >
            Vazgeç
          </button>
          <button
            onClick={mod === "kargola" ? handleKargola : handleIptal}
            disabled={islemSuruyor}
            className="px-5 py-2 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] text-xs font-semibold cursor-pointer"
            style={{
              background: aksiyonRenk,
              opacity: islemSuruyor ? 0.5 : 1,
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {islemSuruyor ? "İşleniyor..." : aksiyonEtiket}
          </button>
        </div>
      </div>
    </div>
  );
}