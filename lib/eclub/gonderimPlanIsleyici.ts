/** SQL bir planı sahiplenir ve sonuçlandırır; bu döngü sınırlı sayıda işi tüketir. */
export interface PlanIslemSonucu {
  plan_id: string;
  kisi_id: string;
  utt_id: string;
  yayin_id: string;
  durum: 'gerceklesti' | 'gerceklesmedi';
  oneri_id: string | null;
  sebep: string | null;
}
export function cronYetkiliMi(authorization: string | null, secret: string | undefined): boolean {
  return !!secret && authorization === `Bearer ${secret}`;
}
interface IsleyiciBagimliliklari {
  isAl: () => Promise<PlanIslemSonucu | null>;
  bildir: (sonuc: PlanIslemSonucu) => Promise<void>;
  saat?: () => number;
  maxSureMs?: number;
  maxIsSayisi?: number;
}
export async function eclubPlanIsleriniTuket({
  isAl, bildir, saat = Date.now, maxSureMs = 45_000, maxIsSayisi = 20,
}: IsleyiciBagimliliklari) {
  if (!Number.isInteger(maxIsSayisi) || maxIsSayisi < 1 || maxIsSayisi > 100
    || !Number.isFinite(maxSureMs) || maxSureMs <= 0 || maxSureMs > 50_000)
    throw new Error('Geçersiz işleyici sınırı.');
  const baslangic = saat();
  const sonuclar: PlanIslemSonucu[] = [];
  let bildirimHatasi = 0;
  while (sonuclar.length < maxIsSayisi && saat() - baslangic < maxSureMs) {
    const sonuc = await isAl();
    if (!sonuc) break;
    if (!sonuc.plan_id || !sonuc.kisi_id || !sonuc.utt_id || !sonuc.yayin_id
      || (sonuc.durum !== 'gerceklesti' && sonuc.durum !== 'gerceklesmedi')
      || (sonuc.durum === 'gerceklesti' && !sonuc.oneri_id)
      || (sonuc.durum === 'gerceklesmedi' && (!sonuc.sebep || sonuc.oneri_id)))
      throw new Error('Plan işleyicisinin SQL sonucu geçersiz.');
    sonuclar.push(sonuc);
    if (sonuc.durum === 'gerceklesti') {
      try { await bildir(sonuc); }
      catch { bildirimHatasi += 1; }
    }
  }
  return {
    islenen_adet: sonuclar.length,
    gerceklesen_adet: sonuclar.filter(s => s.durum === 'gerceklesti').length,
    gerceklesmeyen_adet: sonuclar.filter(s => s.durum === 'gerceklesmedi').length,
    bildirim_hatasi: bildirimHatasi,
    sonuclar,
  };
}
