import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerUyelikListesiGecerli } from "@/lib/agora/partnerUyelikTipleri";

export async function GET(request: Request) {
  try {
    const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
    const params = new URL(request.url).searchParams;
    const durum = params.get("durum") ?? "onay_bekliyor", sayfa = Number(params.get("sayfa") ?? 1);
    if (!["onay_bekliyor", "onaylandi", "reddedildi", "tumu"].includes(durum) || !Number.isSafeInteger(sayfa) || sayfa < 1 || sayfa > 100000) return partnerYanit({ hata: "Geçersiz liste seçimi." }, 400);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_uyelik_basvurulari", { p_admin_id: auth.kullaniciId, p_durum: durum, p_sayfa: sayfa });
    if (error || !partnerUyelikListesiGecerli(data)) return partnerYanit({ hata: "Üyelik başvuruları okunamadı. Yeniden deneyin." }, 503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Üyelik başvuruları okunamadı." }, 503); }
}
export async function POST(request: Request) {
  try {
    const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
    const body = await partnerJsonOku(request); if (!body.ok) return body.yanit;
    const d = body.veri;
    if (typeof d.partner_id !== "string" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.partner_id)
      || !["onaylandi", "reddedildi"].includes(String(d.karar))
      || ![d.uyelik_surum, d.profil_surum].every(v => Number.isSafeInteger(v) && Number(v) > 0)) return partnerYanit({ hata: "Geçersiz üyelik kararı." }, 400);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_uyelik_karar", {
      p_admin_id: auth.kullaniciId, p_partner_id: d.partner_id, p_karar: d.karar, p_uyelik_surum: d.uyelik_surum, p_profil_surum: d.profil_surum,
    });
    if (error) return partnerYanit({ hata: "Üyelik kararı kaydedilemedi. Yeniden deneyin." }, 503);
    if (data !== "tamam") return partnerYanit({ hata: "Başvuru veya profil değişmiş. Güncel bilgileri inceleyip tekrar karar verin." }, 409);
    return partnerYanit({ mesaj: d.karar === "onaylandi" ? "Üyelik onaylandı." : "Üyelik reddedildi. Partner profilini düzeltip yeniden gönderebilir." });
  } catch { return partnerYanit({ hata: "İşlem sonucu doğrulanamadı. Güncel durumu kontrol edin." }, 503); }
}
