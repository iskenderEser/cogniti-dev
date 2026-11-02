import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { bazPuanGecerliMi } from "@/lib/tclub/store/katalog";

type Context = { params: Promise<{ firma_id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { firma_id } = await params;
    const auth = await firmaYonetimOkumaKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;

    if (!uuidGecerliMi(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const db = createAdminClient();
    const [firma, katalog, ayarlar] = await Promise.all([
      db.from("firmalar").select("firma_id,firma_adi,hbstore_aktif").eq("firma_id", firma_id).maybeSingle(),
      db.from("store_urunler").select("urun_id,ad,aciklama,gorsel_url,minimum_siparis_tl,aktif_mi").order("ad"),
      db.from("store_urun_firma_ayarlari").select("urun_id,aktif_mi,baz_puan").eq("firma_id", firma_id),
    ]);
    const error = firma.error ?? katalog.error ?? ayarlar.error;
    if (error) return hataYaniti("FirmaStore çek tanımları alınamadı.", "FirmaStore firma çekleri GET", error);
    if (!firma.data) return NextResponse.json({ hata: "Firma bulunamadı." }, { status: 404 });
    const ayarMap = new Map((ayarlar.data ?? []).map(ayar => [ayar.urun_id, ayar]));
    const cekler = (katalog.data ?? []).map(cek => {
      const ayar = ayarMap.get(cek.urun_id);
      return {
        ...cek,
        secili: ayar?.aktif_mi === true && bazPuanGecerliMi(ayar.baz_puan),
        baz_puan: ayar?.baz_puan ?? null,
      };
    });
    return NextResponse.json({ firma: firma.data, cekler }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return sunucuHatasi(error, "FirmaStore firma çekleri GET"); }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { firma_id } = await params;
    const auth = await firmaYonetimIslemKontrol(firma_id);
    if (!auth.gecerli) return auth.yanit;

    if (!uuidGecerliMi(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    let body: unknown;
    try { body = await request.json(); }
    catch { return validasyonHatasi("Geçerli çek listesi gönderin.", ["cekler"]); }
    if (!body || typeof body !== "object" || !("cekler" in body) || !Array.isArray(body.cekler)) {
      return validasyonHatasi("Çek listesi zorunludur.", ["cekler"]);
    }
    const cekler: { urun_id: string; baz_puan: number }[] = [];
    const kimlikler = new Set<string>();
    for (const cek of body.cekler) {
      if (!cek || typeof cek !== "object" || !uuidGecerliMi(cek.urun_id) || !bazPuanGecerliMi(cek.baz_puan)) {
        return validasyonHatasi("Her seçilen çek için geçerli kimlik ve pozitif tam sayı baz puan girin.", ["cekler"]);
      }
      const urun_id = cek.urun_id.toLowerCase();
      if (kimlikler.has(urun_id)) return validasyonHatasi("Aynı çek birden fazla seçilemez.", ["cekler"]);
      kimlikler.add(urun_id);
      cekler.push({ urun_id, baz_puan: cek.baz_puan });
    }
    const db = createAdminClient();
    const result = await db.rpc("admin_firmastore_cek_tanimlarini_kaydet", { p_firma_id: firma_id, p_cekler: cekler });
    if (result.error) {
      if (["PGRST202", "42883"].includes(result.error.code)) {
        return NextResponse.json({ hata: "FirmaStore firma çek tanımları SQL kurulumu bekleniyor." }, { status: 503 });
      }
      if (result.error.code === "P0002") return NextResponse.json({ hata: "Firma bulunamadı." }, { status: 404 });
      if (result.error.code === "22023") return validasyonHatasi(result.error.message, ["cekler"]);
      return hataYaniti("Çek tanımları kaydedilemedi.", "FirmaStore firma çekleri PUT", result.error);
    }
    return NextResponse.json({ mesaj: "FirmaStore çek tanımları kaydedildi.", ...result.data });
  } catch (error) { return sunucuHatasi(error, "FirmaStore firma çekleri PUT"); }
}
