import type { SupabaseClient } from "@supabase/supabase-js";
import { etkinPuanAraliklari, puanAraliklariGecerliMi, type PuanAraliklari } from "./puanAraliklari";

export async function firmaPuanAraliklariOku(db: SupabaseClient, firmaId: string): Promise<PuanAraliklari | null> {
  const { data, error } = await db.from("firmalar").select("yayin_puan_araliklari").eq("firma_id", firmaId).maybeSingle();
  if (error) throw new Error("Firma puan aralıkları okunamadı. Puan Yönetimi SQL kurulumunu kontrol edin.");
  if (!data) throw new Error("Firma bulunamadı.");
  const ayar: unknown = data.yayin_puan_araliklari;
  if (ayar == null) return null;
  if (!puanAraliklariGecerliMi(ayar)) throw new Error("Firmanın puan aralıkları geçersiz.");
  return ayar;
}

export async function talepPuanAraliklariOku(db: SupabaseClient, talepId: string, ureticiId: string) {
  const { data, error } = await db.from("talepler").select("firma_id,uretici_id,hedef_roller").eq("talep_id", talepId).maybeSingle();
  if (error || !data?.firma_id || data.uretici_id !== ureticiId) throw new Error("Talebin firma ve üretici bilgileri doğrulanamadı.");
  const ayar = await firmaPuanAraliklariOku(db, data.firma_id);
  return etkinPuanAraliklari(ayar, data.hedef_roller?.includes("eczanem") === true);
}
