import { NextResponse } from "next/server";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { sunucuHatasi, validasyonHatasi, hataYaniti } from "@/lib/utils/hataIsle";
import { bannerDosyaUzantisi, bannerKurulumuEksik, bannerSirasiGecerli, bannerAlaniAdedi, ECLUB_BANNER_BUCKET, ECLUB_BANNER_TABLO, ECZANEM_BANNER_TABLO, bannerAlaniGecerli, type BannerAlani } from "@/lib/eclub/banner";
import { firmaBannerlariniOku } from "@/lib/eclub/bannerSunucu";

const kurulumYaniti = (alan: BannerAlani = "firma") => NextResponse.json({ hata: `Banner yüklemeyi etkinleştirmek için ${alan === "firma" ? "eclub_firma_bannerlari.sql" : alan === "uye-ana-sayfa" ? "eczanem_uye_bannerlari.sql" : "eczanem_sayfa_bannerlari.sql"} kurulumunu çalıştırın.`, kurulumGerekli: true }, { status: 503 });

export async function GET(request: Request) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;
    const sorgu = new URL(request.url).searchParams;
    const alan = sorgu.get("alan") ?? "firma";
    if (!bannerAlaniGecerli(alan)) return validasyonHatasi("Geçersiz banner alanı.", ["alan"]);
    const firmaId = sorgu.get("firma_id");
    if (!firmaId || !uuidGecerliMi(firmaId)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const { bannerlar, error } = await firmaBannerlariniOku(createAdminClient(), firmaId, alan);
    if (bannerKurulumuEksik(error)) return kurulumYaniti(alan);
    if (error) return hataYaniti("Bannerlar yüklenemedi.", "Banner SELECT", error);
    return NextResponse.json({ bannerlar }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "GET admin E-Club bannerlar"); }
}

export async function POST(request: Request) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;
    const form = await request.formData();
    const firmaId = String(form.get("firma_id") ?? "");
    const alan = String(form.get("alan") ?? "firma");
    if (!bannerAlaniGecerli(alan)) return validasyonHatasi("Geçersiz banner alanı.", ["alan"]);
    const tablo = alan === "firma" ? ECLUB_BANNER_TABLO : ECZANEM_BANNER_TABLO;
    const sira = Number(form.get("sira"));
    const dosya = form.get("dosya");
    if (!uuidGecerliMi(firmaId) || !Number.isInteger(sira) || sira < 1 || sira > 5) return validasyonHatasi("Firma veya banner sırası geçersiz.", ["firma_id", "sira"]);
    if (!(dosya instanceof File)) return validasyonHatasi("Görsel seçin.", ["dosya"]);
    const uzanti = await bannerDosyaUzantisi(dosya);
    if (!uzanti) return validasyonHatasi("En fazla 5 MB boyutunda PNG, JPEG veya WebP görsel yükleyebilirsiniz.", ["dosya"]);
    const admin = createAdminClient();
    const { data: firma, error: firmaHatasi } = await admin.from("firmalar").select("firma_id, firma_adi").eq("firma_id", firmaId).maybeSingle();
    if (firmaHatasi) return hataYaniti("Firma okunamadı.", "Banner firma SELECT", firmaHatasi);
    if (!firma) return validasyonHatasi("Firma bulunamadı.", ["firma_id"]);
    if (!bannerSirasiGecerli(sira, firma.firma_id, alan)) return validasyonHatasi(`Bu alan için en fazla ${bannerAlaniAdedi(firma.firma_id, alan)} banner yayınlanabilir.`, ["sira"]);
    let eskiSorgusu = admin.from(tablo).select("dosya_yolu").eq("firma_id", firmaId).eq("sira", sira);
    if (alan !== "firma") eskiSorgusu = eskiSorgusu.eq("alan", alan);
    const { data: eski, error: okumaHatasi } = await eskiSorgusu.maybeSingle();
    if (bannerKurulumuEksik(okumaHatasi)) return kurulumYaniti(alan);
    if (okumaHatasi) return hataYaniti("Banner okunamadı.", "Banner SELECT", okumaHatasi);
    const depo = admin.storage.from(ECLUB_BANNER_BUCKET);
    const yol = `eclub-bannerlar/${firmaId}/${alan === "firma" ? "" : `${alan}/`}${sira}-${crypto.randomUUID()}.${uzanti}`;
    const { error: yuklemeHatasi } = await depo.upload(yol, dosya, { contentType: dosya.type, upsert: false });
    if (yuklemeHatasi) return hataYaniti("Görsel yüklenemedi.", "Banner Storage upload", yuklemeHatasi);
    const { error: kayitHatasi } = await admin.from(tablo).upsert({ firma_id: firmaId, ...(alan === "firma" ? {} : { alan }), sira, dosya_yolu: yol, updated_at: new Date().toISOString() }, { onConflict: alan === "firma" ? "firma_id,sira" : "firma_id,alan,sira" });
    if (kayitHatasi) {
      await depo.remove([yol]);
      if (kayitHatasi.code === "23514" && (alan === "uye-ana-sayfa" || sira > 3)) return kurulumYaniti(alan);
      return hataYaniti("Banner kaydedilemedi.", "Banner UPSERT", kayitHatasi);
    }
    if (eski?.dosya_yolu) await depo.remove([eski.dosya_yolu]);
    return NextResponse.json({ banner: { sira, url: depo.getPublicUrl(yol).data.publicUrl } });
  } catch (error) { return sunucuHatasi(error, "POST admin E-Club bannerlar"); }
}

export async function DELETE(request: Request) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;
    const sorgu = new URL(request.url).searchParams;
    const alan = sorgu.get("alan") ?? "firma";
    if (!bannerAlaniGecerli(alan)) return validasyonHatasi("Geçersiz banner alanı.", ["alan"]);
    const tablo = alan === "firma" ? ECLUB_BANNER_TABLO : ECZANEM_BANNER_TABLO;
    const firmaId = sorgu.get("firma_id") ?? "";
    const sira = Number(sorgu.get("sira"));
    if (!uuidGecerliMi(firmaId) || !Number.isInteger(sira) || sira < 1 || sira > 5) return validasyonHatasi("Firma veya banner sırası geçersiz.", ["firma_id", "sira"]);
    const admin = createAdminClient();
    let silmeSorgusu = admin.from(tablo).delete().eq("firma_id", firmaId).eq("sira", sira);
    if (alan !== "firma") silmeSorgusu = silmeSorgusu.eq("alan", alan);
    const { data, error } = await silmeSorgusu.select("dosya_yolu");
    if (bannerKurulumuEksik(error)) return kurulumYaniti(alan);
    if (error) return hataYaniti("Banner kaldırılamadı.", "Banner DELETE", error);
    if (data?.length) await admin.storage.from(ECLUB_BANNER_BUCKET).remove(data.map((satir) => satir.dosya_yolu));
    return NextResponse.json({ ok: true });
  } catch (error) { return sunucuHatasi(error, "DELETE admin E-Club bannerlar"); }
}
