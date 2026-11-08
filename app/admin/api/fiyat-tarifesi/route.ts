import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { fiyatDegerleriGecerli, fiyatTarifesiGecerli } from "@/lib/fiyat/tarife";

async function isle(request?: Request) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    let degerler: unknown = null, surum: number | null = null;
    if (request) {
      const body = await partnerJsonOku(request, 8192);
      if (!body.ok) return body.yanit;
      if (!fiyatDegerleriGecerli(body.veri.degerler) || !Number.isSafeInteger(body.veri.surum) || Number(body.veri.surum) < 1) {
        return partnerYanit({ hata: "Geçerli fiyat değerleri girin. Literatür için boş değer teklif usulüdür." }, 400);
      }
      degerler = body.veri.degerler; surum = Number(body.veri.surum);
    }
    const { data, error } = await createAdminClient(AbortSignal.timeout(15000)).rpc("cogniti_fiyat_tarifesi_yonet", {
      p_admin_id: auth.kullaniciId, p_degerler: degerler, p_beklenen_surum: surum,
    });
    if (error) {
      const status = error.code === "42501" ? 403 : error.code === "40001" ? 409 : error.code === "22023" ? 400 : 503;
      return partnerYanit({ hata: status === 409 ? "Fiyatlar başka bir işlemde değişmiş. Yenileyip tekrar deneyin."
        : status === 403 ? "Fiyat yönetimi yetkiniz bulunmuyor." : status === 400 ? "Geçersiz fiyat değerleri."
        : "Fiyat tarifesi okunamadı veya kaydedilemedi. SQL kurulumunu kontrol edin." }, status);
    }
    if (!fiyatTarifesiGecerli(data)) return partnerYanit({ hata: "Fiyat tarifesi doğrulanamadı." }, 503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Fiyat işlemi tamamlanamadı. Yeniden deneyin." }, 503); }
}
export async function GET() { return isle(); }
export async function PUT(request: Request) { return isle(request); }
