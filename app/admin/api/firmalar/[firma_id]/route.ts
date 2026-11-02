import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
// app/admin/api/firmalar/[firma_id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, veriKontrol, sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";
import { FIRMA_KOLONLARI, FIRMA_KURUM_KOLONLARI } from "@/lib/firma/kolonlar";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { firmaninEksikKullanicilari } from "@/lib/admin/kullaniciDogrulama";
import { firmaAdiBicimle } from "@/lib/utils/firmaAdiBicimle";
import { firmaKonumunuDogrula } from "@/lib/firma/konumReferansi";
import { tekillikIhlaliMi } from "@/lib/admin/hiyerarsiTekillik";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const { firma_id } = await params;
    const kontrol = await firmaYonetimOkumaKontrol(firma_id);
    if (!kontrol.gecerli) return kontrol.yanit;


    if (!firma_id) return validasyonHatasi("firma_id zorunludur.", ["firma_id"]);

    const adminSupabase = createAdminClient();

    const { data: firma, error } = await adminSupabase
      .from("firmalar")
      .select(FIRMA_KURUM_KOLONLARI)
      .eq("firma_id", firma_id)
      .single();

    const firmaKontrol = veriKontrol(firma, "firmalar tablosu SELECT — firma_id kontrolü", "Firma bulunamadı.");
    if (!firmaKontrol.gecerli) return firmaKontrol.yanit;
    if (error) return hataYaniti("Firma sorgulanırken hata oluştu.", "firmalar tablosu SELECT", error, 404);

    return NextResponse.json({ firma }, { status: 200 });

  } catch (err) {
    return sunucuHatasi(err, "GET /admin/api/firmalar/[firma_id]");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const { firma_id } = await params;
    const kontrol = await firmaYonetimIslemKontrol(firma_id);
    if (!kontrol.gecerli) return kontrol.yanit;


    if (!firma_id) return validasyonHatasi("firma_id zorunludur.", ["firma_id"]);

    const adminSupabase = createAdminClient();

    const body = await request.json();
    const { firma_adi, logo_url, ogrenme_platformu_aktif } = body;

    if (typeof firma_adi !== "string" || firma_adi.trim() === "") {
      return validasyonHatasi("Firma adı zorunludur.", ["firma_adi"]);
    }

    const guncelleme: Record<string, unknown> = {
      firma_adi: firmaAdiBicimle(firma_adi),
    };
    if (typeof logo_url === "string" || logo_url === null) {
      guncelleme.logo_url = logo_url;
    }
    if (typeof ogrenme_platformu_aktif === "boolean") {
      guncelleme.ogrenme_platformu_aktif = ogrenme_platformu_aktif;
    }

    const kurumAlanlari = ["adres","vergi_dairesi","vergi_numarasi","sorumlu_ad_soyad","sorumlu_telefon","sorumlu_eposta","il_id","ilce_id","vergi_dairesi_kodu"];
    if (kurumAlanlari.some(alan => Object.hasOwn(body,alan))) {
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
      Object.assign(guncelleme,ekBilgiler,konum.veri);
    }

    const { data: guncellenen, error } = await adminSupabase
      .from("firmalar")
      .update(guncelleme)
      .eq("firma_id", firma_id)
      .select(FIRMA_KURUM_KOLONLARI)
      .single();

    if (tekillikIhlaliMi(error)) {
      return hataYaniti("Bu isimde bir firma zaten mevcut.", "firmalar tablosu UPDATE — tekillik kapısı", null, 422);
    }
    if (error) return hataYaniti("Firma güncellenemedi.", "firmalar tablosu UPDATE", error);

    const guncellenenKontrol = veriKontrol(guncellenen, "firmalar tablosu UPDATE — dönen veri", "Firma güncellendi ancak veri döndürülemedi.");
    if (!guncellenenKontrol.gecerli) return guncellenenKontrol.yanit;

    return NextResponse.json({ mesaj: "Firma güncellendi.", firma: guncellenen }, { status: 200 });

  } catch (err) {
    return sunucuHatasi(err, "PUT /admin/api/firmalar/[firma_id]");
  }
}

// PATCH — firmanın durum bayraklarını günceller.
// Body (en az biri): { hbstore_aktif?: boolean, aktif?: boolean, cc_aktif?: boolean, eclub_aktif?: boolean }
//   - hbstore_aktif: HBStore mağazası açık/kapalı
//   - aktif: firma sisteme erişimi açık/kapalı (pasif → kullanıcılar giriş yapamaz)
//   - cc_aktif: Challenge Club açık/kapalı
//   - eclub_aktif: E-Club açık/kapalı
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const { firma_id } = await params;
    const kontrol = await firmaYonetimIslemKontrol(firma_id);
    if (!kontrol.gecerli) return kontrol.yanit;


    if (!firma_id) return validasyonHatasi("firma_id zorunludur.", ["firma_id"]);

    const adminSupabase = createAdminClient();

    const body = await request.json();
    const { hbstore_aktif, aktif, cc_aktif, eclub_aktif, eczanem_aktif, logo_url, ogrenme_platformu_aktif } = body;

    // Güncellenecek alanları topla (yalnızca gönderilenler)
    const guncelleme: Record<string, unknown> = {};
    if (typeof hbstore_aktif === "boolean") guncelleme.hbstore_aktif = hbstore_aktif;
    if (typeof aktif === "boolean") guncelleme.aktif = aktif;
    if (typeof cc_aktif === "boolean") guncelleme.cc_aktif = cc_aktif;
    if (typeof eclub_aktif === "boolean") guncelleme.eclub_aktif = eclub_aktif;
    if (typeof eczanem_aktif === "boolean") guncelleme.eczanem_aktif = eczanem_aktif;
    if (typeof logo_url === "string" || logo_url === null) guncelleme.logo_url = logo_url;
    if (typeof ogrenme_platformu_aktif === "boolean") guncelleme.ogrenme_platformu_aktif = ogrenme_platformu_aktif;

    if (Object.keys(guncelleme).length === 0) {
      return validasyonHatasi(
        "Güncellenecek alan yok. hbstore_aktif, aktif, cc_aktif, eclub_aktif, eczanem_aktif, logo_url veya ogrenme_platformu_aktif (true/false) gönderin.",
        ["hbstore_aktif", "aktif", "cc_aktif", "eclub_aktif", "eczanem_aktif", "logo_url", "ogrenme_platformu_aktif"]
      );
    }

    // Eczanem yalnız aynı firmanın E-Club'ı açıkken açılabilir.
    if (guncelleme.eczanem_aktif === true && guncelleme.eclub_aktif === false) {
      return validasyonHatasi("Eczanem’i açmak için önce E-Club’ı açın.", ["eclub_aktif", "eczanem_aktif"]);
    }
    // Üst modül kapanınca alt modül de kapanır; yeniden açılış otomatik değildir.
    if (guncelleme.eclub_aktif === false) guncelleme.eczanem_aktif = false;

    // K-A6 — aktivasyon kilidi: firmada eksik bilgili kullanıcı varken firma
    // AKTİFLEŞTİRİLEMEZ; kim ve neden eksik, sebepli mesajla döner.
    if (guncelleme.aktif === true) {
      const eksikSonuc = await firmaninEksikKullanicilari(adminSupabase, firma_id);
      if (!eksikSonuc.ok) return hataYaniti(eksikSonuc.hata, "firmaninEksikKullanicilari — aktivasyon kilidi", null);
      if (eksikSonuc.eksikler.length > 0) {
        const isimler = eksikSonuc.eksikler.slice(0, 5).map((e) => `${e.ad} ${e.soyad} (${e.eksikAlanlar.join(", ")})`).join(", ");
        const fazlasi = eksikSonuc.eksikler.length > 5 ? ` ve ${eksikSonuc.eksikler.length - 5} kişi daha` : "";
        return validasyonHatasi(
          `Firma aktifleştirilemez: ${eksikSonuc.eksikler.length} kullanıcının eksik bilgisi var — önce tamamlayın. Eksikler: ${isimler}${fazlasi}. (Kullanıcı listesinde "Eksik bilgili" filtresiyle görülebilir.)`,
          ["aktif"]
        );
      }
    }

    let firmaGuncellemesi = adminSupabase
      .from("firmalar")
      .update(guncelleme)
      .eq("firma_id", firma_id);
    // Kontrolü UPDATE'in içinde tut: eş zamanlı E-Club kapatması atlanamaz.
    const eclubAcikOlmali = guncelleme.eczanem_aktif === true && guncelleme.eclub_aktif !== true;
    if (eclubAcikOlmali) firmaGuncellemesi = firmaGuncellemesi.eq("eclub_aktif", true);
    const { data: guncellenen, error } = await firmaGuncellemesi
      .select(FIRMA_KOLONLARI)
      .maybeSingle();

    if (!error && !guncellenen && eclubAcikOlmali) {
      return validasyonHatasi("Eczanem’i açmak için önce E-Club’ı açın.", ["eclub_aktif"]);
    }
    if (error?.message?.includes("COGNITI_TOKEN:yeniden_acilis_bakiye_gerekli")) {
      return validasyonHatasi("Firmayı yeniden açmak için önce token yükleyin.", ["aktif"]);
    }
    if (error?.code === "23514" && error.message.includes("firmalar_eczanem_eclub_bagimliligi")) {
      return validasyonHatasi("Eczanem’i açmak için önce E-Club’ı açın.", ["eclub_aktif"]);
    }
    if (error) return hataYaniti("Firma durumu güncellenemedi.", "firmalar tablosu UPDATE — durum", error);

    const guncellenenKontrol = veriKontrol(guncellenen, "firmalar tablosu UPDATE — dönen veri", "Durum güncellendi ancak veri döndürülemedi.");
    if (!guncellenenKontrol.gecerli) return guncellenenKontrol.yanit;

    // Uygun mesajı belirle (tek alan güncellendiyse ona özel mesaj)
    let mesaj = "Firma durumu güncellendi.";
    const tekAlan = Object.keys(guncelleme).length === 1;
    if (guncelleme.eclub_aktif === false && Object.keys(guncelleme).length === 2) {
      mesaj = "E-Club ve Eczanem kapatıldı.";
    } else if (tekAlan && "aktif" in guncelleme) {
      mesaj = guncelleme.aktif ? "Firma aktifleştirildi." : "Firma pasifleştirildi.";
    } else if (tekAlan && "hbstore_aktif" in guncelleme) {
      mesaj = guncelleme.hbstore_aktif ? "Mağaza açıldı." : "Mağaza kapatıldı.";
    } else if (tekAlan && "cc_aktif" in guncelleme) {
      mesaj = guncelleme.cc_aktif ? "Challenge Club açıldı." : "Challenge Club kapatıldı.";
    } else if (tekAlan && "eclub_aktif" in guncelleme) {
      mesaj = guncelleme.eclub_aktif ? "E-Club açıldı." : "E-Club kapatıldı.";
    } else if (tekAlan && "eczanem_aktif" in guncelleme) {
      mesaj = guncelleme.eczanem_aktif ? "Eczanem açıldı." : "Eczanem kapatıldı.";
    } else if (tekAlan && "ogrenme_platformu_aktif" in guncelleme) {
      mesaj = guncelleme.ogrenme_platformu_aktif ? "Öğrenme platformu rozeti açıldı." : "Öğrenme platformu rozeti kapatıldı.";
    } else if (tekAlan && "logo_url" in guncelleme) {
      mesaj = "Firma logosu güncellendi.";
    }

    return NextResponse.json({ mesaj, firma: guncellenen }, { status: 200 });

  } catch (err) {
    return sunucuHatasi(err, "PATCH /admin/api/firmalar/[firma_id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const kontrol = await adminGirisKontrol();
    if (!kontrol.gecerli) return kontrol.yanit;

    const { firma_id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firma_id)) {
      return validasyonHatasi("Geçerli firma_id zorunludur.", ["firma_id"]);
    }
    const body = await request.json().catch(() => null);
    if (typeof body?.onay_firma_adi !== "string" || !body.onay_firma_adi.trim()) {
      return validasyonHatasi("Silmek istediğiniz firmanın adını yazarak onaylayın.", ["onay_firma_adi"]);
    }
    const adminSupabase = createAdminClient();
    // Dışa aktarma ve firma adı kontrolü bağlı kayıtların silinmesiyle aynı transaction'dadır.
    const { data, error } = await adminSupabase.rpc("admin_firma_kalici_sil", {
      p_firma: firma_id,
      p_onay_adi: body.onay_firma_adi,
    });
    if (error) {
      if (["PGRST202", "42883"].includes(error.code)) {
        return hataYaniti("Firma silme SQL kurulumu bekleniyor.", "admin_firma_kalici_sil", null, 503);
      }
      const mesajlar: Record<string, string> = {
        export_gerekli: "Firma silinmeden önce verilerini Excel olarak dışa aktarın.",
        onay_gerekli: "Firma adını yazarak silme işlemini onaylayın.",
        onay_uyusmuyor: "Onay için yazılan ad firmanın adıyla eşleşmiyor.",
        platform_korunur: "Cogniti yönetim kaydı bu işlemle silinemez.",
        bulunamadi: "Firma bulunamadı.",
        bag_temizlenemedi: "Bağlı kayıtlar temizlenemedi. Silme işleminin tamamı geri alındı.",
      };
      const neden = error.message.match(/FIRMA_SIL:([a-z_]+)/)?.[1];
      if (neden && mesajlar[neden]) {
        return hataYaniti(mesajlar[neden], "admin_firma_kalici_sil", null, neden === "bulunamadi" ? 404 : 422);
      }
      return hataYaniti("Firma silinemedi; işlem geri alındı.", "admin_firma_kalici_sil", error);
    }
    if (data?.durum !== "silindi" || data.firma_id !== firma_id) {
      return hataYaniti("Firma silme sonucu doğrulanamadı.", "admin_firma_kalici_sil sonucu", null);
    }
    return NextResponse.json({ mesaj: "Firma ve firmaya ait bağlı kayıtlar silindi." }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "DELETE /admin/api/firmalar/[firma_id]");
  }
}
