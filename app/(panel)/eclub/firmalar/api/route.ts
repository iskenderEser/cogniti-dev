import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { eclubKisiErisimi } from "@/lib/eclub/kisiErisim";
import { eclubFirmaKapsami, eclubFirmaRotasiKapsami } from "@/lib/eclub/firmaGezinme";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { hataYaniti, rolHatasi, sunucuHatasi, validasyonHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const admin = createAdminClient();
    const erisim = await eclubKisiErisimi(admin, user.id);
    if (!erisim.kisi || !ECLUB_TUKETICI_ROLLERI.includes(erisim.kisi.rol)) return rolHatasi("Bu alan yalnız E-Club üyelerine açıktır.");
    const firmaId = new URL(request.url).searchParams.get("firma_id");
    if (firmaId !== null && !uuidGecerliMi(firmaId)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const firmaRotasi = new URL(request.url).searchParams.get("firma");
    const kapsam = firmaRotasi !== null ? eclubFirmaRotasiKapsami(erisim.firmalar, firmaRotasi) : eclubFirmaKapsami(erisim.firmalar, firmaId);
    if ((firmaId || firmaRotasi !== null) && kapsam.length === 0) return rolHatasi("Bu firmaya erişiminiz bulunmuyor.");
    const firmalar = kapsam.map((firma) => ({
      firma_id: firma.firma_id, firma_adi: firma.firma_adi,
      logo_url: firma.logo_url ?? null, eclub_store_aktif: firma.eclub_store_aktif === true,
      eczanem_aktif: firma.eclub_aktif === true && firma.eczanem_aktif === true,
    })).sort((a, b) => a.firma_adi.localeCompare(b.firma_adi, "tr"));
    if (!firmaId && firmaRotasi === null) return NextResponse.json({ firmalar });
    const { data: urunler, error: urunHatasi } = await admin.from("urunler")
      .select("urun_id, urun_adi").eq("firma_id", kapsam[0].firma_id).order("urun_adi");
    if (urunHatasi) return hataYaniti("Firma ürünleri yüklenemedi.", "urunler SELECT — E-Club firma", urunHatasi);
    return NextResponse.json({ firma: firmalar[0], urunler: (urunler ?? []).sort((a, b) => a.urun_adi.localeCompare(b.urun_adi, "tr")) });
  } catch (error) {
    return sunucuHatasi(error, "GET /eclub/firmalar/api");
  }
}
