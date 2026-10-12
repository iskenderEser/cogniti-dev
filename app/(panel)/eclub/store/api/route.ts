import { eclubFirmaKapsami } from "@/lib/eclub/firmaGezinme";
import { uuidGecerliMi } from "@/lib/uretim/rpc";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { hataYaniti, sunucuHatasi, yetkiHatasi, rolHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { eclubKisiErisimi } from "@/lib/eclub/kisiErisim";
import { eclubStoreTakvimDurumu } from "@/lib/eclub/store/takvim";
import { ECLUB_CEK_KARTI_TEST_PUAN_IDLERI } from "@/lib/eclub/store/gorunumTesti";
import { ECLUB_UX_TEST_KISI_ID, eclubUxKartlariniBirlestir, type EclubUxTestSatiri } from "@/lib/eclub/store/uxGorunumTesti";

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
    const [{ data: ozetData, error: ozetError }, { data: testPuanlari, error: testError }, uxTest] = await Promise.all([
      adminSupabase.rpc("get_eclub_eczane_store_ozet", { p_kisi_id: erisim.kisi.kisi_id }),
      adminSupabase.from("eclub_kazanilan_puanlar")
        .select("yayin_id, eczane_id")
        .in("kazanilan_puan_id", [...ECLUB_CEK_KARTI_TEST_PUAN_IDLERI])
        .in("eczane_id", erisim.eczane_idler),
      erisim.kisi.kisi_id === ECLUB_UX_TEST_KISI_ID
        ? adminSupabase.from("eclub_cek_karti_ux_testleri")
          .select("senaryo_id,kisi_id,eczane_id,firma_id,urun_id,sira,etiket,veri")
          .eq("kisi_id", erisim.kisi.kisi_id).in("eczane_id", erisim.eczane_idler)
          .in("firma_id", [...firmaIdler]).order("sira")
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (ozetError) return hataYaniti("Hediye çeki özeti alınamadı.", "get_eclub_eczane_store_ozet RPC", ozetError);

    if (testError) return hataYaniti("Görünüm testi kayıtları doğrulanamadı.", "Hediye Çeki test kapsamı", testError);
    // UX SQL'i henüz kurulmadığında veya temizliğinde normal ekran çalışmaya devam eder.
    if (uxTest.error && !["42P01", "PGRST205"].includes(uxTest.error.code)) {
      return hataYaniti("UX örnekleri okunamadı.", "Hediye Çeki UX test kapsamı", uxTest.error);
    }
    const testKapsamlari = new Set((testPuanlari ?? []).map((p) => `${p.eczane_id}:${p.yayin_id}`));

    const kapsamliYayinlar = (ozetData ?? []).filter((item: { firma_id: string }) => firmaIdler.has(item.firma_id));
    const yayinIdler = kapsamliYayinlar.map((item: { yayin_id: string }) => item.yayin_id);
    const uxTestSatirlari = (uxTest.data ?? []) as EclubUxTestSatiri[];
    const testYayinNumaralari = [...new Set(uxTestSatirlari.map((satir) => satir.veri.talep_no)
      .filter((no): no is number => typeof no === "number" && Number.isSafeInteger(no)))];
    const kunyeSorgusu = adminSupabase.from("v_yayin_kunye")
      .select("yayin_id, firma_id, talep_no, arac_turu").in("firma_id", [...firmaIdler]);
    const { data: kunyeler, error: kunyeError } = testYayinNumaralari.length
      ? await kunyeSorgusu.or([
        ...(yayinIdler.length ? [`yayin_id.in.(${yayinIdler.join(",")})`] : []),
        `talep_no.in.(${testYayinNumaralari.join(",")})`,
      ].join(","))
      : yayinIdler.length
        ? await kunyeSorgusu.in("yayin_id", yayinIdler)
        : { data: [], error: null };
    if (kunyeError) return hataYaniti("Yayın bilgileri alınamadı.", "Hediye çeki yayın künyesi", kunyeError);
    const yayinBilgileri = new Map((kunyeler ?? []).map((yayin) => [yayin.yayin_id, yayin]));
    const yayinTurleri = new Map((kunyeler ?? []).map((yayin) => [`${yayin.firma_id}:${yayin.talep_no}`, yayin.arac_turu]));

    return NextResponse.json({
      firma: firmaId ? firmaKapsami[0] : null,
      takvim: eclubStoreTakvimDurumu(),
      cek_yayinlar: eclubUxKartlariniBirlestir(kapsamliYayinlar.map((item: { eczane_id: string; yayin_id: string }) => ({
        ...item,
        talep_no: yayinBilgileri.get(item.yayin_id)?.talep_no ?? null,
        arac_turu: yayinBilgileri.get(item.yayin_id)?.arac_turu ?? null,
        gorunum_testi_mi: testKapsamlari.has(`${item.eczane_id}:${item.yayin_id}`),
      })), uxTestSatirlari, {
        kisiId: erisim.kisi.kisi_id, eczaneIdler: erisim.eczane_idler, firmaIdler: [...firmaIdler],
      }).map((item) => ({
        ...item,
        arac_turu: item.arac_turu ?? yayinTurleri.get(`${item.firma_id}:${item.talep_no}`) ?? null,
      })),
    }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "GET /eclub/store/api");
  }
}
