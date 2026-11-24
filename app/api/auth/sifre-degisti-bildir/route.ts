import { NextResponse } from "next/server";
import { ayniKaynaktan, ON_BASVURU_TABLOSU } from "@/lib/firma/kurumsalBasvuru";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export async function POST(istek: Request) {
  if (!ayniKaynaktan(istek)) {
    return NextResponse.json({ hata: "İstek doğrulanamadı." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user }, error: oturumHatasi } = await supabase.auth.getUser();
  if (oturumHatasi || !user?.email) {
    return NextResponse.json({ hata: "Oturum doğrulanamadı." }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[sifre-degisti-bildir] Resend ayarları eksik.");
    return NextResponse.json({ ok: true });
  }

  const db = createAdminClient();
  let adSoyad = "";
  const { data: kullanici } = await db
    .from("kullanicilar")
    .select("ad,soyad")
    .eq("kullanici_id", user.id)
    .maybeSingle();

  if (kullanici) {
    adSoyad = [kullanici.ad, kullanici.soyad].filter(Boolean).join(" ").trim();
  } else {
    const { data: aday } = await db
      .from(ON_BASVURU_TABLOSU)
      .select("ad_soyad")
      .eq("aday_auth_id", user.id)
      .maybeSingle();
    if (aday?.ad_soyad) adSoyad = String(aday.ad_soyad).trim();
  }

  const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Kullanıcı,";

  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: "Cogniti Hesap Şifreniz Güncellendi",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">Cogniti hesabınızın şifresi güncellenmiştir.</p>` +
          `<p style="margin: 0 0 16px 0;">Bu işlemi siz yapmadıysanız, hesabınızın güvenliği için lütfen hemen <a href="mailto:admin@cogniti.net">admin@cogniti.net</a> adresinden bizimle iletişime geçiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `Cogniti hesabınızın şifresi güncellenmiştir.\n\n` +
          `Bu işlemi siz yapmadıysanız, hesabınızın güvenliği için lütfen hemen admin@cogniti.net adresinden bizimle iletişime geçiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });
    if (!yanit.ok) {
      console.error("[sifre-degisti-bildir] E-posta gönderilemedi:", yanit.status);
    }
  } catch (err) {
    console.error("[sifre-degisti-bildir] E-posta hatası:", err);
  }

  return NextResponse.json({ ok: true });
}
