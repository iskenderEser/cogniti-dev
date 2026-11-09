import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { satinAlmaBakiyesiGorebilir, satinAlmaBakiyeOzetiGecerli } from "@/lib/satinAlma/bakiyeOzeti";
const yanit = (veri: unknown, status = 200) => Response.json(veri, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET() {
  try {
    const oturum = await createClient();
    const { data: { user }, error } = await oturum.auth.getUser();
    if (error || !user) return yanit({ hata: "Oturum açmanız gerekiyor." }, 401);
    const db = createAdminClient(AbortSignal.timeout(10000));
    const rol = await rolCozucu(db, user.id);
    if (!satinAlmaBakiyesiGorebilir(rol)) return yanit({ hata: "Token bakiyelerine erişiminiz bulunmuyor." }, 403);
    // Firma/sahip parametresi kabul edilmez. SQL mevcut aktif kimlik ve firma kapsamını doğrular.
    const sonuc = await db.rpc("cogniti_satin_alma_bakiye_ozeti", { p_auth_id: user.id });
    if (sonuc.error?.code === "42501") return yanit({ hata: "Token bakiyelerine erişiminiz bulunmuyor." }, 403);
    if (sonuc.error || !satinAlmaBakiyeOzetiGecerli(sonuc.data)) return yanit({ hata: "Token bakiyeleri alınamadı. Yeniden deneyin." }, 503);
    return yanit(sonuc.data);
  } catch {
    return yanit({ hata: "Token bakiyeleri alınamadı. Yeniden deneyin." }, 503);
  }
}
