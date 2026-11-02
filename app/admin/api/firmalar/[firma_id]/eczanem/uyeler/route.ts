import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { createAdminClient } from "@/lib/supabase/server";
import { adminEczanemUyeIsleyicileri } from "@/lib/admin/eczanemUyeleri";

type Baglam = { params: Promise<{ firma_id: string }> };

export async function GET(request: Request, baglam: Baglam) {
  const { firma_id } = await baglam.params;
  const okuma = adminEczanemUyeIsleyicileri({ kontrol: () => firmaYonetimOkumaKontrol(firma_id), admin: createAdminClient });
  return await okuma.GET(request, baglam);
}
export async function PATCH(request: Request, baglam: Baglam) {
  const { firma_id } = await baglam.params;
  const yazma = adminEczanemUyeIsleyicileri({ kontrol: () => firmaYonetimIslemKontrol(firma_id), admin: createAdminClient });
  return await yazma.PATCH(request, baglam);
}
