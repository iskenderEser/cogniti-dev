// components/raporlar/UrunKirilimPaneli.tsx
//
// Ürün dağılımı — master-detail: solda ürün butonları (nav), ortada seçili ürünün
// PUAN KIRILIMI grafiği (Video/Doğru Cevap/Öneri/Extra yeşil + kayıplar kırmızı, negatif).
// Görünüm Sütun/Çizgi/Tablo (pasta yok — net puan negatif olabilir), PNG indir.
// Teknik dağılımı burada YOK. Grafik gövdesi DagilimGrafik.

"use client";

import { useState } from "react";
import DagilimGrafik, { type DagilimKalem } from "@/components/raporlar/DagilimGrafik";

export interface UrunKirilim {
  urun_id: string;
  urun_adi: string;
  video_puani: number;
  soru_puani: number;
  oneri_puani: number;
  eclub_puani?: number;
  extra_puan: number;
  ileri_sarma_kaybi: number;
  yanlis_cevap_kaybi: number;
  oneri_kaybi: number;
  toplam_net_puan: number;
}

const PUAN_RENKLERI = {
  tamamlama: "var(--tema-yerel-rapor-islevsel-metin-43)",
  dogruCevap: "var(--tema-yerel-rapor-islevsel-metin-10)",
  oneri: "var(--tema-yerel-rapor-islevsel-metin-44)",
  extra: "var(--tema-yerel-rapor-islevsel-metin-45)",
  eclub: "var(--tema-yerel-rapor-islevsel-metin-46)",
  ileriSarma: "var(--tema-yerel-rapor-islevsel-metin-47)",
  yanlisCevap: "var(--tema-yerel-rapor-islevsel-metin-48)",
  oneriKaybi: "var(--tema-yerel-rapor-islevsel-metin-49)",
} as const;

function kirilim(u: UrunKirilim, tamamlamaEtiketi: string): DagilimKalem[] {
  return [
    { ad: tamamlamaEtiketi, puan: u.video_puani, renk: PUAN_RENKLERI.tamamlama },
    { ad: "Doğru Cevap", puan: u.soru_puani, renk: PUAN_RENKLERI.dogruCevap },
    { ad: "Öneri", puan: u.oneri_puani, renk: PUAN_RENKLERI.oneri },
    { ad: "Extra", puan: u.extra_puan, renk: PUAN_RENKLERI.extra },
    { ad: "E-Club", puan: (u.eclub_puani ?? 0), renk: PUAN_RENKLERI.eclub },
    { ad: "İleri sarma", puan: -u.ileri_sarma_kaybi, renk: PUAN_RENKLERI.ileriSarma },
    { ad: "Yanlış cevap", puan: -u.yanlis_cevap_kaybi, renk: PUAN_RENKLERI.yanlisCevap },
    { ad: "Öneri kaybı", puan: -u.oneri_kaybi, renk: PUAN_RENKLERI.oneriKaybi },
  ];
}

const dosyaAdi = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();

interface Props {
  urunler: UrunKirilim[];
  modern?: boolean;
  tamamlamaEtiketi?: string;
}

export default function UrunKirilimPaneli({ urunler, modern = false, tamamlamaEtiketi = "Video" }: Props) {
  const [seciliId, setSeciliId] = useState<string>(urunler[0]?.urun_id ?? "");
  const secili = urunler.find((u) => u.urun_id === seciliId) ?? urunler[0];
  if (!secili) return null;

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="flex flex-shrink-0 gap-1 overflow-x-auto md:w-28 md:flex-col md:overflow-visible">
        {urunler.map((u) => {
          const aktif = u.urun_id === secili.urun_id;
          return (
            <button
              key={u.urun_id}
              type="button"
              onClick={() => setSeciliId(u.urun_id)}
              className="whitespace-nowrap rounded-md px-2 py-1 text-left text-xs leading-tight transition-colors md:whitespace-normal"
              style={{
                border: modern ? "1px solid transparent" : "0.5px solid var(--tema-yerel-rapor-cizgi-42)",
                background: aktif ? (modern ? "var(--tema-yerel-rapor-secim-zemin-16)" : "var(--tema-yerel-rapor-eylem-zemin-04)") : (modern ? "var(--tema-yerel-rapor-sayfa-zemini-05)" : "var(--tema-yerel-rapor-kart-02)"),
                color: aktif ? "var(--tema-yerel-rapor-eylem-metin-14)" : "var(--tema-yerel-rapor-ana-metin-23)",
                fontWeight: aktif ? 600 : 400,
              }}
            >
              <span>{u.urun_adi}</span>
              <span className="block" style={{ fontSize: 10, color: aktif ? "var(--tema-yerel-rapor-eylem-metin-14)" : "var(--tema-yerel-rapor-yardimci-metin-68)" }}>
                {u.toplam_net_puan.toLocaleString("tr-TR")} puan
              </span>
            </button>
          );
        })}
      </div>

      {/* Orta: seçili ürünün puan kırılımı */}
      <div className="flex-1 min-w-0">
        <DagilimGrafik
          key={secili.urun_id}
          veri={kirilim(secili, tamamlamaEtiketi)}
          modlar={["bar", "line", "tablo"]}
          apsisAdi="Puan türü"
          ordinatAdi="Puan"
          indirAdi={`urun-${dosyaAdi(secili.urun_adi)}`}
          modern={modern}
        />
      </div>
    </div>
  );
}
