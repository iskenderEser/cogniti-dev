import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerYanit } from "@/lib/agora/partnerHttp";

const PARTNER_CV_BUCKET = "agora-partner-cvleri";

export async function GET(_: Request, { params }: { params: Promise<{ partnerId: string }> }) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const { partnerId } = await params;
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(partnerId)) {
      return partnerYanit({ hata: "Geçersiz partner." }, 400);
    }
    const db = createAdminClient(AbortSignal.timeout(10000));
    const { data, error } = await db.rpc("agora_partner_cv_yolu", {
      p_admin_id: auth.kullaniciId,
      p_partner_id: partnerId,
    });
    if (error || !data || typeof data !== "object" || typeof data.yol !== "string") {
      return partnerYanit({ hata: "Özgeçmiş bulunamadı." }, 404);
    }
    const { data: dosya, error: indirmeHatasi } = await db.storage.from(PARTNER_CV_BUCKET).download(data.yol);
    if (indirmeHatasi || !dosya) {
      return partnerYanit({ hata: "Özgeçmiş okunamadı." }, 503);
    }
    const bytes = new Uint8Array(await dosya.arrayBuffer());
    const hamAd = typeof data.adi === "string" ? data.adi : "ozgecmis.pdf";
    const alt = hamAd.toLowerCase();
    const mime = alt.endsWith(".pdf")
      ? "application/pdf"
      : alt.endsWith(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";
    const temizAd = hamAd.replace(/["\\\r\n]/g, "_");
    return new Response(bytes, {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${temizAd}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return partnerYanit({ hata: "Özgeçmiş okunamadı." }, 503);
  }
}
