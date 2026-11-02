import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaYonetimOkumaKontrol } from "@/lib/admin/firmaYonetimOkuma";
// app/admin/api/eclub/onaylar/route.ts
//
// Admin — elle eklenen eczanelerin onay/reddi.
//   GET → master'da onay_durumu='bekliyor' kayıtlar (elle eklenmiş, onay bekleyen)
//   PUT → { gln, karar: "onayla" | "reddet" }
//         onayla → onay_durumu='onayli' (artık havuza eklenebilir)
//         reddet → master'dan hard delete (henüz havuza bağlı değil, güvenli)

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hataYaniti, veriKontrol, sunucuHatasi, validasyonHatasi, yetkiHatasi, rolHatasi } from "@/lib/utils/hataIsle";

// Admin auth guard — getUser + rol==='admin'.

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();

    const firmaId = new URL(request.url).searchParams.get("firma_id");
    const kontrol = await firmaYonetimOkumaKontrol(firmaId);
    if (!kontrol.gecerli) return kontrol.yanit;
    const kapsamFirma = kontrol.firmaId ?? firmaId;

    let bekleyenSorgu = adminSupabase
      .from("eclub_eczane_master")
      .select("gln, eczane_adi, il, ilce, ekleyen_utt_id, created_at")
      .eq("onay_durumu", "bekliyor")
      .order("created_at", { ascending: true });
    if (kapsamFirma) {
      const { data: temsilciler, error: temsilciHatasi } = await adminSupabase.from("kullanicilar").select("kullanici_id").eq("firma_id", kapsamFirma);
      if (temsilciHatasi) return hataYaniti("Onay kapsamı alınamadı.", "E-Club firma onay kapsamı", temsilciHatasi);
      if (!temsilciler?.length) return NextResponse.json({ bekleyenler: [] });
      bekleyenSorgu = bekleyenSorgu.in("ekleyen_utt_id", temsilciler.map(k => k.kullanici_id));
    }
    const { data: bekleyenler, error } = await bekleyenSorgu;

    if (error) return hataYaniti("Onay bekleyenler çekilemedi.", "eclub_eczane_master SELECT — bekliyor", error);

    // Ekleyen UTT adını iliştir (opsiyonel görünüm)
    const uttIdler = [...new Set((bekleyenler ?? []).map((b) => (b as { ekleyen_utt_id: string | null }).ekleyen_utt_id).filter(Boolean) as string[])];
    const uttAdMap = new Map<string, string>();
    if (uttIdler.length > 0) {
      const { data: uttlar } = await adminSupabase
        .from("kullanicilar")
        .select("kullanici_id, ad, soyad")
        .in("kullanici_id", uttIdler);
      for (const u of uttlar ?? []) {
        const uu = u as { kullanici_id: string; ad: string; soyad: string };
        uttAdMap.set(uu.kullanici_id, `${uu.ad} ${uu.soyad}`);
      }
    }

    const sonuc = (bekleyenler ?? []).map((b) => {
      const bb = b as { gln: string; eczane_adi: string; il: string; ilce: string | null; ekleyen_utt_id: string | null; created_at: string };
      return {
        gln: bb.gln,
        eczane_adi: bb.eczane_adi,
        il: bb.il,
        ilce: bb.ilce,
        ekleyen_utt_id: bb.ekleyen_utt_id,
        ekleyen_ad: bb.ekleyen_utt_id ? (uttAdMap.get(bb.ekleyen_utt_id) ?? null) : null,
        created_at: bb.created_at,
      };
    });

    return NextResponse.json({ bekleyenler: sonuc }, { status: 200 });

  } catch (err) {
    return sunucuHatasi(err, "GET /admin/api/eclub/onaylar");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();


    const body = await request.json();
    const { gln, karar, firma_id } = body;
    const yetki = await firmaYonetimIslemKontrol(firma_id);
    if (!yetki.gecerli) return yetki.yanit;

    if (!gln || typeof gln !== "string") return validasyonHatasi("gln zorunludur.", ["gln"]);
    if (karar !== "onayla" && karar !== "reddet") return validasyonHatasi("Geçersiz karar.", ["karar"]);

    // Kayıt gerçekten bekliyor mu?
    const { data: master, error: masterError } = await adminSupabase
      .from("eclub_eczane_master")
      .select("gln, onay_durumu, kaynak, ekleyen_utt_id")
      .eq("gln", gln.trim())
      .maybeSingle();

    const masterKontrol = veriKontrol(master, "eclub_eczane_master SELECT — gln kontrolü", "Eczane kaydı bulunamadı.");
    if (!masterKontrol.gecerli) return masterKontrol.yanit;
    if (masterError) return hataYaniti("Eczane sorgulanamadı.", "eclub_eczane_master SELECT", masterError, 404);
    if (!master) return hataYaniti("Eczane kaydı bulunamadı.", "eclub_eczane_master SELECT", null, 404);

    const { data: ekleyen, error: ekleyenHatasi } = await adminSupabase.from("kullanicilar").select("firma_id").eq("kullanici_id", master.ekleyen_utt_id).eq("firma_id", firma_id).maybeSingle();
    if (ekleyenHatasi || !ekleyen) return validasyonHatasi("Onay kaydı firma kapsamında bulunamadı.", ["gln"]);

    if (master.onay_durumu !== "bekliyor")
      return validasyonHatasi("Bu kayıt onay beklemiyor.", ["gln"]);

    if (karar === "onayla") {
      const { error: updateError } = await adminSupabase
        .from("eclub_eczane_master")
        .update({ onay_durumu: "onayli" })
        .eq("gln", gln.trim());
      if (updateError) return hataYaniti("Eczane onaylanamadı.", "eclub_eczane_master UPDATE — onayli", updateError);
      return NextResponse.json({ mesaj: "Eczane onaylandı." }, { status: 200 });
    }

    // reddet → hard delete (henüz havuza bağlı değil, güvenli)
    const { error: deleteError } = await adminSupabase
      .from("eclub_eczane_master")
      .delete()
      .eq("gln", gln.trim());
    if (deleteError) return hataYaniti("Eczane reddedilemedi.", "eclub_eczane_master DELETE", deleteError);
    return NextResponse.json({ mesaj: "Eczane reddedildi ve kaydı silindi." }, { status: 200 });

  } catch (err) {
    return sunucuHatasi(err, "PUT /admin/api/eclub/onaylar");
  }
}