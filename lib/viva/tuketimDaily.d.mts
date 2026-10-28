export interface VivaDailyKullanim { toplam_saniye: number; oturum_sayisi: number; katilim_sayisi: number; oturum_idleri: string[]; katilimlar: { id: string; saniye: number }[] }
export function vivaDailyKullanimi(girdi: { oda: string; oku: (yol: string) => Promise<unknown>; sayfaBoyutu?: number }): Promise<VivaDailyKullanim>;
