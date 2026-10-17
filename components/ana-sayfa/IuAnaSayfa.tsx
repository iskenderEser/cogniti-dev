// components/ana-sayfa/IuAnaSayfa.tsx
"use client";

import { TarihPill } from "@/components/ui/tarih-pill";

import { ROL_ADLARI } from "@/lib/utils/roller";

import { iuDurumMesaji } from "@/lib/utils/durum/mesaj";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHataMesaji } from "@/components/HataMesaji";
import type { IuAnaSayfaVeri } from "@/lib/utils/anaSayfa/iu";
import type { AuthKullanici } from "@/types/auth";

interface Props {
  user: AuthKullanici;
  adSoyad: string;
}

export default function IuAnaSayfa({ user, adSoyad }: Props) {
  const router = useRouter();
  const [iuVeri, setIuVeri] = useState<IuAnaSayfaVeri | null>(null);
  const [loading, setLoading] = useState(true);
  const [aktifFiltre, setAktifFiltre] = useState<string>("tumu");
  const { hata } = useHataMesaji();

  useEffect(() => {
    const veriCek = async () => {
      setLoading(true);
      const res = await fetch("/ana-sayfa/api");
      const data = await res.json();
      if (!res.ok) { hata(data.hata ?? "Veriler yüklenemedi.", data.adim, data.detay); }
      else { setIuVeri(data); }
      setLoading(false);
    };
    veriCek();
  }, [user]);

  const formatTarih = (tarih: string) =>
    new Date(tarih).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });


  const asamaRenk = (asama: string) => {
    switch (asama) {
      case "Senaryo": return { bg: "var(--tema-yerel-ana-sayfa-islevsel-zemin-08)", text: "var(--tema-yerel-ana-sayfa-islevsel-metin-11)" };
      case "Video": return { bg: "var(--tema-yerel-ana-sayfa-secim-zemin-02)", text: "var(--tema-yerel-ana-sayfa-eylem-metin-02)" };
      case "Soru Seti": return { bg: "var(--tema-yerel-ana-sayfa-islevsel-zemin-09)", text: "var(--tema-yerel-ana-sayfa-islevsel-metin-12)" };
      default: return { bg: "var(--tema-yerel-ana-sayfa-sayfa-zemini-01)", text: "var(--tema-yerel-ana-sayfa-yardimci-metin-04)" };
    }
  };

  // kategoriRenk kaldırıldı (25.07): renk de metin de durum sözlüğünden gelir.

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <svg className="animate-spin w-6 h-6 text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)]" fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const satirlar = iuVeri?.satirlar ?? [];
  const istat = iuVeri?.istatistikler ?? { bekleyen: 0, revizyon: 0, devam: 0, tamamlanan: 0 };
  const filtrelenmis = aktifFiltre === "tumu" ? satirlar : satirlar.filter(s => s.kategori === aktifFiltre);
  const ad = adSoyad.split(" ")[0] || "IU";

  return (
    <div className="max-w-6xl mx-auto px-3 py-4 md:px-6 md:py-5 lg:px-8 lg:py-7">

      {/* Karşılama */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] m-0">Merhaba {ad}, 👋</h1>
          <p className="text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1">
            <strong style={{ color: "var(--tema-yerel-ana-sayfa-eylem-metin-03)", fontWeight: 700 }}>HapBilgi · </strong>{ROL_ADLARI["iu"]}
          </p>
        </div>
        <TarihPill />
      </div>

      {/* Stat kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {[
          { label: "Sizden Bekleniyor", value: istat.bekleyen, sub: "Yazım veya yükleme sizde", renk: "var(--tema-yerel-ana-sayfa-vurgu-metin-01)", filtre: "bekleyen" },
          { label: "Revizyon İstenen", value: istat.revizyon, sub: "Üreticiden revizyon talebi geldi", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-07)", filtre: "revizyon" },
          { label: "Devam Eden", value: istat.devam, sub: "Yazılıyor veya incelemede", renk: "var(--tema-yerel-ana-sayfa-eylem-metin-03)", filtre: "devam" },
          { label: "Tamamlanan", value: istat.tamamlanan, sub: "Onaylı veya yayında", renk: "var(--tema-yerel-ana-sayfa-islevsel-metin-06)", filtre: "tamamlanan" },
        ].map(k => (
          <div
            key={k.filtre}
            onClick={() => setAktifFiltre(aktifFiltre === k.filtre ? "tumu" : k.filtre)}
            className="bg-[var(--tema-yerel-ana-sayfa-kart-01)] border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] rounded-xl p-3 md:p-5 cursor-pointer transition-shadow duration-150"
            style={{
              borderLeft: `3px solid ${k.renk}`,
              boxShadow: aktifFiltre === k.filtre ? `0 0 0 2px color-mix(in srgb, ${k.renk} 20%, transparent)` : "none",
            }}
          >
            <div className="text-xs font-bold text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] uppercase tracking-wide mb-2">{k.label}</div>
            <div className="text-2xl md:text-3xl font-extrabold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] leading-none">{k.value}</div>
            <div className="hidden md:block text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] mt-1.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* İş takibi başlık */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)]">İş Takibi</span>
        {aktifFiltre !== "tumu" && (
          <button
            onClick={() => setAktifFiltre("tumu")}
            className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] bg-transparent border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] rounded-full px-3 py-1 cursor-pointer"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Filtreyi Kaldır
          </button>
        )}
      </div>

      <div className="bg-[var(--tema-yerel-ana-sayfa-kart-01)] border border-[var(--tema-yerel-ana-sayfa-cizgi-04)] rounded-xl overflow-hidden">

        {/* Mobile: kart görünümü */}
        <div className="md:hidden">
          {filtrelenmis.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)]">Bu kategoride iş bulunmuyor.</div>
          ) : (
            filtrelenmis.map((s, i) => {
              const asamaR = asamaRenk(s.asama);
              const durum = iuDurumMesaji(s.durum_kodu, { asama: s.asama, rolAdi: s.uretici_rol_adi, tarih: s.tarih });
              return (
                <div
                  key={`${s.talep_id}-${i}`}
                  onClick={() => router.push(s.yol)}
                  className="px-4 py-3 cursor-pointer"
                  style={{ borderBottom: i < filtrelenmis.length - 1 ? "1px solid var(--tema-yerel-ana-sayfa-cizgi-05)" : "none" }}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <div className="text-sm font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)]">{s.urun_adi}</div>
                      {s.turu_adi && <div className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] mt-0.5">{s.turu_adi}</div>}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight" style={{ background: durum.renk.bg, color: durum.renk.text, border: `0.5px solid ${durum.renk.border}` }}>{durum.metin}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: asamaR.bg, color: asamaR.text }}>{s.asama}</span>
                    <span className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)]">{s.teknik_adi}</span>
                  </div>
                  <div className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] mt-1">{formatTarih(s.tarih)}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: tablo görünümü */}
        <div className="hidden md:block">
          <div className="grid gap-3 px-5 py-2.5 bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-02)] border-b border-[var(--tema-yerel-ana-sayfa-cizgi-04)]" style={{ gridTemplateColumns: "1.8fr 1.4fr 1.1fr 1.4fr 1fr 20px" }}>
            {["Ürün / Eğitim", "TEKNİK", "AŞAMA", "DURUM", "TARİH", ""].map((h, i) => (
              <div key={i} className="text-xs font-bold text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] uppercase tracking-wide">{h}</div>
            ))}
          </div>
          {filtrelenmis.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)]">Bu kategoride iş bulunmuyor.</div>
          ) : (
            filtrelenmis.map((s, i) => {
              const asamaR = asamaRenk(s.asama);
              const durum = iuDurumMesaji(s.durum_kodu, { asama: s.asama, rolAdi: s.uretici_rol_adi, tarih: s.tarih });
              return (
                <div
                  key={`${s.talep_id}-${i}`}
                  onClick={() => router.push(s.yol)}
                  className="grid gap-3 px-5 py-3 items-center cursor-pointer bg-[var(--tema-yerel-ana-sayfa-kart-01)] hover:bg-[var(--tema-yerel-ana-sayfa-sayfa-zemini-02)] transition-colors duration-100"
                  style={{
                    gridTemplateColumns: "1.8fr 1.4fr 1.1fr 1.4fr 1fr 20px",
                    borderBottom: i < filtrelenmis.length - 1 ? "1px solid var(--tema-yerel-ana-sayfa-cizgi-05)" : "none",
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--tema-yerel-ana-sayfa-ana-metin-01)] truncate">{s.urun_adi}</div>
                    {s.turu_adi && <div className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] truncate">{s.turu_adi}</div>}
                  </div>
                  <div className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-03)] truncate">{s.teknik_adi}</div>
                  <div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block whitespace-nowrap" style={{ background: asamaR.bg, color: asamaR.text }}>{s.asama}</span></div>
                  <div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block leading-tight" style={{ background: durum.renk.bg, color: durum.renk.text, border: `0.5px solid ${durum.renk.border}` }}>{durum.metin}</span></div>
                  <span className="text-xs text-[var(--tema-yerel-ana-sayfa-yardimci-metin-01)] whitespace-nowrap">{formatTarih(s.tarih)}</span>
                  <span className="text-[var(--tema-yerel-ana-sayfa-yardimci-metin-05)] text-base">›</span>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}