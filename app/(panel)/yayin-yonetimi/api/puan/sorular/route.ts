import { puanAraligaUygunMu, puanAraligiMetni } from "@/lib/uretici/puanAraliklari";
import { talepPuanAraliklariOku } from "@/lib/uretici/puanAraliklariSunucu";
// app/yayin-yonetimi/api/puan/sorular/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, yetkiHatasi, rolHatasi, validasyonHatasi, isKuraluHatasi } from "@/lib/utils/hataIsle";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { talepBilgisiSoruSeti } from "@/lib/utils/talepZinciri";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const rol = await rolCozucu(adminSupabase, user.id);
    if (!URETICI_ROLLER.includes(rol)) return rolHatasi("Sadece yetkili roller soru puanı tanımlayabilir.");

    const body = await request.json();
    const { soru_seti_durum_id, puanlar } = body;

    if (!soru_seti_durum_id) return validasyonHatasi("soru_seti_durum_id zorunludur.", ["soru_seti_durum_id"]);
    if (!puanlar || !Array.isArray(puanlar) || puanlar.length === 0) {
      return validasyonHatasi("puanlar dizisi zorunludur.", ["puanlar"]);
    }

    const { data: sahipSeti, error: sahipSetiError } = await adminSupabase
      .from("soru_seti_durumu")
      .select("soru_seti_id")
      .eq("soru_seti_durum_id", soru_seti_durum_id)
      .single();
    if (sahipSetiError || !sahipSeti) {
      return hataYaniti("Soru seti bulunamadı.", "soru_seti_durum_id → soru_seti_id", sahipSetiError, 404);
    }
    const talepBilgisi = await talepBilgisiSoruSeti(adminSupabase, sahipSeti.soru_seti_id);
    if (!talepBilgisi) return hataYaniti("Talep bilgisi bulunamadı.", "soru_seti_id → talep sahipliği", null, 404);
    if (talepBilgisi.uretici_id !== user.id) return rolHatasi("Yalnız kendi içeriğinizin soru puanlarını değiştirebilirsiniz.");

    const araliklar = await talepPuanAraliklariOku(adminSupabase, talepBilgisi.talep_id, user.id);
    const indeksler = new Set<number>();
    for (const p of puanlar) {
      if (!p || !Number.isInteger(p.soru_index) || p.soru_index < 0 || indeksler.has(p.soru_index)) {
        return validasyonHatasi("Soru indeksleri tekrarsız ve sıfırdan başlayan tam sayı olmalıdır.", ["soru_index"]);
      }
      indeksler.add(p.soru_index);
      if (!puanAraligaUygunMu(p.soru_puani, araliklar.cevap)) {
        return validasyonHatasi(`Doğru cevap puanı firma aralığına uygun değil. ${puanAraligiMetni(araliklar.cevap)}`, ["soru_puani"]);
      }
    }

    // İlk yayından sonra puan kilitlenir; yayını durdurmak bu kilidi kaldırmaz.
    const { data: yayin, error: yayinError } = await adminSupabase
      .from("yayin_yonetimi")
      .select("yayin_id")
      .eq("soru_seti_durum_id", soru_seti_durum_id)
      .in("durum", ["yayinda", "Durduruldu"])
      .limit(1)
      .maybeSingle();

    if (yayinError) {
      return hataYaniti("Yayın geçmişi sorgulanırken hata oluştu.", "yayin_yonetimi SELECT — puan kilidi", yayinError);
    }
    if (yayin) return isKuraluHatasi("İlk kez yayımlandıktan sonra doğru cevap puanları değiştirilemez. Yayının durdurulması bu kuralı değiştirmez.");

    // Tüm puanlar tek upsert ile kaydedilir.
    // UNIQUE constraint: (soru_seti_durum_id, soru_index) — var olanı günceller, olmayanı insert eder.
    const kayitlar = puanlar.map((p: { soru_index: number; soru_puani: number }) => ({
      soru_seti_durum_id,
      soru_index: p.soru_index,
      soru_puani: p.soru_puani,
    }));

    const { error: upsertError } = await adminSupabase
      .from("soru_seti_puanlari")
      .upsert(kayitlar, { onConflict: "soru_seti_durum_id,soru_index" });

    if (upsertError) {
      return hataYaniti("Doğru cevap puanları kaydedilemedi.", "soru_seti_puanlari tablosu UPSERT", upsertError);
    }

    return NextResponse.json({ mesaj: `${puanlar.length} soru puanı kaydedildi.` }, { status: 200 });

  } catch (err) {
    return sunucuHatasi(err, "POST /yayin-yonetimi/api/puan/sorular");
  }
}
