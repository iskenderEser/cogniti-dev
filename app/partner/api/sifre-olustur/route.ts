import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { partnerSifreOzeti, partnerTestSifresiGecerli } from "@/lib/agora/partnerSifre";

function davetOzeti(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("davet") ?? "";
    if (!token || token.length < 20 || token.length > 200) {
      return partnerYanit({ hata: "Davet bağlantısı geçersiz." }, 400);
    }
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc(
      "agora_partner_davet_dogrula",
      { p_davet_hash: davetOzeti(token) },
    );
    if (error) {
      return partnerYanit({ hata: "Davet bağlantısı doğrulanamadı." }, 503);
    }
    if (!data || typeof data !== "object" || typeof data.eposta !== "string") {
      return partnerYanit({ hata: "Davet bağlantısının süresi dolmuş veya daha önce kullanılmış." }, 404);
    }
    return partnerYanit({
      ad_soyad: typeof data.ad_soyad === "string" ? data.ad_soyad : "",
      eposta: data.eposta,
    });
  } catch {
    return partnerYanit({ hata: "Davet bağlantısı doğrulanamadı." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const body = await partnerJsonOku(request);
    if (!body.ok) return body.yanit;
    const { davet, sifre } = body.veri;
    if (typeof davet !== "string" || davet.length < 20 || davet.length > 200) {
      return partnerYanit({ hata: "Davet bağlantısı geçersiz." }, 400);
    }
    if (!partnerTestSifresiGecerli(sifre)) {
      return partnerYanit({ hata: "Şifreniz en az 6, en fazla 128 karakter olmalıdır." }, 400);
    }
    const ozet = await partnerSifreOzeti(sifre);
    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc(
      "agora_partner_davet_sifre_belirle",
      {
        p_davet_hash: davetOzeti(davet),
        p_sifre_ozeti: ozet,
      },
    );
    if (error) {
      return partnerYanit({ hata: "Şifre kaydedilemedi. Lütfen tekrar deneyin." }, 503);
    }
    if (data !== true) {
      return partnerYanit({ hata: "Davet bağlantısının süresi dolmuş veya daha önce kullanılmış." }, 410);
    }
    return partnerYanit({ mesaj: "Şifreniz oluşturuldu. Partner girişi sayfasından giriş yapabilirsiniz." });
  } catch {
    return partnerYanit({ hata: "Şifre kaydedilemedi. Lütfen tekrar deneyin." }, 503);
  }
}
