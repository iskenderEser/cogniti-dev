import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";
import { PASIFE_PUAN_KULLANIM_GUN } from "@/lib/eczanem/erisim";

const kacir = (v: string) =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export interface EczanemUyelikDurumEpostaParams {
  authUserId: string | null;
  eposta?: string | null;
  adSoyad?: string | null;
  eczaneAdi: string | null;
  tur: "pasife_alindi" | "listeden_silindi";
  origin: string;
}

export async function eczanemUyelikDurumEpostasiGonder(
  db: SupabaseClient,
  params: EczanemUyelikDurumEpostaParams,
): Promise<{ gonderildi: boolean }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.ECZANEM_DAVET_EMAIL_FROM ||
      process.env.ECLUB_DAVET_EMAIL_FROM ||
      process.env.COGNITI_UYELIK_EMAIL_FROM ||
      process.env.ECLUB_CEK_EMAIL_FROM;
    if (!apiKey || !from) return { gonderildi: false };

    let hedefEposta = params.eposta?.trim().toLowerCase() || "";
    let adSoyad = params.adSoyad?.trim() || "";

    if ((!hedefEposta || !adSoyad) && params.authUserId) {
      const { data, error } = await db.auth.admin.getUserById(params.authUserId);
      if (!error && data?.user) {
        if (!hedefEposta) hedefEposta = data.user.email?.trim().toLowerCase() || "";
        if (!adSoyad) {
          adSoyad =
            [data.user.user_metadata?.ad, data.user.user_metadata?.soyad]
              .filter(Boolean)
              .join(" ")
              .trim() || String(data.user.user_metadata?.ad_soyad ?? "").trim();
        }
      }
    }

    if (!hedefEposta) return { gonderildi: false };

    const adres = davetSiteAdresi(params.origin);
    const eczane = String(params.eczaneAdi ?? "").trim() || "Eczaneniz";
    const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Üyemiz,";

    if (params.tur === "pasife_alindi") {
      const puanLink = `${adres}/eczanem/puanlarim`;
      const p1 = `${eczane} tarafından Cogniti Eczanem üyeliğiniz pasife alındı. Bu eczaneden yeni öğrenme içeriği ve puan kazanımı durduruldu.`;
      const p2 = `Bu eczanede mevcut puanınız varsa ${PASIFE_PUAN_KULLANIM_GUN} gün içinde Puanlarım sayfasından görüntüleyip kullanabilirsiniz; süre sonunda puan kullanımı kapanır.`;

      const yanit = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [hedefEposta],
          subject: "Cogniti Eczanem Üyeliğiniz Pasife Alındı",
          html:
            `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
            `<p style="margin: 0 0 16px 0;">${kacir(p1)}</p>` +
            `<p style="margin: 0 0 16px 0;">${kacir(p2)}</p>` +
            `<p style="margin: 0 0 16px 0;"><a href="${kacir(puanLink)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Puanlarımı görüntüle</a></p>` +
            `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
          text:
            `${hitap}\n\n` +
            `${p1}\n\n` +
            `${p2}\n${puanLink}\n\n` +
            `Cogniti · bilgi taşır`,
        }),
      });
      return { gonderildi: yanit.ok };
    }

    const panelLink = `${adres}/eczanem`;
    const p1 = `${eczane} üye listesinden çıkarıldınız. Bu eczaneyle olan Cogniti Eczanem üyelik bağınız sonlandırıldı.`;
    const p2 = "Cogniti Eczanem genel hesabınız ve varsa diğer eczanelerdeki üyelikleriniz bu işlemden etkilenmez.";

    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [hedefEposta],
        subject: "Cogniti Eczanem Üyelik Bağınız Kaldırıldı",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(p1)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(p2)}</p>` +
          `<p style="margin: 0 0 16px 0;"><a href="${kacir(panelLink)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Cogniti Eczanem'e git</a></p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${p1}\n\n` +
          `${p2}\n${panelLink}\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });
    return { gonderildi: yanit.ok };
  } catch {
    return { gonderildi: false };
  }
}
