/** Ortak şifre kuralı doğrulaması (hem istemci formları hem sunucu uç noktaları). */
export const SIFRE_KURAL_ACIKLAMASI =
  "En az 8 karakter; harf ve rakam içermeli, ardışık veya tekrarlı dizi içermemelidir.";

export function sifreKuralHatasi(sifre: string): string | null {
  if (sifre.length < 8 || sifre.length > 128) return "Şifre 8–128 karakter olmalıdır.";
  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(sifre) || !/\d/.test(sifre)) {
    return "Şifre en az bir harf ve bir rakam içermelidir.";
  }
  if (/(.)\1{3}/.test(sifre)) {
    return "Şifre aynı karakterin 4 kez tekrarını (ör. 1111) içermemelidir.";
  }
  const kucuk = sifre.toLowerCase();
  for (let i = 0; i <= kucuk.length - 4; i++) {
    const c0 = kucuk.charCodeAt(i);
    const c1 = kucuk.charCodeAt(i + 1);
    const c2 = kucuk.charCodeAt(i + 2);
    const c3 = kucuk.charCodeAt(i + 3);
    const harfVeyaRakam =
      /[a-z0-9]/.test(kucuk[i]) &&
      /[a-z0-9]/.test(kucuk[i + 1]) &&
      /[a-z0-9]/.test(kucuk[i + 2]) &&
      /[a-z0-9]/.test(kucuk[i + 3]);
    if (
      harfVeyaRakam &&
      ((c1 === c0 + 1 && c2 === c1 + 1 && c3 === c2 + 1) ||
        (c1 === c0 - 1 && c2 === c1 - 1 && c3 === c2 - 1))
    ) {
      return "Şifre ardışık karakter dizisi (ör. 1234, abcd) içermemelidir.";
    }
  }
  return null;
}
