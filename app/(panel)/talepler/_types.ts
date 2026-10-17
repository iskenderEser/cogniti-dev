// app/talepler/_types.ts
//
// Talepler sayfasının paylaşılan tip sözleşmeleri, sabitler ve helper'lar.
// Bu dosyaya tüm bileşenler ve hook'lar import eder — bu sayfanın kontrat dosyasıdır.

import { TALEP_TURU_SIRA, type TalepTuru } from "@/lib/uretici/yetenekler";
import type { HedefRol, HedefRoller } from "@/lib/utils/roller";
import type { ZincirAsama } from "@/lib/utils/uretimZinciri";
import type { DurumKodu } from "@/lib/utils/durum/mesaj";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

// ============================================================================
// Tipler
// ============================================================================

// Hedef rol tipinin tek kaynağı lib/utils/roller.ts'tir (U0 — Eczanem zemini).
// Bu re-export, sayfa-içi bileşenlerin mevcut import yolunu korur.
export type { HedefRol, HedefRoller };

export interface Talep {
  talep_id: string;
  talep_no: number;
  firma_adi: string;
  uretici_id: string;
  urun_id: string | null;
  teknik_id: string | null;
  urun_adi: string;
  teknik_adi: string;
  egitim_turu: TalepTuru;
  ogrenme_araci_turu: OgrenmeAraciTuru;
  ogrenme_araci_tercihleri?: Record<string, unknown>;
  podcast_transkript_istendi?: boolean;
  hedef_roller: HedefRoller;
  aciklama: string;
  created_at: string;
  hazir_video: boolean;
  hazir_soru_seti: boolean;
  soru_seti_buyuklugu: number;
  video_basi_soru_sayisi: number;
  // ── Zincir durumu (27.07): /talepler/api ekler, v_uretici_icerik_takip'ten türer.
  // Sayfa bu alanlarla "devam eden / iptal edilen" ayrımını yapar; üretimi bitmiş
  // talepler hiç gösterilmez — onlar ana sayfadaki Yayın Listesi'ne aittir.
  asama: ZincirAsama;
  durum_kodu: DurumKodu;
  uretim_bitti: boolean;
  iptal_edildi: boolean;
  /** İşi o an üstlenen içerik üreticisinin adı — iptal tablosunda gösterilir. */
  iu_ad_soyad: string | null;
}

export interface Urun {
  urun_id: string;
  urun_adi: string;
}

export interface Teknik {
  teknik_id: string;
  teknik_adi: string;
}

// Madde 4 Aşama 2B için — UrunTeknikSecici (Adım 9) içinde takım dropdown'una beslenecek.
export interface Takim {
  takim_id: string;
  takim_adi: string;
}

export interface DosyaItem {
  dosya_adi: string;
  url: string;
  boyut: number;
  yuklenme_tarihi: string;
}

export interface Soru {
  soru_metni: string;
  secenekler: { harf: string; metin: string; dogru: boolean }[];
}

export interface KullaniciBilgi {
  firma_id: string;
  takim_id: string | null;
}

// page.tsx'te inline `{ dosya: File; preview: DosyaItem }` olarak kullanılıyordu — adlandırıldı.
export interface BekleyenDosya {
  dosya: File;
  preview: DosyaItem;
}

// ============================================================================
// Sabitler
// ============================================================================

export const DESTEKLENEN_FORMATLAR = ".pdf,.docx,.pptx,.xlsx,.txt,.png,.jpg,.jpeg,.mp4,.mov,.avi,.mkv,.webm";
export const PODCAST_FORMATLAR = ".mp3,.m4a,.aac,audio/mpeg,audio/mp4,audio/aac,audio/x-m4a";
export const GORSEL_FORMATLAR = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
export const PODCAST_KAPAK_FORMATLARI = ".png,.jpg,.jpeg,image/png,image/jpeg";
export const TRANSKRIPT_FORMATLARI = ".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const VIDEO_FORMATLAR = ".mp4,.mov,.avi,.mkv,.webm";
export const EK_DOSYA_FORMATLAR = ".pdf,.docx,.pptx,.xlsx,.txt,.png,.jpg,.jpeg";
export const FLIP_PDF_FORMATLAR = ".pdf,application/pdf";
export const SORU_SETI_BUYUKLUGU_SECENEKLERI = [10, 15, 20, 25];

// Tab altındaki kısa açıklama metinleri.
export const TALEP_TURU_ALT_ACIKLAMA: Record<TalepTuru, string> = {
  urun_egitimi: "Ürün + teknik bilgisi videosu",
  satis_teknikleri: "Satış becerisi (ürün tercihli)",
  yonetim_egitimi: "Yönetim eğitimleri",
  medikal_egitim: "Genel medikal içerik",
  urun_medikal_egitim: "Ürünün medikal yönü",
  ik_egitimi: "İK bilgilendirme, KVKK, etik",
};

// Tüm geçerli talep türlerinin sırası — üretim ve raporların ortak sözleşmesi.
export const TUM_TURLER = [...TALEP_TURU_SIRA];

// Liste tablosunda gösterilen tür rozeti (renk + etiket).
export const TUR_ROZET: Record<TalepTuru, { bg: string; renk: string; border: string; etiket: string }> = {
  urun_egitimi: { bg: "transparent", renk: "transparent", border: "transparent", etiket: "" }, // ürün adı zaten gösteriliyor, rozet yok
  satis_teknikleri: { bg: "var(--tema-yerel-uretim-islevsel-zemin-14)", renk: "var(--tema-yerel-uretim-islevsel-metin-43)", border: "var(--tema-yerel-uretim-islevsel-cizgi-26)", etiket: "Satış Teknikleri" },
  yonetim_egitimi: { bg: "var(--tema-yerel-uretim-islevsel-zemin-16)", renk: "var(--tema-yerel-uretim-islevsel-metin-44)", border: "var(--tema-yerel-uretim-islevsel-cizgi-27)", etiket: "Yönetim Eğitimleri" },
  medikal_egitim: { bg: "var(--tema-yerel-uretim-islevsel-zemin-09)", renk: "var(--tema-yerel-uretim-islevsel-metin-08)", border: "var(--tema-yerel-uretim-islevsel-cizgi-07)", etiket: "Medikal Eğitim" },
  urun_medikal_egitim: { bg: "var(--tema-yerel-uretim-islevsel-zemin-33)", renk: "var(--tema-yerel-uretim-islevsel-metin-45)", border: "var(--tema-yerel-uretim-islevsel-cizgi-28)", etiket: "Ürün-Medikal" },
  ik_egitimi: { bg: "var(--tema-yerel-uretim-islevsel-zemin-02)", renk: "var(--tema-yerel-uretim-islevsel-metin-04)", border: "var(--tema-yerel-uretim-islevsel-cizgi-02)", etiket: "İK Eğitimi" },
};

// Hedef rol görsel tasarımı (bant + pill için ortak renk/etiket sözlüğü).
// UTT: mavi tonu (sistemin ana mavisi). BM: bordo (Challenge Club rengi).
// Eczacı: Türk eczane kırmızısı (#e30a17). Eczane Teknisyeni: konfederasyon
// laciverti (#10304a) + yeşil (#7ed957). (E-Club akışı — ikisi ayrı hedef.)
// Eczanem: amber (eczanenin kendi müşterisi — üçüncü katman).
export const HEDEF_ROL_TASARIM: Record<HedefRol, { bg: string; renk: string; border: string; tamEtiket: string; kisaEtiket: string }> = {
  utt: {
    bg: "var(--tema-hedef-utt-zemin)",
    renk: "var(--tema-hedef-utt-metin)",
    border: "var(--tema-hedef-utt-cizgi)",
    tamEtiket: "Ürün Tanıtım Temsilcileri",
    kisaEtiket: "UTT",
  },
  bm: {
    bg: "var(--tema-hedef-bm-zemin)",
    renk: "var(--tema-hedef-bm-metin)",
    border: "var(--tema-hedef-bm-cizgi)",
    tamEtiket: "Bölge Müdürleri",
    kisaEtiket: "BM",
  },
  eczaci: {
    bg: "var(--tema-hedef-eczaci-zemin)",
    renk: "var(--tema-hedef-eczaci-metin)",
    border: "var(--tema-hedef-eczaci-cizgi)",
    tamEtiket: "Eczacılar",
    kisaEtiket: "Eczacı",
  },
  eczane_teknisyeni: {
    bg: "var(--tema-hedef-eczane_teknisyeni-zemin)",
    renk: "var(--tema-hedef-eczane_teknisyeni-metin)",
    border: "var(--tema-hedef-eczane_teknisyeni-cizgi)",
    tamEtiket: "Eczane Teknisyenleri",
    kisaEtiket: "Ecz. Tek.",
  },
  eczanem: {
    bg: "var(--tema-hedef-eczanem-zemin)",
    renk: "var(--tema-hedef-eczanem-metin)",
    border: "var(--tema-hedef-eczanem-cizgi)",
    tamEtiket: "Eczane Müşterileri",
    kisaEtiket: "Eczanem",
  },
};

// ============================================================================
// Helper
// ============================================================================

export const dosyaTipiRenk = (dosya_adi: string): { etiket: string; bg: string; renk: string } => {
  const ext = dosya_adi.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { etiket: "PDF", bg: "var(--tema-yerel-uretim-islevsel-zemin-09)", renk: "var(--tema-yerel-uretim-vurgu-metin-01)" };
  if (["docx", "doc"].includes(ext)) return { etiket: "DOC", bg: "var(--tema-yerel-uretim-secim-zemin-02)", renk: "var(--tema-yerel-uretim-eylem-metin-02)" };
  if (["pptx", "ppt"].includes(ext)) return { etiket: "PPT", bg: "var(--tema-yerel-uretim-islevsel-zemin-15)", renk: "var(--tema-yerel-uretim-islevsel-metin-36)" };
  if (["xlsx", "xls"].includes(ext)) return { etiket: "XLS", bg: "var(--tema-yerel-uretim-islevsel-zemin-02)", renk: "var(--tema-yerel-uretim-islevsel-metin-04)" };
  if (ext === "txt") return { etiket: "TXT", bg: "var(--tema-yerel-uretim-sayfa-zemini-25)", renk: "var(--tema-yerel-uretim-ana-metin-30)" };
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return { etiket: "IMG", bg: "var(--tema-yerel-uretim-islevsel-zemin-33)", renk: "var(--tema-yerel-uretim-islevsel-metin-45)" };
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return { etiket: "VID", bg: "var(--tema-yerel-uretim-islevsel-zemin-02)", renk: "var(--tema-yerel-uretim-islevsel-metin-01)" };
  if (["mp3", "m4a", "aac"].includes(ext)) return { etiket: "POD", bg: "var(--tema-yerel-uretim-islevsel-zemin-16)", renk: "var(--tema-yerel-uretim-islevsel-metin-44)" };
  return { etiket: ext.toUpperCase(), bg: "var(--tema-yerel-uretim-sayfa-zemini-25)", renk: "var(--tema-yerel-uretim-yardimci-metin-04)" };
};
