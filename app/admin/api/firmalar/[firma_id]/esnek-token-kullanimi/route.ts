import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { esnekKullanimRaporuGecerli } from "@/lib/satinAlma/kullanimRaporu";
export async function GET(request: Request, { params }: { params: Promise<{ firma_id: string }> }) {
  try {
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id)) return partnerYanit({ hata: "Geçersiz firma." }, 400);
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;
    const q = new URL(request.url).searchParams, hesap = q.get("hesap") || null, sayfaMetni = q.get("sayfa") ?? "0";
    if ((hesap !== null && !uuidGecerliMi(hesap)) || !/^\d{1,7}$/.test(sayfaMetni) || Number(sayfaMetni) > 1000000 || q.getAll("hesap").length > 1 || q.getAll("sayfa").length > 1) return partnerYanit({ hata: "Geçersiz hesap veya sayfa." }, 400);
    const sayfa = Number(sayfaMetni);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_firma_esnek_token_kullanimi", { p_auth_id: auth.kullaniciId, p_firma: firma_id, p_hesap: hesap, p_sayfa: sayfa });
    if (error?.code === "42501") return partnerYanit({ hata: "Bu firmanın token hesaplarına erişiminiz bulunmuyor." }, 403);
    if (error && ["PGRST202", "42883"].includes(error.code)) return partnerYanit({ hata: "Esnek token kullanım raporunun SQL kurulumu bekleniyor." }, 503);
    if (error || !esnekKullanimRaporuGecerli(data) || data.firma_id !== firma_id || data.hesap_id !== hesap || data.sayfa !== sayfa) return partnerYanit({ hata: "Token kullanım raporu alınamadı. Yeniden deneyin." }, 503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Token kullanım raporu alınamadı. Yeniden deneyin." }, 503); }
}
