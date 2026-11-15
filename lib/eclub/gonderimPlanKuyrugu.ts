import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import { ogrenmeAraciBayraklari } from '@/lib/ogrenmeAraci/bayraklar';
import { eclubBildirimOlustur } from '@/lib/utils/eclubBildirim';
import { eclubPlanIsleriniTuket, type PlanIslemSonucu } from '@/lib/eclub/gonderimPlanIsleyici';
import { pushYayinla } from '@/lib/push/orkestrasyon';
import { hedefRolleriOku } from '@/lib/utils/roller';
import { sahaHedefliMi } from '@/lib/uretici/sahaPuanModeli';

export async function planliYayinlariAktiveEtVePushGonder() {
  const supabase = createAdminClient();
  const simdiIso = new Date().toISOString();

  const { data: adaylar } = await supabase
    .from('yayin_yonetimi')
    .select('yayin_id, uretici_id, hedef_roller')
    .eq('durum', 'planlandi')
    .lte('yayin_tarihi', simdiIso);

  const adayListesi = adaylar ?? [];
  if (adayListesi.length === 0) {
    return { aktive_sayisi: 0, push_yayin_sayisi: 0 };
  }

  const { data: aktiveSayisi, error: rpcError } = await supabase.rpc('yayin_planlananlari_aktive');
  if (rpcError || !aktiveSayisi) {
    return { aktive_sayisi: Number(aktiveSayisi ?? 0), push_yayin_sayisi: 0 };
  }

  const adayIdler = adayListesi.map((a) => a.yayin_id);
  const { data: acilanlar } = await supabase
    .from('yayin_yonetimi')
    .select('yayin_id, uretici_id, hedef_roller')
    .in('yayin_id', adayIdler)
    .eq('durum', 'yayinda');

  let pushYayinSayisi = 0;
  for (const yayin of acilanlar ?? []) {
    try {
      const [{ data: alicilar }, { data: yayinDetay }] = await Promise.all([
        supabase.rpc('cogniti_token_yayin_gonderim_alicilari', { p_yayin_id: yayin.yayin_id }),
        supabase.from('v_yayin_detay').select('firma_id, takim_id, hedef_roller').eq('yayin_id', yayin.yayin_id).maybeSingle(),
      ]);
      const hedefIdler = (alicilar ?? []).map((k: { kullanici_id: string }) => k.kullanici_id);
      let bmIdler: string[] = [];
      if (yayinDetay?.firma_id && sahaHedefliMi(hedefRolleriOku(yayinDetay))) {
        let bmSorgu = supabase
          .from('kullanicilar')
          .select('kullanici_id')
          .eq('firma_id', yayinDetay.firma_id)
          .eq('rol', 'bm')
          .eq('aktif_mi', true);
        if (yayinDetay.takim_id) {
          bmSorgu = bmSorgu.eq('takim_id', yayinDetay.takim_id);
        }
        const { data: bmler } = await bmSorgu;
        bmIdler = (bmler ?? []).map((k: { kullanici_id: string }) => k.kullanici_id);
      }
      const pushAlicilar = [
        ...new Set([
          ...hedefIdler,
          ...bmIdler,
          ...(yayin.uretici_id ? [yayin.uretici_id] : []),
        ]),
      ];
      if (pushAlicilar.length > 0) {
        await pushYayinla(supabase, 'video_yayini', pushAlicilar, { yayinId: yayin.yayin_id });
        pushYayinSayisi++;
      }
    } catch (err) {
      console.error('[UYARI] Planlı yayın Web Push gönderilemedi:', err);
    }
  }

  return { aktive_sayisi: Number(aktiveSayisi), push_yayin_sayisi: pushYayinSayisi };
}

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
