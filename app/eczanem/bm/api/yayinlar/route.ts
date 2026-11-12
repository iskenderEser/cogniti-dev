import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ECZANEM_KAPALI_MESAJI, uttEczanemErisimi } from "@/lib/eczanem/erisim";
import { uttEczanemVerisi } from "@/lib/eczanem/gonderim";
import { uttEczanemUyeGonderimOzeti, uttEczanemUyeGonderimRafi } from "@/lib/eczanem/uyeGonderimOzeti";
import { eclubYonetimKapsaminiGetir } from "@/lib/eclub/yonetimKapsami";
import { rolHatasi, sunucuHatasi, validasyonHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import type { SupabaseClient } from "@supabase/supabase-js";

async function yayinUrunleri(db: SupabaseClient, firmaId: string, yayinlar: readonly { yayin_id: string }[]) {
  const baglar: [string, string][] = [];
  for (let ilk = 0; ilk < yayinlar.length; ilk += 100) {
    const { data, error } = await db.from("v_yayin_kunye").select("yayin_id, urun_id")
      .eq("firma_id", firmaId).in("yayin_id", yayinlar.slice(ilk, ilk + 100).map(({ yayin_id }) => yayin_id));
    if (error) throw error;
    for (const { yayin_id, urun_id } of data ?? []) {
      if (yayin_id && urun_id) baglar.push([yayin_id, urun_id]);
    }
  }
  return Object.fromEntries(baglar);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authHatasi } = await supabase.auth.getUser();
    if (authHatasi || !user) return yetkiHatasi();

    const db = createAdminClient();
    const { data: yonetici, error } = await db.from("kullanicilar")
      .select("kullanici_id, ad, soyad, rol, firma_id, takim_id, bolge_id, aktif_mi")
      .eq("kullanici_id", user.id).maybeSingle();
    if (error) throw error;
    const rol = yonetici?.rol?.toLowerCase();
    const ureticiGorunumu = request.nextUrl.pathname === "/eczanem/uretici/api/yayinlar";
    const rolUygun = ureticiGorunumu ? URETICI_ROLLER.includes(rol ?? "") : rol === "bm" || rol === "tm";
    if (!yonetici?.aktif_mi || !rolUygun || !yonetici.firma_id) {
      return rolHatasi("Bu sayfaya erişim yetkiniz yok.");
    }
    const gorunum = request.nextUrl.searchParams.get("gorunum");
    const erisim = await uttEczanemErisimi(db, user.id);
    if (!erisim.ok || !erisim.acik) return rolHatasi(erisim.hata ?? ECZANEM_KAPALI_MESAJI);

    const parametreler = request.nextUrl.searchParams;
    const donem = parametreler.get("donem");
    if ((gorunum !== "eczane" && gorunum !== "uye") ||
      (gorunum === "uye" && (!donem || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(donem)))) {
      return validasyonHatasi("Yayın görünümü veya dönem geçersiz.", ["gorunum", "donem"]);
    }
    const { uttler } = await eclubYonetimKapsaminiGetir(db, yonetici);
    const takimGorunumu = rol === "tm" || ureticiGorunumu;
    const bmSecimi = takimGorunumu && gorunum === "eczane";
    const bmGruplari = new Map<string, { id: string; ad: string; uttIdleri: string[] }>();
    if (bmSecimi) {
      for (const { bm_id, bm_adi, utt_id } of uttler) {
        if (!bm_id) continue;
        const grup = bmGruplari.get(bm_id) ?? { id: bm_id, ad: bm_adi, uttIdleri: [] };
        grup.uttIdleri.push(utt_id);
        bmGruplari.set(bm_id, grup);
      }
    }
    const bolgeler = new Map<string, string>();
    if (takimGorunumu) {
      for (const { bolge_id, bolge_adi } of uttler) {
        if (bolge_id) bolgeler.set(bolge_id, bolge_adi);
      }
    }
    const bolgeId = parametreler.get("bolge_id");
    if (bolgeId !== null && !bolgeler.has(bolgeId)) return rolHatasi("Bu bölge yetki kapsamınızın dışında.");
    const bmId = parametreler.get("bm_id");
    if (bmId !== null && !bmGruplari.has(bmId)) return rolHatasi("Bu BM yetki kapsamınızın dışında.");
    const bolgeUttleri = uttler.filter((utt) =>
      (bolgeId === null || utt.bolge_id === bolgeId) && (bmId === null || utt.bm_id === bmId));
    const istenenUtt = parametreler.get("utt_id");
    const seciliUtt = istenenUtt === null
      ? rol === "bm" || bmSecimi ? bolgeUttleri[0] : undefined
      : bolgeUttleri.find((utt) => utt.utt_id === istenenUtt);
    if (istenenUtt !== null && !seciliUtt) return rolHatasi("Bu UTT yetki kapsamınızın dışında.");

    const firmaId = yonetici.firma_id;
    const kapsam = {
      uttler: bolgeUttleri.map(({ utt_id, utt_adi }) => ({ utt_id, utt_adi })),
      bmGruplari: [...bmGruplari.values()].sort((a, b) => a.ad.localeCompare(b.ad, "tr")),
      bolgeler: [...bolgeler].map(([deger, etiket]) => ({ deger, etiket }))
        .sort((a, b) => a.etiket.localeCompare(b.etiket, "tr")),
      seciliUttId: seciliUtt?.utt_id ?? null,
    };
    const options = { headers: { "Cache-Control": "private, no-store" } };
    if (!bolgeUttleri.length) return NextResponse.json({ ...kapsam, veri: null }, options);
    const uttIds = bolgeUttleri.map(({ utt_id }) => utt_id);

    if (gorunum === "eczane") {
      if (!seciliUtt) return NextResponse.json({ ...kapsam, veri: null }, options);
      const takimId = ureticiGorunumu ? seciliUtt.takim_id ?? null : yonetici.takim_id;
      const veri = await uttEczanemVerisi(db, seciliUtt.utt_id, firmaId, takimId, true);
      const gonderimler = veri.gonderimler.map(({ gonderen_utt_id, yayin_id, eczane_id, created_at }) => ({
        yayin_id, eczane_id, created_at: gonderen_utt_id === seciliUtt.utt_id ? created_at : null,
      }));
      const urunBaglari = ureticiGorunumu ? await yayinUrunleri(db, firmaId, veri.yayinlar) : undefined;
      return NextResponse.json({ ...kapsam, urunBaglari, veri: { ...veri, gonderimler } }, options);
    }

    const simdi = new Date();
    const hedefUttler = seciliUtt?.utt_id ?? uttIds;
    const [ozet, raf] = await Promise.all([
      uttEczanemUyeGonderimOzeti(db, hedefUttler, firmaId, simdi),
      uttEczanemUyeGonderimRafi(db, hedefUttler, firmaId, new Date(`${donem}-15T12:00:00Z`), simdi, true),
    ]);
    const urunBaglari = ureticiGorunumu ? await yayinUrunleri(db, firmaId, raf.yayinlar) : undefined;
    return NextResponse.json({ ...kapsam, urunBaglari, veri: { ozet, raf } }, options);
  } catch (error) {
    return sunucuHatasi(error, "GET /eczanem/bm/api/yayinlar");
  }
}
