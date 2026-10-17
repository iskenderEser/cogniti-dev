// components/DosyaGoruntuleListesi.tsx
//
// Talebe eklenen referans dosyaları (talepler.dosya_urls) salt-okuma listeleyen
// paylaşılan bileşen (G-3 — docs/talep_senaryo_is_sureci_gelistirme_is_plani.md).
// Yükleme/silme yetkisi burada yok; ekrana özel aksiyonlar (örn. PM'in silme
// ikonu) `sagAksiyon` render prop'uyla eklenir. Görüntüleme ucu (imzalı URL)
// app/talepler/api/dosyalar üretici sahipliğini veya atanmış İÜ görevini doğrular.

"use client";

import { useState } from "react";

export interface DosyaItem {
  dosya_adi: string;
  url: string;
  boyut: number;
  yuklenme_tarihi: string;
}

const OFFICE_FORMATLAR = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"];

const dosyaTipiRenk = (dosya_adi: string): { etiket: string; bg: string; renk: string } => {
  const ext = dosya_adi.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { etiket: "PDF", bg: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-11)", renk: "var(--tema-yerel-ortak-sayfa-vurgu-metin-01)" };
  if (["docx", "doc"].includes(ext)) return { etiket: "DOC", bg: "var(--tema-yerel-ortak-sayfa-secim-zemin-03)", renk: "var(--tema-yerel-ortak-sayfa-eylem-metin-02)" };
  if (["pptx", "ppt"].includes(ext)) return { etiket: "PPT", bg: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-12)", renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-12)" };
  if (["xlsx", "xls"].includes(ext)) return { etiket: "XLS", bg: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-09)", renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-13)" };
  if (ext === "txt") return { etiket: "TXT", bg: "var(--tema-yerel-ortak-sayfa-sayfa-zemini-08)", renk: "var(--tema-yerel-ortak-sayfa-ana-metin-10)" };
  if (["png", "jpg", "jpeg"].includes(ext)) return { etiket: "IMG", bg: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-13)", renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-14)" };
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return { etiket: "VID", bg: "var(--tema-yerel-ortak-sayfa-islevsel-zemin-09)", renk: "var(--tema-yerel-ortak-sayfa-islevsel-metin-10)" };
  return { etiket: ext.toUpperCase(), bg: "var(--tema-yerel-ortak-sayfa-sayfa-zemini-08)", renk: "var(--tema-yerel-ortak-sayfa-yardimci-metin-14)" };
};

interface Props {
  dosyalar: DosyaItem[];
  onHata: (mesaj: string, adim?: string, detay?: string) => void;
  sagAksiyon?: (dosya: DosyaItem) => React.ReactNode;
}

export function DosyaGoruntuleListesi({ dosyalar, onHata, sagAksiyon }: Props) {
  const [goruntuleniyorUrl, setGoruntuleniyorUrl] = useState<string | null>(null);

  if (dosyalar.length === 0) return null;

  const handleGoruntule = async (dosya: DosyaItem) => {
    const dosyaYolu = dosya.url.split("/talep-dosyalari/")[1];
    if (!dosyaYolu) { onHata("Dosya yolu çözümlenemedi.", "url parse", undefined); return; }

    setGoruntuleniyorUrl(dosya.url);
    // Ç-5: fetch/json ağ hatasıyla fırlarsa chip "..."de kilitli kalmasın.
    try {
      const res = await fetch(`/talepler/api/dosyalar?yol=${encodeURIComponent(dosyaYolu)}`);
      const d = await res.json();

      if (!res.ok) { onHata(d.hata ?? "Dosya görüntülenemedi.", d.adim, d.detay); return; }

      const ext = dosya.dosya_adi.split(".").pop()?.toLowerCase() ?? "";
      const acilacakUrl = OFFICE_FORMATLAR.includes(ext)
        ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(d.signed_url)}`
        : d.signed_url;
      window.open(acilacakUrl, "_blank");
    } catch (err) {
      onHata("Dosya görüntülenemedi.", "ağ/istek hatası", String(err));
    } finally {
      setGoruntuleniyorUrl(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {dosyalar.map((dosya, i) => {
        const { etiket, bg, renk } = dosyaTipiRenk(dosya.dosya_adi);
        const isGoruntuleniyor = goruntuleniyorUrl === dosya.url;
        return (
          <div key={i} className="flex items-center gap-1 bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-06)] border border-[var(--tema-yerel-ortak-sayfa-cizgi-06)] rounded-full py-1 pl-2 pr-2.5">
            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <span style={{ fontSize: 7, fontWeight: 700, color: renk }}>{etiket}</span>
            </div>
            <span className="text-xs text-[var(--tema-yerel-ortak-sayfa-ana-metin-11)] max-w-28 truncate">{dosya.dosya_adi}</span>
            <span onClick={() => !isGoruntuleniyor && handleGoruntule(dosya)}
              className="text-xs font-semibold cursor-pointer ml-0.5 whitespace-nowrap"
              style={{ color: "var(--tema-yerel-ortak-sayfa-eylem-metin-03)", opacity: isGoruntuleniyor ? 0.5 : 1 }}>
              {isGoruntuleniyor ? "..." : "Görüntüle"}
            </span>
            {sagAksiyon?.(dosya)}
          </div>
        );
      })}
    </div>
  );
}
