import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

type Baglam = { params: Promise<{ firma_id: string }> };

export async function GET(request: Request, baglam: Baglam) {
  return proforma(request, baglam, false);
}

export async function POST(request: Request, baglam: Baglam) {
  return proforma(request, baglam, true);
}

async function proforma(request: Request, { params }: Baglam, onayla: boolean) {
  try {
    const { firma_id } = await params;
    const sorgu = new URL(request.url).searchParams;
    const donem = sorgu.get("donem") ?? "";
    const sadeceOnayli = sorgu.get("onayli") === "1";
    if (!uuidGecerliMi(firma_id) || !/^20\d{2}-(01|04|07|10)-01$/.test(donem)) {
      return partnerYanit({ hata: "Firma veya dönem geçersiz." }, 400);
    }
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;
    if ((sadeceOnayli && auth.firmaAdmin) || (onayla && !auth.firmaAdmin)) {
      return partnerYanit({ hata: "Bu işleme yetkiniz yok." }, 403);
    }
    let onayAnahtari: string | null = null;
    if (onayla) {
      const body = await partnerJsonOku(request, 1024);
      if (!body.ok) return body.yanit;
      const anahtar = body.veri.onayAnahtari;
      if (typeof anahtar !== "string" || !/^[a-f0-9]{32}$/.test(anahtar)) {
        return partnerYanit({ hata: "Proformayı yeniden açıp kontrol edin." }, 400);
      }
      onayAnahtari = anahtar;
    }
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_firmastore_proforma", {
      p_auth: auth.kullaniciId, p_firma: firma_id, p_donem: donem,
      p_onayli: sadeceOnayli, p_onay_anahtari: onayAnahtari,
    });
    if (error?.code === "42501") return partnerYanit({ hata: "Bu işleme yetkiniz yok." }, 403);
    if (error?.code === "22023") return partnerYanit({ hata: "Proforma değişti veya henüz onaya hazır değil. Listeyi yenileyin." }, 409);
    if (error || !data || (onayla && !data.onay)) {
      return partnerYanit({ hata: "FirmaStore proforma bilgisi alınamadı." }, 503);
    }
    return partnerYanit(data);
  } catch {
    return partnerYanit({ hata: "FirmaStore proforma bilgisi alınamadı." }, 503);
  }
}
