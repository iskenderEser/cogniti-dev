import { vivaUuidMu, type VivaEtkinlik } from './sozlesme';
export const VIVA_DETAY_BOLUMLERI = [
  { deger: 'ozet', etiket: 'Genel bakış' }, { deger: 'katilimcilar', etiket: 'Katılımcılar ve davetler' },
  { deger: 'kayitlar', etiket: 'Yayın kayıtları' },
] as const;
export type VivaDetayBolumu = typeof VIVA_DETAY_BOLUMLERI[number]['deger'];
export function vivaDetayBolumu(v: unknown): VivaDetayBolumu {
  return VIVA_DETAY_BOLUMLERI.some(b => b.deger === v) ? v as VivaDetayBolumu : 'ozet';
}
export function vivaDetayYolu(id: string, bolum: VivaDetayBolumu = 'ozet') {
  if (!vivaUuidMu(id)) throw new Error('Geçersiz etkinlik.');
  return `/viva/${id}${bolum === 'ozet' ? '' : `?bolum=${vivaDetayBolumu(bolum)}`}`;
}
export function vivaKayitSayfasi(p: URLSearchParams) {
  const offset = Number(p.get('offset') ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) throw new Error('Geçersiz kayıt sayfası.');
  return offset;
}
export interface VivaKayitOzeti { etkinlik: VivaEtkinlik; kayit_sayisi: number; indirme_bitis: string | null; suresi_doldu: boolean }
export interface VivaKayitKutuphanesi { olusturabilir: boolean; etkinlikler: VivaKayitOzeti[]; devam_var: boolean; toplam: number }
