import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { PARTNER_LOGO_BUCKET, partnerLogoTuru } from "@/lib/agora/partnerProfil";
import { partnerYanit } from "@/lib/agora/partnerHttp";

export async function GET(_request: Request, context: { params: Promise<{ partnerId: string }> }) {
  try {
    const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
    const { partnerId } = await context.params;
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(partnerId)) return partnerYanit({ hata: "Geçersiz partner." }, 400);
    const db = createAdminClient(AbortSignal.timeout(15000));
    const { data, error } = await db.rpc("agora_partner_uyelik_profili_oku", { p_admin_id: auth.kullaniciId, p_partner_id: partnerId });
    if (error) return partnerYanit({ hata: "Logo okunamadı." }, 503);
    if (!data || typeof data.logo_yolu !== "string" || !data.logo_yolu.startsWith(`${partnerId}/`)) return partnerYanit({ hata: "Logo bulunamadı." }, 404);
    const { data: logo, error: logoHatasi } = await db.storage.from(PARTNER_LOGO_BUCKET).download(data.logo_yolu);
    if (logoHatasi || !logo) return partnerYanit({ hata: "Logo okunamadı." }, 503);
    const bytes = new Uint8Array(await logo.arrayBuffer()), tur = partnerLogoTuru(bytes);
    if (!tur) return partnerYanit({ hata: "Logo okunamadı." }, 503);
    return new Response(bytes, { headers: { "Content-Type": tur.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return partnerYanit({ hata: "Logo okunamadı." }, 503); }
}
