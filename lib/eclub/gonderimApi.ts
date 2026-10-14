import { trGunu } from "@/lib/zaman/kontrol";

/** HTTP girdileri; kota ve yetki kararı SQL'de yeniden verilir. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const GONDERIM_LIMITLERI = {
  gecerlilik_gun: 15, yayin_tekrar_araligi_gun: 15, haftalik_urun_limiti: 3,
  donemlik_tekrar_limiti: 2, plan_ileri_hafta: 1, plan_yalniz_mevcut_donem: true,
} as const;
export interface GonderimIstegi {
  islem: 'gonder' | 'planla' | 'kontrol';
  yayin_idler: string[]; kisi_idler: string[];
  hedef_gonderim_tarihi: string | null; islem_anahtari: string | null;
}
export function gonderimIsteginiOku(body: unknown): GonderimIstegi {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Geçersiz gönderim isteği.');
  const b = body as Record<string, unknown>;
  const islem = b.islem ?? 'gonder';
  if (islem !== 'gonder' && islem !== 'planla' && islem !== 'kontrol') throw new Error('Geçersiz işlem.');
  const liste = (v: unknown, max: number, alan: string) => {
    if (!Array.isArray(v) || !v.length || v.length > max || v.some(x => typeof x !== 'string' || !UUID.test(x)))
      throw new Error(`${alan} geçersiz veya seçim sınırı aşıldı.`);
    return [...new Set(v as string[])];
  };
  const yayin_idler = liste(b.yayin_idler ?? (b.yayin_id ? [b.yayin_id] : null), 20, 'yayin_idler');
  const kisi_idler = liste(b.kisi_idler, 100, 'kisi_idler');
  if (yayin_idler.length * kisi_idler.length > 300) throw new Error('Tek işlemde en fazla 300 yayın–alıcı seçimi yapılabilir.');
  if (b.hedef_gonderim_at !== undefined) throw new Error('Saatli plan hedefi desteklenmiyor; yalnız tarih gönderin.');
  let hedef: string | null = null;
  if (b.hedef_gonderim_tarihi !== undefined && b.hedef_gonderim_tarihi !== null) {
    if (typeof b.hedef_gonderim_tarihi !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.hedef_gonderim_tarihi)
      || trGunu(new Date(`${b.hedef_gonderim_tarihi}T00:00:00+03:00`)) !== b.hedef_gonderim_tarihi)
      throw new Error('Hedef gönderim tarihi geçersiz.');
    hedef = b.hedef_gonderim_tarihi;
  }
  if (islem === 'planla' && !hedef) throw new Error('Planlama için hedef gönderim tarihi zorunludur.');
  if (islem === 'gonder' && hedef) throw new Error('Anlık gönderimde tarih kullanılamaz.');
  const anahtar = b.islem_anahtari ?? null;
  if (anahtar !== null && (typeof anahtar !== 'string' || !UUID.test(anahtar))) throw new Error('İşlem anahtarı geçersiz.');
  if (islem === 'planla' && !anahtar) throw new Error('Planlama için işlem anahtarı zorunludur.');
  return { islem, yayin_idler, kisi_idler, hedef_gonderim_tarihi: hedef, islem_anahtari: anahtar as string | null };
}

/** Yalnız sonraki iş günleri; uygunlukları ayrıca toplu SQL kontrolü belirler. */
export function planTarihAdaylari(simdi = new Date()): string[] {
  const trOfset = 3 * 3600_000;
  const tr = new Date(simdi.getTime() + trOfset);
  const gun = Date.UTC(tr.getUTCFullYear(), tr.getUTCMonth(), tr.getUTCDate());
  const ptesi = gun - ((tr.getUTCDay() + 6) % 7) * 86400_000;
  const donemBitis = Date.UTC(tr.getUTCFullYear(), Math.floor(tr.getUTCMonth() / 2) * 2 + 2, 1);
  const sonuc: string[] = [];
  for (let an = gun + 86400_000; an < Math.min(ptesi + 14 * 86400_000, donemBitis); an += 86400_000) {
    const dow = new Date(an).getUTCDay();
    if (dow !== 0 && dow !== 6) sonuc.push(trGunu(new Date(an - trOfset)));
  }
  return sonuc;
}
/** Mevcut RPC timestamptz imzası korunur; bu değer kullanıcıya saat sunmaz. */
export function planTarihiniRpcGirdisineCevir(tarih: string): string {
  return new Date(`${tarih}T00:00:00+03:00`).toISOString();
}
export function sayfalamaOku(params: URLSearchParams) {
  const sayfa = Number(params.get('sayfa') ?? 1);
  const boyut = Number(params.get('sayfa_boyutu') ?? 100);
  if (!Number.isSafeInteger(sayfa) || sayfa < 1 || sayfa > 1_000_000 || !Number.isInteger(boyut) || boyut < 1 || boyut > 100)
    throw new Error('Geçersiz sayfalama.');
  return { sayfa, sayfa_boyutu: boyut, baslangic: (sayfa - 1) * boyut };
}
