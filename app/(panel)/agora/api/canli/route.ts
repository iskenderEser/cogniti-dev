import { agoraVitrinBaglami } from "@/lib/agora/vitrinSunucu";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { medyaUuid } from "@/lib/agora/partnerMedyaSunucu";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { KKO_TOKEN_FIYATI } from "@/lib/token/fiyatlandirma";

export async function GET() {
  try {
    const b = await agoraVitrinBaglami();
    if (!b) return partnerYanit({ hata: "Agora erişim yetkiniz bulunmuyor." }, 403);

    const { data, error } = await b.db.rpc("agora_vitrin_canli_oturumlar_oku", {
      p_auth_id: b.authId,
    });
    if (error || !data || typeof data !== "object") {
      return partnerYanit({ hata: "Canlı yayın oturumları okunamadı." }, 503);
    }

    const sonuc = data as { firma_id?: string | null; oturumlar?: unknown[] };
    return partnerYanit({
      firma_id: sonuc.firma_id ?? null,
      oturumlar: sonuc.oturumlar ?? [],
    });
  } catch {
    return partnerYanit({ hata: "Canlı yayın oturumları okunamadı." }, 503);
  }
}

export async function POST(request: Request) {
  const body = await partnerJsonOku(request);
  if (!body.ok) return body.yanit;

  const d = body.veri;
  if (
    !medyaUuid(d.oturum_id) ||
    typeof d.fiyat_tl !== "number" ||
    !Number.isFinite(d.fiyat_tl) ||
    d.fiyat_tl <= 0
  ) {
    return partnerYanit({ hata: "Canlı yayın sipariş bilgileri geçersiz." }, 400);
  }

  try {
    const b = await agoraVitrinBaglami();
    if (!b || !URETICI_ROLLER.includes(b.rol)) {
      return partnerYanit({ hata: "Yalnız üretici kullanıcılar canlı yayın siparişi verebilir." }, 403);
    }

    const { data, error } = await b.db.rpc("agora_canli_oturum_satin_al", {
      p_auth_id: b.authId,
      p_oturum_id: d.oturum_id,
      p_fiyat: d.fiyat_tl,
      p_kko_birim: KKO_TOKEN_FIYATI,
    });

    if (error) {
      const mesaj =
        error.code === "40001"
          ? error.message || "Bu canlı yayın oturumu artık müsait değil veya fiyatı değişti."
          : error.code === "42501"
            ? "Sipariş verme yetkiniz bulunmuyor."
            : "Canlı yayın siparişi tamamlanamadı.";
      return partnerYanit({ hata: mesaj }, error.code === "40001" ? 409 : error.code === "42501" ? 403 : 503);
    }

    if (!data?.siparis_id) {
      return partnerYanit({ hata: "Sipariş sonucu doğrulanamadı." }, 503);
    }

    return partnerYanit(data);
  } catch {
    return partnerYanit({ hata: "Canlı yayın siparişi tamamlanamadı." }, 503);
  }
}
