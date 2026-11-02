import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { yetkiHatasi, rolHatasi, sunucuHatasi } from "@/lib/utils/hataIsle";
import { firmaPuanAraliklariOku } from "@/lib/uretici/puanAraliklariSunucu";

export async function GET() {
  try {
    const session = await createClient();
    const { data: { user }, error } = await session.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const db = createAdminClient();
    const rol = await rolCozucu(db, user.id);
    if (!URETICI_ROLLER.includes(rol)) return rolHatasi("Yalnız üretici roller puan seçeneklerini okuyabilir.");
    const { data: kisi, error: kisiHatasi } = await db.from("kullanicilar").select("firma_id").eq("kullanici_id", user.id).maybeSingle();
    if (kisiHatasi || !kisi?.firma_id) throw new Error("Üreticinin firması doğrulanamadı.");
    const ayar = await firmaPuanAraliklariOku(db, kisi.firma_id);
    return NextResponse.json({ ayar }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "Üretici puan aralıkları GET"); }
}
