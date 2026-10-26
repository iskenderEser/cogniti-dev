import { vivaUuidMu, type VivaEtkinlik } from './sozlesme';
import type { VivaListeBolumu, VivaListeKapsami } from './liste';
export const VIVA_DETAY_BOLUMLERI = [
  { deger: 'katilimcilar', etiket: 'Katılımcılar ve davetler' },
  { deger: 'kayitlar', etiket: 'Yayın kayıtları' },
] as const;
export type VivaDetayBolumu = typeof VIVA_DETAY_BOLUMLERI[number]['deger'];
export function vivaDetayBolumu(v: unknown): VivaDetayBolumu {
  return VIVA_DETAY_BOLUMLERI.some(b => b.deger === v) ? v as VivaDetayBolumu : 'katilimcilar';
}
export function vivaDetayKartDurumu(e: VivaEtkinlik, simdi: number) {
  const basladi = e.durum === 'canli' || (e.yayin_basladi ?? e.durum === 'sona_erdi');
  const zamaniGecti = Date.parse(e.baslangic) <= simdi;
  const suresiDoldu = Date.parse(e.bitis) <= simdi;
  const sonlandi = e.durum === 'sona_erdi' || (basladi && suresiDoldu);
  const eylemlerKapali = (!basladi && zamaniGecti) || sonlandi;
  if (e.durum === 'iptal') return { etiket: 'İptal Edildi', canli: false, eylemlerKapali: true };
  if (e.durum === 'taslak') return { etiket: 'Taslak', canli: false, eylemlerKapali };
  if (!basladi && (zamaniGecti || sonlandi)) return { etiket: 'Gerçekleşmedi', canli: false, eylemlerKapali: true };
  if (sonlandi) return { etiket: 'Gerçekleşti', canli: false, eylemlerKapali: true };
  if (basladi) {
    const gercekBaslangic = e.yayin_baslangici ? Date.parse(e.yayin_baslangici) : NaN;
    return { etiket: Number.isFinite(gercekBaslangic) && simdi >= gercekBaslangic + 300_000 ? 'Devam ediyor' : 'Başladı', canli: true, eylemlerKapali };
  }
  return { etiket: 'Planlandı', canli: false, eylemlerKapali };
}
export type VivaListeKaynagi = `${Exclude<VivaListeBolumu, 'yaklasan'>}-${Exclude<VivaListeKapsami, 'tumu'>}`;
export function vivaListeKaynagi(value: unknown): VivaListeKaynagi | null {
  if (typeof value !== 'string') return null;
  const bolumler = ['ileri', 'canli', 'gecmis', 'taslak'];
  const kapsamlar = ['duzenlediklerim', 'davetlerim'];
  const [bolum, kapsam, fazlalik] = value.split('-');
  return !fazlalik && bolumler.includes(bolum) && kapsamlar.includes(kapsam) && !(bolum === 'taslak' && kapsam === 'davetlerim')
    ? value as VivaListeKaynagi : null;
}
export function vivaListeKaynakEtiketi(kaynak: VivaListeKaynagi): string {
  const [bolum, kapsam] = kaynak.split('-');
  if (bolum === 'taslak') return 'Taslaklarınız';
  const baslik = { ileri: 'İleri Tarihli Yayınlar', canli: 'Başlayan Yayınlar', gecmis: 'Geçmiş' }[bolum];
  const sahiplik = kapsam === 'duzenlediklerim' ? 'Düzenledikleriniz' : 'Davet Edildikleriniz';
  return bolum === 'gecmis' ? `${baslik} ${sahiplik}` : `${baslik} · ${sahiplik}`;
}
export function vivaEtkinlikKaynagi(e: VivaEtkinlik, now = Date.now()): VivaListeKaynagi {
  const bolum = e.durum === 'taslak' ? 'taslak' : e.durum === 'canli' && Date.parse(e.bitis) > now ? 'canli'
    : e.durum === 'planlandi' && Date.parse(e.baslangic) > now ? 'ileri' : 'gecmis';
  return `${bolum}-${e.yonetebilir ? 'duzenlediklerim' : 'davetlerim'}` as VivaListeKaynagi;
}
export function vivaDetayYolu(id: string, bolum: VivaDetayBolumu = 'katilimcilar', kaynak: VivaListeKaynagi | null = null) {
  if (!vivaUuidMu(id)) throw new Error('Geçersiz etkinlik.');
  const sorgu = new URLSearchParams();
  sorgu.set('bolum', vivaDetayBolumu(bolum));
  if (kaynak) sorgu.set('kaynak', kaynak);
  return `/viva/${id}${sorgu.size ? `?${sorgu}` : ''}`;
}
export function vivaKayitSayfasi(p: URLSearchParams) {
  const offset = Number(p.get('offset') ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) throw new Error('Geçersiz kayıt sayfası.');
  return offset;
}
export interface VivaKayitOzeti { etkinlik: VivaEtkinlik; kayit_sayisi: number; indirme_bitis: string | null; suresi_doldu: boolean }
export interface VivaKayitKutuphanesi { olusturabilir: boolean; etkinlikler: VivaKayitOzeti[]; devam_var: boolean; toplam: number }
