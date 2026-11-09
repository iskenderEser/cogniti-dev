import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { type KkoHesapTuru } from "./kkoYetkisi";
export type KkoSecimIstegi = { hesapTuru: KkoHesapTuru; birimFiyat: number; islemAnahtari: string };
export function kkoSecimIstegiGecerli(veri: unknown): veri is KkoSecimIstegi {
  if (!veri || typeof veri !== "object" || Array.isArray(veri)) return false;
  const v = veri as Record<string, unknown>;
  return Object.keys(v).length === 3 && Object.keys(v).every(k => ["hesapTuru", "birimFiyat", "islemAnahtari"].includes(k))
    && (v.hesapTuru === "kisisel" || v.hesapTuru === "firma_ortak")
    && typeof v.birimFiyat === "number" && Number.isFinite(v.birimFiyat) && v.birimFiyat > 0
    && uuidGecerliMi(v.islemAnahtari);
}
