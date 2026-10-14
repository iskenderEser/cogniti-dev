import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { ogrenmeAraciBayraklari } from '@/lib/ogrenmeAraci/bayraklar';
import { eclubBildirimOlustur } from '@/lib/utils/eclubBildirim';
import { eclubPlanIsleriniTuket, type PlanIslemSonucu } from '@/lib/eclub/gonderimPlanIsleyici';

export async function eclubPlanlananGonderimleriTuket() {
  const supabase = createAdminClient();
  const kapaliAraclar = Object.entries(ogrenmeAraciBayraklari()).filter(([, acik]) => !acik).map(([tur]) => tur);
  return eclubPlanIsleriniTuket({
    isAl: async () => {
      const { data, error } = await supabase.rpc('eclub_planlanan_gonderimi_isle', { p_kapali_arac_turleri: kapaliAraclar });
      if (error) throw new Error(`Plan gönderim RPC hatası: ${error.code ?? 'RPC_ERROR'}`);
      return data as PlanIslemSonucu | null;
    },
    bildir: async (sonuc) => {
      const { data: yayin, error } = await supabase.from('v_yayin_detay')
        .select('firma_id, urun_adi').eq('yayin_id', sonuc.yayin_id).single();
      if (error || !yayin) throw new Error('Gerçekleşen planın bildirim bilgileri alınamadı.');
      await eclubBildirimOlustur({
        adminSupabase: supabase, alici_kisi_id: sonuc.kisi_id, gonderen_id: sonuc.utt_id,
        firma_id: yayin.firma_id, kayit_turu: 'oneri', kayit_id: sonuc.oneri_id!,
        mesaj: `Size yeni bir öğrenme içeriği önerildi: ${yayin.urun_adi}`,
      });
    },
  });
}
