import { TUM_ROLLER } from "@/lib/utils/roller";

export function satinAlmaBakiyesiGorebilir(rol: string | null | undefined): boolean {
  const r = (rol ?? "").trim().toLowerCase();
  return TUM_ROLLER.includes(r) && r !== "admin";
}
export type BakiyeOzeti = { paket: "esnek" | "abonelik" | "kko" | null; toplam: number; kullanilan: number; kalan: number; suresi_dolan: number; ayrilan: number };
export type SatinAlmaBakiyeOzeti = { kisisel: BakiyeOzeti | null; firma_ortak: BakiyeOzeti };
function ozetGecerli(veri: unknown): veri is BakiyeOzeti {
  if (!veri || typeof veri !== "object") return false;
  const v = veri as BakiyeOzeti;
  const degerler = [v.toplam, v.kullanilan, v.kalan, v.suresi_dolan, v.ayrilan];
  return (v.paket === "esnek" || v.paket === "abonelik" || v.paket === "kko" || v.paket === null) && degerler.every(n => Number.isSafeInteger(n) && n >= 0)
    && v.toplam === v.kullanilan + v.kalan + v.suresi_dolan + v.ayrilan
    && (v.paket === "kko" ? v.toplam === 1500 : v.toplam === 0 ? v.paket === null : v.paket === "esnek" || v.paket === "abonelik");
}
export function satinAlmaBakiyeOzetiGecerli(veri: unknown): veri is SatinAlmaBakiyeOzeti {
  if (!veri || typeof veri !== "object") return false;
  const v = veri as SatinAlmaBakiyeOzeti;
  return (v.kisisel === null || ozetGecerli(v.kisisel)) && ozetGecerli(v.firma_ortak);
}
