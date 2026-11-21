import { NextRequest, NextResponse } from "next/server";
import { bolisBaglami, uuidGecerliMi } from "@/lib/bolis/sunucu";

export interface BolisYayinKaynagi {
  id: string;
  baslik: string;
  altBilgi: string;
  videoGuid?: string | null;
  dosyaYolu?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi) {
      return NextResponse.json({ hata: "Bu alana erişim yetkiniz bulunmuyor." }, { status: 403 });
    }
    if (!b.firmaId) {
      return NextResponse.json({ kaynaklar: [] });
    }

    const arac = request.nextUrl.searchParams.get("arac") ?? "";

    if (["video", "podcast", "gorsel", "flip_pdf"].includes(arac)) {
      const { data, error } = await b.db
        .from("v_yayin_detay")
        .select("yayin_id, urun_adi, teknik_adi, arac_turu, video_url, arac_dosya_yolu, yayin_tarihi")
        .eq("firma_id", b.firmaId)
        .eq("arac_turu", arac)
        .order("yayin_tarihi", { ascending: false })
        .limit(80);

      if (error) {
        return NextResponse.json({ hata: "Firma yayınları okunamadı." }, { status: 503 });
      }

      const kaynaklar: BolisYayinKaynagi[] = [];
      for (const y of data ?? []) {
        const baslik =
          ((y.urun_adi as string | null) || (y.teknik_adi as string | null) || "Yayın").trim();
        const altBilgi = y.yayin_tarihi
          ? new Intl.DateTimeFormat("tr-TR", {
              dateStyle: "medium",
              timeZone: "Europe/Istanbul",
            }).format(new Date(y.yayin_tarihi as string))
          : "";

        if (arac === "video") {
          const guid = typeof y.video_url === "string" ? y.video_url.trim() : "";
          if (!uuidGecerliMi(guid)) continue;
          kaynaklar.push({
            id: y.yayin_id as string,
            baslik,
            altBilgi,
            videoGuid: guid,
          });
        } else {
          const yol = typeof y.arac_dosya_yolu === "string" ? y.arac_dosya_yolu.trim() : "";
          if (!yol) continue;
          kaynaklar.push({
            id: y.yayin_id as string,
            baslik,
            altBilgi,
            dosyaYolu: yol,
          });
        }
      }

      return NextResponse.json({ kaynaklar });
    }

    return NextResponse.json({ kaynaklar: [] });
  } catch {
    return NextResponse.json({ hata: "Yayın kaynakları okunamadı." }, { status: 503 });
  }
}
