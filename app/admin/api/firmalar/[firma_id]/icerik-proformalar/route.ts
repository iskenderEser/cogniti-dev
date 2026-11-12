import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { proformaOnayiGecerli } from "@/lib/satinAlma/esnekProforma";
import { icerikAlimListesiGecerli } from "@/lib/satinAlma/icerikProforma";

type Baglam = { params: Promise<{ firma_id: string }> };

export async function GET(request: Request, { params }: Baglam) {
  try {
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id)) return partnerYanit({ hata: "Geçersiz firma." }, 400);
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;
    const sorgu = new URL(request.url).searchParams;
    const ay = sorgu.get("ay") ?? "";
    const sayfa = sorgu.get("sayfa") ?? "0";
    const onayli = sorgu.get("onayli") ?? "0";
    if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(ay) || !/^\d{1,7}$/.test(sayfa)
      || Number(sayfa) > 1000000 || !["0", "1"].includes(onayli)) {
      return partnerYanit({ hata: "Geçersiz liste isteği." }, 400);
    }
    if (onayli === "1" && auth.firmaAdmin) return partnerYanit({ hata: "Bu alana erişiminiz yok." }, 403);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_icerik_proformalari_oku", {
      p_auth: auth.kullaniciId, p_firma: firma_id, p_ay: `${ay}-01`, p_sayfa: Number(sayfa), p_onayli: onayli === "1",
    });
    if (error?.code === "42501") return partnerYanit({ hata: "Bu alana erişiminiz yok." }, 403);
    if (error || !icerikAlimListesiGecerli(data) || data.firma_id !== firma_id || data.sayfa !== Number(sayfa)
      || (onayli === "1" && data.alimlar.some(a => !a.onay))) {
      return partnerYanit({ hata: "İçerik alımları alınamadı." }, 503);
    }
    return partnerYanit(data);
  } catch {
    return partnerYanit({ hata: "İçerik alımları alınamadı." }, 503);
  }
}

export async function POST(request: Request, { params }: Baglam) {
  try {
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id)) return partnerYanit({ hata: "Geçersiz firma." }, 400);
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;
    const body = await partnerJsonOku(request, 12000);
    if (!body.ok) return body.yanit;
    const { talepId, aciklama } = body.veri;
    if (!uuidGecerliMi(talepId) || typeof aciklama !== "string" || aciklama.length > 2000
      || aciklama.includes("\0") || (!auth.firmaAdmin && !aciklama.trim())) {
      return partnerYanit({ hata: "Talep ve onay açıklamasını kontrol edin." }, 400);
    }
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_icerik_proforma_onayla", {
      p_auth: auth.kullaniciId, p_firma: firma_id, p_talep: talepId, p_aciklama: aciklama.trim(),
    });
    if (error?.code === "42501") return partnerYanit({ hata: "Bu alana erişiminiz yok." }, 403);
    if (error?.code === "22023") return partnerYanit({ hata: "Alım kaydı proforma onayına uygun değil." }, 400);
    if (error || !proformaOnayiGecerli(data)) return partnerYanit({ hata: "Onay sonucu doğrulanamadı. Tekrar deneyin." }, 503);
    return partnerYanit(data);
  } catch {
    return partnerYanit({ hata: "Onay sonucu alınamadı. Tekrar deneyin." }, 503);
  }
}
