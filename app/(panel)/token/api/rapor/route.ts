import { YONETICI_ROLLER } from "@/lib/utils/roller";
import { isTalepTuru, ureticiYetenegi } from "@/lib/uretici/yetenekler";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { yetkiHatasi, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const bm = request.nextUrl.searchParams.get("gorunum") === "bm";
    const tm = request.nextUrl.searchParams.get("gorunum") === "tm";
    const yonetici = request.nextUrl.searchParams.get("gorunum") === "yonetici";
    const takimMuduru = request.nextUrl.searchParams.get("tm_id") || null;
    const bolgeMuduru = request.nextUrl.searchParams.get("bm_id") || null;
    const utt = request.nextUrl.searchParams.get("utt_id") || null;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (takimMuduru && (!yonetici || !uuid.test(takimMuduru))) return validasyonHatasi("Geçersiz takım müdürü seçimi.", ["tm_id"]);
    if (bolgeMuduru && (!(tm || yonetici) || !uuid.test(bolgeMuduru) || (yonetici && !takimMuduru))) return validasyonHatasi("Geçersiz bölge müdürü seçimi.", ["bm_id"]);
    if (utt && (!(bm || tm || yonetici) || !uuid.test(utt) || ((tm || yonetici) && !bolgeMuduru) || (yonetici && !takimMuduru))) return validasyonHatasi("Geçersiz temsilci seçimi.", ["utt_id"]);
    const icerik = request.nextUrl.searchParams.get("gonderi") === "icerik";
    const egitimTuru = request.nextUrl.searchParams.get("egitim_turu");
    if (icerik) {
      if (!yonetici || bm || tm || utt || !isTalepTuru(egitimTuru)) return validasyonHatasi("Geçersiz içerik türü filtresi.", ["egitim_turu"]);
      const rol = await rolCozucu(createAdminClient(),user.id);
      const yetenek = ureticiYetenegi(rol);
      if (!YONETICI_ROLLER.includes(rol) && !yetenek?.acabilecegiTalepTurleri.includes(egitimTuru)) return yetkiHatasi("Bu içerik türüne erişiminiz bulunmuyor.");
    } else if (egitimTuru !== null) return validasyonHatasi("Geçersiz içerik türü filtresi.", ["egitim_turu"]);
    const egitim = request.nextUrl.searchParams.get("gonderi") === "urun_egitimi";
    const oneri = request.nextUrl.searchParams.get("gonderi") === "oneri";
    if ((egitim || oneri) && (!yonetici || bm || tm || utt)) return validasyonHatasi("Geçersiz gönderi filtresi.", ["gonderi"]);
    const result = yonetici
      ? await createAdminClient().rpc("cogniti_token_yonetici_raporu", { p_kullanici: user.id, p_tm: takimMuduru, p_bm: bolgeMuduru, p_utt: utt })
      : tm
      ? await createAdminClient().rpc("cogniti_token_tm_raporu", { p_kullanici: user.id, p_bm: bolgeMuduru, p_utt: utt })
      : bm
      ? await createAdminClient().rpc("cogniti_token_bm_raporu", { p_kullanici: user.id, p_utt: utt })
      : await createAdminClient().rpc("cogniti_token_raporu", { p_kullanici: user.id });
    if (result.error?.code === "42501") return yetkiHatasi("Token raporuna erişiminiz bulunmuyor.");
    if (result.error) { console.error("Token raporu alınamadı",result.error.code); return NextResponse.json({hata:"Token bilgileri alınamadı."},{status:500}); }
    // Eski SQL kurulumu kullanılıyorsa da hareket/alıcı kayıtlarını istemciye taşıma.
    const data = result.data;
    if ((icerik || egitim || oneri) && data?.hesap_var) {
      const ozet = await createAdminClient().rpc(icerik ? "cogniti_token_uretici_icerik_ozeti" : oneri ? "cogniti_token_pm_oneri_ozeti" : "cogniti_token_pm_egitim_ozeti", { p_kullanici: user.id, p_tm: takimMuduru, p_bm: bolgeMuduru, ...(icerik?{p_tur:egitimTuru}:{}) });
      if (ozet.error?.code === "42501") return yetkiHatasi("Gönderi raporuna erişiminiz bulunmuyor.");
      if (ozet.error) { console.error("Gönderi toplamı alınamadı",ozet.error.code); return NextResponse.json({hata:"Gönderi toplamı alınamadı."},{status:500}); }
      data.gun_sonu = { ...data.gun_sonu, [oneri ? "oneri_token" : "egitim_token"]: ozet.data?.token ?? null };
    }
    return NextResponse.json(data && {
      secili_egitim_turu: icerik ? egitimTuru : null, hesap_var: data.hesap_var, kapsam: data.kapsam, yonetici: data.yonetici,
      paket_turu: data.paket_turu, bakiye: data.bakiye, paket_asimi: data.paket_asimi,
      toplam: data.toplam, yuklemeler: data.yuklemeler, gun_sonu: data.gun_sonu,
      ...(bm || tm || yonetici ? { uttler: data.uttler, secili_utt_id: data.secili_utt_id } : {}),
      ...(tm || yonetici ? { bmler: data.bmler, secili_bm_id: data.secili_bm_id } : {}),
      ...(yonetici ? { tmler: data.tmler, secili_tm_id: data.secili_tm_id } : {}),
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return sunucuHatasi(error,"Token raporu"); }
}
