import { trGunu } from "@/lib/zaman/kontrol";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import type { BakiyeTuru } from "./esnekPaket";

export type GonderimSecimi = {
  akis: "yayin_acilis" | "eclub_oneri";
  kaynakIdler: string[];
  aliciIdler: string[];
  planTarihi: string | null;
};
export type GonderimOnizlemeIstegi = GonderimSecimi & { bakiyeTuru: BakiyeTuru };
export type GonderimTokenOnizlemesi = {
  akis: GonderimSecimi["akis"]; bakiye_turu: BakiyeTuru; planli: boolean;
  uygun_kayit: number; atlanan_kayit: number; gereken_token: number; kullanilabilir_token: number;
  islem_sonrasi: number; eksik_token: number; yeterli: boolean; gercek_gonderim_acik: boolean; plan_rezervasyonu_acik?: boolean; aciklama: string;
};
const tarihGecerli = (v: unknown) => {
  if (v === null) return true;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00+03:00`);
  return Number.isFinite(d.getTime()) && trGunu(d) === v;
};
export function gonderimOnizlemeIstegiGecerli(veri: unknown): veri is GonderimOnizlemeIstegi {
  if (!veri || typeof veri !== "object" || Array.isArray(veri)) return false;
  const v = veri as Record<string, unknown>;
  const keys = ["akis", "kaynakIdler", "aliciIdler", "planTarihi", "bakiyeTuru"];
  if (Object.keys(v).length !== keys.length || !Object.keys(v).every(k => keys.includes(k))) return false;
  const ids = (a: unknown, min: number, max: number): a is string[] => Array.isArray(a) && a.length >= min && a.length <= max && a.every(uuidGecerliMi) && new Set(a).size === a.length;
  return (v.akis === "yayin_acilis" || v.akis === "eclub_oneri") && (v.bakiyeTuru === "kisisel" || v.bakiyeTuru === "firma_ortak")
    && ids(v.kaynakIdler, 1, 20) && ids(v.aliciIdler, v.akis === "eclub_oneri" ? 1 : 0, v.akis === "eclub_oneri" ? 100 : 0)
    && (v.akis !== "eclub_oneri" || v.kaynakIdler.length * v.aliciIdler.length <= 300) && tarihGecerli(v.planTarihi);
}
export function gonderimTokenOnizlemesiGecerli(veri: unknown): veri is GonderimTokenOnizlemesi {
  if (!veri || typeof veri !== "object") return false;
  const v = veri as GonderimTokenOnizlemesi;
  return (v.akis === "yayin_acilis" || v.akis === "eclub_oneri") && (v.bakiye_turu === "kisisel" || v.bakiye_turu === "firma_ortak")
    && typeof v.planli === "boolean" && typeof v.aciklama === "string" && v.aciklama.length <= 1000
    && [v.uygun_kayit,v.atlanan_kayit,v.gereken_token,v.kullanilabilir_token,v.islem_sonrasi,v.eksik_token].every(n => Number.isSafeInteger(n) && n >= 0)
    && v.yeterli === (v.kullanilabilir_token >= v.gereken_token)
    && v.islem_sonrasi === Math.max(0,v.kullanilabilir_token-v.gereken_token)
    && v.eksik_token === Math.max(0,v.gereken_token-v.kullanilabilir_token) && (v.plan_rezervasyonu_acik === undefined || typeof v.plan_rezervasyonu_acik === "boolean") && typeof v.gercek_gonderim_acik === "boolean" && (!v.gercek_gonderim_acik || !v.planli);
}
