import { NextResponse } from "next/server";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";
import { ayniKaynaktan, ON_BASVURU_TABLOSU } from "@/lib/firma/kurumsalBasvuru";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(istek: Request) {
  if (!ayniKaynaktan(istek)) {
    return NextResponse.json({ hata: "İstek doğrulanamadı." }, { status: 403 });
  }

  const veri = await istek.json().catch(() => null);
  const eposta = typeof veri?.eposta === "string" ? veri.eposta.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta) || eposta.length > 254) {
    return NextResponse.json({ hata: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: onBasvuru, error: sorguHatasi } = await db
    .from(ON_BASVURU_TABLOSU)
    .select("kabul_at,davet_bitis_at")
    .eq("eposta", eposta)
    .maybeSingle();

  if (sorguHatasi) {
    return NextResponse.json({ hata: "Bağlantı gönderilemedi. Lütfen biraz sonra tekrar deneyin." }, { status: 503 });
  }

  if (onBasvuru) {
    const aktifDavetiVar = Boolean(
      onBasvuru.davet_bitis_at && Date.parse(onBasvuru.davet_bitis_at) > Date.now()
    );
    // Onaysız ön başvuru adayı şifre sıfırlama e-postası alamaz; nötr yanıt döner.
    if (!onBasvuru.kabul_at && !aktifDavetiVar) {
      return NextResponse.json({ ok: true });
    }
  }

  const adres = davetSiteAdresi(new URL(istek.url).origin);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(eposta, {
    redirectTo: `${adres}/sifre-yenile`,
  });

  if (error) {
    return NextResponse.json({ hata: "Bağlantı gönderilemedi. Lütfen biraz sonra tekrar deneyin." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
