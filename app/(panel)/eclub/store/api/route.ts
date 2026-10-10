import { eclubFirmaKapsami } from "@/lib/eclub/firmaGezinme";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { hataYaniti, sunucuHatasi, yetkiHatasi, rolHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { eclubKisiErisimi } from "@/lib/eclub/kisiErisim";
import { eclubStoreTakvimDurumu } from "@/lib/eclub/store/takvim";
import { ECLUB_CEK_KARTI_TEST_PUAN_IDLERI } from "@/lib/eclub/store/gorunumTesti";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("tip") === "takvim") {
      return NextResponse.json({ takvim: eclubStoreTakvimDurumu() }, { status: 200 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const adminSupabase = createAdminClient();

    const erisim = await eclubKisiErisimi(adminSupabase, user.id);
    if (!erisim.kisi) return rolHatasi("Bu işlem yalnız E-Club kişilerine açıktır.");
    if (!ECLUB_TUKETICI_ROLLERI.includes(erisim.kisi.rol)) return rolHatasi("Geçersiz kişi rolü.");
    const firmaId = searchParams.get("firma_id");
    if (firmaId !== null && !uuidGecerliMi(firmaId)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const firmaKapsami = eclubFirmaKapsami(erisim.firmalar, firmaId, true);
    if (firmaKapsami.length === 0) return rolHatasi("Bu firmanın hediye çeki sayfasına erişiminiz bulunmuyor.");
    const firmaIdler = new Set(firmaKapsami.map((firma) => firma.firma_id));
    const { data: ozetData, error: ozetError } = await adminSupabase
      .rpc("get_eclub_eczane_store_ozet", { p_kisi_id: erisim.kisi.kisi_id });
    if (ozetError) return hataYaniti("Hediye çeki özeti alınamadı.", "get_eclub_eczane_store_ozet RPC", ozetError);

    const { data: testPuanlari, error: testError } = await adminSupabase
      .from("eclub_kazanilan_puanlar")
      .select("yayin_id, eczane_id")
      .in("kazanilan_puan_id", [...ECLUB_CEK_KARTI_TEST_PUAN_IDLERI])
      .in("eczane_id", erisim.eczane_idler);
    if (testError) return hataYaniti("Görünüm testi kayıtları doğrulanamadı.", "Hediye Çeki test kapsamı", testError);
    const testKapsamlari = new Set((testPuanlari ?? []).map((p) => `${p.eczane_id}:${p.yayin_id}`));

    const kapsamliYayinlar = (ozetData ?? []).filter((item: { firma_id: string }) => firmaIdler.has(item.firma_id));
    const yayinIdler = kapsamliYayinlar.map((item: { yayin_id: string }) => item.yayin_id);
    const { data: kunyeler, error: kunyeError } = yayinIdler.length
      ? await adminSupabase.from("v_yayin_kunye").select("yayin_id, talep_no").in("yayin_id", yayinIdler)
      : { data: [], error: null };
    if (kunyeError) return hataYaniti("Yayın bilgileri alınamadı.", "Hediye çeki yayın künyesi", kunyeError);
    const yayinNumaralari = new Map((kunyeler ?? []).map((yayin) => [yayin.yayin_id, yayin.talep_no]));

    return NextResponse.json({
      firma: firmaId ? firmaKapsami[0] : null,
      takvim: eclubStoreTakvimDurumu(),
      cek_yayinlar: kapsamliYayinlar.map((item: { eczane_id: string; yayin_id: string }) => ({
        ...item,
        talep_no: yayinNumaralari.get(item.yayin_id) ?? null,
        gorunum_testi_mi: testKapsamlari.has(`${item.eczane_id}:${item.yayin_id}`),
      })),
    }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "GET /eclub/store/api");
  }
}
