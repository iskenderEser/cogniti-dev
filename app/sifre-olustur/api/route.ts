import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { davetSifresiniKaydet } from "@/lib/eclub/uyelikDaveti";
import {
  firmaKullaniciDavetSifresiniKaydet,
  firmaKullaniciDavetTokeniMi,
} from "@/lib/admin/kullaniciDaveti";
import {
  eczanemDavetSifresiniKaydet,
  eczanemDavetTokeniMi,
} from "@/lib/eczanem/uyelikDaveti";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = createAdminClient(AbortSignal.timeout(15000));
    if (await firmaKullaniciDavetTokeniMi(db, body.token)) {
      await firmaKullaniciDavetSifresiniKaydet(db, body.token, body.sifre, body.tekrar);
    } else if (await eczanemDavetTokeniMi(db, body.token)) {
      await eczanemDavetSifresiniKaydet(db, body.token, body.sifre, body.tekrar, body.kvkk_onay);
    } else {
      await davetSifresiniKaydet(db, body.token, body.sifre, body.tekrar);
    }
    // Davet asla tarayıcıda bir Auth oturumu açmaz. Kullanıcı /login'den giriş yapar.
    return NextResponse.json({ tamamlandi: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ hata: e instanceof Error ? e.message : "Kayıt tamamlanamadı." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
