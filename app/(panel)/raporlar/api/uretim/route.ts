// app/(panel)/raporlar/api/uretim/route.ts
//
// Üretim Raporları Backend API Rotası.
// Üretici (PM, Medikal, Eğitim, İK), Yönetici ve Admin rollerine açıktır.
// Şirket düzeyinde içerik üretim hacmi, V1-V4 varyant dağılımı ve eğitim türü saha etkisini döner.

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { hataYaniti, yetkiHatasi, validasyonHatasi } from '@/lib/utils/hataIsle';
import { tarihAraligi } from '@/lib/utils/tarihAraligi';
import {
  getUretimData,
  uretimRaporKapsaminiCoz,
  uretimRaporunuGorebilir,
} from '@/lib/rapor/uretim/getUretimData';
import { aracTuruDagilimi, aracTuruMu, aracYayinlari } from '@/lib/rapor/paylasilan/aracTuruDagilimi';

export async function GET(request: Request) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const { baslangic, bitis } = tarihAraligi(searchParams.get('periyot') || 'bu_ay');
  const raporRolu = searchParams.get('rapor_rolu') || 'tumu';
  if (raporRolu !== 'tumu' && raporRolu !== 'utt' && raporRolu !== 'bm' && raporRolu !== 'eczaci' && raporRolu !== 'eczane_teknisyeni' && raporRolu !== 'eczanem') {
    return validasyonHatasi('Geçersiz rapor rolü.');
  }
  const aracTuru = searchParams.get('arac_turu');
  const sonYayinId = searchParams.get('son_yayin_id');
  if (aracTuru !== null && !aracTuruMu(aracTuru)) return validasyonHatasi('Geçersiz öğrenme aracı.');
  if (sonYayinId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sonYayinId)) {
    return validasyonHatasi('Geçersiz yayın sayfası.');
  }
  // Detay sayfaları, özette kullanılan aynı tarih aralığını korur.
  const detayBaslangic = searchParams.get('baslangic');
  const detayBitis = searchParams.get('bitis');
  if (aracTuru !== null) {
    const bas = Date.parse(detayBaslangic ?? '');
    const bit = Date.parse(detayBitis ?? '');
    if (!Number.isFinite(bas) || !Number.isFinite(bit) || bas >= bit || bit > Date.now()
      || bit - bas > 366 * 24 * 60 * 60 * 1000) {
      return validasyonHatasi('Geçersiz rapor tarih aralığı.');
    }
  }

  // 1. Auth Kontrolü
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return yetkiHatasi('Oturum açılmamış');

  // 2. Kullanıcı ve Rol Çözümleme
  const { data: kullanici, error: kullaniciError } = await adminSupabase
    .from('kullanicilar')
    .select('kullanici_id, ad, soyad, rol, firma_id')
    .eq('eposta', user.email)
    .single();

  if (kullaniciError || !kullanici) {
    return hataYaniti('Kullanıcı bulunamadı', 'kullanici_bulamadi', kullaniciError);
  }

  const rol = (kullanici.rol ?? '').toLowerCase();
  const yetkili = uretimRaporunuGorebilir(rol);

  if (!yetkili) {
    return yetkiHatasi('Bu rapora erişim yetkiniz yok');
  }

  try {
    const kapsam = await uretimRaporKapsaminiCoz(
      adminSupabase,
      { ...kullanici, rol },
    );

    if (aracTuru !== null && aracTuruMu(aracTuru)) {
      const sayfa = await aracYayinlari(adminSupabase, {
        raporKimligi: kapsam.raporKimligi, raporRolu, aracTuru, sonYayinId,
        baslangic: new Date(detayBaslangic!).toISOString(), bitis: new Date(detayBitis!).toISOString(),
      });
      return NextResponse.json({ success: true, data: sayfa });
    }

    const [rapor, aracTurleri, firmaRes] = await Promise.all([
      getUretimData(adminSupabase, kapsam, baslangic, bitis, raporRolu),
      aracTuruDagilimi(adminSupabase, {
        baslangic,
        bitis,
        raporKimligi: kapsam.raporKimligi,
        raporRolu,
      }),
      adminSupabase
        .from('firmalar')
        .select('firma_adi')
        .eq('firma_id', kapsam.firmaId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kullanici: {
          ad: kullanici.ad,
          soyad: kullanici.soyad,
          rol: kullanici.rol,
          firma_adi: firmaRes.data?.firma_adi ?? '—',
        },
        ...rapor,
        arac_turu_dagilimi: aracTurleri,
        arac_turu_tarih_araligi: { baslangic, bitis },
      },
    });
  } catch (error) {
    return hataYaniti('Üretim raporu okunamadı.', 'getUretimData', error);
  }
}
