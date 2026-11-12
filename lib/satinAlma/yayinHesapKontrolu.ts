import { createAdminClient } from "@/lib/supabase/server";
import { satinAlmaBakiyeOzetiGecerli, yayinTokenHesabiVar } from "./bakiyeOzeti";

export async function yeniYayinHesapKontrolu(db: ReturnType<typeof createAdminClient>, kullaniciId: string) {
  const { data, error } = await db.rpc("cogniti_satin_alma_bakiye_ozeti", { p_auth_id: kullaniciId });
  if (error || !satinAlmaBakiyeOzetiGecerli(data)) {
    return Response.json({ hata: "Token hesabınız kontrol edilemedi. Yeniden deneyin." }, { status: 503 });
  }
  if (!yayinTokenHesabiVar(data)) {
    return Response.json({ hata: "Yayın oluşturmak için hemen bir paket siparişi verebilirsin." }, { status: 403 });
  }
  return null;
}
