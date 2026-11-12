// Üretici katalogları ve yönetici yayın görünümünün veri ucu. Yalnız YAYINDAKI_VIDEO_GORENLER
// (üretici + yönetici + tm/bm; iu ve tüketici roller hariç) erişebilir — bekçi
// proxy.ts'te de var, burada ikinci kez (savunma katmanı) uygulanır.
// Veri: getYayindakiVideolar — tüm türler + üreten (ad soyad/rol) + favori/beğeni
// sayısı. Klasör gruplaması (üreten role göre) sayfa/kart tarafında (Adım 4-5).

import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sunucuHatasi, yetkiHatasi, rolHatasi } from "@/lib/utils/hataIsle";
import { URETICI_ROLLER, YAYINDAKI_VIDEO_GORENLER } from "@/lib/utils/roller";
import { getYayindakiVideolar } from "@/lib/video/yayindakiVideolar";
import { rolCozucu } from "@/lib/utils/rolCozucu";

async function odemeBekleyenleriOku(db: ReturnType<typeof createAdminClient>, ureticiId: string) {
  const { data, error } = await db
    .from("soru_seti_durumu")
    .select(`
      soru_seti_durum_id,
      soru_setleri!inner (
        talepler!inner (
          talep_id, uretici_id, talep_no, urun_adi, teknik_adi, ogrenme_araci_turu,
          icerik_turu, uretim_bedeli_token, firmalar ( firma_adi ), urunler ( urun_adi )
        )
      )
    `)
    .eq("durum", "onaylandi")
    .eq("soru_setleri.talepler.uretici_id", ureticiId)
    .eq("soru_setleri.talepler.uretim_bedeli_turu", "sabit")
    .gt("soru_setleri.talepler.uretim_bedeli_token", 0)
    .is("soru_setleri.talepler.yayin_oncesi_silme_durumu", null)
    .is("soru_setleri.talepler.uretim_bedeli_odendi_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Ödeme bekleyen yayınlar alınamadı.", { cause: error });

  const talepIdleri = new Set<string>();
  return (data ?? []).flatMap((satir) => {
    const soruSeti = Array.isArray(satir.soru_setleri) ? satir.soru_setleri[0] : satir.soru_setleri;
    const talep = Array.isArray(soruSeti?.talepler) ? soruSeti.talepler[0] : soruSeti?.talepler;
    if (!talep || talep.uretici_id !== ureticiId || talepIdleri.has(talep.talep_id)) return [];
    talepIdleri.add(talep.talep_id);

    const firma = Array.isArray(talep.firmalar) ? talep.firmalar[0] : talep.firmalar;
    const urun = Array.isArray(talep.urunler) ? talep.urunler[0] : talep.urunler;
    return [{
      talep_id: talep.talep_id,
      yayin_id: satir.soru_seti_durum_id,
      urun_adi: urun?.urun_adi ?? talep.urun_adi ?? talep.teknik_adi ?? "İçerik",
      teknik_adi: talep.teknik_adi,
      firma_adi: firma?.firma_adi,
      talep_no: talep.talep_no,
      arac_turu: talep.ogrenme_araci_turu,
      icerik_turu: talep.icerik_turu,
      token: talep.uretim_bedeli_token,
    }];
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const rol = await rolCozucu(adminSupabase, user.id);
    if (!YAYINDAKI_VIDEO_GORENLER.includes(rol)) {
      return rolHatasi("Bu sayfaya erişim yetkiniz yok.");
    }

    const kapsamParametresi = request.nextUrl.searchParams.get("kapsam");
    const kapsam = kapsamParametresi === "benim" || kapsamParametresi === "digerleri"
      ? kapsamParametresi
      : "tumu";
    if (kapsam !== "tumu" && !URETICI_ROLLER.includes(rol)) {
      return rolHatasi("Bu yayın kapsamına erişim yetkiniz yok.");
    }

    const yayinlar = getYayindakiVideolar(user.id, rol, adminSupabase, kapsam);
    if (kapsam !== "benim") return NextResponse.json({ videolar: await yayinlar }, { status: 200 });

    const [videolar, odemeBekleyenler] = await Promise.all([
      yayinlar,
      odemeBekleyenleriOku(adminSupabase, user.id),
    ]);
    return NextResponse.json({ videolar, odemeBekleyenler }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err) {
    return sunucuHatasi(err, "GET /yayin-katalogu/api");
  }
}
