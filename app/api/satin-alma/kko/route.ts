import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { kkoSecimIstegiGecerli } from "@/lib/satinAlma/kkoSecimi";
import { kkoYetkiliHesabiOku } from "@/lib/satinAlma/kkoYetkisiSunucu";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

export async function POST(request: Request) {
  const body = await partnerJsonOku(request);
  if (!body.ok) return body.yanit;
  if (!kkoSecimIstegiGecerli(body.veri)) return partnerYanit({ hata: "KKÖ seçim bilgileri geçersiz." }, 400);
  try {
    const yetki = await kkoYetkiliHesabiOku(body.veri.hesapTuru);
    if (!yetki.ok) return partnerYanit(yetki, yetki.status);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_kko_secimini_kaydet", {
      p_auth_id: yetki.kullaniciId, p_hesap: body.veri.hesapTuru, p_birim_fiyat: body.veri.birimFiyat, p_anahtar: body.veri.islemAnahtari,
    });
    if (error?.code === "42501") return partnerYanit({ hata: "Bu hesap için KKÖ seçme yetkiniz bulunmuyor." }, 403);
    if (error?.code === "P0003") {
      const mesaj = error.message?.includes("paket_veya_bloke_var") ? "Kullanılabilir paket tokenı, açık sipariş veya blokeli gönderi varken KKÖ’ye geçilemez."
        : error.message?.includes("fiyat_degisti") ? "KKÖ birim fiyatı değişti. Sayfayı yenileyin."
        : error.message?.includes("tercih_degisti") ? "Hesabın kullanım tercihi değişmiş. Sayfayı yenileyin." : "Bu hesapta KKÖ zaten etkin.";
      return partnerYanit({ hata: mesaj }, 409);
    }
    if (error?.code === "22023") return partnerYanit({ hata: "KKÖ seçim bilgileri doğrulanamadı." }, 400);
    if (error || !data || !uuidGecerliMi(data.bakiye_id) || typeof data.yeniden_deneme !== "boolean") {
      return partnerYanit({ hata: "KKÖ seçiminin sonucu doğrulanamadı. Aynı işlemle yeniden deneyin." }, 503);
    }
    return partnerYanit({ ok: true, hesapId: data.bakiye_id, yenidenDeneme: data.yeniden_deneme });
  } catch { return partnerYanit({ hata: "KKÖ seçiminin sonucu doğrulanamadı. Aynı işlemle yeniden deneyin." }, 503); }
}
