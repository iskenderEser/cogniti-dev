// app/eczanem/api/baglama-talepleri/route.ts
// Eczanem üyesi — yeni eczane bağlama / yeniden aktifleştirme onay talepleri.
//   GET  → bekleyen talepleri eczane adıyla listeler
//   POST → üyenin onay ("onayla") veya ret ("reddet") kararını atomik RPC ile işler

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isKuraluHatasi, rolHatasi, sunucuHatasi, validasyonHatasi, yetkiHatasi } from "@/lib/utils/hataIsle";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { MUSTERI_ROLU } from "@/lib/utils/roller";
import { eczaneAdMap } from "@/lib/eczanem/gonderim";

const UUID_DESENI = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function musteriOturumu() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { hata: yetkiHatasi() };

  const adminSupabase = createAdminClient();
  const rol = await rolCozucu(adminSupabase, user.id);
  if (rol !== MUSTERI_ROLU) return { hata: rolHatasi("Bu işlem yalnızca Eczanem üyelerine açıktır.") };
  return { adminSupabase, user };
}

export async function GET() {
  try {
    const oturum = await musteriOturumu();
    if ("hata" in oturum) return oturum.hata;
    const { adminSupabase, user } = oturum;

    const { data: musteri, error: musteriHatasi } = await adminSupabase
      .from("eczanem_musteriler")
      .select("musteri_id, aktif_mi")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (musteriHatasi) return sunucuHatasi(musteriHatasi, "eczanem_musteriler SELECT — bağlama talepleri");
    if (!musteri || !musteri.aktif_mi) return NextResponse.json({ talepler: [] }, { status: 200 });

    const { data: talepler, error: talepHatasi } = await adminSupabase
      .from("eczanem_baglama_talepleri")
      .select("talep_id, eczane_id, talep_turu, sona_erme, created_at")
      .eq("musteri_id", musteri.musteri_id)
      .eq("durum", "bekliyor")
      .gt("sona_erme", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (talepHatasi) {
      if (talepHatasi.code === "42P01") return NextResponse.json({ talepler: [] }, { status: 200 });
      return sunucuHatasi(talepHatasi, "eczanem_baglama_talepleri SELECT — üye");
    }

    const satirlar = (talepler ?? []) as Array<{
      talep_id: string;
      eczane_id: string;
      talep_turu: "yeni_bag" | "yeniden_aktivasyon";
      sona_erme: string;
      created_at: string;
    }>;
    const adMap = await eczaneAdMap(adminSupabase, satirlar.map((t) => t.eczane_id));

    return NextResponse.json({
      talepler: satirlar.map((t) => ({
        talep_id: t.talep_id,
        eczane_id: t.eczane_id,
        eczane_adi: adMap.get(t.eczane_id) ?? "Eczane",
        talep_turu: t.talep_turu,
        sona_erme: t.sona_erme,
        created_at: t.created_at,
      })),
    }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "GET /eczanem/api/baglama-talepleri");
  }
}

export async function POST(request: NextRequest) {
  try {
    const oturum = await musteriOturumu();
    if ("hata" in oturum) return oturum.hata;
    const { adminSupabase, user } = oturum;

    const body = await request.json();
    const talepId = String(body?.talep_id ?? "");
    const karar = String(body?.karar ?? "");
    if (!UUID_DESENI.test(talepId)) return validasyonHatasi("Geçersiz talep kimliği.", ["talep_id"]);
    if (!["onayla", "reddet"].includes(karar)) return validasyonHatasi("Geçersiz karar.", ["karar"]);

    const { data, error } = await adminSupabase.rpc("eczanem_baglama_talebi_karar_ver", {
      p_talep_id: talepId,
      p_auth_user_id: user.id,
      p_karar: karar,
    });
    if (error) return sunucuHatasi(error, "eczanem_baglama_talebi_karar_ver RPC");

    const sonuc = Array.isArray(data) ? data[0] : data;
    if (!sonuc?.ok) {
      return isKuraluHatasi(sonuc?.hata ?? "Kararınız işlenemedi.");
    }

    const mesaj =
      karar === "reddet"
        ? "Eczane bağlantı talebi reddedildi."
        : sonuc.talep_turu === "yeniden_aktivasyon"
          ? "Eczane üyeliğiniz yeniden aktifleştirildi."
          : "Eczane üyeliğiniz onaylandı ve hesabınıza eklendi.";

    return NextResponse.json(
      { ok: true, karar, eczane_id: sonuc.eczane_id, mesaj },
      { status: 200 },
    );
  } catch (err) {
    return sunucuHatasi(err, "POST /eczanem/api/baglama-talepleri");
  }
}
