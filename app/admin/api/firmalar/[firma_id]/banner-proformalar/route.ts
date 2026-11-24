import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { bannerProformaGecerli, proformaOnayiGecerli } from "@/lib/satinAlma/bannerProforma";
import { vivaAlimDonemiGecerli } from "@/lib/satinAlma/vivaAlimlari";
import { proformaOnayEpostasiGonder } from "@/lib/satinAlma/proformaEposta";

type Baglam = { params: Promise<{ firma_id: string }> };
function hataDurumu(kod: string) {
  return kod === "42501" ? 403 : kod === "22023" ? 400 : 503;
}
export async function GET(request: Request, { params }: Baglam) {
  try {
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id)) return partnerYanit({ hata: "Geçersiz firma." }, 400);
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;
    const q = new URL(request.url).searchParams;
    const ay=q.get("ay"),onayli=q.get("onayli")??"0";
    if(!vivaAlimDonemiGecerli(ay)||!["0","1"].includes(onayli)||["ay","onayli"].some(k=>q.getAll(k).length>1))return partnerYanit({hata:"Geçersiz ay."},400);
    const {data,error}=await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_banner_proforma_oku",{p_auth_id:auth.kullaniciId,p_firma:firma_id,p_ay:`${ay}-01`,p_sadece_onayli:onayli==="1"});
    if (error) return partnerYanit({ hata: "Proforma bilgileri alınamadı. Kurulumu ve erişiminizi kontrol edin." }, hataDurumu(error.code));
    if(!bannerProformaGecerli(data)||data.firma_id!==firma_id||data.ay!==ay||(onayli==="1"&&data.belge!==null&&data.onay===null))return partnerYanit({hata:"Banner proforma bilgileri doğrulanamadı."},503);
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Proforma bilgileri alınamadı." }, 503); }
}
export async function POST(request: Request, { params }: Baglam) {
  try {
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id)) return partnerYanit({ hata: "Geçersiz firma." }, 400);
    // Adminin açıklamalı proforma onayı, firma salt okunur kuralına kullanıcının onayladığı dar istisnadır.
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;
    const body = await partnerJsonOku(request, 12000);
    if (!body.ok) return body.yanit;
    const { ay, aciklama } = body.veri;
    if (!vivaAlimDonemiGecerli(ay) || typeof aciklama !== "string" || aciklama.length > 2000 || aciklama.includes("\0")) {
      return partnerYanit({ hata: "Geçersiz onay bilgisi." }, 400);
    }
    const db = createAdminClient(AbortSignal.timeout(10000));
    const { data, error } = await db.rpc("cogniti_banner_proforma_onayla", {
      p_auth_id: auth.kullaniciId, p_firma: firma_id, p_ay: `${ay}-01`, p_aciklama: aciklama.trim(),
    });
    if (error) return partnerYanit({ hata: error.code === "22023" ? "Banner alım ayının kapandığını, birim fiyatı ve admin açıklamasını kontrol edin." : "Proforma onayı kaydedilemedi." }, hataDurumu(error.code));
    if (!proformaOnayiGecerli(data)) return partnerYanit({ hata: "Onay sonucu doğrulanamadı. Tekrar deneyin." }, 503);
    await proformaOnayEpostasiGonder(db, {
      tur: "banner",
      firmaId: firma_id,
      kayitAnahtari: `${ay}-01`,
      onaylayanId: auth.kullaniciId,
      onay: data,
    });
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Onay sonucu alınamadı. Tekrar deneyin." }, 503); }
}
