import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { KURUMSAL_BASVURU_TABLOSU, KURUMSAL_BELGE_BUCKET } from "@/lib/firma/kurumsalBasvuru";
import { belgeTuruGecerliMi, KURUMSAL_BELGE_KURALLARI } from "@/lib/firma/kurumsalUyelikDogrulama";
import { sunucuHatasi } from "@/lib/utils/hataIsle";

const HEADERS = { "Cache-Control": "private, no-store" };
const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status, headers: HEADERS });
const UUID_DESENI = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  istek: NextRequest,
  { params }: { params: Promise<{ onBasvuruId: string }> }
) {
  try {
    const yetki = await adminGirisKontrol();
    if (!yetki.gecerli) return yetki.yanit;

    const { onBasvuruId } = await params;
    const tur = istek.nextUrl.searchParams.get("tur");
    if (!UUID_DESENI.test(onBasvuruId) || !belgeTuruGecerliMi(tur)) {
      return hata("Geçersiz belge isteği.", 400);
    }

    const kural = KURUMSAL_BELGE_KURALLARI[tur];
    const db = createAdminClient();
    const { data, error } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(`${kural.yolKolonu},${kural.adKolonu}`)
      .eq("on_basvuru_id", onBasvuruId)
      .maybeSingle();

    if (error) throw error;
    const kayit = data as Record<string, string | null> | null;
    const yol = kayit?.[kural.yolKolonu];
    const dosyaAdi = kayit?.[kural.adKolonu] ?? `${tur}`;
    if (!yol) return hata("Belge bulunamadı.", 404);

    const { data: blob, error: indirmeHatasi } = await db.storage.from(KURUMSAL_BELGE_BUCKET).download(yol);
    if (indirmeHatasi || !blob) return hata("Belge indirilemedi.", 404);

    const icerikTipi = blob.type || "application/octet-stream";
    const indir = istek.nextUrl.searchParams.get("indir") === "1";
    const inlineIzinli = !indir && (tur === "logo" || icerikTipi === "application/pdf" || icerikTipi.startsWith("image/"));
    const guvenliAd = dosyaAdi.replace(/["\\\r\n]/g, "_");
    const yanitHeaders = new Headers({
      "Content-Type": icerikTipi,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${inlineIzinli ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(guvenliAd)}`,
    });
    if (icerikTipi.includes("svg")) {
      yanitHeaders.set("Content-Security-Policy", "sandbox");
    }

    return new Response(await blob.arrayBuffer(), { status: 200, headers: yanitHeaders });
  } catch (error) {
    return sunucuHatasi(error, "GET /admin/api/kurumsal-basvurular/[onBasvuruId]/belge");
  }
}
