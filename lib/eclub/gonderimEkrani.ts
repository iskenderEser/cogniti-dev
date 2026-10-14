import { haftaBaslangici, trGunu } from '@/lib/zaman/kontrol';
import { trZamanParcalari, trZamanUtc } from '@/lib/zaman/turkiye';
import type { GonderimKontrolSonucu } from '@/lib/eclub/gonderimPlanTipleri';

const GUN_MS = 86_400_000;

function gonderimAni(deger: string | null | undefined): number | null {
  if (!deger) return null;
  const an = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(deger) ? `${deger}T00:00:00+03:00` : deger);
  return Number.isFinite(an) ? an : null;
}

/** Aynı alıcı/yayın için 15 günlük engelin kalkacağı an; SQL uygunluk sonucu kaynak alınır. */
export function gonderimAraligiBitisAni(sonuc: GonderimKontrolSonucu): number | null {
  if (sonuc.sebep !== 'on_bes_gun_araligi') return null;
  const oncekiBitis = gonderimAni(sonuc.yeniden_gonderilebilir_at);
  const sonrakiPlan = gonderimAni(sonuc.sonraki_gonderim_at);
  const tarihler = [oncekiBitis, sonrakiPlan === null ? null : sonrakiPlan + 15 * GUN_MS].filter((an): an is number => an !== null);
  return tarihler.length ? Math.max(...tarihler) : null;
}

/** Bir alıcının seçili yayınları için ortak gönderim engelinin kalan tam gün sayısı. */
export function gonderiIcinKalanGun(sonuclar: readonly GonderimKontrolSonucu[], simdi: number): number | null {
  const engeller = sonuclar.filter(sonuc => sonuc.uygun === false);
  if (!engeller.length || engeller.some(sonuc => sonuc.sebep !== 'on_bes_gun_araligi')) return null;
  const bitisler = engeller.map(gonderimAraligiBitisAni);
  if (bitisler.some(bitis => bitis === null)) return null;
  const sonBitis = Math.max(...bitisler.filter((bitis): bitis is number => bitis !== null));
  return Math.max(0, Math.ceil((sonBitis - simdi) / GUN_MS));
}

export function planTakvimSinirlari(simdi = new Date()) {
  const { yil, ay, gun } = trZamanParcalari(simdi);
  const donemSonu = trZamanUtc(yil, Math.floor((ay - 1) / 2) * 2 + 3, 1).getTime();
  const haftaSonu = haftaBaslangici(simdi).getTime() + 14 * 86400_000;
  return { min: trGunu(trZamanUtc(yil, ay, gun + 1)), max: trGunu(new Date(Math.min(donemSonu, haftaSonu) - 1)) };
}
export function planHedefiniCoz(tarih: string, simdi = new Date()): { hedef: string | null; hata: string | null } {
  if (!tarih) return { hedef: null, hata: 'Planlama için tarih seçin.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return { hedef: null, hata: 'Geçerli bir tarih seçin.' };
  const an = new Date(`${tarih}T00:00:00+03:00`);
  if (!Number.isFinite(an.getTime()) || trGunu(an) !== tarih)
    return { hedef: null, hata: 'Geçerli bir tarih seçin.' };
  const sinir = planTakvimSinirlari(simdi);
  if (tarih < sinir.min) return { hedef: null, hata: 'Plan yalnız sonraki bir güne yapılabilir.' };
  if (tarih > sinir.max)
    return { hedef: null, hata: 'Plan yalnız mevcut iki aylık dönemde ve en fazla takip eden haftaya yapılabilir.' };
  const { yil, ay, gun } = trZamanParcalari(an);
  const gunNo = new Date(Date.UTC(yil, ay - 1, gun)).getUTCDay();
  if (gunNo === 0 || gunNo === 6) return { hedef: null, hata: 'Gönderim hedefi Pazartesi–Cuma olmalıdır.' };
  return { hedef: tarih, hata: null };
}
export function gonderimTarihiYaz(deger: string): string {
  const tarih = /^\d{4}-\d{2}-\d{2}$/.test(deger) ? deger : trGunu(new Date(deger));
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeZone: 'Europe/Istanbul' })
    .format(new Date(`${tarih}T12:00:00+03:00`));
}
export const GONDERIM_SEBEPLERI: Record<string, string> = {
  hedef_hafta_sonu: 'Gönderim tarihi hafta içi olmalıdır.', hedef_gecmiste: 'Hedef tarih geçmişte veya bugündür.',
  takip_eden_hafta_asildi: 'En fazla takip eden haftaya plan yapılabilir.', ileri_donem_planlanamaz: 'İleri döneme plan yapılamaz.',
  haftalik_urun_kotasi: 'Bu ürün için haftalık 3 gönderim/plan hakkı doldu.',
  donemlik_tekrar_kotasi: 'Bu dönem için yayın tekrar hakkı doldu.', on_bes_gun_araligi: 'Bu alıcıya aynı yayın için 15 gün aralığında başka bir gönderim veya plan var.',
  inceleme_tamamlanmadi: 'Önce yayını inceleyip tamamlayın.', utt_yetkisiz: 'Gönderenin E-Club yetkisi yok.',
  yayin_bulunamadi: 'Yayın bulunamadı.', yayin_aktif_degil: 'Yayın şu anda yayında değil.', yayin_kapsam_disi: 'Yayın erişim kapsamı dışında.',
  alici_hesabi_yok: 'Üyenin giriş hesabı bulunmuyor.', rol_uyumsuz: 'Üyenin rolü yayın için uygun değil.',
  aktif_alici_bagi_yok: 'Üyenin aktif eczane/UTT bağı yok.', urun_bagi_yok: 'Yayının ürün bağlantısı bulunamadı.',
  gecmis_urun_bagi_cozulemedi: 'Geçmiş gönderimin ürün bağlantısı doğrulanamadı.',
  plan_gunu_gecersiz: 'Planın gönderim günü geçti.', arac_kullanima_kapali: 'Öğrenme aracı kullanıma kapalı.',
  plan_zaten_kayitli: 'Bu plan zaten kayıtlı.', islem_anahtari_uyusmuyor: 'İşlem anahtarı farklı bir plan için kullanılmış.',
};
export function gonderimSebebiYaz(sebep: string | null | undefined): string {
  return sebep ? GONDERIM_SEBEPLERI[sebep] ?? 'Gönderim koşulları doğrulanamadı.' : '';
}
