import 'server-only';
import { vivaKullanici, VivaHatasi } from './sunucu';
import type { VivaKayitKutuphanesi } from './detay';
export async function vivaKayitKutuphanesiOku(offset: number): Promise<VivaKayitKutuphanesi> {
  const { db, user } = await vivaKullanici();
  const { data, error } = await db.rpc('viva_kayit_kutuphanesi', { p_auth: user.id, p_offset: offset });
  if (error) {
    if (['PGRST202', '42883'].includes(error.code ?? '')) throw new VivaHatasi('Yayın kayıtları listesi için SQL kurulumu bekleniyor.', 503);
    throw error;
  }
  return data as VivaKayitKutuphanesi;
}
