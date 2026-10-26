import type { VivaEtkinlik } from './sozlesme';
import { trZamanParcalari } from '@/lib/zaman/turkiye';

export type VivaListeBolumu = 'ileri' | 'canli' | 'yaklasan' | 'taslak' | 'gecmis';
export type VivaListeKapsami = 'tumu' | 'duzenlediklerim' | 'davetlerim';
export interface VivaListeSorgusu {
  bolum: VivaListeBolumu; kapsam: VivaListeKapsami; arama: string; ay: string; gun: string | null; offset: number;
}
export interface VivaListeKarti extends VivaEtkinlik { katilimci_sayisi: number | null }
export interface VivaListeYaniti {
  olusturabilir: boolean; canlilar: VivaListeKarti[]; etkinlikler: VivaListeKarti[];
  toplam: number; devam_var: boolean; takvim: { gun: string; adet: number }[];
  siradaki: VivaListeKarti | null; simdi: string; uyumluluk?: boolean;
}
const iki = (n: number) => String(n).padStart(2, '0');
export function vivaBugun(simdi = new Date()) {
  const p = trZamanParcalari(simdi);
  return `${p.yil}-${iki(p.ay)}-${iki(p.gun)}`;
}
export function vivaGunGecerli(gun: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gun)) return false;
  const [y, m, d] = gun.split('-').map(Number);
  const date = new Date(`${gun}T12:00:00+03:00`);
  return y >= 1900 && y <= 2200 && !Number.isNaN(date.getTime()) && vivaBugun(date) === `${y}-${iki(m)}-${iki(d)}`;
}
export function vivaListeSorgusu(q: URLSearchParams, simdi = new Date()): VivaListeSorgusu {
  const bolum = q.get('bolum') ?? 'ileri', kapsam = q.get('kapsam') ?? 'tumu';
  const arama = (q.get('arama') ?? '').trim(), ay = q.get('ay') ?? vivaBugun(simdi).slice(0, 7);
  const gun = q.get('gun') || null, offset = Number(q.get('offset') ?? 0);
  if (!['ileri', 'canli', 'yaklasan', 'taslak', 'gecmis'].includes(bolum) || !['tumu', 'duzenlediklerim', 'davetlerim'].includes(kapsam)
    || arama.length > 160 || !/^\d{4}-\d{2}$/.test(ay) || !vivaGunGecerli(`${ay}-01`)
    || (gun !== null && (!vivaGunGecerli(gun) || !gun.startsWith(ay)))
    || !Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000) throw Error('Geçersiz etkinlik filtresi.');
  return { bolum: bolum as VivaListeBolumu, kapsam: kapsam as VivaListeKapsami, arama, ay, gun, offset };
}
export function vivaListeUrl(s: VivaListeSorgusu) {
  const q = new URLSearchParams({ islem: 'liste_ekrani', bolum: s.bolum, kapsam: s.kapsam, ay: s.ay, offset: String(s.offset) });
  if (s.arama) q.set('arama', s.arama);
  if (s.gun) q.set('gun', s.gun);
  return `/viva/api?${q}`;
}
/** Eski RPC ile uyumluluk: ancak bütün yetkili sayfalar toplandıktan sonra çağrılır. */
export function vivaListeHesapla(liste: VivaEtkinlik[], s: VivaListeSorgusu, olusturabilir: boolean, simdi = new Date()): VivaListeYaniti {
  const time = simdi.getTime();
  const kapsam = liste.filter(e => (s.kapsam === 'tumu' || (s.kapsam === 'duzenlediklerim' ? e.yonetebilir : !e.yonetebilir))
    && e.baslik.toLocaleLowerCase('tr-TR').includes(s.arama.toLocaleLowerCase('tr-TR')));
  const grupta = (e: VivaEtkinlik) => s.bolum === 'taslak' ? e.durum === 'taslak' && e.yonetebilir
    : s.bolum === 'ileri' ? e.durum === 'planlandi' && Date.parse(e.baslangic) > time && Date.parse(e.bitis) > time
    : s.bolum === 'canli' ? e.durum === 'canli' && Date.parse(e.bitis) > time
    : s.bolum === 'yaklasan' ? ['canli', 'planlandi'].includes(e.durum) && Date.parse(e.bitis) > time
      : e.durum !== 'taslak' && (['sona_erdi', 'iptal'].includes(e.durum) || Date.parse(e.bitis) <= time);
  const gruplu = kapsam.filter(grupta);
  const tarihte = (e: VivaEtkinlik) => !s.gun || vivaBugun(new Date(e.baslangic)) === s.gun;
  const sirala = (a: VivaEtkinlik, b: VivaEtkinlik) => Date.parse(a.baslangic) - Date.parse(b.baslangic) || a.etkinlik_id.localeCompare(b.etkinlik_id);
  const kart = (e: VivaEtkinlik): VivaListeKarti => ({ ...e, katilimci_sayisi: null });
  const canlilar = s.bolum === 'yaklasan' ? gruplu.filter(e => e.durum === 'canli' && tarihte(e)).sort(sirala) : [];
  const adaylar = gruplu.filter(e => tarihte(e) && !(s.bolum === 'yaklasan' && e.durum === 'canli')).sort((a, b) => s.bolum === 'gecmis' ? -sirala(a, b) : sirala(a, b));
  const gunler = new Map<string, number>();
  for (const e of gruplu) { const gun = vivaBugun(new Date(e.baslangic)); if (gun.startsWith(s.ay)) gunler.set(gun, (gunler.get(gun) ?? 0) + 1); }
  const siradaki = kapsam.filter(e => e.durum === 'planlandi' && Date.parse(e.baslangic) > time && Date.parse(e.bitis) > time && tarihte(e)).sort(sirala)[0];
  return { olusturabilir, canlilar: canlilar.map(kart), etkinlikler: adaylar.slice(s.offset, s.offset + 20).map(kart), toplam: adaylar.length,
    devam_var: adaylar.length > s.offset + 20, takvim: [...gunler].sort(([a], [b]) => a.localeCompare(b)).map(([gun, adet]) => ({ gun, adet })),
    siradaki: siradaki ? kart(siradaki) : null, simdi: simdi.toISOString(), uyumluluk: true };
}
export function vivaAyKaydir(ay: string, fark: number) {
  const [y, m] = ay.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + fark, 1));
  return `${d.getUTCFullYear()}-${iki(d.getUTCMonth() + 1)}`;
}
export function vivaTakvimGunleri(ay: string) {
  const [y, m] = ay.split('-').map(Number), ilk = new Date(Date.UTC(y, m - 1, 1));
  const bos = (ilk.getUTCDay() + 6) % 7, sayi = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [...Array.from({ length: bos }, () => null), ...Array.from({ length: sayi }, (_, i) => `${ay}-${iki(i + 1)}`)];
}
