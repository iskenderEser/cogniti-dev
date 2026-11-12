import { createAdminClient, createClient } from "@/lib/supabase/server";
import { siparisListesiGecerli } from "@/lib/satinAlma/siparisListesi";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import { rolCozucu } from "@/lib/utils/rolCozucu";

const yanit = (veri: unknown, status = 200) =>
  Response.json(veri, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request: Request) {
  const sorgu = new URL(request.url).searchParams;
  const hesap = sorgu.get("hesap");
  const sayfaMetni = sorgu.get("sayfa") ?? "0";
  const sayfa = Number(sayfaMetni);
  if ((hesap !== "kisisel" && hesap !== "firma_ortak") || !/^\d{1,7}$/.test(sayfaMetni) || sayfa > 1000000) {
    return yanit({ hata: "Geçersiz satın alım listesi isteği." }, 400);
  }

  try {
    const oturum = await createClient();
    const { data: { user }, error: oturumHatasi } = await oturum.auth.getUser();
    if (oturumHatasi || !user) return yanit({ hata: "Oturum açmanız gerekiyor." }, 401);

    const db = createAdminClient(AbortSignal.timeout(10000));
    const rol = await rolCozucu(db, user.id);
    if (!esnekPaketBakiyeTuru(rol)) {
      return yanit({ hata: "Satın alım geçmişine erişiminiz bulunmuyor." }, 403);
    }

    const { data, error } = await db.rpc("cogniti_cuzdan_satin_alimlari", {
      p_auth_id: user.id,
      p_hesap: hesap,
      p_sayfa: sayfa,
    });
    if (error?.code === "42501") return yanit({ hata: "Satın alım geçmişine erişiminiz bulunmuyor." }, 403);
    if (error && ["PGRST202", "42883"].includes(error.code)) {
      return yanit({ hata: "Satın alım geçmişi henüz kullanıma açılmadı." }, 503);
    }
    if (error || !siparisListesiGecerli(data) || data.sayfa !== sayfa
      || data.siparisler.some(siparis => siparis.bakiye_turu !== hesap)) {
      return yanit({ hata: "Satın alım geçmişi alınamadı." }, 503);
    }
    return yanit(data);
  } catch {
    return yanit({ hata: "Satın alım geçmişi alınamadı." }, 503);
  }
}
