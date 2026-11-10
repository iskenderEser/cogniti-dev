export const SM2_TOKEN_ADETLERI = [2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000, 26000, 27000, 28000, 29000, 30000, 31000, 32000, 33000, 34000, 35000, 36000, 37000, 38000, 39000, 40000, 41000, 42000, 43000, 44000, 45000, 46000, 47000, 48000, 49000, 50000];
export const SM2_SURELERI = [0] as const;
export const ESNEK_UC_FIYAT_ANAHTARLARI = ["esnek_2500_token_tl", "esnek_50000_token_tl"] as const;

export function esnekBirimFiyati(adet: number, baslangic: number, bitis: number): number {
  const egim = (baslangic - bitis) / Math.log(50000 / 2500);
  return Math.round((baslangic - egim * Math.log(adet / 2500)) * 100) / 100;
}
export interface Sm2Fiyat { token_adedi: number; ay: number; katsayi: number; birim_fiyat: number }

export function sm2MatrisiGecerli(veri: unknown): veri is Sm2Fiyat[] {
  if (!Array.isArray(veri) || veri.length !== SM2_TOKEN_ADETLERI.length * SM2_SURELERI.length) return false;
  const anahtarlar = new Set<string>();
  for (const h of veri) {
    if (!h || !SM2_TOKEN_ADETLERI.includes(h.token_adedi) || !SM2_SURELERI.includes(h.ay)
      || typeof h.katsayi !== "number" || !Number.isFinite(h.katsayi) || h.katsayi <= 0
      || typeof h.birim_fiyat !== "number" || !Number.isFinite(h.birim_fiyat) || h.birim_fiyat < 0) return false;
    anahtarlar.add(`${h.token_adedi}:${h.ay}`);
  }
  return anahtarlar.size === SM2_TOKEN_ADETLERI.length * SM2_SURELERI.length;
}
