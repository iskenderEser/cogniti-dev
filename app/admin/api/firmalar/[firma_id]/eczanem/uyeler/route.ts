import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { adminEczanemUyeIsleyicileri } from "@/lib/admin/eczanemUyeleri";

const isleyiciler = adminEczanemUyeIsleyicileri({ kontrol: adminGirisKontrol, admin: createAdminClient });
type Baglam = { params: Promise<{ firma_id: string }> };

export async function GET(request: Request, baglam: Baglam) {
  return await isleyiciler.GET(request, baglam);
}
export async function PATCH(request: Request, baglam: Baglam) {
  return await isleyiciler.PATCH(request, baglam);
}
