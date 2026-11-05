import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerSifreOzeti, partnerTestSifresiGecerli } from "@/lib/agora/partnerSifre";
import { partnerListesiGecerli } from "@/lib/agora/partnerOnayTipleri";

export async function GET(request: Request) {
  try {
    const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
    const params = new URL(request.url).searchParams;
    const durum = params.get("durum") ?? "bekliyor", sayfa = Number(params.get("sayfa") ?? 1);
    if (!["bekliyor", "onaylandi", "reddedildi", "tumu"].includes(durum) || !Number.isSafeInteger(sayfa) || sayfa < 1 || sayfa > 100000) return partnerYanit({ hata: "Geçersiz liste seçimi." }, 400);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_basvurulari", { p_admin_id: auth.kullaniciId, p_durum: durum, p_sayfa: sayfa });
    if (error || !partnerListesiGecerli(data)) return partnerYanit({ hata: "Partner başvuruları okunamadı. Yeniden deneyin." }, 503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Partner başvuruları okunamadı." }, 503); }
}

export async function POST(request: Request) {
  try {
    const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
    const body = await partnerJsonOku(request); if (!body.ok) return body.yanit;
    const d = body.veri;
    if (typeof d.partner_id !== "string" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(d.partner_id)
      || !["onaylandi", "reddedildi"].includes(String(d.karar)) || !Number.isSafeInteger(d.giris_surum) || Number(d.giris_surum) < 1) return partnerYanit({ hata: "Geçersiz başvuru veya karar." }, 400);
    if (d.karar === "onaylandi" && !partnerTestSifresiGecerli(d.test_sifre)) return partnerYanit({ hata: "Test şifresi en az 6, en fazla 128 karakter olmalıdır." }, 400);
    const ozet = d.karar === "onaylandi" ? await partnerSifreOzeti(d.test_sifre as string) : null;
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("agora_partner_ilk_giris_karar", {
      p_admin_id: auth.kullaniciId, p_partner_id: d.partner_id, p_karar: d.karar, p_surum: d.giris_surum, p_sifre_ozeti: ozet,
    });
    if (error) return partnerYanit({ hata: "Karar kaydedilemedi. Yeniden deneyin." }, 503);
    if (data === "cakisma") return partnerYanit({ hata: "Başvuru başka bir işlemle değişti. Listeyi yenileyin." }, 409);
    if (data !== "tamam") return partnerYanit({ hata: "Karar kaydedilemedi." }, 503);
    return partnerYanit({ mesaj: d.karar === "onaylandi" ? "İlk giriş onaylandı." : "Başvuru reddedildi." });
  } catch { return partnerYanit({ hata: "Karar kaydedilemedi." }, 503); }
}
