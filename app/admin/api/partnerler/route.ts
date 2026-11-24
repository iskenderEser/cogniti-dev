import { createHash, randomBytes } from "node:crypto";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";
import { partnerBasvuruRetEpostasiGonder, partnerEpostaGonderici } from "@/lib/agora/partnerEposta";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerListesiGecerli } from "@/lib/agora/partnerOnayTipleri";
import { SUREC14_TOAST } from "@/lib/bildirimler/toastMesajlari";

const kacir = (v: string) =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export async function GET(request: Request) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const params = new URL(request.url).searchParams;
    const durum = params.get("durum") ?? "bekliyor";
    const sayfa = Number(params.get("sayfa") ?? 1);
    if (
      !["bekliyor", "onaylandi", "reddedildi", "tumu"].includes(durum) ||
      !Number.isSafeInteger(sayfa) ||
      sayfa < 1 ||
      sayfa > 100000
    ) {
      return partnerYanit({ hata: "Geçersiz liste seçimi." }, 400);
    }
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_basvurulari", {
      p_admin_id: auth.kullaniciId,
      p_durum: durum,
      p_sayfa: sayfa,
    });
    if (error || !partnerListesiGecerli(data)) {
      return partnerYanit({ hata: "Partner başvuruları okunamadı. Yeniden deneyin." }, 503);
    }
    return partnerYanit(data);
  } catch {
    return partnerYanit({ hata: "Partner başvuruları okunamadı." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const body = await partnerJsonOku(request);
    if (!body.ok) return body.yanit;
    const d = body.veri;
    if (
      typeof d.partner_id !== "string" ||
      !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.partner_id) ||
      !["onaylandi", "reddedildi"].includes(String(d.karar)) ||
      !Number.isSafeInteger(d.giris_surum) ||
      Number(d.giris_surum) < 1
    ) {
      return partnerYanit({ hata: "Geçersiz başvuru veya karar." }, 400);
    }

    const db = createAdminClient(AbortSignal.timeout(15000));

    if (d.karar === "reddedildi") {
      const { data, error } = await db.rpc("agora_partner_tek_asama_karar", {
        p_admin_id: auth.kullaniciId,
        p_partner_id: d.partner_id,
        p_karar: "reddedildi",
        p_surum: d.giris_surum,
        p_davet_hash: null,
        p_davet_bitis_at: null,
      });
      if (error || !data || typeof data !== "object") {
        return partnerYanit({ hata: "Karar kaydedilemedi. Yeniden deneyin." }, 503);
      }
      if (data.durum === "cakisma") {
        return partnerYanit({ hata: "Başvuru başka bir işlemle değişti. Listeyi yenileyin." }, 409);
      }
      if (data.durum !== "tamam") {
        return partnerYanit({ hata: "Karar kaydedilemedi." }, 503);
      }
      if (typeof data.eposta === "string") {
        try {
          await partnerBasvuruRetEpostasiGonder({
            partnerId: d.partner_id,
            eposta: data.eposta,
            adSoyad: typeof data.ad_soyad === "string" ? data.ad_soyad : "",
            surum: Number(data.giris_surum ?? d.giris_surum),
          });
        } catch {
          // Ret kararı e-posta hatasından bağımsızdır.
        }
      }
      return partnerYanit({ mesaj: SUREC14_TOAST.basvuruReddedildi });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = partnerEpostaGonderici();
    if (!apiKey || !from) {
      return partnerYanit({ hata: "Davet e-postası ayarları eksik." }, 503);
    }

    let adres: string;
    try {
      adres = davetSiteAdresi(new URL(request.url).origin);
    } catch {
      return partnerYanit({ hata: "Site adresi yapılandırması eksik." }, 503);
    }

    const token = randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(token).digest("hex");
    const bitis = new Date(Date.now() + 48 * 3600_000).toISOString();

    const { data, error } = await db.rpc("agora_partner_tek_asama_karar", {
      p_admin_id: auth.kullaniciId,
      p_partner_id: d.partner_id,
      p_karar: "onaylandi",
      p_surum: d.giris_surum,
      p_davet_hash: hash,
      p_davet_bitis_at: bitis,
    });
    if (error || !data || typeof data !== "object") {
      return partnerYanit({ hata: "Karar kaydedilemedi. Yeniden deneyin." }, 503);
    }
    if (data.durum === "cakisma") {
      return partnerYanit({ hata: "Başvuru başka bir işlemle değişti. Listeyi yenileyin." }, 409);
    }
    if (data.durum !== "tamam" || typeof data.eposta !== "string") {
      return partnerYanit({ hata: "Karar kaydedilemedi." }, 503);
    }

    const link = new URL("/partner/sifre-olustur", adres);
    link.searchParams.set("davet", token);
    const ad = typeof data.ad_soyad === "string" ? data.ad_soyad.trim() : "";
    const firma = typeof data.firma_adi === "string" ? data.firma_adi.trim() : "";
    const hitap = ad ? `Sayın ${ad},` : "Sayın İş Partnerimiz,";
    const onayCumlesi =
      data.basvuru_turu === "kurumsal" && firma
        ? `${firma} adına yaptığınız Cogniti İş Partnerliği başvurunuz onaylanmıştır.`
        : "Cogniti İş Partnerliği başvurunuz onaylanmıştır.";

    try {
      const yanit = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `agora-partner-onay/${d.partner_id}/v${data.giris_surum ?? d.giris_surum}`,
        },
        body: JSON.stringify({
          from,
          to: [data.eposta],
          subject: "Cogniti İş Partnerliği Başvurunuz Onaylandı",
          html:
            `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
            `<p style="margin: 0 0 16px 0;">${kacir(onayCumlesi)} Partner panelinize giriş yapabilmek için aşağıdaki bağlantıdan şifrenizi oluşturabilirsiniz.</p>` +
            `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
            `<li style="margin: 0;"><strong>Şifre oluşturma bağlantısı:</strong> <a href="${kacir(link.href)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Şifremi oluştur</a> (${kacir(link.href)})</li>` +
            `</ul>` +
            `<p style="margin: 0 0 16px 0;">Bu bağlantı 48 saat boyunca geçerlidir.</p>` +
            `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
          text:
            `${hitap}\n\n${onayCumlesi} Partner panelinize giriş yapabilmek için aşağıdaki bağlantıdan şifrenizi oluşturabilirsiniz.\n\n` +
            `- Şifre oluşturma bağlantısı: ${link.href}\n\n` +
            `Bu bağlantı 48 saat boyunca geçerlidir.\n\n` +
            `Cogniti · bilgi taşır`,
        }),
      });
      if (!yanit.ok) throw new Error("E-posta gönderilemedi.");
      return partnerYanit({ mesaj: SUREC14_TOAST.basvuruOnaylandi });
    } catch {
      await db.rpc("agora_partner_davet_iptal", {
        p_admin_id: auth.kullaniciId,
        p_partner_id: d.partner_id,
        p_davet_hash: hash,
      });
      return partnerYanit(
        { hata: "Başvuru onaylandı ancak davet e-postası gönderilemedi. Yenileyip daveti tekrar gönderin." },
        502,
      );
    }
  } catch {
    return partnerYanit({ hata: "Karar kaydedilemedi." }, 503);
  }
}
