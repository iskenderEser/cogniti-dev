import { vivaKayitSayfasi } from '@/lib/viva/detay';
import { vivaKayitKutuphanesiOku } from '@/lib/viva/kayitKutuphaneSunucu';
import { vivaHata, vivaYanit, VivaHatasi } from '@/lib/viva/sunucu';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    let offset: number;
    try { offset = vivaKayitSayfasi(new URL(req.url).searchParams); } catch { throw new VivaHatasi('Geçersiz kayıt sayfası.'); }
    return vivaYanit(await vivaKayitKutuphanesiOku(offset));
  } catch (e) { return vivaHata(e); }
}
