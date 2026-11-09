import { URETICI_ROLLER, YONETICI_ROLLER, FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";
import { SM2_TOKEN_ADETLERI } from "@/lib/fiyat/sm2";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

export type BakiyeTuru = "kisisel" | "firma_ortak";
/** Fiyatları görebilmek satın alma yetkisi vermez. */
export function esnekPaketBakiyeTuru(rol: string | null | undefined): BakiyeTuru | null {
  const deger = (rol ?? "").trim().toLowerCase();
  if (URETICI_ROLLER.includes(deger)) return "kisisel";
  if (YONETICI_ROLLER.includes(deger) || deger === FIRMA_ADMIN_ROLU) return "firma_ortak";
  return null;
}
export type EsnekPaketSiparisIstegi = {
  tokenAdedi: number;
  tarifeSurumu: number;
  birimFiyat: number;
  islemAnahtari: string;
};
/** Firma, satın alan veya bakiye sahibi istemciden kabul edilmez. */
export function esnekPaketSiparisIstegiGecerli(veri: unknown): veri is EsnekPaketSiparisIstegi {
  if (!veri || typeof veri !== "object" || Array.isArray(veri)) return false;
  const v = veri as Record<string, unknown>;
  if (Object.keys(v).length !== 4 || !Object.keys(v).every(k => ["tokenAdedi", "tarifeSurumu", "birimFiyat", "islemAnahtari"].includes(k))) return false;
  return typeof v.tokenAdedi === "number" && SM2_TOKEN_ADETLERI.includes(v.tokenAdedi)
    && typeof v.tarifeSurumu === "number" && Number.isSafeInteger(v.tarifeSurumu) && v.tarifeSurumu > 0 && v.tarifeSurumu <= 2147483647
    && typeof v.birimFiyat === "number" && Number.isFinite(v.birimFiyat) && v.birimFiyat > 0 && v.birimFiyat <= 1000000000
    && Math.abs(v.birimFiyat * 100 - Math.round(v.birimFiyat * 100)) < 0.00001
    && uuidGecerliMi(v.islemAnahtari);
}
