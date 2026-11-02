import { createClient, createAdminClient } from "@/lib/supabase/server";
import { firmaAdminErisiminiDogrula } from "@/lib/admin/firmaAdminErisimi";
import { yetkiHatasi, rolHatasi, hataYaniti } from "@/lib/utils/hataIsle";

// Yalnız okuma uçlarında kullanılır. Mevcut admin yazma bekçisi değişmez.
export async function firmaYonetimOkumaKontrol(firmaId: string | null = null) {
  const { data: { user }, error } = await (await createClient()).auth.getUser();
  if (error || !user) return { gecerli: false as const, yanit: yetkiHatasi() };
  const db = createAdminClient();
  const { data: kimlik, error: kimlikHatasi } = await db.from("kullanicilar").select("rol,firma_id,aktif_mi").eq("kullanici_id", user.id).maybeSingle();
  if (kimlikHatasi) return { gecerli: false as const, yanit: hataYaniti("Yönetim yetkisi doğrulanamadı.", "Firma yönetimi okuma", kimlikHatasi, 503) };
  if (kimlik?.rol?.toLowerCase() === "admin" && kimlik.aktif_mi === true) return { gecerli: true as const, kullaniciId: user.id, firmaId: null, firmaAdmin: false };
  if (!kimlik || (firmaId !== null && firmaId !== kimlik.firma_id)) return { gecerli: false as const, yanit: rolHatasi() };
  const erisim = await firmaAdminErisiminiDogrula(db, kimlik);
  if (!erisim.ok) return { gecerli: false as const, yanit: hataYaniti(erisim.hata, "Firma yönetimi okuma", null, erisim.status) };
  return { gecerli: true as const, kullaniciId: user.id, firmaId: erisim.firma.firma_id, firmaAdmin: true };
}
