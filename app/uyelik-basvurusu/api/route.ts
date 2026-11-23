import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sifreKuralHatasi } from "@/lib/auth/sifreKurali";
import { ayniKaynaktan, davetBicimiGecerli, davetOzeti, ON_BASVURU_TABLOSU } from "@/lib/firma/kurumsalBasvuru";
import { BASVURU_ALINDI, DAVET_BILGISI } from "../basvuruMesaji";

const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status });
const metin = (deger: unknown, sinir: number) =>
  typeof deger === "string" && deger.trim().length <= sinir ? deger.trim() : "";
const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const BASVURU_MESAJI = `${BASVURU_ALINDI} ${DAVET_BILGISI}`;
const KISISEL_ALANLAR = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.co.uk", "ymail.com", "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com",
  "yandex.com", "yandex.ru", "mail.com", "gmx.com",
]);

interface OnBasvuruBilgileri {
  firma_adi: string;
  web_sitesi: string;
  ad_soyad: string;
  eposta: string;
  cep_tel: string;
}

async function resendEpostaGonder(apiKey: string, govde: Record<string, unknown>, etiket: string) {
  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(govde),
    });
    if (!yanit.ok) {
      console.error(`[uyelik-basvurusu] ${etiket} e-postası gönderilemedi:`, yanit.status);
    }
  } catch (err) {
    console.error(`[uyelik-basvurusu] ${etiket} e-postası hatası:`, err);
  }
}

async function onBasvuruEpostalariniGonder(bilgiler: OnBasvuruBilgileri) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[uyelik-basvurusu] Resend ayarları eksik (RESEND_API_KEY / COGNITI_UYELIK_EMAIL_FROM).");
    return;
  }

  const gonderimler: Promise<void>[] = [
    resendEpostaGonder(
      apiKey,
      {
        from,
        to: [bilgiler.eposta],
        subject: "Cogniti kurumsal üyelik ön başvurunuz alındı",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(`Merhaba ${bilgiler.ad_soyad},`)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(`${bilgiler.firma_adi} adına yaptığınız kurumsal üyelik ön başvurunuz alınmıştır.`)}</p>` +
          `<p style="margin: 0 0 16px 0;">Başvurunuz incelenip onaylandığında Kurumsal Üyelik Formu davetiniz bu e-posta adresine iletilecektir.</p>` +
          `<p style="margin: 0 0 16px 0;">Cogniti’ye ilginiz için teşekkür ederiz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `Merhaba ${bilgiler.ad_soyad},\n\n` +
          `${bilgiler.firma_adi} adına yaptığınız kurumsal üyelik ön başvurunuz alınmıştır.\n\n` +
          `Başvurunuz incelenip onaylandığında Kurumsal Üyelik Formu davetiniz bu e-posta adresine iletilecektir.\n\n` +
          `Cogniti’ye ilginiz için teşekkür ederiz.\n\n` +
          `Cogniti · bilgi taşır`,
      },
      "basvuran-teyit"
    ),
  ];

  const adminEposta = process.env.COGNITI_ADMIN_EMAIL?.trim();
  if (adminEposta) {
    gonderimler.push(
      resendEpostaGonder(
        apiKey,
        {
          from,
          to: [adminEposta],
          reply_to: bilgiler.eposta,
          subject: `Yeni kurumsal üyelik ön başvurusu — ${bilgiler.firma_adi}`,
          html:
            `<p style="margin: 0 0 16px 0;">Yeni bir kurumsal üyelik ön başvurusu alındı:</p>` +
            `<ul style="margin: 0; padding-left: 20px;">` +
            `<li style="margin: 0 0 6px 0;"><strong>Firma:</strong> ${kacir(bilgiler.firma_adi)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>Web sitesi:</strong> ${kacir(bilgiler.web_sitesi)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>Yetkili:</strong> ${kacir(bilgiler.ad_soyad)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>E-posta:</strong> ${kacir(bilgiler.eposta)}</li>` +
            `<li style="margin: 0;"><strong>Telefon:</strong> ${kacir(bilgiler.cep_tel)}</li>` +
            `</ul>`,
          text:
            `Yeni bir kurumsal üyelik ön başvurusu alındı:\n\n` +
            `- Firma: ${bilgiler.firma_adi}\n` +
            `- Web sitesi: ${bilgiler.web_sitesi}\n` +
            `- Yetkili: ${bilgiler.ad_soyad}\n` +
            `- E-posta: ${bilgiler.eposta}\n` +
            `- Telefon: ${bilgiler.cep_tel}`,
        },
        "admin-bildirim"
      )
    );
  } else {
    console.error("[uyelik-basvurusu] COGNITI_ADMIN_EMAIL tanımlı değil; yönetici bildirimi gönderilmedi.");
  }

  await Promise.allSettled(gonderimler);
}

function webAdresiniDogrula(deger: unknown) {
  const adres = metin(deger, 500);
  if (!adres) return null;
  try {
    const url = new URL(adres.includes("://") ? adres : `https://${adres}`);
    if (!["https:", "http:"].includes(url.protocol) || !url.hostname.includes(".") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export async function POST(istek: Request) {
  if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
  const ham = await istek.text();
  if (ham.length > 4096) return hata("Form çok uzun.", 413);
  let veri;
  try { veri = JSON.parse(ham); }
  catch { return hata("Form okunamadı.", 400); }
  const eposta = metin(veri?.eposta, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) return hata("Geçerli bir e-posta adresi girin.", 400);

  const db = createAdminClient();
  const sifre: unknown = veri.sifre;
  if (veri.islem === "basvuru") {
    const firma = metin(veri.firma, 150);
    const web = webAdresiniDogrula(veri.web);
    const ad = metin(veri.ad, 150);
    const telefon = metin(veri.telefon, 30).replace(/[\s().-]/g, "").replace(/^(?:\+90|0)/, "");
    if (!firma || !web || !ad || /[\r\n]/.test(firma + ad) || !/^5\d{9}$/.test(telefon)) {
      return hata("Firma adı, web sitesi, ad soyad ve geçerli bir cep telefonu girin.", 400);
    }
    if (KISISEL_ALANLAR.has(eposta.split("@")[1])) return hata("Kurumsal e-posta adresinizi girin.", 400);
    if (typeof sifre !== "string") return hata("Şifre 8–128 karakter olmalıdır.", 400);
    const sifreHatasi = sifreKuralHatasi(sifre);
    if (sifreHatasi) return hata(sifreHatasi, 400);
    if (Buffer.byteLength(sifre) > 72) return hata("Şifre en fazla 72 karakter olmalıdır.", 400);
    const bilgiler = { firma_adi: firma, web_sitesi: web, ad_soyad: ad, eposta, cep_tel: telefon };
    const { data: mevcut, error: okumaHatasi } = await db.from(ON_BASVURU_TABLOSU)
      .select("id,aday_auth_id,davet_bitis_at,kabul_at").eq("eposta", eposta).maybeSingle();
    if (okumaHatasi) return hata("Başvuru kaydedilemedi.", 503);
    if (mevcut) {
      if (!mevcut.kabul_at && mevcut.davet_bitis_at && Date.parse(mevcut.davet_bitis_at) <= Date.now() && mevcut.aday_auth_id) {
        const { data } = await db.auth.signInWithPassword({ email: eposta, password: sifre });
        if (data.user?.id === mevcut.aday_auth_id) {
          const { error } = await db.from(ON_BASVURU_TABLOSU)
            .update({ ...bilgiler, davet_hash: null, davet_bitis_at: null, olusturuldu_at: new Date().toISOString() })
            .eq("id", mevcut.id).eq("davet_bitis_at", mevcut.davet_bitis_at).is("kabul_at", null);
          if (error) return hata("Başvuru güncellenemedi.", 503);
          await onBasvuruEpostalariniGonder(bilgiler);
          return Response.json({ mesaj: BASVURU_MESAJI });
        }
        return hata("Yeniden başvurmak için daha önce belirlediğiniz şifreyi girin.", 403);
      }
      return hata("Bu e-posta adresiyle daha önce başvuru yapıldı.", 409);
    }

    const { data: hesap, error: hesapHatasi } = await db.auth.admin.createUser({
      email: eposta, password: sifre, email_confirm: true, app_metadata: { cogniti_uyelik_adayi: true },
    });
    if (hesapHatasi || !hesap.user) return hata("Başvuru hesabı oluşturulamadı.", 409);
    const { error } = await db.from(ON_BASVURU_TABLOSU).insert({ ...bilgiler, aday_auth_id: hesap.user.id });
    if (error) {
      await db.auth.admin.deleteUser(hesap.user.id);
      return hata("Başvuru kaydedilemedi.", 503);
    }
    await onBasvuruEpostalariniGonder(bilgiler);
    return Response.json({ mesaj: BASVURU_MESAJI });
  }

  const token = metin(veri.token, 43);
  if (veri.islem !== "davet" || !davetBicimiGecerli(token) || typeof sifre !== "string") {
    return hata("Davet geçersiz.", 400);
  }
  const hash = davetOzeti(token);
  const { data: aday, error } = await db.from(ON_BASVURU_TABLOSU).select("id,aday_auth_id")
    .eq("eposta", eposta).eq("davet_hash", hash).gt("davet_bitis_at", new Date().toISOString())
    .is("kabul_at", null).maybeSingle();
  if (error) return hata("Başvuru doğrulanamadı.", 503);
  if (!aday?.aday_auth_id) return hata("Davet geçersiz veya süresi dolmuş.", 403);
  const auth = await createClient();
  const { data } = await auth.auth.signInWithPassword({ email: eposta, password: sifre });
  if (data.user?.id !== aday.aday_auth_id) return hata("E-posta veya şifre hatalı.", 403);
  const simdi = new Date().toISOString();
  const { data: kayit, error: kayitHatasi } = await db.from(ON_BASVURU_TABLOSU)
    .update({ kabul_at: simdi, davet_hash: null }).eq("id", aday.id).eq("davet_hash", hash)
    .gt("davet_bitis_at", simdi).is("kabul_at", null).select("id").maybeSingle();
  if (kayitHatasi || !kayit) return hata("Davet kabul edilemedi.", 409);
  return Response.json({ ok: true });
}
