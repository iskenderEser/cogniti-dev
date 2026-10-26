import 'server-only';
import { vivaKullanici, VivaHatasi } from './sunucu';
import { vivaListeHesapla, type VivaListeSorgusu, type VivaListeYaniti } from './liste';
import type { VivaBaglam, VivaEtkinlik } from './sozlesme';

/** Yeni salt okunur RPC; kurulum gelene kadar eski yetkili RPC'nin bütün sayfalarıyla uyumludur. */
async function eskiListeEkraniOku(sorgu: VivaListeSorgusu, signal?: AbortSignal): Promise<VivaListeYaniti> {
  const { db, user } = await vivaKullanici();
  const { data, error } = await db.rpc('viva_liste_ekrani', { p_auth: user.id, p_veri: { ...sorgu } });
  if (!error) return data as VivaListeYaniti;
  if (!['PGRST202', '42883'].includes(error.code ?? '')) throw error;
  // Yalnız eksik yeni fonksiyon için eski okuma kullanılır; yetki/ağ hatasında fallback yapılmaz.
  const baglam = await db.rpc('viva_islem', { p_auth: user.id, p_islem: 'baglam', p_veri: {} });
  if (baglam.error) throw baglam.error;
  const sonuc: VivaEtkinlik[] = [], gorulen = new Set<string>();
  for (let offset = 0; offset < 5_000; offset += 20) {
    signal?.throwIfAborted();
    const sayfa = await db.rpc('viva_islem', { p_auth: user.id, p_islem: 'liste', p_veri: { offset } });
    if (sayfa.error) throw sayfa.error;
    const veri = sayfa.data as { etkinlikler: VivaEtkinlik[]; devam_var: boolean };
    if (!Array.isArray(veri?.etkinlikler) || typeof veri.devam_var !== 'boolean') throw new VivaHatasi('Etkinlikler alınamadı.', 503);
    let yeni = 0;
    for (const e of veri.etkinlikler) if (!gorulen.has(e.etkinlik_id)) { gorulen.add(e.etkinlik_id); sonuc.push(e); yeni++; }
    if (!veri.devam_var) return vivaListeHesapla(sonuc, sorgu, (baglam.data as VivaBaglam).olusturabilir);
    if (!yeni) throw new VivaHatasi('Etkinlikler değişti. Listeyi yeniden yükleyin.', 409);
  }
  // Hiçbir zaman eksik veriyle yanlış "etkinlik yok" veya yanlış sayaç döndürme.
  throw new VivaHatasi('Etkinlik listesi şu anda hazırlanamadı. Lütfen daha sonra yeniden deneyin.', 503);
}

/** Mevcut RPC'nin tüm yetkili sonuçları ayrıştırılır; sayaç ve sayfalama filtre sonrası hesaplanır. */
export async function vivaListeEkraniOku(sorgu: VivaListeSorgusu, signal?: AbortSignal): Promise<VivaListeYaniti> {
  if (sorgu.bolum !== 'ileri' && sorgu.bolum !== 'canli') return eskiListeEkraniOku(sorgu, signal);
  const kartlar = new Map<string, VivaListeYaniti['etkinlikler'][number]>();
  let ilk: VivaListeYaniti | undefined;
  for (let offset = 0; offset < 5_000; offset += 20) {
    signal?.throwIfAborted();
    const sayfa = await eskiListeEkraniOku({ ...sorgu, bolum: 'yaklasan', gun: null, offset }, signal);
    ilk ??= sayfa;
    const onceki = kartlar.size;
    for (const kart of [...sayfa.canlilar, ...sayfa.etkinlikler]) kartlar.set(kart.etkinlik_id, kart);
    if (!sayfa.devam_var) {
      const sonuc = vivaListeHesapla([...kartlar.values()], sorgu, ilk.olusturabilir, new Date(ilk.simdi));
      const zenginlestir = (kart: VivaListeYaniti['etkinlikler'][number]) => ({ ...kart, katilimci_sayisi: kartlar.get(kart.etkinlik_id)?.katilimci_sayisi ?? null });
      return { ...sonuc, uyumluluk: ilk.uyumluluk, etkinlikler: sonuc.etkinlikler.map(zenginlestir), siradaki: sonuc.siradaki ? zenginlestir(sonuc.siradaki) : null };
    }
    if (kartlar.size === onceki) throw new VivaHatasi('Etkinlikler değişti. Listeyi yeniden yükleyin.', 409);
  }
  throw new VivaHatasi('Etkinlik listesi şu anda hazırlanamadı. Lütfen daha sonra yeniden deneyin.', 503);
}
