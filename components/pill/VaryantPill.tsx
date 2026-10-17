// components/pill/VaryantPill.tsx
//
// Talebin üretim varyantı. İki bayrak BAĞIMSIZ (talepler.hazir_video,
// talepler.hazir_soru_seti) — ikisi de true olabilir, o zaman iki pill yan yana.
// İkisi de false ise normal üretimdir → hiç pill yok (null).
//
// METİN DEĞİŞTİ (İskender kararı 27.07, docs/pill_envanteri.md §E-4):
// "Öğrenme Aracı" / "Soru" yerine "Hazır [seçilen araç]" / "Hazır Soru". Sebep: aynı kelime hem
// varyant hem üretim aşaması pill'iydi, bazen aynı satırda yan yana düşüyordu
// (bulgu P-3). Ayrıca talep detayı zaten hazır varyantı yazıyordu — iki ekran iki
// ad kullanıyordu (P-6). Tek ad: "Hazır ...".
//
// Taşındı (27.07): eski yeri components/UretimVaryantiRozet.tsx. Ölçüsü kendi
// içinde yazılıydı (dikey dolgu 0, satır yüksekliği 1.05) ve yanındaki pill'lerden
// belirgin biçimde kısaydı — dört farklı yüksekliğin en uç örneğiydi (P-1).

"use client";

import { Pill, type PillRenk } from "./Pill";
import { ogrenmeAraciMetinleri } from "@/lib/ogrenmeAraci/etiketler";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

interface Props {
  hazirVideo?: boolean | null;
  hazirSoruSeti?: boolean | null;
  /** `hazirVideo`, şemadaki eski adıyla hazır öğrenme aracı bayrağıdır. */
  ogrenmeAraciTuru?: OgrenmeAraciTuru | null;
  /**
   * true → pill'ler kendi satırına düşer (liste satırında adın ALTINA).
   * Bugünkü davranış bu; varsayılan true tutuldu ki taşıma sırasında hiçbir
   * sayfanın yerleşimi kaymasın. Adım 4'te satır düzeni elden geçirilirken
   * gerekmeyen yerlerde kapatılacak.
   */
  kendiSatirinda?: boolean;
}

type VaryantTipi = "arac" | "soru" | "iu";

const VARYANT: Record<VaryantTipi, { etiket: string; renk: PillRenk }> = {
  arac: { etiket: "", renk: { bg: "var(--tema-pill-varyant-arac-zemin)", metin: "var(--tema-pill-varyant-arac-metin)", kenar: "var(--tema-pill-varyant-arac-cizgi)" } },
  soru: { etiket: "Hazır Soru", renk: { bg: "var(--tema-pill-varyant-soru-zemin)", metin: "var(--tema-pill-varyant-soru-metin)", kenar: "var(--tema-pill-varyant-soru-cizgi)" } },
  // Normal üretim: içeriği İÇERİK ÜRETİCİSİ hazırlar. Eskiden bu durumda hücre
  // boş kalıyordu ("-" gibi görünüyordu) — oysa bu bir eksik veri değil, üç
  // üretim yönteminden biri. Boş bırakmak "yöntem yok" demekti, yanlıştı.
  iu: { etiket: "İçerik Üreticisi", renk: { bg: "var(--tema-pill-varyant-iu-zemin)", metin: "var(--tema-pill-varyant-iu-metin)", kenar: "var(--tema-pill-varyant-iu-cizgi)" } },
};

export function VaryantPill({ hazirVideo, hazirSoruSeti, ogrenmeAraciTuru, kendiSatirinda = true }: Props) {
  const tipler: VaryantTipi[] = [];
  if (hazirVideo) tipler.push("arac");
  if (hazirSoruSeti) tipler.push("soru");
  // Hiçbir hazır bayrak yoksa üretim baştan sona İÜ'nündür. Bu kural MERKEZDE
  // durur: VaryantPill'i kullanan her ekran pill'i kendiliğinden alır, hiçbir
  // sayfaya elle yazılmaz (İskender kuralı 27.07).
  if (tipler.length === 0) tipler.push("iu");

  // flexBasis:100% → sarmalı ana satırda kendi satırına düşer. Yerleşim kararı
  // aslında sayfaya aittir; Adım 4'te satır düzeni elden geçirilirken kaldırılacak.
  return (
    // Mobil/kendi satırındaki kullanım gerektiğinde sarar. Masaüstü tablo hücresi
    // yeterli genişliği ayırdığı için iki üretim yöntemi tek satırda kalır.
    <div style={{ display: "flex", flexWrap: kendiSatirinda ? "wrap" : "nowrap", gap: "1mm", ...(kendiSatirinda ? { flexBasis: "100%" } : {}) }}>
      {tipler.map((t) => (
        <Pill key={t} renk={VARYANT[t].renk}>
          {t === "arac" ? ogrenmeAraciMetinleri(ogrenmeAraciTuru).hazir : VARYANT[t].etiket}
        </Pill>
      ))}
    </div>
  );
}
