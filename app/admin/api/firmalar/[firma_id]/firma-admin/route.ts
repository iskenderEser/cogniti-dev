import { NextRequest, NextResponse } from "next/server";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { platformBannerFirmasi } from "@/lib/eclub/banner";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

type Context = { params: Promise<{ firma_id: string }> };
function dbHatasi(error: { code: string; message: string }) {
  if (["42703", "42883", "PGRST202", "PGRST204"].includes(error.code)) return NextResponse.json({ hata: "Firma admini SQL kurulumu bekleniyor." }, { status: 503 });
  const status = error.code === "40001" ? 409 : error.code === "42501" ? 403 : error.code === "P0002" ? 404 : error.code === "22023" ? 422 : 500;
  return hataYaniti(status < 500 ? error.message : "Firma admini ayarı alınamadı veya kaydedilemedi.", "Firma admini", error, status);
}
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
    const { firma_id } = await params;
    if (!uuidGecerliMi(firma_id) || platformBannerFirmasi(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const db = createAdminClient();
    const [firma, adminler] = await Promise.all([
      db.from("firmalar").select("firma_admin_aktif").eq("firma_id", firma_id).maybeSingle(),
      db.from("kullanicilar").select("kullanici_id", { count: "exact", head: true }).eq("firma_id", firma_id).eq("rol", FIRMA_ADMIN_ROLU).eq("aktif_mi", true),
    ]);
    if (firma.error) return dbHatasi(firma.error);
    if (adminler.error) return dbHatasi(adminler.error);
    if (!firma.data) return NextResponse.json({ hata: "Firma bulunamadı." }, { status: 404 });
    return NextResponse.json({ aktif: firma.data.firma_admin_aktif, aktif_admin_sayisi: adminler.count ?? 0 }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "Firma admini GET"); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const auth = await adminGirisKontrol(); if (!auth.gecerli) return auth.yanit;
    const { firma_id } = await params;
    let body;
    try { body = await request.json(); } catch { return validasyonHatasi("Geçerli firma admini ayarı gönderin.", ["aktif"]); }
    if (!uuidGecerliMi(firma_id) || platformBannerFirmasi(firma_id) || typeof body?.aktif !== "boolean" || typeof body?.beklenen_aktif !== "boolean") return validasyonHatasi("Geçerli firma ve aç/kapat değeri gönderin.", ["firma_id", "aktif"]);
    const { data, error } = await createAdminClient().rpc("cogniti_firma_admin_durum_degistir", {
      p_admin_id: auth.kullaniciId, p_firma_id: firma_id, p_aktif: body.aktif, p_beklenen_aktif: body.beklenen_aktif,
    });
    if (error) return dbHatasi(error);
    return NextResponse.json({ aktif: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "Firma admini PUT"); }
}
