import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { ECLUB_UYE_SUTUNLARI } from "@/lib/admin/eclubUyeleri";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

export async function GET(request: Request, { params }: { params: Promise<{ firma_id: string }> }) {
  try {
    const { firma_id } = await params;
    const kontrol = await firmaYonetimOkumaKontrol(firma_id);
    if (!kontrol.gecerli) return kontrol.yanit;

    const sorgu = new URL(request.url).searchParams;
    const filtreler: Record<string, string> = {};
    const kimlikAlanlari = ["takim_id", "bolge_id", "temsilci_id", "eczane_id", "kisi_id"];
    for (const { anahtar } of ECLUB_UYE_SUTUNLARI) {
      const deger = sorgu.get(anahtar) ?? "";
      if (!deger) continue;
      if (deger.length > 254 || (kimlikAlanlari.includes(anahtar) && deger !== "__bos__" && !uuidGecerliMi(deger))
        || (anahtar === "durum" && !["aktif", "pasif"].includes(deger))) {
        return validasyonHatasi("Geçersiz sütun filtresi.", [anahtar]);
      }
      filtreler[anahtar] = deger;
    }
    const sayfa = Number(sorgu.get("sayfa") ?? "1");
    if (!uuidGecerliMi(firma_id)
      || !Number.isSafeInteger(sayfa) || sayfa < 1 || sayfa > 1000000) {
      return validasyonHatasi("Geçersiz firma veya sayfa.", ["firma_id", "sayfa"]);
    }
    const { data, error } = await createAdminClient().rpc("admin_eclub_uyeleri_oku", {
      p_firma_id: firma_id,
      p_filtreler: filtreler,
      p_arama: (sorgu.get("q") ?? "").trim().slice(0, 80), p_sayfa: sayfa, p_limit: 20,
    });
    if (error) {
      if (["PGRST202", "42883"].includes(error.code)) {
        return hataYaniti("Üye listesi kurulumu gerekli: scripts/sql/admin_eclub_sutun_filtreleri.sql dosyasını çalıştırın.", "Admin E-Club üye listesi", error, 503);
      }
      const durumKodu = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : error.code === "22023" ? 400 : 500;
      return hataYaniti(durumKodu < 500 ? error.message : "Üye listesi alınamadı.", "admin_eclub_uyeleri_oku", error, durumKodu);
    }
    if (!data) return hataYaniti("Üye listesi alınamadı.", "Admin E-Club üye listesi");
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return sunucuHatasi(err, "GET admin firma E-Club üyeleri");
  }
}
