export const SM2_TOKEN_ADETLERI = Array.from({ length: 13 }, (_, i) => 2500 + i * 500);
export const SM2_SURELERI = [1, 2, 3, 4, 5] as const;
export interface Sm2Fiyat { token_adedi: number; ay: number; katsayi: number; birim_fiyat: number }

export function sm2MatrisiGecerli(veri: unknown): veri is Sm2Fiyat[] {
  if (!Array.isArray(veri) || veri.length !== 65) return false;
  const anahtarlar = new Set<string>();
  for (const h of veri) {
    if (!h || !SM2_TOKEN_ADETLERI.includes(h.token_adedi) || !SM2_SURELERI.includes(h.ay)
      || typeof h.katsayi !== "number" || !Number.isFinite(h.katsayi) || h.katsayi <= 0
      || typeof h.birim_fiyat !== "number" || !Number.isFinite(h.birim_fiyat) || h.birim_fiyat < 0) return false;
    anahtarlar.add(`${h.token_adedi}:${h.ay}`);
  }
  return anahtarlar.size === 65;
}
