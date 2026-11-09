import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { kkoHesapTuru } from "./kkoYetkisi";

/** Yalnız yetki/hesap çözümlemesi yapar; KKÖ etkinleştirmez veya token yüklemez. */
export async function kkoYetkiliHesabiOku(beklenenHesap: unknown) {
  try {
    const oturum = await createClient();
    const { data: { user }, error } = await oturum.auth.getUser();
    if (error || !user) return { ok: false as const, status: 401, hata: "Oturum açmanız gerekiyor." };
    const db = createAdminClient(AbortSignal.timeout(10000));
    const rol = await rolCozucu(db, user.id);
    const hesapTuru = kkoHesapTuru(rol);
    if (!hesapTuru || hesapTuru !== beklenenHesap) {
      return { ok: false as const, status: 403, hata: "Bu hesap için KKÖ seçme yetkiniz bulunmuyor." };
    }
    const { data: kisi, error: kisiHatasi } = await db.from("kullanicilar")
      .select("firma_id,aktif_mi").eq("kullanici_id", user.id).maybeSingle();
    if (kisiHatasi) return { ok: false as const, status: 503, hata: "Hesap yetkisi doğrulanamadı." };
    if (!kisi || kisi.aktif_mi !== true || !uuidGecerliMi(kisi.firma_id)) {
      return { ok: false as const, status: 403, hata: "Aktif firma hesabınız bulunmuyor." };
    }
    const { data: firma, error: firmaHatasi } = await db.from("firmalar")
      .select("aktif").eq("firma_id", kisi.firma_id).maybeSingle();
    if (firmaHatasi) return { ok: false as const, status: 503, hata: "Hesap yetkisi doğrulanamadı." };
    if (firma?.aktif !== true) return { ok: false as const, status: 403, hata: "Aktif firma hesabınız bulunmuyor." };
    return { ok: true as const, kullaniciId: user.id, rol, hesapTuru, firmaId: kisi.firma_id as string,
      sahipId: hesapTuru === "kisisel" ? user.id : null };
  } catch {
    return { ok: false as const, status: 503, hata: "Hesap yetkisi doğrulanamadı." };
  }
}
