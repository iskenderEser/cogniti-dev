import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { PARTNER_LOGO_BUCKET, partnerLogoTuru } from "@/lib/agora/partnerProfil";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const { partnerId } = await params;
  if (!medyaUuid(partnerId)) {
    return partnerYanit({ hata: "Geçersiz partner." }, 400);
  }

  try {
    const b = await agoraVitrinBaglami();
    if (!b) return partnerYanit({ hata: "Agora erişim yetkiniz bulunmuyor." }, 403);

    const { data: logoYolu, error: profilHatasi } = await b.db.rpc(
      "agora_vitrin_partner_logo_oku",
      {
        p_auth_id: b.authId,
        p_partner_id: partnerId,
      },
    );

    if (profilHatasi) return partnerYanit({ hata: "Logo okunamadı." }, 503);

    const yol = typeof logoYolu === "string" ? logoYolu : null;
    if (!yol || !yol.startsWith(`${partnerId}/`)) {
      return partnerYanit({ hata: "Logo bulunamadı." }, 404);
    }

    const { data, error } = await b.db.storage.from(PARTNER_LOGO_BUCKET).download(yol);
    if (error || !data) return partnerYanit({ hata: "Logo okunamadı." }, 503);

    const bytes = new Uint8Array(await data.arrayBuffer());
    const tur = partnerLogoTuru(bytes);
    if (!tur) return partnerYanit({ hata: "Logo okunamadı." }, 503);

    return new Response(bytes, {
      headers: {
        "Content-Type": tur.mime,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return partnerYanit({ hata: "Logo okunamadı." }, 503);
  }
}
