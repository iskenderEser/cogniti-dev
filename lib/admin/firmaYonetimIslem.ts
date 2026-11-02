import { createAdminClient } from "@/lib/supabase/server";
import { firmaYonetimOkumaKontrol } from "./firmaYonetimOkuma";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { hataYaniti, rolHatasi } from "@/lib/utils/hataIsle";

export async function firmaYonetimIslemKontrol(firmaId: string | null | undefined) {
  if (!uuidGecerliMi(firmaId)) return { gecerli: false as const, yanit: rolHatasi("Geçerli firma kapsamı gerekir.") };
  const yetki = await firmaYonetimOkumaKontrol(firmaId);
  if (!yetki.gecerli) return yetki;
  if (yetki.firmaAdmin) return yetki;
  const { data, error } = await createAdminClient().from("firmalar").select("firma_admin_aktif").eq("firma_id", firmaId).maybeSingle();
  if (error || !data) return { gecerli: false as const, yanit: hataYaniti("Firma yönetimi durumu doğrulanamadı.", "Firma yönetimi işlem", error, 503) };
  if (data.firma_admin_aktif) return { gecerli: false as const, yanit: rolHatasi("Firma admini açık; Cogniti bu firma alanında yalnız görüntüleme yapabilir.") };
  return yetki;
}
