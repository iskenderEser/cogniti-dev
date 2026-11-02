import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sunucuHatasi, hataYaniti, validasyonHatasi } from "@/lib/utils/hataIsle";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { puanAraliklariGecerliMi } from "@/lib/uretici/puanAraliklari";
import { firmaPuanAraliklariOku } from "@/lib/uretici/puanAraliklariSunucu";
type Context = { params: Promise<{ firma_id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { firma_id } = await params;
    const auth = await firmaYonetimOkumaKontrol(firma_id); if (!auth.gecerli) return auth.yanit;

    if (!uuidGecerliMi(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const ayar = await firmaPuanAraliklariOku(createAdminClient(), firma_id);
    return NextResponse.json({ firma_id, ayar }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "Firma Puan Yönetimi GET"); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { firma_id } = await params;
    const auth = await firmaYonetimIslemKontrol(firma_id); if (!auth.gecerli) return auth.yanit;

    if (!uuidGecerliMi(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    let body: unknown;
    try { body = await request.json(); } catch { return validasyonHatasi("Geçerli puan aralıkları gönderin.", ["ayar"]); }
    const ayar = body && typeof body === "object" && "ayar" in body ? body.ayar : null;
    if (!puanAraliklariGecerliMi(ayar)) return validasyonHatasi("Üç puan türünü de tamamlayın: pozitif tam sayılar, en yüksek ≥ en düşük, artış > 0 ve her türde en fazla 1000 seçenek.", ["ayar"]);
    const { data, error } = await createAdminClient().from("firmalar").update({ yayin_puan_araliklari: ayar }).eq("firma_id", firma_id).select("firma_id").maybeSingle();
    if (error) return hataYaniti("Puan aralıkları kaydedilemedi.", "firmalar UPDATE — puan aralıkları", error);
    if (!data) return NextResponse.json({ hata: "Firma bulunamadı." }, { status: 404 });
    return NextResponse.json({ firma_id, ayar, mesaj: "Puan aralıkları kaydedildi." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "Firma Puan Yönetimi PUT"); }
}
