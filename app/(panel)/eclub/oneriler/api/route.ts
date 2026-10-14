// app/eclub/oneriler/api/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, yetkiHatasi, rolHatasi, validasyonHatasi, isKuraluHatasi } from "@/lib/utils/hataIsle";
import { GONDERIM_LIMITLERI, gonderimIsteginiOku, planTarihiniRpcGirdisineCevir, planTarihAdaylari, sayfalamaOku } from "@/lib/eclub/gonderimApi";
import type { GonderimKontrolSonucu } from "@/lib/eclub/gonderimPlanTipleri";
import { eclubBildirimOlustur } from "@/lib/utils/eclubBildirim";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { TUKETICI_ROLLER, hedefRolleriOku, type HedefRoller } from "@/lib/utils/roller";
import { eclubYayinKapsamindaMi } from "@/lib/eclub/oneriKapsam";
import { yayinAraciKullanimaAcikMi } from "@/lib/ogrenmeAraci/bayraklar";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

interface KisiEczaneBagSatiri {
  kisi_id: string;
  eczane_id: string;
  baslangic_tarihi: string | null;
  bitis_tarihi: string | null;
  created_at: string | null;
}
interface EczaneGlnSatiri { eczane_id: string; gln: string; }
interface EczaneMasterSatiri { gln: string; eczane_adi: string; }
interface OneriKisiKimlik { ad: string | null; soyad: string | null; rol: string | null; }
interface OneriKayitSatiri {
  oneri_id: string;
  yayin_id: string;
  arac_id: string;
  arac_turu: OgrenmeAraciTuru;
  kisi_id: string;
  oneri_baslangic: string;
  oneri_bitis: string;
  izlendi_mi: boolean | null;
  created_at: string | null;
  eclub_kisiler?: OneriKisiKimlik | OneriKisiKimlik[] | null;
}
interface YayinAdiSatiri {
  yayin_id: string;
  urun_adi: string | null;
  teknik_adi: string | null;
  talep_no: number | null;
  firma_adi: string | null;
  hedef_roller: unknown;
}
function tekilIliski<T>(deger: T | T[] | null | undefined): T | null {
  if (!deger) return null;
  return Array.isArray(deger) ? (deger[0] ?? null) : deger;
}

// Gönderim anındaki kişi-eczane bağından "oneri_id → eczane_adi" haritası kurar.
// Tarih aralığı E-Club raporundaki geçmiş üyelik kuralıyla aynıdır.
async function oneriEczaneAdiMap(
  adminSupabase: ReturnType<typeof createAdminClient>,
  oneriler: OneriKayitSatiri[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (oneriler.length === 0) return map;
  const kisiIdler = [...new Set(oneriler.map((oneri) => oneri.kisi_id))];

  // Pasif bağlar da geçmiş gönderimler için gereklidir.
  const { data: baglar, error: bagError } = await adminSupabase
    .from("eclub_kisi_eczane")
    .select("kisi_id, eczane_id, baslangic_tarihi, bitis_tarihi, created_at")
    .in("kisi_id", kisiIdler);

  if (bagError) throw new Error(`eclub_kisi_eczane SELECT — eczane adı: ${bagError.message}`);
  const bagSatirlari = (baglar ?? []) as KisiEczaneBagSatiri[];
  if (bagSatirlari.length === 0) return map;

  const eczaneIdler = [...new Set(bagSatirlari.map((b) => b.eczane_id))];

  // 2. Eczane → gln
  const { data: eczaneler, error: eczaneError } = await adminSupabase
    .from("eclub_eczaneler")
    .select("eczane_id, gln")
    .in("eczane_id", eczaneIdler);

  if (eczaneError) throw new Error(`eclub_eczaneler SELECT — eczane adı: ${eczaneError.message}`);
  const eczaneSatirlari = (eczaneler ?? []) as EczaneGlnSatiri[];
  const eczaneGlnMap = new Map<string, string>();
  for (const e of eczaneSatirlari) eczaneGlnMap.set(e.eczane_id, e.gln);

  const glnler = [...new Set(eczaneSatirlari.map((e) => e.gln))];

  // 3. gln → eczane_adi (master)
  const { data: masterlar, error: masterError } = await adminSupabase
    .from("eclub_eczane_master")
    .select("gln, eczane_adi")
    .in("gln", glnler);

  if (masterError) throw new Error(`eclub_eczane_master SELECT — eczane adı: ${masterError.message}`);
  const glnAdiMap = new Map<string, string>();
  for (const m of (masterlar ?? []) as EczaneMasterSatiri[]) glnAdiMap.set(m.gln, m.eczane_adi);

  const baglarKisiyeGore = new Map<string, KisiEczaneBagSatiri[]>();
  for (const bag of bagSatirlari) {
    const kisiBaglari = baglarKisiyeGore.get(bag.kisi_id) ?? [];
    kisiBaglari.push(bag);
    baglarKisiyeGore.set(bag.kisi_id, kisiBaglari);
  }

  for (const oneri of oneriler) {
    const gonderimZamani = new Date(oneri.created_at ?? oneri.oneri_baslangic).getTime();
    const bag = (baglarKisiyeGore.get(oneri.kisi_id) ?? [])
      .filter((aday) => {
        const baslangic = aday.baslangic_tarihi ?? aday.created_at;
        return (baslangic === null || new Date(baslangic).getTime() <= gonderimZamani)
          && (aday.bitis_tarihi === null || gonderimZamani < new Date(aday.bitis_tarihi).getTime());
      })
      .sort((a, b) => {
        const aBaslangic = a.baslangic_tarihi ?? a.created_at;
        const bBaslangic = b.baslangic_tarihi ?? b.created_at;
        return (bBaslangic === null ? -Infinity : new Date(bBaslangic).getTime())
          - (aBaslangic === null ? -Infinity : new Date(aBaslangic).getTime())
          || (b.created_at === null ? -Infinity : new Date(b.created_at).getTime())
          - (a.created_at === null ? -Infinity : new Date(a.created_at).getTime());
      })[0];
    if (!bag) continue;
    const gln = eczaneGlnMap.get(bag.eczane_id);
    const adi = gln ? glnAdiMap.get(gln) : null;
    if (adi) map.set(oneri.oneri_id, adi);
  }

  return map;
}

// ─── GET: UTT'nin öneri geçmişi ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const rol = await rolCozucu(adminSupabase, user.id);
    if (!TUKETICI_ROLLER.includes(rol)) return rolHatasi("Bu sayfaya yalnız UTT/KD_UTT erişebilir.");

    if (request.nextUrl.searchParams.get("yalniz_limit") === "1") {
      return NextResponse.json({ limitler: GONDERIM_LIMITLERI });
    }
    let sayfalama;
    try { sayfalama = sayfalamaOku(request.nextUrl.searchParams); }
    catch (error) { return validasyonHatasi(error instanceof Error ? error.message : 'Geçersiz sayfalama.'); }
    const { sayfa, sayfa_boyutu, baslangic } = sayfalama;
    if (request.nextUrl.searchParams.get('kaynak') === 'planlar') {
      const { data: planlar, count, error } = await adminSupabase.from('eclub_yayin_gonderim_planlari')
        .select('plan_id, kisi_id, yayin_id, urun_id, hedef_gonderim_at, durum, oneri_id, gerceklesti_at, son_hata_kodu, created_at, eclub_kisiler(ad, soyad, rol)', { count: 'exact' })
        .eq('utt_id', user.id).order('created_at', { ascending: false }).order('plan_id', { ascending: false })
        .range(baslangic, baslangic + sayfa_boyutu - 1);
      if (error) return hataYaniti('Planlar alınamadı.', 'eclub_yayin_gonderim_planlari SELECT', error);
      const yayinIdler = [...new Set((planlar ?? []).map(p => p.yayin_id))];
      const { data: yayinlar, error: yayinHatasi } = yayinIdler.length ? await adminSupabase.from('v_yayin_detay')
        .select('yayin_id, urun_adi, firma_adi, talep_no, hedef_roller, arac_turu').in('yayin_id', yayinIdler) : { data: [], error: null };
      if (yayinHatasi) return hataYaniti('Plan yayın bilgileri alınamadı.', 'v_yayin_detay SELECT — planlar', yayinHatasi);
      const yayinMap = new Map((yayinlar ?? []).map(y => [y.yayin_id, y]));
      const planSonucu = (planlar ?? []).map(p => {
        const kisi = tekilIliski(p.eclub_kisiler as OneriKisiKimlik | OneriKisiKimlik[] | null);
        const yayin = yayinMap.get(p.yayin_id);
        const { eclub_kisiler: kimlik, hedef_gonderim_at: hedef_gonderim_tarihi, ...plan } = p;
        void kimlik;
        return { ...plan, hedef_gonderim_tarihi, kisi_ad: kisi?.ad ?? '-', kisi_soyad: kisi?.soyad ?? '-', kisi_rol: kisi?.rol ?? null,
          urun_adi: yayin?.urun_adi ?? 'Yayın bilgisi alınamadı', firma_adi: yayin?.firma_adi ?? null,
          talep_no: yayin?.talep_no ?? null, hedef_roller: yayin ? hedefRolleriOku(yayin) : [], arac_turu: yayin?.arac_turu ?? null };
      });
      return NextResponse.json({ planlar: planSonucu, limitler: GONDERIM_LIMITLERI,
        sayfalama: { sayfa, sayfa_boyutu, toplam: count, devam_var: baslangic + sayfa_boyutu < (count ?? 0) } });
    }
    // UTT'nin gönderdiği öneriler + alıcı (eclub_kisiler) temel bilgisi.
    // Eczane adı ayrı sorgu+Map ile çözülür (eczane bağı eclub_kisiler'de değil,
    // eclub_kisi_eczane → eclub_eczaneler → eclub_eczane_master zincirindedir).
    const { data: oneriler, count, error } = await adminSupabase
      .from("eclub_oneri_kayitlari")
      .select(`
        oneri_id, yayin_id, arac_id, arac_turu, kisi_id, oneri_baslangic, oneri_bitis, izlendi_mi, created_at,
        eclub_kisiler ( ad, soyad, rol )
      `, { count: "exact" })
      .eq("oneren_id", user.id)
      .order("created_at", { ascending: false }).order("oneri_id", { ascending: false })
      .range(baslangic, baslangic + sayfa_boyutu - 1);

    if (error) return hataYaniti("Öneri geçmişi çekilemedi.", "eclub_oneri_kayitlari SELECT — oneren_id filtresi", error);

    // Her geçmiş gönderimin eczanesini gönderim anındaki üyelikten çöz.
    const oneriSatirlari = (oneriler ?? []) as OneriKayitSatiri[];
    const eczaneAdiMap = await oneriEczaneAdiMap(adminSupabase, oneriSatirlari);

    // Yayın adlarını toplu çek (v_yayin_detay)
    const yayinIds = [...new Set(oneriSatirlari.map((o) => o.yayin_id))];
    const yayinAdiMap = new Map<string, { urun_adi: string | null; teknik_adi: string | null; talep_no: number | null; firma_adi: string | null; hedef_roller: HedefRoller }>();
    if (yayinIds.length > 0) {
      const { data: yayinlar, error: yayinlarError } = await adminSupabase
        .from("v_yayin_detay")
        .select("yayin_id, urun_adi, teknik_adi, talep_no, firma_adi, hedef_roller")
        .in("yayin_id", yayinIds);
      if (yayinlarError)
        return hataYaniti("Öneri yayın bilgileri çekilemedi.", "v_yayin_detay SELECT — öneri geçmişi", yayinlarError);
      for (const y of (yayinlar ?? []) as YayinAdiSatiri[]) {
        yayinAdiMap.set(y.yayin_id, {
          urun_adi: y.urun_adi,
          teknik_adi: y.teknik_adi,
          talep_no: y.talep_no,
          firma_adi: y.firma_adi,
          hedef_roller: hedefRolleriOku(y),
        });
      }
    }

    const sonuc = oneriSatirlari.map((o) => {
      const kisi = tekilIliski(o.eclub_kisiler);
      const yayin = yayinAdiMap.get(o.yayin_id) ?? { urun_adi: null, teknik_adi: null, talep_no: null, firma_adi: null, hedef_roller: [] };
      return {
        oneri_id: o.oneri_id,
        yayin_id: o.yayin_id,
        arac_id: o.arac_id,
        arac_turu: o.arac_turu,
        urun_adi: yayin.urun_adi ?? "-",
        teknik_adi: yayin.teknik_adi ?? "-",
        talep_no: yayin.talep_no,
        firma_adi: yayin.firma_adi,
        hedef_roller: yayin.hedef_roller,
        kisi_id: o.kisi_id,
        kisi_ad: kisi?.ad ?? "-",
        kisi_soyad: kisi?.soyad ?? "-",
        kisi_rol: kisi?.rol ?? null,
        eczane_adi: eczaneAdiMap.get(o.oneri_id) ?? "-",
        oneri_baslangic: o.oneri_baslangic,
        oneri_bitis: o.oneri_bitis,
        izlendi_mi: o.izlendi_mi ?? false,
        created_at: o.created_at ?? o.oneri_baslangic,
      };
    });

    return NextResponse.json({
      oneriler: sonuc, limitler: GONDERIM_LIMITLERI,
      sayfalama: { sayfa, sayfa_boyutu, toplam: count, devam_var: baslangic + sayfa_boyutu < (count ?? 0) },
    });

  } catch (err) {
    return sunucuHatasi(err, "GET /eclub/oneriler/api");
  }
}

// POST: anlık gönderim, plan kaydı veya aynı seçimin salt okunur uygunluk kontrolü.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();
    const rol = await rolCozucu(adminSupabase, user.id);
    if (!TUKETICI_ROLLER.includes(rol)) return rolHatasi('Bu işlemi yalnız UTT/KD_UTT yapabilir.');
    let secim;
    let tarihleriHesapla = true;
    try {
      const body = await request.json();
      secim = gonderimIsteginiOku(body);
      if (body.tarihleri_hesapla !== undefined && typeof body.tarihleri_hesapla !== 'boolean') throw new Error('Tarih kontrolü seçeneği geçersiz.');
      tarihleriHesapla = body.tarihleri_hesapla !== false;
    }
    catch (error) { return validasyonHatasi(error instanceof Error ? error.message : 'Geçersiz istek.'); }

    const { data: utt, error: uttError } = await adminSupabase.from('kullanicilar')
      .select('firma_id, takim_id').eq('kullanici_id', user.id).maybeSingle();
    if (uttError || !utt?.firma_id) return hataYaniti('UTT kapsamı alınamadı.', 'kullanicilar SELECT', uttError);
    const { data: yayinlar, error: yayinError } = await adminSupabase.from('v_yayin_detay')
      .select('yayin_id, firma_id, takim_id, arac_turu, urun_adi').in('yayin_id', secim.yayin_idler);
    if (yayinError) return hataYaniti('Yayın bilgileri alınamadı.', 'v_yayin_detay SELECT', yayinError);
    const yayinMap = new Map((yayinlar ?? []).map(y => [y.yayin_id as string, y]));
    for (const id of secim.yayin_idler) {
      const yayin = yayinMap.get(id);
      if (!yayin || !eclubYayinKapsamindaMi(utt, yayin)) return isKuraluHatasi('Seçilen yayınlardan biri erişim kapsamınızda değil.');
      if (!yayinAraciKullanimaAcikMi(yayin.arac_turu)) return isKuraluHatasi('Seçilen öğrenme araçlarından biri kullanıma kapalı.');
    }
    const parametreler = {
      p_utt_id: user.id, p_kisi_idler: secim.kisi_idler, p_yayin_idler: secim.yayin_idler,
      p_hedef_at: secim.hedef_gonderim_tarihi ? planTarihiniRpcGirdisineCevir(secim.hedef_gonderim_tarihi) : null,
      p_islem_anahtari: secim.islem_anahtari,
      p_onizleme: secim.islem === 'kontrol',
    };
    const { data, error } = await adminSupabase.rpc('eclub_yayin_toplu_islem', parametreler);
    if (error || !data) return hataYaniti('Gönderim işlemi tamamlanamadı.', 'eclub_yayin_toplu_islem RPC', error);
    const sonuc = data as { sonuclar: GonderimKontrolSonucu[] };
    if (!Array.isArray(sonuc.sonuclar)) throw new Error('Toplu gönderim sonucu okunamadı.');

    // Gün bazında, bütün seçimler için birlikte uygun olan tarihler.
    const uygunTarihler: string[] = [];
    if (secim.islem === 'kontrol' && secim.hedef_gonderim_tarihi && tarihleriHesapla) {
      for (const hedef of planTarihAdaylari()) {
        const { data: aday, error: adayError } = await adminSupabase.rpc('eclub_yayin_toplu_islem', {
          ...parametreler, p_hedef_at: planTarihiniRpcGirdisineCevir(hedef), p_onizleme: true,
        });
        if (adayError || !aday) return hataYaniti('Uygun tarihler hesaplanamadı.', 'eclub_yayin_toplu_islem önizleme', adayError);
        const sonuclar = (aday as { sonuclar: GonderimKontrolSonucu[] }).sonuclar;
        if (!Array.isArray(sonuclar)) throw new Error('Tarih kontrolü okunamadı.');
        if (sonuclar.length && sonuclar.every(s => s.uygun)) uygunTarihler.push(hedef);
      }
    }
    const kaydedilenler = sonuc.sonuclar.filter(s => s.kaydedildi);
    // Plan oluştururken bildirim yoktur; yalnız gerçek öneri kayıtları bildirilir.
    if (secim.islem === 'gonder') {
      for (const kayit of kaydedilenler) {
        if (!kayit.oneri_id) throw new Error('Gönderimin öneri kimliği eksik.');
        const yayin = yayinMap.get(kayit.yayin_id)!;
        await eclubBildirimOlustur({ adminSupabase, alici_kisi_id: kayit.kisi_id,
          firma_id: yayin.firma_id, gonderen_id: user.id, kayit_turu: 'oneri', kayit_id: kayit.oneri_id,
          mesaj: `Size yeni bir öğrenme içeriği önerildi: ${yayin.urun_adi}` });
      }
    }
    return NextResponse.json({
      ...data, limitler: GONDERIM_LIMITLERI, uygun_tarihler: uygunTarihler,
      mesaj: secim.islem === 'kontrol' ? 'Gönderim uygunluğu kontrol edildi.'
        : `${kaydedilenler.length} ${secim.islem === 'planla' ? 'gönderim planlandı' : 'yayın gönderildi'}.`,
      gonderilen_sayisi: secim.islem === 'gonder' ? kaydedilenler.length : 0,
      planlanan_sayisi: secim.islem === 'planla' ? kaydedilenler.length : 0,
      gonderilen: secim.islem === 'gonder' ? kaydedilenler.map(s => s.kisi_id) : [],
      atlanan: sonuc.sonuclar.filter(s => s.sebep).map(s => ({ kisi_id: s.kisi_id, yayin_id: s.yayin_id,
        sebep: s.sebep, yeniden_gonderilebilir_at: s.yeniden_gonderilebilir_at ?? undefined })),
    }, { status: secim.islem === 'kontrol' ? 200 : 201 });
  } catch (err) { return sunucuHatasi(err, 'POST /eclub/oneriler/api'); }
}
