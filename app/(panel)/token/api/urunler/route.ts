import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TUKETICI_ROLLER } from "@/lib/utils/roller";
import { yetkiHatasi, sunucuHatasi } from "@/lib/utils/hataIsle";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const admin = createAdminClient();
    const { data: kullanici, error: kullaniciHatasi } = await admin.from("kullanicilar")
      .select("firma_id, takim_id, rol, aktif_mi")
      .eq("kullanici_id", user.id).maybeSingle();
    if (kullaniciHatasi) throw kullaniciHatasi;
    if (!kullanici?.aktif_mi || !kullanici.firma_id || !TUKETICI_ROLLER.includes((kullanici.rol ?? "").toLowerCase())) {
      return yetkiHatasi("Takım ürünlerine erişiminiz bulunmuyor.");
    }

    const { data: firma, error: firmaHatasi } = await admin.from("firmalar")
      .select("firma_id").eq("firma_id", kullanici.firma_id).eq("aktif", true).maybeSingle();
    if (firmaHatasi) throw firmaHatasi;
    if (!firma) return yetkiHatasi("Firmanıza erişiminiz bulunmuyor.");
    if (!kullanici.takim_id) return NextResponse.json({ urunler: [] }, { headers });

    const { data: takim, error: takimHatasi } = await admin.from("takimlar")
      .select("takim_id").eq("takim_id", kullanici.takim_id).eq("firma_id", kullanici.firma_id).maybeSingle();
    if (takimHatasi) throw takimHatasi;
    if (!takim) return yetkiHatasi("Takımınıza erişiminiz bulunmuyor.");

    // Ürün kapsamı oturumdan gelir; takımsız veya başka takımdaki ürünler eklenmez.
    const { data: urunler, error: urunHatasi } = await admin.from("urunler")
      .select("urun_id, urun_adi").eq("firma_id", kullanici.firma_id).eq("takim_id", kullanici.takim_id)
      .order("urun_adi", { ascending: true });
    if (urunHatasi) throw urunHatasi;
    return NextResponse.json({ urunler: (urunler ?? []).sort((a, b) => a.urun_adi.localeCompare(b.urun_adi, "tr-TR")) }, { headers });
  } catch (error) {
    return sunucuHatasi(error, "Token takım ürünleri");
  }
}
