import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
// app/admin/api/firmalar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { FIRMA_KOLONLARI } from "@/lib/firma/kolonlar";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { eksikSayilariCikar } from "@/lib/admin/kullaniciDogrulama";
import { firmaAdiBicimle } from "@/lib/utils/firmaAdiBicimle";
import { firmaKonumunuDogrula } from "@/lib/firma/konumReferansi";
import { tekillikIhlaliMi } from "@/lib/admin/hiyerarsiTekillik";


export async function GET() {
  try {
    const kontrol = await firmaYonetimOkumaKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;

    const adminSupabase = createAdminClient();

    let firmaSorgu = adminSupabase
      .from("firmalar")
      .select(FIRMA_KOLONLARI)

      .order("firma_adi", { ascending: true });
    if (kontrol.firmaId) firmaSorgu = firmaSorgu.eq("firma_id", kontrol.firmaId);
    const { data: firmalar, error } = await firmaSorgu;

    if (error) return hataYaniti("Firmalar çekilemedi.", "firmalar tablosu SELECT", error);

    // T-2: firma kartındaki "⚠ N eksik bilgili" rozeti için firma başına eksik
    // sayısı — tüm firmaların kullanıcıları TEK sorguda çekilir (firma başına
    // N+1 yok), sayım saf fonksiyonda (eksik tanımı tek kaynak: kullaniciEksikMi).
    let kullaniciSorgu = adminSupabase
      .from("kullanicilar")
      .select("firma_id, rol, takim_id, bolge_id, telefon");
    if (kontrol.firmaId) kullaniciSorgu = kullaniciSorgu.eq("firma_id", kontrol.firmaId);
    const { data: kullaniciSatirlari, error: kullaniciError } = await kullaniciSorgu;

    if (kullaniciError) {
      return hataYaniti("Eksik bilgili kullanıcı sayıları çekilemedi.", "kullanicilar tablosu SELECT — eksik sayımı (T-2)", kullaniciError);
    }

    const eksikSayilari = eksikSayilariCikar(kullaniciSatirlari ?? []);
    const firmalarYaniti = (firmalar ?? []).map((f) => ({
      ...f,
      eksik_sayisi: eksikSayilari.get(f.firma_id) ?? 0,
    }));

    return NextResponse.json({ firmalar: firmalarYaniti }, { status: 200 });

  } catch (err) {
    return sunucuHatasi(err, "GET /admin/api/firmalar");
  }
}

export async function POST(request: NextRequest) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;

    const adminSupabase = createAdminClient();

    const body = await request.json();
    const { firma_adi } = body;

    if (typeof firma_adi !== "string" || firma_adi.trim() === "") {
      return validasyonHatasi("Firma adı zorunludur.", ["firma_adi"]);
    }

    const alanlar = { adres: 2000, vergi_dairesi: 200, vergi_numarasi: 10, sorumlu_ad_soyad: 200, sorumlu_telefon: 25, sorumlu_eposta: 254, logo_url: 2048 } as const;
    const ekBilgiler: Record<string, string | null> = {};
    for (const [alan, sinir] of Object.entries(alanlar)) {
      const deger = body[alan];
      if (typeof deger !== "string" || !deger.trim()) {
        return validasyonHatasi("Logo dahil tüm firma bilgileri zorunludur.", [alan]);
      }
      if (deger != null && (typeof deger !== "string" || deger.trim().length > sinir)) {
        return validasyonHatasi(`Firma bilgisi geçersiz veya çok uzun: ${alan}.`, [alan]);
      }
      ekBilgiler[alan] = typeof deger === "string" && deger.trim() ? deger.trim() : null;
    }
    if (ekBilgiler.vergi_numarasi && !/^\d{10}$/.test(ekBilgiler.vergi_numarasi)) {
      return validasyonHatasi("Vergi numarası 10 haneli sayı olmalıdır.", ["vergi_numarasi"]);
    }
    if (ekBilgiler.sorumlu_telefon && !/^\+?[\d\s()-]+$/.test(ekBilgiler.sorumlu_telefon)) {
      return validasyonHatasi("Geçerli bir cep telefonu numarası girin.", ["sorumlu_telefon"]);
    }
    if (ekBilgiler.sorumlu_telefon) {
      const rakamlar = ekBilgiler.sorumlu_telefon.replace(/\D/g, "");
      if (rakamlar.length < 10 || rakamlar.length > 15) return validasyonHatasi("Geçerli bir cep telefonu numarası girin.", ["sorumlu_telefon"]);
    }
    if (ekBilgiler.sorumlu_eposta) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ekBilgiler.sorumlu_eposta)) {
        return validasyonHatasi("Geçerli bir e-posta adresi girin.", ["sorumlu_eposta"]);
      }
      ekBilgiler.sorumlu_eposta = ekBilgiler.sorumlu_eposta.toLowerCase();
    }
    if (ekBilgiler.logo_url && !/^(https?:\/\/|\/(?!\/))/.test(ekBilgiler.logo_url)) {
      return validasyonHatasi("Logo adresi geçersiz.", ["logo_url"]);
    }

    const konum = firmaKonumunuDogrula(body);
    if (!konum.gecerli) return validasyonHatasi(konum.hata,konum.alanlar);

    const bicimliFirmaAdi = firmaAdiBicimle(firma_adi);

    // Aynı isimde firma var mı kontrol et
    const { data: mevcutFirma, error: mevcutError } = await adminSupabase
      .from("firmalar")
      .select("firma_id")
      .eq("firma_adi", bicimliFirmaAdi)
      .single();

    if (mevcutError && mevcutError.code !== "PGRST116") {
      return hataYaniti("Firma kontrolü yapılamadı.", "firmalar tablosu SELECT — tekrar kontrolü", mevcutError);
    }

    if (mevcutFirma) {
      return hataYaniti("Bu isimde bir firma zaten mevcut.", "firmalar tablosu SELECT — tekrar kontrolü", null, 422);
    }

    const { data: yeniFirma, error } = await adminSupabase
      .from("firmalar")
      .insert({ firma_adi: bicimliFirmaAdi, ...ekBilgiler, ...konum.veri, ogrenme_platformu_aktif: Boolean(ekBilgiler.logo_url) })
      .select(FIRMA_KOLONLARI)

      .single();

    if (tekillikIhlaliMi(error)) {
      return hataYaniti("Bu isimde bir firma zaten mevcut.", "firmalar tablosu INSERT — tekillik kapısı", null, 422);
    }
    if (error) return hataYaniti("Firma eklenemedi.", "firmalar tablosu INSERT", error);

    return NextResponse.json({ mesaj: "Firma eklendi.", firma: yeniFirma }, { status: 201 });

  } catch (err) {
    return sunucuHatasi(err, "POST /admin/api/firmalar");
  }
}
