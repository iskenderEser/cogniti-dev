export interface FirmaCekTanimi {
  firma_id: string;
  karsilik_puan: number;
  karsilik_tl: number;
  surum: number;
  guncellenme_at: string;
}
export interface EclubFirmaTanimiSatiri {
  firma_id: string;
  firma_adi: string;
  aktif: boolean;
  eclub_aktif: boolean;
  tanim: FirmaCekTanimi | null;
}
export function firmaCekDegerleriGecerli(puan: unknown, tl: unknown): boolean {
  return typeof puan === "number" && Number.isInteger(puan) && puan > 0 && puan <= 2147483647
    && typeof tl === "number" && Number.isFinite(tl) && tl > 0 && tl <= 999999999.99 && Number(tl.toFixed(2)) === tl;
}
