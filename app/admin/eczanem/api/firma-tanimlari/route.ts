import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { platformBannerFirmasi, PLATFORM_FIRMA_ID } from "@/lib/eclub/banner";
import { firmaCekDegerleriGecerli, type FirmaCekTanimi } from "@/lib/eclub/store/firmaCekTanimi";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

function dbHatasi(error: { code: string; message: string }) {
  if (["42P01", "42883", "PGRST202", "PGRST205"].includes(error.code)) return NextResponse.json({ hata: "Firma tanımları için eczanem_firma_cek_tanimlari.sql kurulumu bekleniyor." }, { status: 503 });
  if (error.code === "40001") return NextResponse.json({ hata: error.message }, { status: 409 });
  if (error.code === "P0002") return NextResponse.json({ hata: "Firma bulunamadı." }, { status: 404 });
  if (error.code === "42501") return NextResponse.json({ hata: "Bu işlem için admin yetkisi gerekiyor." }, { status: 403 });
  if (error.code === "22023") return validasyonHatasi(error.message, ["karsilik_puan", "karsilik_tl"]);
  return hataYaniti("Firma çek tanımları alınamadı veya kaydedilemedi.", "Eczanem firma tanımları", error);
}
export async function GET(request: NextRequest) {
  try {
    const istenenFirma = request.nextUrl.searchParams.get("firma");
    const auth = await firmaYonetimOkumaKontrol(istenenFirma); if (!auth.gecerli) return auth.yanit;
    const db = createAdminClient();
    const firmaId = auth.firmaId ?? istenenFirma;

    if (!uuidGecerliMi(firmaId) || platformBannerFirmasi(firmaId)) return validasyonHatasi("Geçersiz firma.", ["firma"]);
    let firmaSorgu = db.from("firmalar").select("firma_id,firma_adi,aktif,eczanem_aktif").neq("firma_id", PLATFORM_FIRMA_ID).order("firma_adi");
    let tanimSorgu = db.from("eczanem_firma_cek_tanimlari").select("firma_id,karsilik_puan,karsilik_tl,surum,guncellenme_at");
    if (firmaId) { firmaSorgu = firmaSorgu.eq("firma_id", firmaId); tanimSorgu = tanimSorgu.eq("firma_id", firmaId); }
    const [firmalar, tanimlar] = await Promise.all([firmaSorgu, tanimSorgu]);
    const error = firmalar.error ?? tanimlar.error; if (error) return dbHatasi(error);
    const map = new Map((tanimlar.data ?? []).map((t: FirmaCekTanimi) => [t.firma_id, t]));
    return NextResponse.json({ firmalar: (firmalar.data ?? []).map(f => ({ ...f, tanim: map.get(f.firma_id) ?? null })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "Eczanem firma tanımları GET"); }
}
export async function PUT(request: NextRequest) {
  try {
    let b;
    try { b = await request.json(); } catch { return validasyonHatasi("Geçerli firma tanımı gönderin.", ["firma_id"]); }
    const auth = await firmaYonetimIslemKontrol(b?.firma_id); if (!auth.gecerli) return auth.yanit;
    if (!b || !uuidGecerliMi(b.firma_id) || platformBannerFirmasi(b.firma_id) || !firmaCekDegerleriGecerli(b.karsilik_puan, b.karsilik_tl)
      || !Number.isInteger(b.surum) || b.surum < 0 || b.surum >= 2147483647) return validasyonHatasi("Firma, pozitif tam sayı puan ve en fazla iki ondalıklı TL girin.", ["firma_id", "karsilik_puan", "karsilik_tl"]);
    const result = await createAdminClient().rpc("admin_eczanem_firma_cek_tanimi_kaydet", {
      p_admin_id: auth.kullaniciId, p_firma_id: b.firma_id, p_puan: b.karsilik_puan, p_tl: b.karsilik_tl, p_surum: b.surum,
    });
    if (result.error) return dbHatasi(result.error);
    return NextResponse.json({ tanim: result.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "Eczanem firma tanımları PUT"); }
}
