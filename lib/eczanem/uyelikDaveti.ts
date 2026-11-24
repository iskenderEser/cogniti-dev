import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sifreKuralHatasi } from "@/lib/auth/sifreKurali";
import { davetHash, davetSiteAdresi, davetTokenGecerli } from "@/lib/eclub/uyelikDaveti";

const DAVET_TABLOSU = "eczanem_uyelik_davetleri";

const kacir = (v: string) =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function eczanemDavetBekliyor(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.eczanem_davet_bekliyor === true;
}

export async function eczanemDavetAltyapisiKontrol(db: SupabaseClient): Promise<void> {
  const { error } = await db.from(DAVET_TABLOSU).select("auth_user_id").limit(0);
  if (error) throw new Error("Eczanem üyelik daveti veritabanı kurulumu tamamlanmamış.");
}

export async function eczanemDavetTokeniMi(db: SupabaseClient, token: unknown): Promise<boolean> {
  if (!davetTokenGecerli(token)) return false;
  const { data, error } = await db
    .from(DAVET_TABLOSU)
    .select("auth_user_id")
    .eq("token_hash", davetHash(token))
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.auth_user_id);
}

export async function eczanemUyelikDavetiGonder(
  db: SupabaseClient,
  authId: string,
  origin: string,
  eczaneAdi?: string | null,
): Promise<{ gonderildi: boolean; mesaj: string }> {
  const { data, error } = await db.auth.admin.getUserById(authId);
  if (error || !data.user?.email) throw new Error("Davet hesabı doğrulanamadı.");
  if (!eczanemDavetBekliyor(data.user.app_metadata)) {
    throw new Error("Bu üyenin giriş hesabı zaten hazır.");
  }

  const token = randomBytes(32).toString("base64url");
  const { data: davetId, error: kayitHatasi } = await db.rpc("eczanem_davet_yenile", {
    p_auth: authId,
    p_hash: davetHash(token),
    p_eposta: data.user.email,
  });
  if (kayitHatasi) {
    return {
      gonderildi: false,
      mesaj: `Üye kayıtlı; davet gönderilemedi. ${kayitHatasi.message}`.trim(),
    };
  }

  try {
    const adres = davetSiteAdresi(origin);
    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.ECZANEM_DAVET_EMAIL_FROM ||
      process.env.ECLUB_DAVET_EMAIL_FROM ||
      process.env.COGNITI_UYELIK_EMAIL_FROM ||
      process.env.ECLUB_CEK_EMAIL_FROM;
    if (!apiKey || !from) {
      throw new Error("Davet e-postası için gönderim ayarları eksik.");
    }

    const link = `${adres}/sifre-olustur?token=${token}`;
    const adSoyad = [data.user.user_metadata?.ad, data.user.user_metadata?.soyad]
      .filter(Boolean)
      .join(" ")
      .trim() || String(data.user.user_metadata?.ad_soyad ?? "").trim();
    const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Üyemiz,";
    const eczaneTemiz = String(eczaneAdi ?? "").trim();
    const acilisCumlesi = eczaneTemiz
      ? `${eczaneTemiz} tarafından Cogniti Eczanem üyeliğiniz oluşturuldu. Üyeliğinizi tamamlamak için aşağıdaki bağlantıdan şifrenizi oluşturabilirsiniz.`
      : "Cogniti Eczanem üyeliğiniz oluşturuldu. Üyeliğinizi tamamlamak için aşağıdaki bağlantıdan şifrenizi oluşturabilirsiniz.";

    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `eczanem-davet/${davetId}`,
      },
      body: JSON.stringify({
        from,
        to: [data.user.email],
        subject: "Cogniti Eczanem Üyelik Davetiniz",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(acilisCumlesi)}</p>` +
          `<p style="margin: 0 0 16px 0;"><a href="${kacir(link)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">Şifre oluştur</a></p>` +
          `<p style="margin: 0 0 16px 0;">Bu bağlantı 24 saat geçerlidir ve tek kullanımlıktır. Süresi dolarsa eczanenizden daveti yeniden göndermesini isteyebilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${acilisCumlesi}\n${link}\n\n` +
          `Bu bağlantı 24 saat geçerlidir ve tek kullanımlıktır. Süresi dolarsa eczanenizden daveti yeniden göndermesini isteyebilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });

    if (!yanit.ok) throw new Error("Davet e-postası gönderilemedi.");

    const { error: gonderimHatasi } = await db
      .from(DAVET_TABLOSU)
      .update({ gonderildi: true })
      .eq("davet_id", davetId);
    if (gonderimHatasi) throw new Error("Davet gönderim durumu kaydedilemedi.");

    return {
      gonderildi: true,
      mesaj: "Üye kaydedildi; 24 saat geçerli şifre oluşturma daveti e-postasına gönderildi.",
    };
  } catch (e) {
    return {
      gonderildi: false,
      mesaj: `Üye kaydedildi ancak davet e-postası gönderilemedi. ${e instanceof Error ? e.message : ""}`.trim(),
    };
  }
}

/** Üye zaten kayıtlıdır; e-posta gönderim kesintisi başarılı kaydı hataya çevirmez. */
export async function kayitSonrasiEczanemDavetiGonder(
  db: SupabaseClient,
  authId: string,
  origin: string,
  eczaneAdi?: string | null,
): Promise<{ gonderildi: boolean; mesaj: string }> {
  try {
    return await eczanemUyelikDavetiGonder(db, authId, origin, eczaneAdi);
  } catch {
    return {
      gonderildi: false,
      mesaj: "Üye kaydedildi ancak davet e-postası gönderilemedi.",
    };
  }
}

interface EczanemDavetSatiri {
  auth_user_id: string;
  davet_id: string;
  eposta: string;
}

export const ECZANEM_KVKK_ONAY_HATASI =
  "Devam etmek için KVKK Aydınlatma Metni ve üyelik onayını işaretlemeniz gerekir.";

export async function eczanemDavetSifresiniKaydet(
  db: SupabaseClient,
  token: unknown,
  sifre: unknown,
  tekrar: unknown,
  kvkkOnay: unknown,
): Promise<void> {
  if (!davetTokenGecerli(token)) throw new Error("Davet bağlantısı geçersiz.");
  if (kvkkOnay !== true) throw new Error(ECZANEM_KVKK_ONAY_HATASI);
  if (typeof sifre !== "string") throw new Error("Şifre 8–128 karakter olmalıdır.");
  const kuralHatasi = sifreKuralHatasi(sifre);
  if (kuralHatasi) throw new Error(kuralHatasi);
  if (sifre !== tekrar) throw new Error("Şifreler eşleşmiyor.");

  const lease = randomUUID();
  const { data, error } = await db.rpc("eczanem_davet_islem_al", {
    p_hash: davetHash(token),
    p_lease: lease,
  });
  if (error) throw new Error("Davet doğrulanamadı. Lütfen yeniden deneyin.");

  const davet = (Array.isArray(data) ? data[0] : data) as EczanemDavetSatiri | undefined;
  if (!davet) {
    throw new Error("Davet kullanılmış, süresi dolmuş veya işlem sürüyor. Eczanenizden yeni davet isteyin.");
  }

  let authTamamlandi = false;
  let authYazimiBelirsiz = false;
  try {
    const { data: hesap, error: hesapHatasi } = await db.auth.admin.getUserById(davet.auth_user_id);
    if (hesapHatasi || !hesap.user || hesap.user.email?.toLowerCase() !== davet.eposta.toLowerCase()) {
      throw new Error("Davet hesabı değişmiş. Eczanenizden yeni davet isteyin.");
    }

    const { data: musteri, error: musteriHatasi } = await db
      .from("eczanem_musteriler")
      .select("musteri_id, aktif_mi")
      .eq("auth_user_id", davet.auth_user_id)
      .maybeSingle();
    if (musteriHatasi || !musteri || musteri.aktif_mi !== true) {
      throw new Error("Üyelik hesabı aktif değil. Eczanenizle iletişime geçin.");
    }

    const { data: baglar, error: bagHatasi } = await db
      .from("eczanem_uyelikler")
      .select("uyelik_id")
      .eq("musteri_id", musteri.musteri_id)
      .eq("aktif_mi", true)
      .limit(1);
    if (bagHatasi || !baglar?.length) {
      throw new Error("Eczane üyeliği pasife alınmış. Eczanenizle iletişime geçin.");
    }

    // Auth kaydı başarılı, DB tamamlama yanıtı kaybolmuşsa tekrar şifre yazılmaz.
    authTamamlandi = hesap.user.app_metadata?.eczanem_davet_tamamlandi === davet.davet_id;
    if (!authTamamlandi) {
      if (!eczanemDavetBekliyor(hesap.user.app_metadata)) {
        throw new Error("Bu hesap için davet artık geçerli değil.");
      }
      authYazimiBelirsiz = true;
      const { error: sifreHatasi } = await db.auth.admin.updateUserById(davet.auth_user_id, {
        password: sifre,
        email_confirm: true,
        ban_duration: "none",
        app_metadata: {
          ...hesap.user.app_metadata,
          eczanem_davet_bekliyor: false,
          eczanem_davet_tamamlandi: davet.davet_id,
        },
      });
      if (sifreHatasi) {
        authYazimiBelirsiz = !sifreHatasi.status || sifreHatasi.status >= 500;
        throw new Error(
          authYazimiBelirsiz
            ? "Şifre kaydı doğrulanamadı. İki dakika sonra tekrar deneyin."
            : "Şifre kaydedilemedi. Lütfen yeniden deneyin.",
        );
      }
      authTamamlandi = true;
    }

    const { data: bitti, error: bitisHatasi } = await db.rpc("eczanem_davet_islem_bitir", {
      p_auth: davet.auth_user_id,
      p_lease: lease,
      p_basarili: true,
    });
    if (bitisHatasi || !bitti) {
      throw new Error("Şifre kaydedildi; kayıt tamamlama işlemi için iki dakika sonra tekrar deneyin.");
    }
  } catch (e) {
    // Auth işlemi başarıyla bitmişse davet bekliyor durumuna geri döndürülmez.
    if (!authTamamlandi && !authYazimiBelirsiz) {
      await db.rpc("eczanem_davet_islem_bitir", {
        p_auth: davet.auth_user_id,
        p_lease: lease,
        p_basarili: false,
      });
    }
    throw e;
  }
}
