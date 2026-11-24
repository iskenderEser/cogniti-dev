// app/(panel)/eczanem/eczane/api/musteri-ekle/route.ts
// Eczacı/teknisyen — yeni müşteri kaydı (şifre oluşturma daveti) veya mevcut
// müşteriyi eczaneye bağlama. Telefon sistemde varsa kimlik/auth yeniden
// oluşturulmaz; yalnız eczane üyeliği kurulur. Yeni müşteride Ad Soyad /
// Cep Tel / E-posta zorunludur; şifre eczane tarafından belirlenmez, 24 saat
// geçerli tek kullanımlık davet bağlantısıyla üye tarafından oluşturulur.

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, validasyonHatasi, yetkiHatasi, rolHatasi, isKuraluHatasi } from "@/lib/utils/hataIsle";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { eczaciAktifEczanesi } from "@/lib/eczanem/eczaci";
import { telefonNormalize } from "@/lib/eczanem/telefon";
import {
  DIGER_KIMLIK_MUSTERI_OLAMAZ_MESAJI,
  ECLUB_UYESI_MUSTERI_OLAMAZ_MESAJI,
  digerKimlikTelefonuMu,
  eclubUyesiTelefonMu,
} from "@/lib/eczanem/eclubUyesiKontrol";
import { authTelafisiYap, provizyonBaslat, provizyonDurumuYaz } from "@/lib/kimlik/provizyon";
import { adSoyadBicimle } from "@/lib/utils/adSoyadBicimle";
import { eczanemDavetAltyapisiKontrol, kayitSonrasiEczanemDavetiGonder } from "@/lib/eczanem/uyelikDaveti";
import { baglamaTalebiEpostasiGonder } from "@/lib/eczanem/baglamaTalebiEposta";
import { eczanemTelefonSorguIzniAl } from "@/lib/eczanem/telefonSorguSiniri";


function epostaGecerliMi(eposta: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta);
}

function epostaCakismasiMi(mesaj?: string): boolean {
  return /already|registered|exists|duplicate/i.test(mesaj ?? "");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const rol = await rolCozucu(adminSupabase, user.id);
    if (!ECLUB_TUKETICI_ROLLERI.includes(rol))
      return rolHatasi("Müşteri kaydı yalnızca eczacı/teknisyen tarafından yapılabilir.");

    const eden = await eczaciAktifEczanesi(adminSupabase, user.id);
    if (!eden.ok) return isKuraluHatasi(eden.hata ?? "Aktif eczane bağınız bulunamadı.");

    const body = await request.json();
    const telefon = telefonNormalize(body?.telefon ?? "");
    if (!telefon) return validasyonHatasi("Geçerli bir cep telefonu girin.", ["telefon"]);

    // Telefon sorgulamada hız sınırı ve şifreli denetim kaydı E-Club/Eczanem
    // varlık kontrollerinden ÖNCE çalışır; toplu numara taramasını kapatır.
    if (body?.islem === "sorgula") {
      const sinir = await eczanemTelefonSorguIzniAl(adminSupabase, {
        eczaneId: eden.eczaneId!,
        kisiId: eden.kisiId!,
        telefon,
      });
      if (!sinir.ok) {
        return sunucuHatasi(sinir.dbHatasi, "eczanem_telefon_sorgu_kontrol RPC");
      }
      if (!sinir.izinli) {
        return NextResponse.json({ hata: sinir.hata }, { status: 429 });
      }
    }

    // E-Club kimliği ile Eczanem müşteri kimliği global olarak ayrıdır.
    // Kontrol eczane bağına değil telefona bakar; başka eczanedeki E-Club
    // üyesi de bu eczaneye müşteri olarak kaydedilemez.
    const eclubKontrol = await eclubUyesiTelefonMu(adminSupabase, telefon);
    if (!eclubKontrol.ok) {
      return sunucuHatasi(eclubKontrol.hata, "eclub_kisiler SELECT — Eczanem müşteri telefon kontrolü");
    }
    if (eclubKontrol.uyeMi) return isKuraluHatasi(ECLUB_UYESI_MUSTERI_OLAMAZ_MESAJI);

    const digerKimlikKontrol = await digerKimlikTelefonuMu(adminSupabase, telefon);
    if (!digerKimlikKontrol.ok) {
      return sunucuHatasi(digerKimlikKontrol.hata, "eczanem_telefon_baska_kimlik_kontrol RPC");
    }
    if (digerKimlikKontrol.cakismaVar) {
      return isKuraluHatasi(digerKimlikKontrol.mesaj ?? DIGER_KIMLIK_MUSTERI_OLAMAZ_MESAJI);
    }

    const islem = body?.islem === "sorgula" ? "sorgula" : body?.islem === "bagla" ? "bagla" : "kaydet";

    // Telefon = tek kimlik, eczane bağı = çoklu (REDBOOK §5.1). Mevcut
    // müşterinin auth hesabına ve kimlik bilgilerine ikinci eczane dokunamaz.
    const { data: mevcut, error: mevcutHatasi } = await adminSupabase
      .from("eczanem_musteriler")
      .select("musteri_id, aktif_mi, auth_user_id")
      .eq("telefon", telefon)
      .maybeSingle();
    if (mevcutHatasi) return sunucuHatasi(mevcutHatasi, "eczanem_musteriler SELECT — telefon");

    let mevcutDavetBekliyor = false;
    if (mevcut?.auth_user_id) {
      const { data: bekleyenDavet, error: bekleyenDavetHatasi } = await adminSupabase
        .from("eczanem_uyelik_davetleri")
        .select("durum")
        .eq("auth_user_id", mevcut.auth_user_id)
        .neq("durum", "tamamlandi")
        .maybeSingle();
      if (bekleyenDavetHatasi && bekleyenDavetHatasi.code !== "42P01") {
        return sunucuHatasi(bekleyenDavetHatasi, "eczanem_uyelik_davetleri SELECT — mevcut kontrol");
      }
      mevcutDavetBekliyor = Boolean(bekleyenDavet);
    }

    if (islem === "sorgula") {
      if (!mevcut) {
        return NextResponse.json({ ok: true, durum: "yeni", mesaj: "Bu telefonla kayıtlı Eczanem müşterisi bulunamadı." }, { status: 200 });
      }
      if (mevcutDavetBekliyor) {
        return isKuraluHatasi("Bu telefonla bekleyen bir üyelik daveti bulunuyor; üye şifresini oluşturmadan yeni eczaneye bağlanamaz.");
      }
      if (!mevcut.aktif_mi || !mevcut.auth_user_id) {
        return isKuraluHatasi("Müşterinin genel hesabı aktif değil; yeni eczane üyeliği kurulamaz.");
      }

      const { data: uyelik, error: uyelikHatasi } = await adminSupabase
        .from("eczanem_uyelikler")
        .select("uyelik_id, aktif_mi")
        .eq("musteri_id", mevcut.musteri_id)
        .eq("eczane_id", eden.eczaneId!)
        .maybeSingle();
      if (uyelikHatasi) return sunucuHatasi(uyelikHatasi, "eczanem_uyelikler SELECT — müşteri sorgulama");

      if (!uyelik?.aktif_mi) {
        const { data: bekleyenTalep, error: bekleyenTalepHatasi } = await adminSupabase
          .from("eczanem_baglama_talepleri")
          .select("talep_id")
          .eq("musteri_id", mevcut.musteri_id)
          .eq("eczane_id", eden.eczaneId!)
          .eq("durum", "bekliyor")
          .gt("sona_erme", new Date().toISOString())
          .maybeSingle();
        if (bekleyenTalepHatasi && bekleyenTalepHatasi.code !== "42P01") {
          return sunucuHatasi(bekleyenTalepHatasi, "eczanem_baglama_talepleri SELECT — sorgulama");
        }
        if (bekleyenTalep) {
          return NextResponse.json({
            ok: true,
            durum: "onay_bekliyor",
            yeniden_aktif: Boolean(uyelik && !uyelik.aktif_mi),
            mesaj: "Bu üye için zaten bekleyen bir bağlantı onay talebiniz bulunuyor.",
          }, { status: 200 });
        }
      }

      return NextResponse.json({
        ok: true,
        durum: uyelik?.aktif_mi ? "zaten_bagli" : "kayitli",
        yeniden_aktif: Boolean(uyelik && !uyelik.aktif_mi),
        mesaj: uyelik?.aktif_mi
          ? "Bu müşteri zaten eczanenize bağlı."
          : "Müşterinin mevcut Eczanem kaydı bulundu.",
      }, { status: 200 });
    }

    if (islem === "bagla") {
      if (!mevcut) return validasyonHatasi("Bu telefonla kayıtlı bir müşteri bulunamadı.", ["telefon"]);
      if (mevcutDavetBekliyor) {
        return isKuraluHatasi("Bu telefonla bekleyen bir üyelik daveti bulunuyor; üye şifresini oluşturmadan yeni eczaneye bağlanamaz.");
      }
      if (!mevcut.aktif_mi || !mevcut.auth_user_id) {
        return isKuraluHatasi("Müşterinin genel hesabı aktif değil; eczane üyeliği kurulamadı.");
      }

      const { data: mevcutUyelik, error: mevcutUyelikHatasi } = await adminSupabase
        .from("eczanem_uyelikler")
        .select("uyelik_id, aktif_mi")
        .eq("musteri_id", mevcut.musteri_id)
        .eq("eczane_id", eden.eczaneId!)
        .maybeSingle();
      if (mevcutUyelikHatasi) return sunucuHatasi(mevcutUyelikHatasi, "eczanem_uyelikler SELECT — mevcut bağ");
      if (mevcutUyelik?.aktif_mi) {
        return validasyonHatasi("Bu müşteri zaten eczanenizin aktif üyesi.", ["telefon"]);
      }

      const { data: talepSonucu, error: talepHatasi } = await adminSupabase.rpc("eczanem_baglama_talebi_olustur", {
        p_musteri_id: mevcut.musteri_id,
        p_eczane_id: eden.eczaneId!,
        p_islem_yapan_kisi_id: eden.kisiId!,
      });
      if (talepHatasi) return sunucuHatasi(talepHatasi, "eczanem_baglama_talebi_olustur RPC");
      const talep = Array.isArray(talepSonucu) ? talepSonucu[0] : talepSonucu;
      if (!talep?.ok || !talep.talep_id) {
        return isKuraluHatasi(talep?.hata ?? "Bağlantı onay talebi oluşturulamadı.");
      }

      if (talep.mevcut_bekleyen) {
        return NextResponse.json({
          ok: true,
          mevcut_musteri: true,
          onay_bekliyor: true,
          mesaj: "Bu üye için zaten bekleyen bir bağlantı onay talebiniz var; üyenin onayı bekleniyor.",
        }, { status: 200 });
      }

      const { data: eczaneKaydi } = await adminSupabase
        .from("eclub_eczaneler")
        .select("eclub_eczane_master ( eczane_adi )")
        .eq("eczane_id", eden.eczaneId!)
        .maybeSingle();
      const masterRaw = (eczaneKaydi as { eclub_eczane_master?: { eczane_adi?: string } | Array<{ eczane_adi?: string }> } | null)?.eclub_eczane_master;
      const eczaneAdi = (Array.isArray(masterRaw) ? masterRaw[0] : masterRaw)?.eczane_adi ?? null;

      const epostaSonuc = await baglamaTalebiEpostasiGonder(adminSupabase, {
        authUserId: mevcut.auth_user_id,
        talepId: talep.talep_id,
        talepTuru: talep.talep_turu === "yeniden_aktivasyon" ? "yeniden_aktivasyon" : "yeni_bag",
        eczaneAdi,
        origin: request.nextUrl.origin,
      });

      const mesaj =
        talep.talep_turu === "yeniden_aktivasyon"
          ? "Yeniden aktifleştirme onay talebi üyeye gönderildi. Üye onayladığında üyeliği yeniden açılır."
          : "Bağlantı onay talebi üyeye gönderildi. Üye onayladığında eczanenize bağlanır.";

      return NextResponse.json({
        ok: true,
        mevcut_musteri: true,
        onay_bekliyor: true,
        eposta_gonderildi: epostaSonuc.gonderildi,
        mesaj,
      }, { status: 200 });
    }

    if (mevcut) {
      return validasyonHatasi("Bu telefon sistemde kayıtlı. Kısa yoldan 'Kayıtlı Müşteriyi Bağla' işlemini kullanın.", ["telefon"]);
    }

    let ad = String(body?.ad ?? "").trim();
    let soyad = String(body?.soyad ?? "").trim();
    let adSoyad = String(body?.ad_soyad ?? "").trim();

    if (!ad && !soyad && adSoyad) {
      const parcalar = adSoyad.split(/\s+/);
      soyad = parcalar.length > 1 ? parcalar.pop()! : "";
      ad = parcalar.join(" ");
    }
    if (!adSoyad && (ad || soyad)) {
      adSoyad = [ad, soyad].filter(Boolean).join(" ");
    }

    ad = adSoyadBicimle(ad);
    soyad = adSoyadBicimle(soyad);
    adSoyad = [ad, soyad].filter(Boolean).join(" ");

    if (ad.length < 2) return validasyonHatasi("Ad en az 2 karakter olmalıdır.", ["ad"]);
    if (soyad.length < 2) return validasyonHatasi("Soyad en az 2 karakter olmalıdır.", ["soyad"]);
    if (ad.length > 100) return validasyonHatasi("Ad 100 karakterden uzun olamaz.", ["ad"]);
    if (soyad.length > 100) return validasyonHatasi("Soyad 100 karakterden uzun olamaz.", ["soyad"]);

    const eposta = String(body?.eposta ?? "").trim().toLowerCase();
    if (!eposta) return validasyonHatasi("E-posta zorunludur.", ["eposta"]);
    if (eposta.length > 200) return validasyonHatasi("E-posta 200 karakterden uzun olamaz.", ["eposta"]);
    if (!epostaGecerliMi(eposta)) return validasyonHatasi("Geçerli bir e-posta adresi giriniz.", ["eposta"]);

    await eczanemDavetAltyapisiKontrol(adminSupabase);

    // Auth dış kaynağı ile müşteri+üyelik RPC'si izlenen saga olarak çalışır.
    // RPC içindeki iki uygulama yazımı atomiktir; başarısızlıkta Auth telafisinin
    // sonucu provizyon günlüğüne kaydedilir ve sahipsiz hesap sessiz kalmaz.
    const provizyon = await provizyonBaslat(adminSupabase, "eczanem_musteri");
    if (!provizyon.ok || !provizyon.islemId) {
      return hataYaniti("Müşteri oluşturma işlemi başlatılamadı.", "kimlik_provizyon_islemleri INSERT", provizyon.hata);
    }

    const { data: authData, error: authInsertHatasi } = await adminSupabase.auth.admin.createUser({
      email: eposta,
      app_metadata: { eczanem_davet_bekliyor: true },
      ban_duration: "876000h",
      email_confirm: false,
      user_metadata: { kimlik: "eczanem_musteri", ad, soyad, ad_soyad: adSoyad },
    });
    if (authInsertHatasi || !authData?.user) {
      await provizyonDurumuYaz(adminSupabase, provizyon.islemId, "basarisiz", { hata: authInsertHatasi?.message ?? "Auth kullanıcısı oluşmadı." });
      if (epostaCakismasiMi(authInsertHatasi?.message)) return validasyonHatasi("Bu e-posta zaten kayıtlı.", ["eposta"]);
      return sunucuHatasi(authInsertHatasi, "auth.admin.createUser — müşteri");
    }
    const authUserId = authData.user.id;
    const authKaydi = await provizyonDurumuYaz(adminSupabase, provizyon.islemId, "auth_olustu", { authUserId });
    if (!authKaydi.ok) {
      await authTelafisiYap(adminSupabase, provizyon.islemId, authUserId, authKaydi.hata);
      return hataYaniti("Müşteri oluşturma işlemi kaydedilemedi.", "kimlik_provizyon_islemleri UPDATE — auth_olustu", authKaydi.hata);
    }

    const { data: yeniMusteriId, error: musteriHatasi } = await adminSupabase.rpc("eczanem_yeni_musteri_provizyonu_izli", {
      p_telefon: telefon,
      p_ad_soyad: adSoyad,
      p_auth_user_id: authUserId,
      p_eczane_id: eden.eczaneId!,
      p_islem_yapan_kisi_id: eden.kisiId!,
      p_ad: ad,
      p_soyad: soyad,
    });
    if (musteriHatasi || !yeniMusteriId) {
      const telafi = await authTelafisiYap(
        adminSupabase,
        provizyon.islemId,
        authUserId,
        musteriHatasi ?? new Error("Müşteri provizyonu sonuç döndürmedi."),
      );
      if (telafi.geriAlindi && musteriHatasi?.message?.includes("E-Club üyesi")) {
        return isKuraluHatasi(ECLUB_UYESI_MUSTERI_OLAMAZ_MESAJI);
      }
      if (
        telafi.geriAlindi &&
        (musteriHatasi?.message?.includes("kurumsal kullanıcısına") || musteriHatasi?.message?.includes("iş partnerine"))
      ) {
        return isKuraluHatasi(musteriHatasi.message);
      }
      if (musteriHatasi?.code === "23505" && telafi.geriAlindi) {
        return validasyonHatasi("Bu numara zaten kayıtlı.", ["telefon"]);
      }
      return hataYaniti(
        telafi.geriAlindi
          ? "Müşteri kaydedilemedi; oluşturulan giriş hesabı geri alındı."
          : "Müşteri kaydedilemedi; yönetici kontrolü gerekir.",
        "eczanem_yeni_musteri_provizyonu_izli RPC",
        telafi.hata ?? musteriHatasi,
      );
    }
    await provizyonDurumuYaz(adminSupabase, provizyon.islemId, "tamamlandi", {
      authUserId,
      hedefKayitId: String(yeniMusteriId),
    });

    const { data: eczaneKaydi } = await adminSupabase
      .from("eclub_eczaneler")
      .select("eclub_eczane_master ( eczane_adi )")
      .eq("eczane_id", eden.eczaneId!)
      .maybeSingle();
    const masterRaw = (eczaneKaydi as { eclub_eczane_master?: { eczane_adi?: string } | Array<{ eczane_adi?: string }> } | null)?.eclub_eczane_master;
    const eczaneAdi = (Array.isArray(masterRaw) ? masterRaw[0] : masterRaw)?.eczane_adi ?? null;

    const davet = await kayitSonrasiEczanemDavetiGonder(
      adminSupabase,
      authUserId,
      request.nextUrl.origin,
      eczaneAdi,
    );

    return NextResponse.json(
      { ok: true, gonderildi: davet.gonderildi, mesaj: davet.mesaj },
      { status: 201 },
    );
  } catch (err) {
    return sunucuHatasi(err, "POST /eczanem/eczane/api/musteri-ekle");
  }
}
