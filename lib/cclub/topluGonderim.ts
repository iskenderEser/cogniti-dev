import type { SupabaseClient } from "@supabase/supabase-js";
import { bildirimOlustur } from "@/lib/utils/bildirimOlustur";
import { challengeGeldiMesaji } from "@/lib/cclub/bildirimMesajlari";

type TopluSonuc =
  | { ok: true; gonderilen: string[]; atlanan: { alan_id: string; sebep: string }[] }
  | { ok: false; hata: string; tokenHatasi: boolean };

/** Challenge, gönderme puanı ve token tek RPC içindedir. Bildirim yalnız başarıdan sonra oluşur. */
export async function challengeTopluOlustur(
  db: SupabaseClient,
  girdi: { gonderen_id: string; yayin_id: string; alan_idler: string[] },
  meta: { gonderenAdi: string; videoAdi: string },
): Promise<TopluSonuc> {
  const { data, error } = await db.rpc("cogniti_token_cclub_toplu_gonder", {
    p_gonderen_id: girdi.gonderen_id, p_yayin_id: girdi.yayin_id, p_alan_idler: girdi.alan_idler,
  });
  if (error) {
    if (error.code === "P0001" && error.message === "COGNITI_TOKEN:bakiye_yetersiz") {
      return { ok: false, hata: "Firmanızın token bakiyesi bu gönderim için yetersiz. Hiçbir challenge gönderilmedi.", tokenHatasi: true };
    }
    if (error.code === "P0001" && error.message === "COGNITI_TOKEN:hesap_yok") {
      return { ok: false, hata: "Firmanızın token hesabı henüz açılmamış. Hiçbir challenge gönderilmedi.", tokenHatasi: true };
    }
    return { ok: false, hata: "Challenge gönderimi tamamlanamadı.", tokenHatasi: false };
  }
  if (!data || !Array.isArray(data.gonderilen) || !Array.isArray(data.atlanan)
    || data.gonderilen.some((r: { alan_id?: unknown; challenge_id?: unknown } | null) => !r || typeof r.alan_id !== "string" || typeof r.challenge_id !== "string")
    || data.atlanan.some((r: { alan_id?: unknown; sebep?: unknown } | null) => !r || typeof r.alan_id !== "string" || typeof r.sebep !== "string")) {
    return { ok: false, hata: "Gönderim sonucu okunamadı. Tekrar denemeden önce challenge listenizi kontrol edin.", tokenHatasi: false };
  }
  const gonderilen = data.gonderilen as { alan_id: string; challenge_id: string }[];
  for (const kayit of gonderilen) {
    await bildirimOlustur({ adminSupabase: db, alici_id: kayit.alan_id, gonderen_id: girdi.gonderen_id,
      kayit_turu: "challenge", kayit_id: kayit.challenge_id, mesaj: challengeGeldiMesaji(meta.gonderenAdi, meta.videoAdi) });
  }
  return { ok: true, gonderilen: gonderilen.map(r => r.alan_id), atlanan: data.atlanan };
}
