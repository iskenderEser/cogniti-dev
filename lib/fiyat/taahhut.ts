export interface TaahhutluPaket {
  id: number;
  ad: string;
  token: number;
  birim: number;
  aylik: number;
}
export type AbonelikPaketTaslagi = Omit<TaahhutluPaket, "id" | "aylik"> & { id: number | null };

function paketAlanlariGecerli(p: unknown): p is AbonelikPaketTaslagi {
  if (!p || typeof p !== "object") return false;
  const { id, ad, token, birim } = p as AbonelikPaketTaslagi;
  return (id === null || (Number.isInteger(id) && id > 0 && id <= 2147483647))
    && typeof ad === "string" && ad.trim().length > 0 && ad.trim().length <= 80
    && Number.isInteger(token) && token >= 15 && token <= 1_000_000_000
    && typeof birim === "number" && birim >= 0.01 && birim <= 1_000_000_000
    && Math.abs(birim * 1_000_000 - Math.round(birim * 1_000_000)) < 0.0001
    && Math.round(token * birim * 100) <= 7_500_000_000_000_000;
}

export function abonelikPaketTaslaklariGecerli(v: unknown): v is AbonelikPaketTaslagi[] {
  if (!Array.isArray(v) || !v.every(paketAlanlariGecerli)) return false;
  const ids = v.flatMap(p => p.id === null ? [] : [p.id]);
  return new Set(ids).size === ids.length;
}

export function taahhutluPaketlerGecerli(v: unknown): v is TaahhutluPaket[] {
  return abonelikPaketTaslaklariGecerli(v) && v.every(p => {
    const aylik = (p as TaahhutluPaket).aylik;
    return p.id !== null && typeof aylik === "number" && Number.isFinite(aylik) && aylik > 0;
  });
}
