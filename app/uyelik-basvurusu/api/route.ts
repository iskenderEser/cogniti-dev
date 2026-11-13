import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ayniKaynaktan, davetBicimiGecerli, davetOzeti, ON_BASVURU_TABLOSU } from "@/lib/firma/kurumsalBasvuru";
import { BASVURU_ALINDI, DAVET_BILGISI } from "../basvuruMesaji";

const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status });
const metin = (deger: unknown, sinir: number) =>
  typeof deger === "string" && deger.trim().length <= sinir ? deger.trim() : "";
const BASVURU_MESAJI = `${BASVURU_ALINDI} ${DAVET_BILGISI}`;
const KISISEL_ALANLAR = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.co.uk", "ymail.com", "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com",
  "yandex.com", "yandex.ru", "mail.com", "gmx.com",
]);

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
    if (typeof sifre !== "string" || [...sifre].length < 8 || Buffer.byteLength(sifre) > 72 ||
        !/\p{Lu}/u.test(sifre) || !/\d/.test(sifre) || !/[\p{P}\p{S}]/u.test(sifre)) {
      return hata("Şifre en az 8 karakter, bir büyük harf, bir rakam ve bir özel karakter içermelidir.", 400);
    }
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
