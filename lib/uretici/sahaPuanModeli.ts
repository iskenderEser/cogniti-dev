// UTT/BM yayınlarının yayın öncesi puan modeli ve dönüşüm sözleşmesi.
export type SahaPuanModeli = "tl_karsilikli" | "tlsiz";

export function sahaHedefliMi(hedefRoller: readonly string[]): boolean {
  return hedefRoller.length > 0 && hedefRoller.every((rol) => rol === "utt" || rol === "bm");
}

// Yeni saha yayınında TL oranı yayına yazılmaz; firma/çek tanımındadır.
export function sahaMerkeziPuanKosullariHatasi(cekKarsiligi: unknown, puan: unknown, tl: unknown): string | null {
  if (typeof cekKarsiligi !== "boolean") return "UTT/BM yayını için puan modelini seçin.";
  if (puan != null || tl != null) return "UTT/BM yayınında puan–TL oranı girilmez. Karşılık FirmaStore’da firma ve çeke göre belirlenir.";
  return null;
}

// İkon ve sipariş puanı uygunluğu yayın oranından bağımsızdır.
// Eski E-Club varsayılanları açık saha modeli seçimi sayılmaz.
export function sahaCekPuaniVarMi(yayin: {
  saha_puan_modeli?: string | null;
  cek_karsiligi_var_mi?: boolean | null;
  hedef_roller?: readonly string[] | null;
}): boolean {
  return yayin.saha_puan_modeli === "tl_karsilikli"
    && yayin.cek_karsiligi_var_mi === true
    && sahaHedefliMi(yayin.hedef_roller ?? []);
}
