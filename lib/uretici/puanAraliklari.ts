export const PUAN_TURLERI = ["yayin", "cevap", "extra"] as const;
export type PuanTuru = typeof PUAN_TURLERI[number];
export type PuanAraligi = { minimum: number; maksimum: number; artis: number };
export type PuanAraliklari = Record<PuanTuru, PuanAraligi>;

export function puanAraliklariGecerliMi(v: unknown): v is PuanAraliklari {
  if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).length !== 3) return false;
  return PUAN_TURLERI.every(tur => {
    const a = (v as Record<string, unknown>)[tur];
    if (!a || typeof a !== "object" || Array.isArray(a) || Object.keys(a).length !== 3) return false;
    const { minimum, maksimum, artis } = a as PuanAraligi;
    return [minimum, maksimum, artis].every(n => Number.isInteger(n) && n > 0 && n <= 2147483647)
      && maksimum >= minimum && Math.floor((maksimum - minimum) / artis) < 1000;
  });
}

// Firma henüz aralık tanımlamadığında önceki seçenekler korunur.
export function etkinPuanAraliklari(ayar: PuanAraliklari | null, eczanem = false): PuanAraliklari {
  return ayar ?? {
    yayin: eczanem ? { minimum: 50, maksimum: 500, artis: 25 } : { minimum: 40, maksimum: 70, artis: 5 },
    cevap: eczanem ? { minimum: 10, maksimum: 100, artis: 10 } : { minimum: 3, maksimum: 7, artis: 1 },
    extra: { minimum: 5, maksimum: 10, artis: 1 },
  };
}
export function puanSecenekleri(a: PuanAraligi): number[] {
  return Array.from({ length: Math.floor((a.maksimum - a.minimum) / a.artis) + 1 }, (_, i) => a.minimum + i * a.artis);
}
export function puanAraligaUygunMu(v: unknown, a: PuanAraligi): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= a.minimum && v <= a.maksimum && (v - a.minimum) % a.artis === 0;
}
export function puanAraligiMetni(a: PuanAraligi): string {
  return `En düşük ${a.minimum} · En yüksek ${a.maksimum} · Artış ${a.artis}`;
}
