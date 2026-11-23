import { NextRequest, NextResponse } from "next/server";
import { firmaYonetimIslemKontrol } from "@/lib/admin/firmaYonetimIslem";
import { firmaKullaniciDavetiGonder } from "@/lib/admin/kullaniciDaveti";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { sunucuHatasi, validasyonHatasi } from "@/lib/utils/hataIsle";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ firma_id: string }> }
) {
  try {
    const { firma_id } = await params;
    const kontrol = await firmaYonetimIslemKontrol(firma_id);
    if (!kontrol.gecerli) return kontrol.yanit;

    const body = await request.json().catch(() => null);
    const kullaniciId = typeof body?.kullanici_id === "string" ? body.kullanici_id.trim() : "";
    if (!uuidGecerliMi(kullaniciId)) {
      return validasyonHatasi("Geçerli bir kullanıcı seçin.", ["kullanici_id"]);
    }

    const db = createAdminClient();
    const [firmaSonuc, kullaniciSonuc] = await Promise.all([
      db.from("firmalar").select("firma_adi").eq("firma_id", firma_id).maybeSingle(),
      db.from("kullanicilar").select("kullanici_id,aktif_mi").eq("kullanici_id", kullaniciId).eq("firma_id", firma_id).maybeSingle(),
    ]);

    if (!firmaSonuc.data) return NextResponse.json({ hata: "Firma bulunamadı." }, { status: 404 });
    if (!kullaniciSonuc.data) return NextResponse.json({ hata: "Kullanıcı bu firmada bulunamadı." }, { status: 404 });
    if (kullaniciSonuc.data.aktif_mi !== true) {
      return NextResponse.json({ hata: "Pasif kullanıcıya davet gönderilemez." }, { status: 409 });
    }

    const sonuc = await firmaKullaniciDavetiGonder(
      db,
      kullaniciId,
      firmaSonuc.data.firma_adi,
      new URL(request.url).origin
    );

    if (!sonuc.gonderildi) {
      return NextResponse.json({ hata: sonuc.mesaj }, { status: 400 });
    }

    return NextResponse.json({ ok: true, mesaj: "24 saatlik şifre oluşturma daveti yeniden gönderildi." }, { status: 200 });
  } catch (err) {
    return sunucuHatasi(err, "POST /admin/api/firmalar/[firma_id]/kullanicilar/davet");
  }
}
