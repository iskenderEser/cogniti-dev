import { NextRequest, NextResponse } from 'next/server';
import { eclubPlanlananGonderimleriTuket, planliYayinlariAktiveEtVePushGonder } from '@/lib/eclub/gonderimPlanKuyrugu';
import { cronYetkiliMi } from '@/lib/eclub/gonderimPlanIsleyici';
import { sunucuHatasi } from '@/lib/utils/hataIsle';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function isle(request: NextRequest) {
  if (!cronYetkiliMi(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ hata: 'Yetkisiz erişim.' }, { status: 401 });
  }
  try {
    const planliYayinSonuc = await planliYayinlariAktiveEtVePushGonder().catch(() => ({
      aktive_sayisi: 0,
      push_yayin_sayisi: 0,
    }));
    const sonuc = await eclubPlanlananGonderimleriTuket();
    return NextResponse.json({ ok: true, ...sonuc, planli_yayin: planliYayinSonuc });
  } catch (error) {
    return sunucuHatasi(error, 'E-Club planlanan yayın gönderimleri');
  }
}
export async function GET(request: NextRequest) { return isle(request); }
export async function POST(request: NextRequest) { return isle(request); }
