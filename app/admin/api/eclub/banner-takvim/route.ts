import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { bannerAlaniGecerli, bannerDosyaUzantisi, ECLUB_BANNER_BUCKET, platformBannerFirmasi } from "@/lib/eclub/banner";
import { trGunu } from "@/lib/zaman/kontrol";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

function dbHatasi(e: { code: string; message: string }) {
  if (["42P01", "42883", "PGRST202", "PGRST205"].includes(e.code)) return NextResponse.json({ hata: "Haftalık banner SQL kurulumu bekleniyor." }, { status: 503 });
  return hataYaniti(["22023", "40001", "42501", "P0002"].includes(e.code) ? e.message : "Banner işlemi tamamlanamadı.", "Haftalık banner", e,
    e.code === "42501" ? 403 : e.code === "40001" ? 409 : e.code === "P0002" ? 404 : e.code === "22023" ? 422 : 500);
}
const gunGecerli = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && trGunu(new Date(`${v}T12:00:00+03:00`)) === v;
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams, firma = q.get("firma_id"), alan = q.get("alan") ?? "firma", sira = Number(q.get("sira")), bas = q.get("bas") ?? "", hafta = Number(q.get("hafta"));
    if (!uuidGecerliMi(firma) || platformBannerFirmasi(firma) || !bannerAlaniGecerli(alan) || ![1, 2, 3].includes(sira) || ![1, 2].includes(hafta) || !gunGecerli(bas)) return validasyonHatasi("Geçerli firma, alan ve pazartesi seçin.", ["takvim"]);
    const yetki = await firmaYonetimOkumaKontrol(firma); if (!yetki.gecerli) return yetki.yanit;
    const db = createAdminClient(), sonuc = await db.rpc("firma_banner_takvim", { p_firma: firma, p_alan: alan, p_sira: sira, p_bas: bas, p_hafta: hafta });
    if (sonuc.error) return dbHatasi(sonuc.error);
    const depo = db.storage.from(ECLUB_BANNER_BUCKET), data = sonuc.data;
    return NextResponse.json({ ...data,
      rezervasyonlar: (data.rezervasyonlar ?? []).map((r: { gorseller: { dosya_yolu: string }[] }) => ({ ...r, gorseller: r.gorseller.map(h => ({ ...h, url: depo.getPublicUrl(h.dosya_yolu).data.publicUrl })) })),
      mevcut_bannerlar: (data.mevcut_bannerlar ?? []).map((b: { dosya_yolu: string }) => ({ ...b, url: depo.getPublicUrl(b.dosya_yolu).data.publicUrl })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return sunucuHatasi(e, "Banner takvimi GET"); }
}
export async function POST(request: NextRequest) {
  const db = createAdminClient(), yuklenen: string[] = [];
  try {
    const f = await request.formData(), firma = String(f.get("firma_id") ?? ""), alan = String(f.get("alan") ?? ""), islem = String(f.get("islem") ?? "rezerve"), id = String(f.get("rezervasyon_id") ?? "");
    if (!uuidGecerliMi(firma) || platformBannerFirmasi(firma) || !uuidGecerliMi(id) || !bannerAlaniGecerli(alan) || !["rezerve", "gorsel"].includes(islem)) return validasyonHatasi("Geçerli banner işlemi gönderin.", ["banner"]);
    const yetki = await firmaYonetimIslemKontrol(firma); if (!yetki.gecerli) return yetki.yanit;
    const hafta = Number(f.get("hafta")), sira = Number(f.get("sira")), bas = String(f.get("bas") ?? ""), haftaNo = Number(f.get("hafta_no"));
    if (islem === "rezerve" && (![1, 2].includes(hafta) || ![1, 2, 3].includes(sira) || !gunGecerli(bas))) return validasyonHatasi("Hafta ve alan seçin.", ["takvim"]);
    if (islem === "gorsel" && ![0, 1].includes(haftaNo)) return validasyonHatasi("Geçerli hafta seçin.", ["hafta_no"]);
    // Her hafta kendi görseline sahiptir; dosyalar kayıttan önce doğrulanır.
    const dosyalar = Array.from({ length: islem === "rezerve" ? hafta : 1 }, (_, i) => f.get(`gorsel_${i}`));
    const uzantilar: string[] = [];
    for (const dosya of dosyalar) {
      if (!(dosya instanceof File)) return validasyonHatasi("Her hafta için görsel seçin.", ["gorsel"]);
      const uzanti = await bannerDosyaUzantisi(dosya);
      if (!uzanti) return validasyonHatasi("En fazla 5 MB PNG, JPEG veya WebP seçin.", ["gorsel"]);
      uzantilar.push(uzanti);
    }
    const depo = db.storage.from(ECLUB_BANNER_BUCKET);
    for (let i = 0; i < dosyalar.length; i++) {
      const yol = `firma-banner-rezervasyon/${firma}/${id}/${crypto.randomUUID()}.${uzantilar[i]}`;
      const dosya = dosyalar[i] as File;
      const { error } = await depo.upload(yol, dosya, { contentType: dosya.type, upsert: false });
      if (error) throw new Error("Görsel yüklenemedi.");
      yuklenen.push(yol);
    }
    const sonuc = islem === "rezerve"
      ? await db.rpc("firma_banner_rezerve", { p_aktor: yetki.kullaniciId, p_firma: firma, p_id: id, p_alan: alan, p_sira: sira, p_bas: bas, p_yollar: yuklenen })
      : await db.rpc("firma_banner_gorsel_degistir", { p_aktor: yetki.kullaniciId, p_firma: firma, p_id: id, p_hafta: haftaNo, p_yol: yuklenen[0] });
    if (sonuc.error) { await depo.remove(yuklenen); return dbHatasi(sonuc.error); }
    return NextResponse.json({ ok: true, mesaj: islem === "rezerve" ? "Rezervasyon kaydedildi. Ücret ilk hafta başladığında işlenecek." : "Haftanın görseli güncellendi." });
  } catch (e) {
    if (yuklenen.length) await db.storage.from(ECLUB_BANNER_BUCKET).remove(yuklenen);
    return sunucuHatasi(e, "Banner rezervasyonu POST");
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams, firma = q.get("firma_id"), id = q.get("rezervasyon_id"), beklenen = Number(q.get("beklenen_kesinti"));
    if (!uuidGecerliMi(firma) || !uuidGecerliMi(id) || !q.has("beklenen_kesinti") || ![0,200,400].includes(beklenen)) return validasyonHatasi("Geçerli rezervasyon seçin.", ["rezervasyon_id"]);
    const yetki = await firmaYonetimIslemKontrol(firma); if (!yetki.gecerli) return yetki.yanit;
    const sonuc = await createAdminClient().rpc("firma_banner_iptal", { p_aktor: yetki.kullaniciId, p_firma: firma, p_id: id, p_beklenen_kesinti: beklenen });
    if (sonuc.error) return dbHatasi(sonuc.error);
    return NextResponse.json({ ...sonuc.data, mesaj: sonuc.data.kesinti ? `Rezervasyon kapatıldı. Toplam ${sonuc.data.kesinti} token bedel uygulanır; iade yapılmaz.` : "Rezervasyon ücretsiz iptal edildi." });
  } catch (e) { return sunucuHatasi(e, "Banner rezervasyonu DELETE"); }
}
