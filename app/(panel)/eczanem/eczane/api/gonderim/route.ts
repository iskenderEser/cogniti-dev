// app/eczanem/eczane/api/gonderim/route.ts
// Eczacı/teknisyen dağıtım ucu (İP-§5.5): GET gelen videolar + aktif üyeler,
// POST tek/toplu müşteri gönderimi. İş mantığı lib/eczanem/gonderim.ts'te.

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sunucuHatasi, yetkiHatasi, rolHatasi, validasyonHatasi, isKuraluHatasi } from "@/lib/utils/hataIsle";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { eczaciAktifEczanesi } from "@/lib/eczanem/eczaci";
import { eczaneGelenVideolar, eczaneAktifUyeler, eczaneUyeGonderimDurumlari, eczaneVideoGonderimOzetleri, musterilereTopluGonder } from "@/lib/eczanem/gonderim";

const UUID_DESENI = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const rol = await rolCozucu(adminSupabase, user.id);
    if (!ECLUB_TUKETICI_ROLLERI.includes(rol)) return rolHatasi("Bu sayfaya yalnız eczacı/teknisyen erişebilir.");

    const eden = await eczaciAktifEczanesi(adminSupabase, user.id);
    if (!eden.ok) return isKuraluHatasi(eden.hata ?? "Eczane bağı bulunamadı.");

    const yayinId = request.nextUrl.searchParams.get("yayin_id") ?? undefined;
    if (yayinId && !UUID_DESENI.test(yayinId)) return validasyonHatasi("Geçersiz yayın kimliği.", ["yayin_id"]);

    const yayinIdlerParam = request.nextUrl.searchParams.get("yayin_idler");
    if (yayinIdlerParam !== null) {
      const yayinIdler = [...new Set(yayinIdlerParam.split(","))];
      if (request.nextUrl.searchParams.get("sadece_uyeler") !== "1" || yayinId ||
        yayinIdler.length === 0 || yayinIdler.length > 100 ||
        yayinIdler.some((id) => !UUID_DESENI.test(id))) {
        return validasyonHatasi("En fazla 100 geçerli yayın seçilmelidir.", ["yayin_idler"]);
      }
      const { data: gelenler, error: gelenHatasi } = await adminSupabase
        .from("eczanem_eczane_gonderimleri")
        .select("yayin_id")
        .eq("eczane_id", eden.eczaneId!)
        .in("yayin_id", yayinIdler);
      if (gelenHatasi) throw new Error("Eczaneye gelen yayınlar doğrulanamadı.");
      if (new Set((gelenler ?? []).map((kayit) => kayit.yayin_id)).size !== yayinIdler.length) {
        return validasyonHatasi("Seçilen yayınlardan biri eczanenize ulaşmamış.", ["yayin_idler"]);
      }
      const uyeler = await eczaneAktifUyeler(adminSupabase, eden.eczaneId!);
      const gonderimler = await eczaneUyeGonderimDurumlari(adminSupabase, eden.eczaneId!, yayinIdler, uyeler);
      return NextResponse.json({ uyeler, gonderimler }, { status: 200 });
    }

    // "Müşterileri Yönet" açılışı: yalnız seçili videonun üyeleri getirilir.
    // Videolar (v_yayin_detay) ve özetler sayfa açılışında bir kez yüklendi ve
    // değişmez; burada yeniden çalıştırılmaz — ağır view tekrar değerlendirilmez.
    const sadeceUyeler = request.nextUrl.searchParams.get("sadece_uyeler") === "1";
    if (sadeceUyeler && yayinId) {
      const uyeler = await eczaneAktifUyeler(adminSupabase, eden.eczaneId!, yayinId);
      return NextResponse.json({ uyeler }, { status: 200 });
    }

    const [videolar, uyeler] = await Promise.all([
      eczaneGelenVideolar(adminSupabase, eden.eczaneId!),
      eczaneAktifUyeler(adminSupabase, eden.eczaneId!, yayinId),
    ]);
    const videoOzetleri = await eczaneVideoGonderimOzetleri(adminSupabase, eden.eczaneId!, videolar, uyeler);

    const gonderilen = uyeler.filter((uye) => uye.gonderildi_mi).length;
    return NextResponse.json({
      videolar,
      uyeler,
      video_ozetleri: videoOzetleri,
      ozet: {
        video_sayisi: videolar.length,
        aktif_uye_sayisi: uyeler.length,
        gonderilen_uye_sayisi: gonderilen,
        gonderilebilir_uye_sayisi: uyeler.length - gonderilen,
      },
    }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "GET /eczanem/eczane/api/gonderim");
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return yetkiHatasi();

    const rol = await rolCozucu(adminSupabase, user.id);
    if (!ECLUB_TUKETICI_ROLLERI.includes(rol)) return rolHatasi("Sadece eczacı/teknisyen gönderim yapabilir.");

    const eden = await eczaciAktifEczanesi(adminSupabase, user.id);
    if (!eden.ok) return isKuraluHatasi(eden.hata ?? "Eczane bağı bulunamadı.");

    const body = await request.json();
    const yayinIdler = body?.yayin_idler ?? (body?.yayin_id ? [body.yayin_id] : []);
    const musteriIdler = body?.musteri_idler;
    if (!Array.isArray(yayinIdler) || !yayinIdler.length || yayinIdler.some((id: unknown) => typeof id !== "string" || !UUID_DESENI.test(id))) {
      return validasyonHatasi("Geçerli yayınlar seçilmelidir.", ["yayin_idler"]);
    }
    if (!Array.isArray(musteriIdler) || !musteriIdler.length || musteriIdler.some((id: unknown) => typeof id !== "string" || !UUID_DESENI.test(id))) {
      return validasyonHatasi("Geçerli müşteriler seçilmelidir.", ["musteri_idler"]);
    }
    if (yayinIdler.length * musteriIdler.length > 10000) {
      return validasyonHatasi("Tek istekte en fazla 10.000 yayın-müşteri gönderimi seçilebilir.");
    }
    const sonuc = await musterilereTopluGonder(adminSupabase, eden.eczaneId!, eden.kisiId!, yayinIdler, musteriIdler);
    if (!sonuc.ok) return isKuraluHatasi(sonuc.hata ?? "Gönderim başarısız.");

    const mesaj =
      sonuc.atlanan > 0
        ? `${sonuc.gonderilen} müşteriye gönderildi, ${sonuc.atlanan} atlandı (zaten gönderilmiş/üye değil).`
        : `${sonuc.gonderilen} müşteriye gönderildi.`;
    return NextResponse.json({ ok: true, mesaj, gonderilen: sonuc.gonderilen, atlanan: sonuc.atlanan, gonderilen_yayin: sonuc.gonderilenYayin ?? 0 }, { status: 201 });
  } catch (err) {
    return sunucuHatasi(err, "POST /eczanem/eczane/api/gonderim");
  }
}
