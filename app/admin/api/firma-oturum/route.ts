import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { firmaAdminErisiminiDogrula } from "@/lib/admin/firmaAdminErisimi";
import { sunucuHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";

export async function GET() {
  try {
    const { data: { user }, error } = await (await createClient()).auth.getUser();
    if (error || !user) return yetkiHatasi();
    const db = createAdminClient();
    const { data: kimlik, error: kimlikHatasi } = await db.from("kullanicilar").select("rol,firma_id,aktif_mi").eq("kullanici_id", user.id).maybeSingle();
    if (kimlikHatasi) return NextResponse.json({ hata: "Firma yönetimi erişimi doğrulanamadı." }, { status: 503 });
    if (!kimlik) return NextResponse.json({ hata: "Firma yönetimi yetkiniz bulunmuyor." }, { status: 403 });
    const sonuc = await firmaAdminErisiminiDogrula(db, kimlik);
    if (!sonuc.ok) return NextResponse.json({ hata: sonuc.hata }, { status: sonuc.status });
    return NextResponse.json({ firma: sonuc.firma }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return sunucuHatasi(error, "Firma admini oturum kontrolü"); }
}
