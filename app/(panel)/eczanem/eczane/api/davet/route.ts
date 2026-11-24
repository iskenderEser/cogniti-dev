// app/(panel)/eczanem/eczane/api/davet/route.ts
// Eczacı/teknisyen — bekleyen Eczanem üyelik daveti işlemleri:
//   POST   → bekleyen daveti yeniden gönder
//   PATCH  → henüz kabul edilmemiş davette ad/soyad/e-posta düzelt + daveti yeniden gönder
//   DELETE → henüz kabul edilmemiş daveti iptal et (üyelik + aktifleşmemiş hesap silinir)

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, sunucuHatasi, validasyonHatasi, yetkiHatasi, rolHatasi, isKuraluHatasi } from "@/lib/utils/hataIsle";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { eczaciAktifEczanesi } from "@/lib/eczanem/eczaci";
import { adSoyadBicimle } from "@/lib/utils/adSoyadBicimle";
import {
  eczanemDavetBekliyor,
  eczanemUyelikDavetiGonder,
  kayitSonrasiEczanemDavetiGonder,
} from "@/lib/eczanem/uyelikDaveti";

const UUID_DESENI = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function epostaGecerliMi(eposta: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta);
}

function epostaCakismasiMi(mesaj?: string): boolean {
  return /already|registered|exists|duplicate/i.test(mesaj ?? "");
}

async function eczaciYetki(
  adminSupabase: SupabaseClient,
  userId: string,
): Promise<{ kisiId: string; eczaneId: string } | { hata: NextResponse }> {
  const rol = await rolCozucu(adminSupabase, userId);
  if (!ECLUB_TUKETICI_ROLLERI.includes(rol)) {
    return { hata: rolHatasi("Bu işlem yalnızca eczacı/teknisyen tarafından yapılabilir.") };
  }
  const eden = await eczaciAktifEczanesi(adminSupabase, userId);
  if (!eden.ok) {
    return { hata: isKuraluHatasi(eden.hata ?? "Aktif eczane bağınız bulunamadı.") };
  }
  return { kisiId: eden.kisiId!, eczaneId: eden.eczaneId! };
}

async function eczaneAdiBul(adminSupabase: SupabaseClient, eczaneId: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from("eclub_eczaneler")
    .select("eclub_eczane_master ( eczane_adi )")
    .eq("eczane_id", eczaneId)
    .maybeSingle();
  const masterRaw = (data as { eclub_eczane_master?: { eczane_adi?: string } | Array<{ eczane_adi?: string }> } | null)?.eclub_eczane_master;
  return (Array.isArray(masterRaw) ? masterRaw[0] : masterRaw)?.eczane_adi ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const adminSupabase = createAdminClient();
    const ctx = await eczaciYetki(adminSupabase, user.id);
    if ("hata" in ctx) return ctx.hata;

    const body = await request.json();
    const musteriId = String(body?.musteri_id ?? "");
    if (!UUID_DESENI.test(musteriId)) return validasyonHatasi("Geçersiz üye kimliği.", ["musteri_id"]);

    const { data: bag, error: bagHatasi } = await adminSupabase
      .from("eczanem_uyelikler")
      .select("uyelik_id, aktif_mi")
      .eq("musteri_id", musteriId)
      .eq("eczane_id", ctx.eczaneId)
      .maybeSingle();
    if (bagHatasi) return sunucuHatasi(bagHatasi, "eczanem_uyelikler SELECT — davet yeniden gönder");
    if (!bag || !bag.aktif_mi) return rolHatasi("Bu üye eczanenizde aktif değil.");

    const { data: musteri, error: musteriHatasi } = await adminSupabase
      .from("eczanem_musteriler")
      .select("auth_user_id, aktif_mi")
      .eq("musteri_id", musteriId)
      .maybeSingle();
    if (musteriHatasi) return sunucuHatasi(musteriHatasi, "eczanem_musteriler SELECT — davet yeniden gönder");
    if (!musteri?.auth_user_id || !musteri.aktif_mi) {
      return isKuraluHatasi("Üyenin davet hesabı bulunamadı.");
    }

    const eczaneAdi = await eczaneAdiBul(adminSupabase, ctx.eczaneId);
    const sonuc = await eczanemUyelikDavetiGonder(
      adminSupabase,
      musteri.auth_user_id,
      request.nextUrl.origin,
      eczaneAdi,
    );
    return NextResponse.json(
      {
        ok: sonuc.gonderildi,
        ...sonuc,
        mesaj: sonuc.gonderildi ? "Şifre oluşturma daveti yeniden gönderildi." : sonuc.mesaj,
      },
      { status: sonuc.gonderildi ? 200 : 502 },
    );
  } catch (err) {
    return NextResponse.json(
      { hata: err instanceof Error ? err.message : "Davet gönderilemedi." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const adminSupabase = createAdminClient();
    const ctx = await eczaciYetki(adminSupabase, user.id);
    if ("hata" in ctx) return ctx.hata;

    const body = await request.json();
    const musteriId = String(body?.musteri_id ?? "");
    if (!UUID_DESENI.test(musteriId)) return validasyonHatasi("Geçersiz üye kimliği.", ["musteri_id"]);

    const ad = adSoyadBicimle(String(body?.ad ?? "").trim());
    const soyad = adSoyadBicimle(String(body?.soyad ?? "").trim());
    const adSoyad = [ad, soyad].filter(Boolean).join(" ");
    if (ad.length < 2) return validasyonHatasi("Ad en az 2 karakter olmalıdır.", ["ad"]);
    if (soyad.length < 2) return validasyonHatasi("Soyad en az 2 karakter olmalıdır.", ["soyad"]);
    if (ad.length > 100) return validasyonHatasi("Ad 100 karakterden uzun olamaz.", ["ad"]);
    if (soyad.length > 100) return validasyonHatasi("Soyad 100 karakterden uzun olamaz.", ["soyad"]);

    const epostaGirdisi = String(body?.eposta ?? "").trim().toLowerCase();
    if (epostaGirdisi) {
      if (epostaGirdisi.length > 200) return validasyonHatasi("E-posta 200 karakterden uzun olamaz.", ["eposta"]);
      if (!epostaGecerliMi(epostaGirdisi)) return validasyonHatasi("Geçerli bir e-posta adresi giriniz.", ["eposta"]);
    }

    const { data: bag, error: bagHatasi } = await adminSupabase
      .from("eczanem_uyelikler")
      .select("uyelik_id")
      .eq("musteri_id", musteriId)
      .eq("eczane_id", ctx.eczaneId)
      .maybeSingle();
    if (bagHatasi) return sunucuHatasi(bagHatasi, "eczanem_uyelikler SELECT — davet güncelle");
    if (!bag) return rolHatasi("Bu üye listenizde değil.");

    const { data: musteri, error: musteriHatasi } = await adminSupabase
      .from("eczanem_musteriler")
      .select("auth_user_id")
      .eq("musteri_id", musteriId)
      .maybeSingle();
    if (musteriHatasi || !musteri?.auth_user_id) {
      return isKuraluHatasi("Üye hesabı bulunamadı.");
    }

    const { data: authData, error: authGetHatasi } = await adminSupabase.auth.admin.getUserById(musteri.auth_user_id);
    if (authGetHatasi || !authData?.user?.email) {
      return isKuraluHatasi("Üyenin giriş hesabı doğrulanamadı.");
    }
    if (!eczanemDavetBekliyor(authData.user.app_metadata)) {
      return isKuraluHatasi("Üyelik daveti zaten tamamlanmış; bilgiler değiştirilemez.");
    }

    const eskiEposta = authData.user.email.toLowerCase();
    const hedefEposta = epostaGirdisi || eskiEposta;
    const epostaDegisti = hedefEposta !== eskiEposta;

    const { data: baskaBaglar, error: baskaBagHatasi } = await adminSupabase
      .from("eczanem_uyelikler")
      .select("uyelik_id")
      .eq("musteri_id", musteriId)
      .neq("eczane_id", ctx.eczaneId)
      .limit(1);
    if (baskaBagHatasi) return sunucuHatasi(baskaBagHatasi, "eczanem_uyelikler SELECT — çoklu eczane kontrolü");
    if (baskaBaglar && baskaBaglar.length > 0) {
      return isKuraluHatasi("Birden fazla eczaneye bağlı üyenin bilgileri değiştirilemez.");
    }

    const { data: davetSatiri, error: davetOkuHatasi } = await adminSupabase
      .from("eczanem_uyelik_davetleri")
      .select("durum, lease_sonu")
      .eq("auth_user_id", musteri.auth_user_id)
      .maybeSingle();
    if (davetOkuHatasi) return sunucuHatasi(davetOkuHatasi, "eczanem_uyelik_davetleri SELECT — davet güncelle");
    if (!davetSatiri || davetSatiri.durum === "tamamlandi") {
      return isKuraluHatasi("Üyelik daveti zaten tamamlanmış; bilgiler değiştirilemez.");
    }
    if (davetSatiri.lease_sonu && new Date(davetSatiri.lease_sonu).getTime() > Date.now()) {
      return isKuraluHatasi("Şifre oluşturma işlemi sürüyor; biraz sonra tekrar deneyin.");
    }

    const eskiMetadata = { ...(authData.user.user_metadata ?? {}) };
    const { error: authUpdateHatasi } = await adminSupabase.auth.admin.updateUserById(musteri.auth_user_id, {
      ...(epostaDegisti ? { email: hedefEposta, email_confirm: false } : {}),
      user_metadata: {
        ...eskiMetadata,
        kimlik: "eczanem_musteri",
        ad,
        soyad,
        ad_soyad: adSoyad,
      },
    });
    if (authUpdateHatasi) {
      if (epostaCakismasiMi(authUpdateHatasi.message)) {
        return validasyonHatasi("Bu e-posta zaten kayıtlı.", ["eposta"]);
      }
      return sunucuHatasi(authUpdateHatasi, "auth.admin.updateUserById — bekleyen davet güncelle");
    }

    const { data: rpcData, error: rpcHatasi } = await adminSupabase.rpc("eczanem_bekleyen_davet_bilgi_guncelle", {
      p_musteri_id: musteriId,
      p_eczane_id: ctx.eczaneId,
      p_islem_yapan_kisi_id: ctx.kisiId,
      p_ad: ad,
      p_soyad: soyad,
      p_ad_soyad: adSoyad,
      p_eposta: hedefEposta,
    });
    const rpcSonuc = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (rpcHatasi || !rpcSonuc?.ok) {
      // DB güncellemesi reddedildiyse Auth bilgisini eski haline geri al.
      await adminSupabase.auth.admin.updateUserById(musteri.auth_user_id, {
        ...(epostaDegisti ? { email: eskiEposta, email_confirm: false } : {}),
        user_metadata: eskiMetadata,
      });
      if (rpcHatasi) {
        return hataYaniti("Bekleyen davet bilgileri güncellenemedi.", "eczanem_bekleyen_davet_bilgi_guncelle RPC", rpcHatasi);
      }
      return isKuraluHatasi(rpcSonuc?.hata ?? "Bekleyen davet bilgileri güncellenemedi.");
    }

    const yenidenGonder = body?.yeniden_gonder !== false;
    if (yenidenGonder) {
      const eczaneAdi = await eczaneAdiBul(adminSupabase, ctx.eczaneId);
      const davet = await kayitSonrasiEczanemDavetiGonder(
        adminSupabase,
        musteri.auth_user_id,
        request.nextUrl.origin,
        eczaneAdi,
      );
      return NextResponse.json(
        {
          ok: true,
          gonderildi: davet.gonderildi,
          mesaj: davet.gonderildi
            ? "Bekleyen davet bilgileri güncellendi ve yeni davet e-postası gönderildi."
            : `Bilgiler güncellendi ancak davet gönderilemedi. ${davet.mesaj}`.trim(),
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ ok: true, mesaj: "Bekleyen davet bilgileri güncellendi." }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "PATCH /eczanem/eczane/api/davet");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const adminSupabase = createAdminClient();
    const ctx = await eczaciYetki(adminSupabase, user.id);
    if ("hata" in ctx) return ctx.hata;

    const body = await request.json();
    const musteriId = String(body?.musteri_id ?? "");
    if (!UUID_DESENI.test(musteriId)) return validasyonHatasi("Geçersiz üye kimliği.", ["musteri_id"]);

    const { data: rpcData, error: rpcHatasi } = await adminSupabase.rpc("eczanem_bekleyen_davet_iptal", {
      p_musteri_id: musteriId,
      p_eczane_id: ctx.eczaneId,
      p_islem_yapan_kisi_id: ctx.kisiId,
    });
    if (rpcHatasi) {
      return hataYaniti("Bekleyen davet iptal edilemedi.", "eczanem_bekleyen_davet_iptal RPC", rpcHatasi);
    }
    const rpcSonuc = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!rpcSonuc?.ok) {
      return isKuraluHatasi(rpcSonuc?.hata ?? "Bekleyen davet iptal edilemedi.");
    }

    if (rpcSonuc.auth_user_id) {
      const { error: authSilHatasi } = await adminSupabase.auth.admin.deleteUser(rpcSonuc.auth_user_id);
      if (authSilHatasi) {
        return hataYaniti(
          "Davet iptal edildi ancak giriş hesabı silinemedi; yönetici kontrolü gerekir.",
          "auth.admin.deleteUser — bekleyen davet iptal",
          authSilHatasi,
        );
      }
    }

    return NextResponse.json({ ok: true, mesaj: "Bekleyen davet iptal edildi." }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "DELETE /eczanem/eczane/api/davet");
  }
}
