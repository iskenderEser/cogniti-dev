import { PM_AILESI_ROLLER } from "@/lib/utils/roller";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
// app/admin/api/firmalar/[firma_id]/urunler/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, veriKontrol, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const { firma_id } = await params;
    const girisKontrolu = await firmaYonetimOkumaKontrol(firma_id);
    if (!girisKontrolu.gecerli) return girisKontrolu.yanit;


    if (!firma_id) return validasyonHatasi("firma_id zorunludur.", ["firma_id"]);

    const { searchParams } = new URL(request.url);
    const takim_id = searchParams.get("takim_id");

    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from("urunler")
      .select("urun_id, urun_adi, takim_id, created_at, sorumlu_pm_id")
      .eq("firma_id", firma_id)
      .order("urun_adi", { ascending: true });

    if (takim_id) query = query.eq("takim_id", takim_id);

    const { data: urunler, error } = await query;

    if (error) return hataYaniti("Ürünler çekilemedi.", "urunler tablosu SELECT — firma_id filtresi", error);

    const { data: pmAdaylari, error: adayHatasi } = await adminSupabase.from("kullanicilar")
      .select("kullanici_id, ad, soyad, takim_id")
      .eq("firma_id", firma_id).eq("aktif_mi", true).in("rol", PM_AILESI_ROLLER)
      .order("ad").order("soyad");
    if (adayHatasi) return hataYaniti("PM listesi alınamadı.", "Ürün sorumlusu adayları", adayHatasi);

    return NextResponse.json({ urunler: urunler ?? [], pmAdaylari: pmAdaylari ?? [] });
  } catch (err) {
    return sunucuHatasi(err, "GET /admin/api/firmalar/[firma_id]/urunler");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const { firma_id } = await params;
    const girisKontrolu = await firmaYonetimIslemKontrol(firma_id);
    if (!girisKontrolu.gecerli) return girisKontrolu.yanit;


    if (!firma_id) return validasyonHatasi("firma_id zorunludur.", ["firma_id"]);

    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { urun_adi, takim_id } = body;

    if (!urun_adi || urun_adi.trim() === "") {
      return validasyonHatasi("Ürün adı zorunludur.", ["urun_adi"]);
    }
    if (!takim_id) {
      return validasyonHatasi("takim_id zorunludur.", ["takim_id"]);
    }

    // takim_id bu firmaya ait mi kontrol et
    const { data: takim, error: takimError } = await adminSupabase
      .from("takimlar")
      .select("takim_id")
      .eq("takim_id", takim_id)
      .eq("firma_id", firma_id)
      .single();

    if (takimError || !takim) return hataYaniti("Takım bu firmaya ait değil.", "takimlar tablosu SELECT — takim_id + firma_id kontrolü", takimError, 404);

    const { data: mevcut, error: kontrolError } = await adminSupabase
      .from("urunler")
      .select("urun_id")
      .eq("takim_id", takim_id)
      .eq("urun_adi", urun_adi.trim())
      .single();

    if (kontrolError && kontrolError.code !== "PGRST116") {
      return hataYaniti("Ürün adı kontrolü yapılamadı.", "urunler tablosu SELECT — tekrar kontrolü", kontrolError);
    }
    if (mevcut) return hataYaniti("Bu takımda aynı isimde ürün zaten mevcut.", "urunler tablosu — tekrar kontrolü", null, 422);

    const { data: yeniUrun, error: insertError } = await adminSupabase
      .from("urunler")
      .insert({ firma_id, takim_id, urun_adi: urun_adi.trim() })
      .select("urun_id, urun_adi, takim_id, created_at")
      .single();

    if (insertError) return hataYaniti("Ürün eklenemedi.", "urunler tablosu INSERT", insertError);

    const kontrol = veriKontrol(yeniUrun, "urunler tablosu INSERT — dönen veri", "Ürün eklendi ancak veri döndürülemedi.");
    if (!kontrol.gecerli) return kontrol.yanit;

    return NextResponse.json({ mesaj: "Ürün eklendi.", urun: yeniUrun }, { status: 201 });
  } catch (err) {
    return sunucuHatasi(err, "POST /admin/api/firmalar/[firma_id]/urunler");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> },
) {
  try {
    const { firma_id } = await params;
    const kontrol = await firmaYonetimIslemKontrol(firma_id);
    if (!kontrol.gecerli) return kontrol.yanit;

    const body = await request.json().catch(() => null);
    const urunId = body?.urun_id;
    const sorumluId = body?.sorumlu_pm_id;
    if (!uuidGecerliMi(urunId) || (sorumluId !== null && !uuidGecerliMi(sorumluId))) {
      return validasyonHatasi("Geçerli bir ürün ve sorumlu PM seçin.");
    }

    const { data, error } = await createAdminClient().from("urunler")
      .update({ sorumlu_pm_id: sorumluId }).eq("urun_id", urunId).eq("firma_id", firma_id)
      .select("urun_id").maybeSingle();
    if (error?.code === "23514" || error?.code === "23503") {
      return validasyonHatasi("Ürünle aynı firma ve takımda bulunan aktif bir PM seçin.");
    }
    if (error) return hataYaniti("Sorumlu PM kaydedilemedi.", "Ürün sorumlusu güncelleme", error);
    if (!data) return hataYaniti("Ürün bulunamadı.", "Ürün sorumlusu güncelleme", null, 404);

    return NextResponse.json({ mesaj: "Ürün sorumlusu güncellendi." });
  } catch (error) {
    return sunucuHatasi(error, "Ürün sorumlusu güncelleme");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const { firma_id } = await params;
    const girisKontrolu = await firmaYonetimIslemKontrol(firma_id);
    if (!girisKontrolu.gecerli) return girisKontrolu.yanit;


    if (!firma_id) return validasyonHatasi("firma_id zorunludur.", ["firma_id"]);

    const adminSupabase = createAdminClient();
    const body = await request.json();
    const { urun_id } = body;

    if (!urun_id) return validasyonHatasi("urun_id zorunludur.", ["urun_id"]);

    const { data: urun, error: kontrolError } = await adminSupabase
      .from("urunler")
      .select("urun_id")
      .eq("urun_id", urun_id)
      .eq("firma_id", firma_id)
      .single();

    if (kontrolError || !urun) {
      return hataYaniti("Ürün bulunamadı.", "urunler tablosu SELECT — urun_id + firma_id kontrolü", kontrolError, 404);
    }

    const { error: deleteError } = await adminSupabase
      .from("urunler")
      .delete()
      .eq("urun_id", urun_id);

    if (deleteError) return hataYaniti("Ürün silinemedi.", "urunler tablosu DELETE", deleteError);

    return NextResponse.json({ mesaj: "Ürün silindi." }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "DELETE /admin/api/firmalar/[firma_id]/urunler");
  }
}