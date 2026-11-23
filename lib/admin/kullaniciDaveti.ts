import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sifreKuralHatasi } from "@/lib/auth/sifreKurali";
import { davetSiteAdresi, davetTokenGecerli } from "@/lib/eclub/uyelikDaveti";

const DAVET_TABLOSU = "cogniti_kullanici_davetleri";
const davetHash = (token: string) => createHash("sha256").update(token).digest("hex");
const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function rastgeleBaslangicSifresi(): string {
  return `${randomBytes(24).toString("base64url")}Aa1!`;
}

export function firmaDavetBekliyor(metadata: Record<string, unknown> | undefined): boolean {
  return metadata?.cogniti_davet_bekliyor === true;
}

export async function firmaKullaniciDavetiGonder(
  db: SupabaseClient,
  kullaniciId: string,
  firmaAdi: string,
  origin: string
): Promise<{ gonderildi: boolean; mesaj: string }> {
  const { data: authData, error: authHatasi } = await db.auth.admin.getUserById(kullaniciId);
  if (authHatasi || !authData.user?.email) {
    return { gonderildi: false, mesaj: "Kullanıcı hesabı doğrulanamadı." };
  }
  if (!firmaDavetBekliyor(authData.user.app_metadata)) {
    return { gonderildi: false, mesaj: "Bu kullanıcı şifresini zaten oluşturmuş." };
  }

  const { data: kullanici } = await db
    .from("kullanicilar")
    .select("ad,soyad,eposta,aktif_mi")
    .eq("kullanici_id", kullaniciId)
    .maybeSingle();

  if (!kullanici || kullanici.aktif_mi !== true) {
    return { gonderildi: false, mesaj: "Aktif kullanıcı bulunamadı." };
  }

  const eposta = (authData.user.email || kullanici.eposta).toLowerCase();
  const adSoyad = [kullanici.ad, kullanici.soyad].filter(Boolean).join(" ").trim();
  const token = randomBytes(32).toString("base64url");

  const { data: davetId, error: kayitHatasi } = await db.rpc("cogniti_kullanici_davet_yenile", {
    p_kullanici: kullaniciId,
    p_hash: davetHash(token),
    p_eposta: eposta,
  });

  if (kayitHatasi) {
    return { gonderildi: false, mesaj: kayitHatasi.message || "Davet oluşturulamadı." };
  }

  try {
    const adres = davetSiteAdresi(origin);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
    if (!apiKey || !from) {
      throw new Error("E-posta ayarları eksik.");
    }
    const link = `${adres}/sifre-olustur?token=${token}`;
    const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Kullanıcı,";

    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `firma-kullanici-davet/${davetId}`,
      },
      body: JSON.stringify({
        from,
        to: [eposta],
        subject: "Cogniti hesabınız oluşturuldu — şifrenizi belirleyin",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(`${firmaAdi} bünyesinde Cogniti hesabınız oluşturulmuştur.`)}</p>` +
          `<p style="margin: 0 0 16px 0;">Giriş şifrenizi belirlemek için <a href="${kacir(link)}">şifre oluşturma bağlantısını</a> kullanabilirsiniz.</p>` +
          `<p style="margin: 0 0 16px 0;">Bu bağlantı 24 saat boyunca geçerlidir ve tek kullanımlıktır. Süresi dolarsa yöneticinizden daveti yeniden göndermesini isteyebilirsiniz.</p>` +
          `<p style="margin: 0 0 16px 0;">Cogniti’ye hoş geldiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${firmaAdi} bünyesinde Cogniti hesabınız oluşturulmuştur.\n\n` +
          `Giriş şifrenizi belirlemek için aşağıdaki bağlantıyı kullanabilirsiniz:\n${link}\n\n` +
          `Bu bağlantı 24 saat boyunca geçerlidir ve tek kullanımlıktır. Süresi dolarsa yöneticinizden daveti yeniden göndermesini isteyebilirsiniz.\n\n` +
          `Cogniti’ye hoş geldiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });

    if (!yanit.ok) throw new Error("Davet e-postası gönderilemedi.");

    const { error: guncellemeHatasi } = await db
      .from(DAVET_TABLOSU)
      .update({ gonderildi: true })
      .eq("davet_id", davetId);
    if (guncellemeHatasi) throw new Error("Davet durumu kaydedilemedi.");

    return {
      gonderildi: true,
      mesaj: "Kullanıcı eklendi; 24 saatlik şifre oluşturma daveti e-postasına gönderildi.",
    };
  } catch (err) {
    return {
      gonderildi: false,
      mesaj: `Kullanıcı kaydedildi ancak davet gönderilemedi. Düzenleme ekranından daveti yeniden gönderin. ${err instanceof Error ? err.message : ""}`.trim(),
    };
  }
}

export async function kayitSonrasiFirmaDavetiGonder(
  db: SupabaseClient,
  kullaniciId: string,
  firmaAdi: string,
  origin: string
): Promise<{ gonderildi: boolean; mesaj: string }> {
  try {
    return await firmaKullaniciDavetiGonder(db, kullaniciId, firmaAdi, origin);
  } catch {
    return {
      gonderildi: false,
      mesaj: "Kullanıcı kaydedildi ancak davet gönderilemedi. Düzenleme ekranından daveti yeniden gönderin.",
    };
  }
}

export async function firmaKullaniciDavetTokeniMi(db: SupabaseClient, token: unknown): Promise<boolean> {
  if (!davetTokenGecerli(token)) return false;
  const { data, error } = await db
    .from(DAVET_TABLOSU)
    .select("kullanici_id")
    .eq("token_hash", davetHash(token))
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.kullanici_id);
}

interface FirmaDavetSatiri {
  kullanici_id: string;
  davet_id: string;
  eposta: string;
}

export async function firmaKullaniciDavetSifresiniKaydet(
  db: SupabaseClient,
  token: unknown,
  sifre: unknown,
  tekrar: unknown
) {
  if (!davetTokenGecerli(token)) throw new Error("Davet bağlantısı geçersiz.");
  if (typeof sifre !== "string") throw new Error("Şifre 8–128 karakter olmalıdır.");
  const kuralHatasi = sifreKuralHatasi(sifre);
  if (kuralHatasi) throw new Error(kuralHatasi);
  if (sifre !== tekrar) throw new Error("Şifreler eşleşmiyor.");

  const lease = randomUUID();
  const { data, error } = await db.rpc("cogniti_kullanici_davet_islem_al", {
    p_hash: davetHash(token),
    p_lease: lease,
  });
  if (error) throw new Error("Davet doğrulanamadı. Lütfen yeniden deneyin.");

  const davet = (Array.isArray(data) ? data[0] : data) as FirmaDavetSatiri | undefined;
  if (!davet) {
    throw new Error("Davet kullanılmış, süresi dolmuş veya işlem sürüyor. Yöneticinizden yeni davet isteyin.");
  }

  let authTamamlandi = false;
  let authYazimiBelirsiz = false;
  try {
    const { data: hesap, error: hesapHatasi } = await db.auth.admin.getUserById(davet.kullanici_id);
    if (hesapHatasi || !hesap.user || hesap.user.email?.toLowerCase() !== davet.eposta.toLowerCase()) {
      throw new Error("Davet hesabı değişmiş. Yöneticinizden yeni davet isteyin.");
    }

    const { data: kullanici, error: kullaniciHatasi } = await db
      .from("kullanicilar")
      .select("kullanici_id,aktif_mi")
      .eq("kullanici_id", davet.kullanici_id)
      .maybeSingle();
    if (kullaniciHatasi || !kullanici || kullanici.aktif_mi !== true) {
      throw new Error("Kullanıcı hesabı aktif değil. Yöneticinizle iletişime geçin.");
    }

    authTamamlandi = hesap.user.app_metadata.cogniti_davet_tamamlandi === davet.davet_id;
    if (!authTamamlandi) {
      if (!firmaDavetBekliyor(hesap.user.app_metadata)) {
        throw new Error("Bu hesap için davet artık geçerli değil.");
      }
      authYazimiBelirsiz = true;
      const { error: sifreHatasi } = await db.auth.admin.updateUserById(davet.kullanici_id, {
        password: sifre,
        email_confirm: true,
        ban_duration: "none",
        app_metadata: {
          ...hesap.user.app_metadata,
          cogniti_davet_bekliyor: false,
          cogniti_davet_tamamlandi: davet.davet_id,
        },
      });
      if (sifreHatasi) {
        authYazimiBelirsiz = !sifreHatasi.status || sifreHatasi.status >= 500;
        throw new Error(
          authYazimiBelirsiz
            ? "Şifre kaydı doğrulanamadı. İki dakika sonra tekrar deneyin."
            : "Şifre kaydedilemedi. Lütfen yeniden deneyin."
        );
      }
      authTamamlandi = true;
    }

    const { data: bitti, error: bitisHatasi } = await db.rpc("cogniti_kullanici_davet_islem_bitir", {
      p_kullanici: davet.kullanici_id,
      p_lease: lease,
      p_basarili: true,
    });
    if (bitisHatasi || !bitti) {
      throw new Error("Şifre kaydedildi; kayıt tamamlama işlemi için iki dakika sonra tekrar deneyin.");
    }
  } catch (err) {
    if (!authTamamlandi && !authYazimiBelirsiz) {
      await db.rpc("cogniti_kullanici_davet_islem_bitir", {
        p_kullanici: davet.kullanici_id,
        p_lease: lease,
        p_basarili: false,
      });
    }
    throw err;
  }
}
