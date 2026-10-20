export const ECLUB_BANNER_BUCKET = "store-urun-gorselleri";
export const ECLUB_BANNER_TABLO = "eclub_firma_bannerlari";
export const ECLUB_BANNER_MAX_BOYUT = 5 * 1024 * 1024;
// Marka adı değişse de platformun mevcut firma ve banner kayıtları aynı kalır.
export const PLATFORM_FIRMA_ID = "15853eba-a94c-4528-9a07-0ee0b8677a02";

export interface EclubBanner { sira: number; url: string }

export function platformBannerFirmasi(firmaId: string): boolean {
  return firmaId.toLowerCase() === PLATFORM_FIRMA_ID;
}

export function bannerAdedi(firmaId: string): number {
  return platformBannerFirmasi(firmaId) ? 5 : 3;
}

export function bannerSirasiGecerli(sira: number, firmaId = "", alan: BannerAlani = "firma"): boolean {
  return Number.isInteger(sira) && sira >= 1 && sira <= bannerAlaniAdedi(firmaId, alan);
}

/** Uzantı dosya adına değil, dosyanın gerçek biçimine göre seçilir. */
export async function bannerDosyaUzantisi(dosya: File): Promise<string | null> {
  if (dosya.size === 0 || dosya.size > ECLUB_BANNER_MAX_BOYUT) return null;
  const b = new Uint8Array(await dosya.slice(0, 12).arrayBuffer());
  if (dosya.type === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) return "png";
  if (["image/jpeg", "image/jpg"].includes(dosya.type) && b[0] === 255 && b[1] === 216 && b[2] === 255) return "jpg";
  if (dosya.type === "image/webp" && new TextDecoder().decode(b.slice(0, 4)) === "RIFF" && new TextDecoder().decode(b.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export function bannerKurulumuEksik(hata: { code?: string } | null): boolean {
  return hata?.code === "42P01" || hata?.code === "PGRST205";
}

export const ECZANEM_BANNER_TABLO = "eczanem_sayfa_bannerlari";
export const ECZANEM_BANNER_ALANLARI = {
  "uye-ana-sayfa": "Üye Ana Sayfa Bannerları",
  uyeler: "Üyeler Sayfası Bannerı",
  "uye-yayinlari": "Üye Yayınları Sayfası Bannerı",
  "indirim-onayi": "İndirim Onayı Sayfası Bannerı",
} as const;
export type BannerAlani = "firma" | keyof typeof ECZANEM_BANNER_ALANLARI;

export function bannerAlaniGecerli(alan: string): alan is BannerAlani {
  return alan === "firma" || Object.hasOwn(ECZANEM_BANNER_ALANLARI, alan);
}

export function bannerAlaniAdedi(firmaId: string, alan: BannerAlani): number {
  return alan === "firma" || alan === "uye-ana-sayfa" ? bannerAdedi(firmaId) : 3;
}
