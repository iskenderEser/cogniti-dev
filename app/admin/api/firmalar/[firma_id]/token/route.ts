import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ firma_id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const { firma_id } = await params;
    if (!UUID.test(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const db = createAdminClient();
    const [account, balance, loads, usage, users] = await Promise.all([
      db.from("cogniti_token_hesaplari").select("paket_turu,aylik_paket_miktari,onay_yetkili_id,token_pasif_at,token_pasif_neden").eq("firma_id", firma_id).maybeSingle(),
      db.rpc("cogniti_token_bakiye", { p_firma: firma_id }),
      db.from("cogniti_token_yuklemeleri").select("yukleme_id,yukleme_turu,miktar,kalan,son_kullanim_at,aciklama,created_at").eq("firma_id", firma_id).order("created_at", { ascending: false }).limit(50),
      db.from("cogniti_token_tuketimleri").select("tuketim_id,gonderen_turu,gonderen_id,alici_turu,alici_kimligi,islem_turu,kaynak_id,asim_miktari,created_at").eq("firma_id", firma_id).order("created_at", { ascending: false }).limit(50),
      db.from("kullanicilar").select("kullanici_id,ad,soyad,rol").eq("firma_id", firma_id).eq("aktif_mi", true).order("ad"),
    ]);
    const error = account.error ?? balance.error ?? loads.error ?? usage.error ?? users.error;
    if (error) return hataYaniti("Token bilgileri alınamadı.", "admin token GET", error);
    return NextResponse.json({ hesap: account.data, bakiye: balance.data?.[0] ?? null, yuklemeler: loads.data ?? [], tuketimler: usage.data ?? [], kullanicilar: users.data ?? [] });
  } catch (error) { return sunucuHatasi(error, "admin token GET"); }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const { firma_id } = await params;
    if (!UUID.test(firma_id)) return validasyonHatasi("Geçersiz firma.", ["firma_id"]);
    const body = await request.json();
    const db = createAdminClient();
    if (body.islem === "yetkili") {
      if (typeof body.kullanici_id !== "string" || !UUID.test(body.kullanici_id)) return validasyonHatasi("Yetkili seçin.", ["kullanici_id"]);
      const person = await db.from("kullanicilar").select("kullanici_id").eq("kullanici_id", body.kullanici_id).eq("firma_id", firma_id).eq("aktif_mi", true).maybeSingle();
      if (person.error) return hataYaniti("Yetkili kontrol edilemedi.", "admin token yetkili", person.error);
      if (!person.data) return validasyonHatasi("Firma için aktif kullanıcı seçin.", ["kullanici_id"]);
      const updated = await db.from("cogniti_token_hesaplari").update({ onay_yetkili_id: body.kullanici_id }).eq("firma_id", firma_id).eq("paket_turu", "kullandigin_kadar_ode").select("firma_id").maybeSingle();
      if (updated.error) return hataYaniti("Yetkili kaydedilemedi.", "admin token yetkili UPDATE", updated.error);
      if (!updated.data) return validasyonHatasi("KKÖ hesabı bulunamadı.", ["firma_id"]);
      return NextResponse.json({ ok: true });
    }
    if (typeof body.anahtar !== "string" || !UUID.test(body.anahtar)) return validasyonHatasi("İşlem anahtarı geçersiz.", ["anahtar"]);
    if (body.islem === "hesap_ac") {
      if (!["aylik", "kullandigin_kadar_ode"].includes(body.paket)) return validasyonHatasi("Paket seçin.", ["paket"]);
      if (body.paket === "aylik" && ![10000, 30000, 75000].includes(body.miktar)) return validasyonHatasi("Aylık paket seçin.", ["miktar"]);
      const result = await db.rpc("cogniti_token_hesap_olustur", { p_firma: firma_id, p_paket: body.paket, p_aylik_miktar: body.paket === "aylik" ? body.miktar : null, p_admin: auth.kullaniciId, p_anahtar: body.anahtar });
      if (result.error) return hataYaniti("Token hesabı açılamadı.", "admin token hesap", result.error);
      return NextResponse.json({ ok: true });
    }
    if (body.islem === "yukle") {
      if (!Number.isSafeInteger(body.miktar) || body.miktar < 1 || body.miktar > 10000000 || typeof body.aciklama !== "string" || !body.aciklama.trim() || body.aciklama.length > 500) return validasyonHatasi("Geçerli miktar ve açıklama girin.", ["miktar", "aciklama"]);
      const result = await db.rpc("cogniti_token_yukle", { p_firma: firma_id, p_tur: "admin_duzeltme", p_miktar: body.miktar, p_anahtar: body.anahtar, p_yil: null, p_ay: null, p_olusturan: auth.kullaniciId, p_aciklama: body.aciklama.trim() });
      if (result.error) return hataYaniti("Token yüklenemedi.", "admin token yükle", result.error);
      return NextResponse.json({ ok: true });
    }
    return validasyonHatasi("Geçersiz işlem.", ["islem"]);
  } catch (error) { return sunucuHatasi(error, "admin token POST"); }
}
