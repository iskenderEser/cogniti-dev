import { sm2MatrisiGecerli, type Sm2Fiyat } from './sm2';
import { taahhutluPaketlerGecerli, type TaahhutluPaket } from './taahhut';

export interface PlanlamaTarifesi {
  surum: number;
  sm2: Sm2Fiyat[];
  paketler: TaahhutluPaket[];
  kko: { limit: number; birim: number };
}
export function planlamaTarifesiGecerli(veri: unknown): veri is PlanlamaTarifesi {
  if (!veri || typeof veri !== 'object') return false;
  const d = veri as Partial<PlanlamaTarifesi>;
  return Number.isSafeInteger(d.surum) && Number(d.surum) > 0
    && sm2MatrisiGecerli(d.sm2) && taahhutluPaketlerGecerli(d.paketler)
    && !!d.kko && Number.isSafeInteger(d.kko.limit) && d.kko.limit > 0
    && typeof d.kko.birim === 'number' && Number.isFinite(d.kko.birim) && d.kko.birim > 0;
}
