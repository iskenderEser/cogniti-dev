import { NextRequest, NextResponse } from "next/server";
import { bolisBaglami } from "@/lib/bolis/sunucu";
import { BUNNY_TUS_ENDPOINT, bunnyYuklemeBaslat } from "@/lib/video/bunnyYukleme";

const IZINLI_VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"];
const MAKS_VIDEO_BAYT = 5 * 1024 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi || !b.firmaId) {
      return NextResponse.json({ hata: "Video yükleme yetkiniz bulunmuyor." }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const dosyaAdi = typeof body?.dosya_adi === "string" ? body.dosya_adi.trim() : "";
    const mimeType = typeof body?.mime_type === "string" ? body.mime_type.trim() : "";
    const dosyaBoyutu = Number(body?.dosya_boyutu);

    if (
      !dosyaAdi ||
      dosyaAdi.length > 255 ||
      !IZINLI_VIDEO_MIME.includes(mimeType) ||
      !Number.isSafeInteger(dosyaBoyutu) ||
      dosyaBoyutu <= 0 ||
      dosyaBoyutu > MAKS_VIDEO_BAYT
    ) {
      return NextResponse.json(
        { hata: "MP4, WebM veya MOV video dosyası seçin (en fazla 5 GB)." },
        { status: 400 },
      );
    }

    const baslik = `BOLIS_${b.firmaId.slice(0, 8)}_${dosyaAdi.slice(0, 80)}`;
    const izin = await bunnyYuklemeBaslat(baslik);
    if (!izin.ok) {
      return NextResponse.json({ hata: izin.hata }, { status: 503 });
    }

    return NextResponse.json({
      video_guid: izin.videoGuid,
      library_id: izin.libraryId,
      imza: izin.imza,
      son_kullanma: izin.sonKullanma,
      tus_endpoint: BUNNY_TUS_ENDPOINT,
      baslik,
    });
  } catch {
    return NextResponse.json({ hata: "Video yükleme başlatılamadı." }, { status: 503 });
  }
}
