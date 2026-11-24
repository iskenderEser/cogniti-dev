import "server-only";

const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export async function firmaAdminYetkiEpostasiGonder(params: {
  eposta: string;
  adSoyad: string;
  firmaAdi: string;
  girisLinki: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[firma-admin-eposta] Resend ayarları eksik.");
    return;
  }

  const hitap = params.adSoyad.trim() ? `Sayın ${params.adSoyad.trim()},` : "Sayın Yetkili,";

  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [params.eposta],
        subject: "Cogniti Firma Admini Yetkiniz Tanımlandı",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(`${params.firmaAdi} için Cogniti Firma Admini yönetim yetkiniz aktif edilmiştir.`)}</p>` +
          `<p style="margin: 0 0 16px 0;">Kurumsal e-posta adresiniz ve şifrenizle giriş yaparak firmanızın yönetim işlemlerini yürütebilirsiniz: <a href="${kacir(params.girisLinki)}">Giriş sayfası</a></p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${params.firmaAdi} için Cogniti Firma Admini yönetim yetkiniz aktif edilmiştir.\n\n` +
          `Kurumsal e-posta adresiniz ve şifrenizle giriş yaparak firmanızın yönetim işlemlerini yürütebilirsiniz:\n${params.girisLinki}\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });
    if (!yanit.ok) {
      console.error("[firma-admin-eposta] E-posta gönderilemedi:", yanit.status);
    }
  } catch (err) {
    console.error("[firma-admin-eposta] E-posta hatası:", err);
  }
}
