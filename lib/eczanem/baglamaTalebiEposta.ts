import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";

const kacir = (v: string) =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export interface BaglamaTalebiEpostaParams {
  authUserId: string;
  talepId: string;
  talepTuru: "yeni_bag" | "yeniden_aktivasyon";
  eczaneAdi: string | null;
  origin: string;
}

export async function baglamaTalebiEpostasiGonder(
  db: SupabaseClient,
  params: BaglamaTalebiEpostaParams,
): Promise<{ gonderildi: boolean }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.ECZANEM_DAVET_EMAIL_FROM ||
      process.env.ECLUB_DAVET_EMAIL_FROM ||
      process.env.COGNITI_UYELIK_EMAIL_FROM ||
      process.env.ECLUB_CEK_EMAIL_FROM;
    if (!apiKey || !from) return { gonderildi: false };

    const { data, error } = await db.auth.admin.getUserById(params.authUserId);
    if (error || !data?.user?.email) return { gonderildi: false };

    const adres = davetSiteAdresi(params.origin);
    const link = `${adres}/eczanem`;
    const adSoyad =
      [data.user.user_metadata?.ad, data.user.user_metadata?.soyad]
        .filter(Boolean)
        .join(" ")
        .trim() || String(data.user.user_metadata?.ad_soyad ?? "").trim();
    const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Üyemiz,";
    const eczane = String(params.eczaneAdi ?? "").trim() || "Bir eczane";

    const anaMetin =
      params.talepTuru === "yeniden_aktivasyon"
        ? `${eczane}, daha önce pasife alınan Cogniti Eczanem üyeliğinizi yeniden aktifleştirmek istiyor. Onayınız olmadan üyeliğiniz yeniden açılmaz.`
        : `${eczane}, sizi Cogniti Eczanem üye listesine eklemek istiyor. Onayınız olmadan bu eczaneyle üyelik bağınız kurulmaz.`;

    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `eczanem-baglama-talebi/${params.talepId}`,
      },
      body: JSON.stringify({
        from,
        to: [data.user.email],
        subject: "Cogniti Eczanem Bağlantı Onay Talebi",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(anaMetin)}</p>` +
          `<p style="margin: 0 0 16px 0;"><a href="${kacir(link)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Talebi incele ve yanıtla</a></p>` +
          `<p style="margin: 0 0 16px 0;">Bu talep 7 gün boyunca geçerlidir. İstemediğiniz bir eczane talebini tek tıkla reddedebilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${anaMetin}\n\n` +
          `Talebi incelemek ve yanıtlamak için Cogniti hesabınıza giriş yapabilirsiniz:\n${link}\n\n` +
          `Bu talep 7 gün boyunca geçerlidir. İstemediğiniz bir eczane talebini tek tıkla reddedebilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });

    return { gonderildi: yanit.ok };
  } catch {
    return { gonderildi: false };
  }
}
