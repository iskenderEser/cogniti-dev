import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { sunucuHatasi, validasyonHatasi, hataYaniti } from "@/lib/utils/hataIsle";
import { bannerKaynagi, bannerKaynakKurulumuEksik, bannerDosyaUzantisi, bannerKurulumuEksik, bannerGorunurlukKurulumuEksik, bannerSirasiGecerli, bannerAlaniAdedi, ECLUB_BANNER_BUCKET, ECLUB_BANNER_TABLO, ECZANEM_BANNER_TABLO, bannerAlaniGecerli, type BannerAlani } from "@/lib/eclub/banner";
import { adminBannerlariniOku } from "@/lib/eclub/bannerSunucu";

const kurulumYaniti = (alan: BannerAlani = "firma") => NextResponse.json({ hata: `Banner yüklemeyi etkinleştirmek için ${alan === "firma" ? "eclub_firma_bannerlari.sql" : alan === "uye-ana-sayfa" ? "eczanem_uye_bannerlari.sql" : "eczanem_sayfa_bannerlari.sql"} kurulumunu çalıştırın.`, kurulumGerekli: true }, { status: 503 });
const kaynakKurulumYaniti = () => NextResponse.json({ hata: "cogniti_banner_yonetimi.sql dosyasını çalıştırın.", kurulumGerekli: true }, { status: 503 });
const gorunurlukKurulumYaniti = () => NextResponse.json({ hata: "Gizle/Göster ve güvenli kaldırma için banner_gorunurluk.sql dosyasını çalıştırın.", kurulumGerekli: true }, { status: 503 });

export async function GET(request: Request) {
  try {
    const kontrol = await firmaYonetimOkumaKontrol(new URL(request.url).searchParams.get("firma_id"));
    if (!kontrol.gecerli) return kontrol.yanit;
    const sorgu = new URL(request.url).searchParams;
    const alan = sorgu.get("alan") ?? "firma";
    if (!bannerAlaniGecerli(alan)) return validasyonHatasi("Geçersiz banner alanı.", ["alan"]);
    const firmaId = sorgu.get("firma_id");
    if (!firmaId || !uuidGecerliMi(firmaId)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const kaynak = bannerKaynagi(firmaId,sorgu.get("kaynak") ?? undefined);
    if (!kaynak) return validasyonHatasi("Geçersiz banner kaynağı.", ["kaynak"]);
    const sonuc = await adminBannerlariniOku(createAdminClient(),firmaId,alan,kaynak);
    if (bannerKurulumuEksik(sonuc.error)) return kurulumYaniti(alan);
    if (sonuc.error) return hataYaniti("Bannerlar yüklenemedi.", "Banner SELECT", sonuc.error);
    return NextResponse.json({ bannerlar:sonuc.bannerlar, gorunurlukHazir:sonuc.gorunurlukHazir, kaynakHazir:sonuc.kaynakHazir, doluSiralar:sonuc.doluSiralar }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "GET admin E-Club bannerlar"); }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const firmaId = String(form.get("firma_id") ?? "");

    const alan = String(form.get("alan") ?? "firma");
    const kaynak = bannerKaynagi(firmaId,form.get("kaynak") ?? undefined);
    if (!kaynak) return validasyonHatasi("Geçersiz banner kaynağı.", ["kaynak"]);
    const kontrol = kaynak === "cogniti" ? await adminGirisKontrol() : await firmaYonetimIslemKontrol(firmaId);
    if (!kontrol.gecerli) return kontrol.yanit;
    if (kaynak === "firma") return validasyonHatasi("Firma bannerlarını haftalık takvim üzerinden yönetin.", ["banner"]);
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
    let eskiSorgusu = admin.from(tablo).select("dosya_yolu, gorunur, kaynak").eq("firma_id", firmaId).eq("sira", sira);
    if (alan !== "firma") eskiSorgusu = eskiSorgusu.eq("alan", alan);
    const {data:eski,error:okumaHatasi} = await eskiSorgusu.maybeSingle();
    if (bannerKaynakKurulumuEksik(okumaHatasi)) return kaynakKurulumYaniti();
    if (bannerGorunurlukKurulumuEksik(okumaHatasi)) return gorunurlukKurulumYaniti();
    if (bannerKurulumuEksik(okumaHatasi)) return kurulumYaniti(alan);
    if (okumaHatasi) return hataYaniti("Banner okunamadı.", "Banner SELECT", okumaHatasi);
    if (eski && eski.kaynak !== kaynak) return NextResponse.json({hata:"Bu alan diğer kaynağın bannerıyla dolu. Sayfayı yenileyin."},{status:409});
    const depo = admin.storage.from(ECLUB_BANNER_BUCKET);
    const yol = `eclub-bannerlar/${firmaId}/${alan === "firma" ? "" : `${alan}/`}${sira}-${crypto.randomUUID()}.${uzanti}`;
    const { error: yuklemeHatasi } = await depo.upload(yol, dosya, { contentType: dosya.type, upsert: false });
    if (yuklemeHatasi) return hataYaniti("Görsel yüklenemedi.", "Banner Storage upload", yuklemeHatasi);
    const { error: kayitHatasi } = await admin.rpc("admin_banner_kaydet", {p_firma_id:firmaId,p_alan:alan,p_sira:sira,p_dosya_yolu:yol,p_kaynak:kaynak,p_beklenen_yol:eski?.dosya_yolu ?? null});
    if (kayitHatasi) {
      await depo.remove([yol]);
      if (["PGRST202", "42883"].includes(kayitHatasi.code)) return kaynakKurulumYaniti();
      if (kayitHatasi.code === "40001") return NextResponse.json({hata:"Banner alanı işlem sırasında değişti. Sayfayı yenileyin."},{status:409});
      if (kayitHatasi.code === "23514" && (alan === "uye-ana-sayfa" || sira > 3)) return kurulumYaniti(alan);
      return hataYaniti("Banner kaydedilemedi.", "Banner UPSERT", kayitHatasi);
    }
    if (eski?.dosya_yolu) await depo.remove([eski.dosya_yolu]);
    return NextResponse.json({ banner: { sira, url: depo.getPublicUrl(yol).data.publicUrl, gorunur: eski?.gorunur !== false } });
  } catch (error) { return sunucuHatasi(error, "POST admin E-Club bannerlar"); }
}

export async function PATCH(request: Request) {
  try {
    const veri = await request.json().catch(() => null);
    const alan = veri?.alan ?? "firma";
    const firmaId = veri?.firma_id;

    const sira = veri?.sira;
    const gorunur = veri?.gorunur;
    if (typeof alan !== "string" || !bannerAlaniGecerli(alan)) return validasyonHatasi("Geçersiz banner alanı.", ["alan"]);
    if (typeof firmaId !== "string" || !uuidGecerliMi(firmaId) || !bannerSirasiGecerli(sira, firmaId, alan)) return validasyonHatasi("Firma veya banner sırası geçersiz.", ["firma_id", "sira"]);
    const kaynak = bannerKaynagi(firmaId,veri?.kaynak);
    if (!kaynak) return validasyonHatasi("Geçersiz banner kaynağı.", ["kaynak"]);
    const kontrol = kaynak === "cogniti" ? await adminGirisKontrol() : await firmaYonetimIslemKontrol(firmaId);
    if (!kontrol.gecerli) return kontrol.yanit;
    if (kaynak === "firma") return validasyonHatasi("Firma bannerlarını haftalık takvim üzerinden yönetin.", ["banner"]);
    if (typeof gorunur !== "boolean") return validasyonHatasi("Geçerli bir görünürlük seçin.", ["gorunur"]);
    const admin = createAdminClient();
    const tablo = alan === "firma" ? ECLUB_BANNER_TABLO : ECZANEM_BANNER_TABLO;
    let sorgu = admin.from(tablo).update({ gorunur, updated_at: new Date().toISOString() }).eq("firma_id", firmaId).eq("kaynak", kaynak).eq("sira", sira);
    if (alan !== "firma") sorgu = sorgu.eq("alan", alan);
    const { data: banner, error } = await sorgu.select("sira, gorunur").maybeSingle();
    if (bannerKaynakKurulumuEksik(error)) return kaynakKurulumYaniti();
    if (bannerGorunurlukKurulumuEksik(error)) return gorunurlukKurulumYaniti();
    if (bannerKurulumuEksik(error)) return kurulumYaniti(alan);
    if (error) return hataYaniti("Banner görünürlüğü değiştirilemedi.", "Banner görünürlük UPDATE", error);
    if (!banner) return validasyonHatasi("Banner bulunamadı.", ["sira"]);
    return NextResponse.json({ banner });
  } catch (error) { return sunucuHatasi(error, "PATCH admin E-Club bannerlar"); }
}

export async function DELETE(request: Request) {
  try {
    const sorgu = new URL(request.url).searchParams;
    const alan = sorgu.get("alan") ?? "firma";
    if (!bannerAlaniGecerli(alan)) return validasyonHatasi("Geçersiz banner alanı.", ["alan"]);
    const tablo = alan === "firma" ? ECLUB_BANNER_TABLO : ECZANEM_BANNER_TABLO;
    const firmaId = sorgu.get("firma_id") ?? "";

    const sira = Number(sorgu.get("sira"));
    const kaynak = bannerKaynagi(firmaId,sorgu.get("kaynak") ?? undefined);
    if (!kaynak) return validasyonHatasi("Geçersiz banner kaynağı.", ["kaynak"]);
    const kontrol = kaynak === "cogniti" ? await adminGirisKontrol() : await firmaYonetimIslemKontrol(firmaId);
    if (!kontrol.gecerli) return kontrol.yanit;
    if (!uuidGecerliMi(firmaId) || !bannerSirasiGecerli(sira, firmaId, alan)) return validasyonHatasi("Firma veya banner sırası geçersiz.", ["firma_id", "sira"]);
    const admin = createAdminClient();
    let okuma = admin.from(tablo).select("dosya_yolu, gorunur").eq("firma_id", firmaId).eq("kaynak", kaynak).eq("sira", sira);
    if (alan !== "firma") okuma = okuma.eq("alan", alan);
    const { data: mevcut, error: okumaHatasi } = await okuma.maybeSingle();
    if (bannerKaynakKurulumuEksik(okumaHatasi)) return kaynakKurulumYaniti();
    if (bannerGorunurlukKurulumuEksik(okumaHatasi)) return gorunurlukKurulumYaniti();
    if (bannerKurulumuEksik(okumaHatasi)) return kurulumYaniti(alan);
    if (okumaHatasi) return hataYaniti("Banner okunamadı.", "Banner kaldırma SELECT", okumaHatasi);
    if (!mevcut) return NextResponse.json({ ok: true });

    // Dosya temizliği başarısız olursa kayıt, gizli durumda yeniden denenebilir kalır.
    let gizleme = admin.from(tablo).update({ gorunur: false, updated_at: new Date().toISOString() })
      .eq("firma_id", firmaId).eq("kaynak", kaynak).eq("sira", sira).eq("dosya_yolu", mevcut.dosya_yolu);
    if (alan !== "firma") gizleme = gizleme.eq("alan", alan);
    const { data: gizlenen, error: gizlemeHatasi } = await gizleme.select("dosya_yolu").maybeSingle();
    if (gizlemeHatasi) return hataYaniti("Banner kaldırılamadı.", "Banner kaldırma gizleme UPDATE", gizlemeHatasi);
    if (!gizlenen) return NextResponse.json({ hata: "Banner işlem sırasında değişti. Sayfayı yenileyip tekrar deneyin." }, { status: 409 });

    const { error: dosyaHatasi } = await admin.storage.from(ECLUB_BANNER_BUCKET).remove([mevcut.dosya_yolu]);
    if (dosyaHatasi) {
      console.error("[Banner kaldırma] Dosya temizlenemedi:", dosyaHatasi);
      return NextResponse.json({ hata: "Görsel dosyası silinemedi. Banner gizli tutuldu; Kaldır ile tekrar deneyebilirsiniz.", banner: { sira, gorunur: false } }, { status: 500 });
    }

    let silme = admin.from(tablo).delete().eq("firma_id", firmaId).eq("kaynak", kaynak).eq("sira", sira).eq("dosya_yolu", mevcut.dosya_yolu);
    if (alan !== "firma") silme = silme.eq("alan", alan);
    const { data: silinen, error: silmeHatasi } = await silme.select("dosya_yolu").maybeSingle();
    if (silmeHatasi) {
      console.error("[Banner kaldırma] Kayıt temizlenemedi:", silmeHatasi);
      return NextResponse.json({ hata: "Görsel dosyası silindi ancak kayıt temizlenemedi. Kaldır ile tekrar deneyebilirsiniz.", banner: { sira, gorunur: false } }, { status: 500 });
    }
    if (!silinen) return NextResponse.json({ hata: "Banner işlem sırasında değişti. Sayfayı yenileyip tekrar deneyin." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) { return sunucuHatasi(error, "DELETE admin E-Club bannerlar"); }
}
