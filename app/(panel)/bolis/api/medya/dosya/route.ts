import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { bolisBaglami } from "@/lib/bolis/sunucu";
import { bunnyStorageNesneYukle, bunnyStorageOrtami } from "@/lib/ogrenmeAraci/bunnyStorage";
import { dosyaBeyaniDogrula } from "@/lib/ogrenmeAraci/sozlesme";
import type { YeniOgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

const STATIK_ARACLAR: readonly YeniOgrenmeAraciTuru[] = ["podcast", "gorsel", "flip_pdf"];

export async function POST(request: NextRequest) {
  try {
    const b = await bolisBaglami();
    if (!b || !b.yoneticiMi || !b.firmaId) {
      return NextResponse.json({ hata: "Dosya yükleme yetkiniz bulunmuyor." }, { status: 403 });
    }

    if (!bunnyStorageOrtami()) {
      return NextResponse.json({ hata: "Dosya depolama hizmeti yapılandırılmamış." }, { status: 503 });
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ hata: "Geçersiz dosya isteği." }, { status: 400 });
    }

    const aracHam = String(formData.get("arac_turu") ?? "");
    const dosya = formData.get("dosya");
    if (
      !(STATIK_ARACLAR as readonly string[]).includes(aracHam) ||
      !(dosya instanceof File)
    ) {
      return NextResponse.json({ hata: "Geçerli bir dosya ve araç türü seçin." }, { status: 400 });
    }

    const aracTuru = aracHam as YeniOgrenmeAraciTuru;
    const dogrulama = dosyaBeyaniDogrula({
      aracTuru,
      dosyaAdi: dosya.name,
      mimeType: dosya.type || "application/octet-stream",
      dosyaBoyutu: dosya.size,
    });

    if (!dogrulama.ok) {
      return NextResponse.json({ hata: dogrulama.hata }, { status: 400 });
    }

    const bytes = new Uint8Array(await dosya.arrayBuffer());
    const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
    const dosyaYolu = `bolis/${b.firmaId}/${aracTuru}/${randomUUID()}.${dogrulama.uzanti}`;

    const yuklendi = await bunnyStorageNesneYukle({
      dosyaYolu,
      mimeType: dosya.type || "application/octet-stream",
      checksumSha256,
      govde: bytes,
    });

    if (!yuklendi) {
      return NextResponse.json({ hata: "Dosya depolamaya aktarılamadı." }, { status: 503 });
    }

    return NextResponse.json({
      dosya_yolu: dosyaYolu,
      dosya_adi: dosya.name,
    });
  } catch {
    return NextResponse.json({ hata: "Dosya yüklenemedi." }, { status: 503 });
  }
}
