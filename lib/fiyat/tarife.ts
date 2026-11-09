import { sm2MatrisiGecerli, type Sm2Fiyat } from "./sm2";

export const FIYAT_KALEMLERI = [
  { anahtar:"kko_token_miktari", grup:"Abonelik", ad:"Giriş Paketi · Token miktarı", birim:"Token/ay" },
  { anahtar:"kko_asim_tl", grup:"Paket aşımı", ad:"Giriş Paketi · Aşım bedeli", birim:"TL/token" },
  {
    "anahtar": "kko_token_tl",
    "grup": "Abonelik",
    "ad": "Giriş Paketi · Birim fiyat",
    "birim": "TL/token"
  },
  {
    "anahtar": "paket_10k_token_miktari",
    "grup": "Abonelik",
    "ad": "1. Paket · Token miktarı",
    "birim": "Token/ay"
  },
  {
    "anahtar": "paket_10k_token_tl",
    "grup": "Abonelik",
    "ad": "1. Paket · Token birim fiyatı",
    "birim": "TL/token"
  },
  {
    "anahtar": "paket_10k_asim_tl",
    "grup": "Paket aşımı",
    "ad": "1. Paket · Aşım birim fiyatı",
    "birim": "TL/token"
  },
  {
    "anahtar": "paket_30k_token_miktari",
    "grup": "Abonelik",
    "ad": "2. Paket · Token miktarı",
    "birim": "Token/ay"
  },
  {
    "anahtar": "paket_30k_token_tl",
    "grup": "Abonelik",
    "ad": "2. Paket · Token birim fiyatı",
    "birim": "TL/token"
  },
  {
    "anahtar": "paket_30k_asim_tl",
    "grup": "Paket aşımı",
    "ad": "2. Paket · Aşım birim fiyatı",
    "birim": "TL/token"
  },
  {
    "anahtar": "paket_75k_token_miktari",
    "grup": "Abonelik",
    "ad": "3. Paket · Token miktarı",
    "birim": "Token/ay"
  },
  {
    "anahtar": "paket_75k_token_tl",
    "grup": "Abonelik",
    "ad": "3. Paket · Token birim fiyatı",
    "birim": "TL/token"
  },
  {
    "anahtar": "paket_75k_asim_tl",
    "grup": "Paket aşımı",
    "ad": "3. Paket · Aşım birim fiyatı",
    "birim": "TL/token"
  },
  { "anahtar": "paket_25k_token_miktari", "grup": "Abonelik", "ad": "4. Paket · Token miktarı", "birim": "Token/ay" },
  { "anahtar": "paket_25k_token_tl", "grup": "Abonelik", "ad": "4. Paket · Token birim fiyatı", "birim": "TL/token" },
  {
    "anahtar": "uretim_video_tl",
    "grup": "İçerik üretimi",
    "ad": "Video Üretimi",
    "birim": "TL/adet"
  },
  {
    "anahtar": "uretim_podcast_tl",
    "grup": "İçerik üretimi",
    "ad": "Podcast Üretimi",
    "birim": "TL/adet"
  },
  {
    "anahtar": "uretim_brosur_tl",
    "grup": "İçerik üretimi",
    "ad": "Dijital Broşür Üretimi",
    "birim": "TL/adet"
  },
  {
    "anahtar": "uretim_literatur_tl",
    "grup": "İçerik üretimi",
    "ad": "Literatür Üretimi",
    "birim": "TL/adet"
  },
  {
    "anahtar": "banner_haftalik_token",
    "grup": "Banner",
    "ad": "Banner Kiralama",
    "birim": "Token/hafta"
  },
  {
    "anahtar": "viva_kisi_dakika_usd",
    "grup": "Viva",
    "ad": "Kişi-dakika maliyeti",
    "birim": "USD/kişi-dakika"
  },
  {
    "anahtar": "viva_usd_tl",
    "grup": "Viva",
    "ad": "Hesaplamada kullanılacak USD/TL kuru",
    "birim": "TL/USD"
  },
  {
    "anahtar": "viva_satis_katsayisi",
    "grup": "Viva",
    "ad": "Satış katsayısı",
    "birim": "Katsayı"
  }
] as const;
export type FiyatAnahtari = typeof FIYAT_KALEMLERI[number]["anahtar"];
export type FiyatDegerleri = Record<FiyatAnahtari, number | null>;
export interface FiyatTarifesi {
  surum: number;
  sm2: Sm2Fiyat[];
  degerler: FiyatDegerleri;
  hesaplar: { viva_kisi_dakika_tl: number; viva_kisi_dakika_token: number; paket_10k_aylik_tl: number; paket_30k_aylik_tl: number; paket_75k_aylik_tl: number; paket_25k_aylik_tl: number };
}
export function fiyatDegerleriGecerli(veri: unknown): veri is FiyatDegerleri {
  if (!veri || typeof veri !== "object" || Array.isArray(veri)) return false;
  const d = veri as Record<string, unknown>;
  return Object.keys(d).length === FIYAT_KALEMLERI.length && FIYAT_KALEMLERI.every(({ anahtar }) => {
    const v = d[anahtar];
    if (anahtar === "uretim_literatur_tl" && v === null) return true;
    return typeof v === "number" && Number.isFinite(v) && (anahtar === "kko_asim_tl" ? v >= 0 : v > 0) && v <= 1000000000
      && Math.abs(v * 1000000 - Math.round(v * 1000000)) < 0.0001
      && (!(anahtar === "banner_haftalik_token" || anahtar.endsWith("_token_miktari")) || Number.isInteger(v));
  });
}
export function fiyatTarifesiGecerli(veri: unknown): veri is FiyatTarifesi {
  if (!veri || typeof veri !== "object" || Array.isArray(veri)) return false;
  const d = veri as Record<string, unknown>;
  if (!Number.isSafeInteger(d.surum) || Number(d.surum) < 1 || !fiyatDegerleriGecerli(d.degerler)
    || !sm2MatrisiGecerli(d.sm2) || !d.hesaplar || typeof d.hesaplar !== "object" || Array.isArray(d.hesaplar)) return false;
  const h = d.hesaplar as Record<string, unknown>;
  return ["viva_kisi_dakika_tl", "viva_kisi_dakika_token", "paket_10k_aylik_tl", "paket_30k_aylik_tl", "paket_75k_aylik_tl", "paket_25k_aylik_tl"].every(k =>
    typeof h[k] === "number" && Number.isFinite(h[k]) && Number(h[k]) > 0);
}
export function fiyatMetniniOku(metin: string): number | null {
  const m = metin.trim().replace(",", ".");
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(m)) return null;
  const sayi = Number(m);
  return Number.isFinite(sayi) && sayi >= 0 && sayi <= 1000000000 ? sayi : null;
}
