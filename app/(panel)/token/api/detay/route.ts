import { YONETICI_ROLLER } from "@/lib/utils/roller";
import { isTalepTuru, ureticiYetenegi } from "@/lib/uretici/yetenekler";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { vivaDetayRpc } from "@/lib/token/vivaDetay";
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { yetkiHatasi, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { tokenDetaySunumu, type TokenDetayHamSatir } from "@/lib/token/detay";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yetkiHatasi();
    const sayfaMetni = request.nextUrl.searchParams.get("sayfa") ?? "0";
    if (!/^\d{1,5}$/.test(sayfaMetni) || Number(sayfaMetni) > 10000) return validasyonHatasi("Geçersiz sayfa.", ["sayfa"]);
    const gonderi = request.nextUrl.searchParams.get("gonderi") ?? "tumu";
    const arac = request.nextUrl.searchParams.get("arac") ?? "tumu";
    const alici = request.nextUrl.searchParams.get("alici");
    if (alici !== null && (!["eczaci", "eczane_teknisyeni", "eclub"].includes(alici) || gonderi !== "eclub")) return validasyonHatasi("Geçersiz alıcı filtresi.", ["alici"]);
    if (!["tumu", "eclub", "eczanem", "oneri", "urun_egitimi", "icerik"].includes(gonderi)) return validasyonHatasi("Geçersiz gönderi türü.", ["gonderi"]);
    if (!["tumu", "video", "podcast", "gorsel", "flip_pdf", "viva"].includes(arac)) return validasyonHatasi("Geçersiz yayın aracı.", ["arac"]);
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
    if ((bm || tm || yonetici) && gonderi === "tumu") return validasyonHatasi("Gönderi türünü seçin.", ["gonderi"]);
    if (gonderi === "oneri" && (!(bm || tm || yonetici) || (yonetici && utt) || (!yonetici && takimMuduru) || (bm && (utt || bolgeMuduru)) || alici || arac === "viva")) return validasyonHatasi("Geçersiz öneri filtresi.", ["gonderi"]);
    if (gonderi === "urun_egitimi" && (!yonetici || bm || tm || utt || alici || arac === "viva")) return validasyonHatasi("Geçersiz ürün eğitimi filtresi.", ["gonderi"]);
    const admin = createAdminClient();
    const egitimTuru = request.nextUrl.searchParams.get("egitim_turu");
    if (gonderi === "icerik") {
      if (!yonetici || bm || tm || utt || alici || arac === "viva" || !isTalepTuru(egitimTuru)) return validasyonHatasi("Geçersiz içerik türü filtresi.", ["egitim_turu"]);
      const rol = await rolCozucu(admin,user.id);
      const yetenek = ureticiYetenegi(rol);
      if (!YONETICI_ROLLER.includes(rol) && !yetenek?.acabilecegiTalepTurleri.includes(egitimTuru)) return yetkiHatasi("Bu içerik türüne erişiminiz bulunmuyor.");
    } else if (egitimTuru !== null) return validasyonHatasi("Geçersiz içerik türü filtresi.", ["egitim_turu"]);
    if (gonderi === "eczanem" && arac === "viva") return validasyonHatasi("Eczanem için Viva kullanılamaz.", ["arac"]);
    const toplam = request.nextUrl.searchParams.get("toplam");
    const ay = request.nextUrl.searchParams.get("ay");
    if ((toplam !== null && toplam !== "1") || (ay !== null && (!/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(ay) || toplam !== "1"))) return validasyonHatasi("Geçersiz ay filtresi.", ["ay"]);
    if (toplam && (bm || tm || yonetici || takimMuduru || bolgeMuduru || utt || !["eclub", "eczanem"].includes(gonderi))) return validasyonHatasi("Geçersiz toplam kapsamı.", ["toplam"]);
    const result = toplam === "1"
      ? await admin.rpc("cogniti_token_utt_ay_detay_raporu", { p_kullanici:user.id, p_sayfa:Number(sayfaMetni), p_gonderi:gonderi, p_arac:arac, p_alici:alici ?? "eclub", p_ay:ay ? `${ay}-01` : null })
      : gonderi === "icerik"
      ? await admin.rpc("cogniti_token_uretici_icerik_detay_raporu", { p_kullanici:user.id, p_tm:takimMuduru, p_bm:bolgeMuduru, p_sayfa:Number(sayfaMetni), p_arac:arac, p_tur:egitimTuru })
      : gonderi === "urun_egitimi"
      ? await admin.rpc("cogniti_token_pm_egitim_detay_raporu", { p_kullanici: user.id, p_tm: takimMuduru, p_bm: bolgeMuduru, p_sayfa: Number(sayfaMetni), p_arac: arac })
      : gonderi === "oneri"
      ? yonetici
        ? await admin.rpc("cogniti_token_pm_oneri_detay_raporu", { p_kullanici: user.id, p_tm: takimMuduru, p_bm: bolgeMuduru, p_sayfa: Number(sayfaMetni), p_arac: arac })
        : tm
        ? await admin.rpc("cogniti_token_tm_oneri_detay_raporu", { p_kullanici: user.id, p_bm: bolgeMuduru, p_utt: utt, p_sayfa: Number(sayfaMetni), p_arac: arac })
        : await admin.rpc("cogniti_token_bm_oneri_detay_raporu", { p_kullanici: user.id, p_sayfa: Number(sayfaMetni), p_arac: arac })
      : arac === "viva"
      ? await admin.rpc("cogniti_token_viva_detay_raporu", vivaDetayRpc(user.id, Number(sayfaMetni), alici, yonetici ? "yonetici" : tm ? "tm" : bm ? "bm" : "benim", takimMuduru, bolgeMuduru, utt))
      : yonetici
      ? gonderi === "eczanem"
        ? await admin.rpc("cogniti_token_yonetici_eczanem_detay_raporu", { p_kullanici: user.id, p_tm: takimMuduru, p_bm: bolgeMuduru, p_utt: utt, p_sayfa: Number(sayfaMetni), p_arac: arac })
        : await admin.rpc(alici ? "cogniti_token_yonetici_detay_raporu_alici" : "cogniti_token_yonetici_detay_raporu", { p_kullanici: user.id, p_tm: takimMuduru, p_bm: bolgeMuduru, p_utt: utt, p_sayfa: Number(sayfaMetni), p_gonderi: gonderi, p_arac: arac, ...(alici ? { p_alici: alici } : {}) })
      : tm
      ? gonderi === "eczanem"
        ? await admin.rpc("cogniti_token_tm_eczanem_detay_raporu", { p_kullanici: user.id, p_bm: bolgeMuduru, p_utt: utt, p_sayfa: Number(sayfaMetni), p_arac: arac })
        : await admin.rpc(alici ? "cogniti_token_tm_detay_raporu_alici" : "cogniti_token_tm_detay_raporu", { p_kullanici: user.id, p_bm: bolgeMuduru, p_utt: utt, p_sayfa: Number(sayfaMetni), p_gonderi: gonderi, p_arac: arac, ...(alici ? { p_alici: alici } : {}) })
      : bm
      ? gonderi === "eczanem"
        ? await admin.rpc("cogniti_token_bm_eczanem_detay_raporu", { p_kullanici: user.id, p_utt: utt, p_sayfa: Number(sayfaMetni), p_arac: arac })
        : await admin.rpc(alici ? "cogniti_token_bm_detay_raporu_alici" : "cogniti_token_bm_detay_raporu", { p_kullanici: user.id, p_utt: utt, p_sayfa: Number(sayfaMetni), p_gonderi: gonderi, p_arac: arac, ...(alici ? { p_alici: alici } : {}) })
      : gonderi === "eczanem"
      ? await admin.rpc("cogniti_token_eczanem_detay_raporu", { p_kullanici: user.id, p_sayfa: Number(sayfaMetni), p_arac: arac })
      : gonderi === "tumu" && arac === "tumu"
      ? await admin.rpc("cogniti_token_detay_raporu", { p_kullanici: user.id, p_sayfa: Number(sayfaMetni) })
      : await admin.rpc(alici ? "cogniti_token_detay_raporu_filtreli_alici" : "cogniti_token_detay_raporu_filtreli", { p_kullanici: user.id, p_sayfa: Number(sayfaMetni), p_gonderi: gonderi, p_arac: arac, ...(alici ? { p_alici: alici } : {}) });
    if (result.error?.code === "42501") return yetkiHatasi("Token detaylarına erişiminiz bulunmuyor.");
    if (result.error) {
      console.error("Token detayları alınamadı", result.error.code);
      return NextResponse.json({ hata: "Token kullanım detayları alınamadı." }, { status: 500 });
    }
    const data = result.data as { satirlar: TokenDetayHamSatir[]; devami_var: boolean; genel_toplam?: number; ay_toplami?: number | null };
    return NextResponse.json({ satirlar: data.satirlar.map(tokenDetaySunumu), devamiVar: data.devami_var, ...(toplam === "1" ? { genelToplam: data.genel_toplam, ayToplami: data.ay_toplami } : {}) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return sunucuHatasi(error, "Token kullanım detayları"); }
}
