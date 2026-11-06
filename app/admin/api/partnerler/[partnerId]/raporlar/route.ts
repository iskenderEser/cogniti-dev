import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { raporOkumaHatasi, raporSayfasi, partnerRaporListesiGecerli } from "@/lib/agora/rapor";

type Context = { params: Promise<{ partnerId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const { partnerId } = await context.params;
    if (!uuidGecerliMi(partnerId)) return partnerYanit({ hata: "Geçersiz partner." }, 400);
    const sayfa = raporSayfasi(new URL(request.url).searchParams.get("sayfa"));
    if (sayfa === null) return partnerYanit({ hata: "Geçersiz rapor sayfası." }, 400);
    const id = partnerId.toLowerCase();
    const { data, error } = await createAdminClient(AbortSignal.timeout(15000)).rpc("agora_partner_admin_raporlari_oku", {
      p_admin_id: auth.kullaniciId, p_partner_id: id, p_sayfa: sayfa,
    });
    if (error) {
      const sonuc = raporOkumaHatasi(error.code);
      return partnerYanit({ hata: sonuc.mesaj }, sonuc.status);
    }
    if (data === null) return partnerYanit({ hata: "Partner firma bulunamadı." }, 404);
    if (!partnerRaporListesiGecerli(data, id, sayfa)) {
      return partnerYanit({ hata: "Rapor bilgileri doğrulanamadı." }, 503);
    }
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Raporlar okunamadı. Yeniden deneyin." }, 503); }
}
