import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { siparisListesiGecerli } from "@/lib/satinAlma/siparisListesi";

export async function GET(request: Request, { params }: { params: Promise<{ firma_id: string }> }) {
  try {
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id)) return partnerYanit({ hata: "Geçersiz firma." }, 400);
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;
    const q = new URL(request.url).searchParams;
    const sayfaMetni = q.get("sayfa") ?? "0";
    if (!/^\d{1,7}$/.test(sayfaMetni) || Number(sayfaMetni) > 1000000 || q.getAll("sayfa").length > 1) return partnerYanit({ hata: "Geçersiz sayfa." }, 400);
    const sayfa = Number(sayfaMetni);
    const arama = q.get("q")?.trim() ?? "";
    if (arama.length > 80 || arama.includes("\0") || q.getAll("q").length > 1) return partnerYanit({ hata: "Geçersiz arama." }, 400);
    const paket = q.get("paket");
    if ((paket !== null && paket !== "esnek" && paket !== "abonelik" && paket !== "kko") || q.getAll("paket").length > 1) return partnerYanit({ hata: "Geçersiz paket filtresi." }, 400);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_firma_satin_alinan_paketler", {
      p_auth_id: auth.kullaniciId, p_firma: firma_id, p_sayfa: sayfa, p_arama: arama,
      ...(paket === "esnek" ? { p_yalniz_esnek: true } : paket ? { p_paket: paket } : {}),
    });
    if (error?.code === "42501") return partnerYanit({ hata: "Bu firmanın siparişlerine erişiminiz bulunmuyor." }, 403);
    if (error && ["PGRST202", "42883"].includes(error.code)) return partnerYanit({ hata: "Satın alınan paketler için okuma SQL kurulumu bekleniyor." }, 503);
    if (error || !siparisListesiGecerli(data) || data.firma_id !== firma_id || data.sayfa !== sayfa
      || data.siparisler.some(s => {
        if (paket === "abonelik") return !s.paket_turu.startsWith("abonelik_");
        return paket === null ? s.paket_turu === "kko" : s.paket_turu !== paket;
      })) return partnerYanit({ hata: "Satın alma kayıtları alınamadı. Yeniden deneyin." }, 503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Satın alma kayıtları alınamadı. Yeniden deneyin." }, 503); }
}
