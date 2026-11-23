import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  adayOturumuDetay,
  ayniKaynaktan,
  KURUMSAL_BASVURU_TABLOSU,
  KURUMSAL_BELGE_BUCKET,
} from "@/lib/firma/kurumsalBasvuru";
import {
  belgeTuruGecerliMi,
  dosyaIcerikTuruCoz,
  KURUMSAL_BELGE_KURALLARI,
} from "@/lib/firma/kurumsalUyelikDogrulama";
import { sunucuHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";

const HEADERS = { "Cache-Control": "private, no-store" };
const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status, headers: HEADERS });

export async function GET(istek: NextRequest) {
  try {
    const aday = await adayOturumuDetay();
    if (!aday) return yetkiHatasi();

    const tur = istek.nextUrl.searchParams.get("tur");
    if (!belgeTuruGecerliMi(tur)) return hata("Geçersiz belge türü.", 400);

    const kural = KURUMSAL_BELGE_KURALLARI[tur];
    const db = createAdminClient();
    const { data, error } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(`${kural.yolKolonu},${kural.adKolonu}`)
      .eq("on_basvuru_id", aday.id)
      .maybeSingle();

    if (error) throw error;
    const kayit = data as Record<string, string | null> | null;
    const yol = kayit?.[kural.yolKolonu];
    const dosyaAdi = kayit?.[kural.adKolonu] ?? `${tur}`;
    if (!yol) return hata("Belge bulunamadı.", 404);

    const { data: blob, error: indirmeHatasi } = await db.storage.from(KURUMSAL_BELGE_BUCKET).download(yol);
    if (indirmeHatasi || !blob) return hata("Belge okunamadı.", 404);

    const icerikTipi = blob.type || "application/octet-stream";
    const indir = istek.nextUrl.searchParams.get("indir") === "1" || tur !== "logo";
    const guvenliAd = dosyaAdi.replace(/["\\\r\n]/g, "_");
    const yanitHeaders = new Headers({
      "Content-Type": icerikTipi,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${indir ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(guvenliAd)}`,
    });
    if (icerikTipi.includes("svg")) {
      yanitHeaders.set("Content-Security-Policy", "sandbox");
    }

    return new Response(await blob.arrayBuffer(), { status: 200, headers: yanitHeaders });
  } catch (error) {
    return sunucuHatasi(error, "GET /kurumsal-uyelik/api/basvuru/belge");
  }
}

export async function POST(istek: Request) {
  try {
    if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
    const aday = await adayOturumuDetay();
    if (!aday) return yetkiHatasi();

    const formData = await istek.formData().catch(() => null);
    if (!formData) return hata("Dosya okunamadı.", 400);

    const tur = formData.get("tur");
    const dosya = formData.get("dosya");
    if (!belgeTuruGecerliMi(tur)) return hata("Geçersiz belge türü.", 400);
    if (!(dosya instanceof File)) return hata("Dosya seçilmedi.", 400);

    const kural = KURUMSAL_BELGE_KURALLARI[tur];
    const kontrol = dosyaIcerikTuruCoz(tur, dosya);
    if (!kontrol.ok) return hata(kontrol.hata, 400);

    const db = createAdminClient();
    const { data: mevcut, error: okumaHatasi } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(`durum,${kural.yolKolonu}`)
      .eq("on_basvuru_id", aday.id)
      .maybeSingle();

    if (okumaHatasi) throw okumaHatasi;
    const mevcutSatir = mevcut as Record<string, string | null> | null;
    if (mevcutSatir && (mevcutSatir.durum === "incelemede" || mevcutSatir.durum === "onaylandi")) {
      return hata("Başvurunuz incelemede veya onaylandığı için belge değiştirilemez.", 409);
    }

    const eskiYol = mevcutSatir?.[kural.yolKolonu] ?? null;
    const yeniYol = `${aday.id}/${tur}-${Date.now()}-${randomUUID().slice(0, 8)}.${kontrol.uzanti}`;
    const buffer = Buffer.from(await dosya.arrayBuffer());

    const { error: yuklemeHatasi } = await db.storage
      .from(KURUMSAL_BELGE_BUCKET)
      .upload(yeniYol, buffer, { contentType: kontrol.mime, upsert: false });

    if (yuklemeHatasi) {
      return hata("Dosya yüklenemedi. Tekrar deneyin.", 502);
    }

    const simdi = new Date().toISOString();
    const temizAd = dosya.name.trim().slice(0, 200) || `${tur}.${kontrol.uzanti}`;
    const { error: kayitHatasi } = await db.from(KURUMSAL_BASVURU_TABLOSU).upsert(
      {
        on_basvuru_id: aday.id,
        durum: mevcutSatir?.durum ?? "taslak",
        [kural.yolKolonu]: yeniYol,
        [kural.adKolonu]: temizAd,
        guncellendi_at: simdi,
      },
      { onConflict: "on_basvuru_id" }
    );

    if (kayitHatasi) {
      await db.storage.from(KURUMSAL_BELGE_BUCKET).remove([yeniYol]);
      throw kayitHatasi;
    }

    if (eskiYol && eskiYol !== yeniYol) {
      void db.storage.from(KURUMSAL_BELGE_BUCKET).remove([eskiYol]);
    }

    return Response.json(
      {
        ok: true,
        dosya_adi: temizAd,
        url: tur === "logo" ? `/kurumsal-uyelik/api/basvuru/belge?tur=logo&v=${encodeURIComponent(simdi)}` : null,
      },
      { status: 201, headers: HEADERS }
    );
  } catch (error) {
    return sunucuHatasi(error, "POST /kurumsal-uyelik/api/basvuru/belge");
  }
}

export async function DELETE(istek: NextRequest) {
  try {
    if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
    const aday = await adayOturumuDetay();
    if (!aday) return yetkiHatasi();

    const tur = istek.nextUrl.searchParams.get("tur");
    if (!belgeTuruGecerliMi(tur)) return hata("Geçersiz belge türü.", 400);

    const kural = KURUMSAL_BELGE_KURALLARI[tur];
    const db = createAdminClient();
    const { data: mevcut, error: okumaHatasi } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .select(`durum,${kural.yolKolonu}`)
      .eq("on_basvuru_id", aday.id)
      .maybeSingle();

    if (okumaHatasi) throw okumaHatasi;
    const mevcutSatir = mevcut as Record<string, string | null> | null;
    if (!mevcutSatir) return Response.json({ ok: true }, { headers: HEADERS });
    if (mevcutSatir.durum === "incelemede" || mevcutSatir.durum === "onaylandi") {
      return hata("Başvurunuz incelemede veya onaylandığı için belge silinemez.", 409);
    }

    const eskiYol = mevcutSatir[kural.yolKolonu];
    const { error: guncellemeHatasi } = await db
      .from(KURUMSAL_BASVURU_TABLOSU)
      .update({
        [kural.yolKolonu]: null,
        [kural.adKolonu]: null,
        guncellendi_at: new Date().toISOString(),
      })
      .eq("on_basvuru_id", aday.id);

    if (guncellemeHatasi) throw guncellemeHatasi;
    if (eskiYol) {
      void db.storage.from(KURUMSAL_BELGE_BUCKET).remove([eskiYol]);
    }

    return Response.json({ ok: true }, { headers: HEADERS });
  } catch (error) {
    return sunucuHatasi(error, "DELETE /kurumsal-uyelik/api/basvuru/belge");
  }
}
