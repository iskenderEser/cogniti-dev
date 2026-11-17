"use client";

export const TASLAK_FIRMA_ANAHTARI = "cogniti_kurumsal_taslak_firma";
export const TASLAK_SOZLESME_ANAHTARI = "cogniti_kurumsal_taslak_sozlesme";
export const TASLAK_ISIM_LISTESI_ANAHTARI = "cogniti_kurumsal_taslak_liste_isim-listesi";
export const TASLAK_URUN_LISTESI_ANAHTARI = "cogniti_kurumsal_taslak_liste_urun-listesi";
export const SON_ETKILESIM_ANAHTARI = "cogniti_kurumsal_son_etkilesim";

const TUM_ANAHTARLAR = [
  TASLAK_FIRMA_ANAHTARI,
  TASLAK_SOZLESME_ANAHTARI,
  TASLAK_ISIM_LISTESI_ANAHTARI,
  TASLAK_URUN_LISTESI_ANAHTARI,
  SON_ETKILESIM_ANAHTARI,
] as const;

export function taslakOku<T>(anahtar: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const ham = window.sessionStorage.getItem(anahtar);
    if (!ham) return null;
    return JSON.parse(ham) as T;
  } catch {
    return null;
  }
}

export function taslakYaz(anahtar: string, deger: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(anahtar, JSON.stringify(deger));
  } catch {
    // sessionStorage kota veya erişim hatası sessizce geçilir
  }
}

export function taslakSil(anahtar: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(anahtar);
  } catch {
    // sessizce geçilir
  }
}

export function kurumsalTaslagiTemizle(): void {
  if (typeof window === "undefined") return;
  for (const anahtar of TUM_ANAHTARLAR) {
    try {
      window.sessionStorage.removeItem(anahtar);
    } catch {
      // sessizce geçilir
    }
  }
}
