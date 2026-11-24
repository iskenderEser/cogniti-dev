import "server-only";

const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

async function resendGonder(govde: Record<string, unknown>, etiket: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error(`[kullanici-durum-eposta] Resend ayarları eksik (${etiket}).`);
    return;
  }
  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, ...govde }),
    });
    if (!yanit.ok) {
      console.error(`[kullanici-durum-eposta] ${etiket} e-postası gönderilemedi:`, yanit.status);
    }
  } catch (err) {
    console.error(`[kullanici-durum-eposta] ${etiket} e-postası hatası:`, err);
  }
}

export async function kullaniciRolDegistiEpostasiGonder(params: {
  eposta: string;
  adSoyad: string;
  firmaAdi: string;
  yeniRolAdi: string;
  girisLinki: string;
}) {
  const hitap = params.adSoyad.trim() ? `Sayın ${params.adSoyad.trim()},` : "Sayın Kullanıcı,";
  await resendGonder(
    {
      to: [params.eposta],
      subject: "Cogniti Kullanıcı Rolünüz Güncellendi",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">${kacir(params.firmaAdi)} bünyesindeki Cogniti rolünüz <strong>${kacir(params.yeniRolAdi)}</strong> olarak güncellenmiştir.</p>` +
        `<p style="margin: 0 0 16px 0;">Güncel yetkilerinizle giriş yapabilirsiniz: <a href="${kacir(params.girisLinki)}">Giriş sayfası</a></p>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `${params.firmaAdi} bünyesindeki Cogniti rolünüz ${params.yeniRolAdi} olarak güncellenmiştir.\n\n` +
        `Güncel yetkilerinizle giriş yapabilirsiniz:\n${params.girisLinki}\n\n` +
        `Cogniti · bilgi taşır`,
    },
    "rol-degisti"
  );
}

export async function kullaniciPasifeAlindiEpostasiGonder(params: {
  eposta: string;
  adSoyad: string;
  firmaAdi: string;
}) {
  const hitap = params.adSoyad.trim() ? `Sayın ${params.adSoyad.trim()},` : "Sayın Kullanıcı,";
  await resendGonder(
    {
      to: [params.eposta],
      subject: "Cogniti Hesabınız Pasife Alındı",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">${kacir(params.firmaAdi)} bünyesindeki Cogniti hesabınız pasife alınmıştır.</p>` +
        `<p style="margin: 0 0 16px 0;">Detaylı bilgi için firmanızın yöneticisiyle iletişime geçebilirsiniz.</p>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `${params.firmaAdi} bünyesindeki Cogniti hesabınız pasife alınmıştır.\n\n` +
        `Detaylı bilgi için firmanızın yöneticisiyle iletişime geçebilirsiniz.\n\n` +
        `Cogniti · bilgi taşır`,
    },
    "pasife-alindi"
  );
}

export async function kullaniciAktifEdildiEpostasiGonder(params: {
  eposta: string;
  adSoyad: string;
  firmaAdi: string;
  girisLinki: string;
}) {
  const hitap = params.adSoyad.trim() ? `Sayın ${params.adSoyad.trim()},` : "Sayın Kullanıcı,";
  await resendGonder(
    {
      to: [params.eposta],
      subject: "Cogniti Hesabınız Aktif Edildi",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">${kacir(params.firmaAdi)} bünyesindeki Cogniti hesabınız yeniden aktif edilmiştir.</p>` +
        `<p style="margin: 0 0 16px 0;">Mevcut e-posta adresiniz ve şifrenizle giriş yapabilirsiniz: <a href="${kacir(params.girisLinki)}">Giriş sayfası</a></p>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `${params.firmaAdi} bünyesindeki Cogniti hesabınız yeniden aktif edilmiştir.\n\n` +
        `Mevcut e-posta adresiniz ve şifrenizle giriş yapabilirsiniz:\n${params.girisLinki}\n\n` +
        `Cogniti · bilgi taşır`,
    },
    "aktif-edildi"
  );
}
