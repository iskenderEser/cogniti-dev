import { vivaGirdi, vivaHata, vivaKullanici, vivaYanit, VivaHatasi } from "@/lib/viva/sunucu";
import { vivaUuidMu } from "@/lib/viva/sozlesme";
import { VivaDailyHatasi } from "@/lib/viva/daily";
import { vivaDailyOdaHazirla, vivaOdaSonucu, type VivaOdaDeposu } from "@/lib/viva/oda";

export const runtime = "nodejs";
async function depoOlustur(id: unknown): Promise<VivaOdaDeposu> {
  if (!vivaUuidMu(id)) throw new VivaHatasi("Geçersiz etkinlik.");
  const { db, user } = await vivaKullanici();
  return { async islem(islem, veri = {}) {
    const { data, error } = await db.rpc("viva_daily_oda_islem", { p_auth: user.id, p_etkinlik: id, p_islem: islem, p_veri: veri });
    if (error) throw error;
    return data;
  } };
}
function hata(err: unknown) {
  return err instanceof VivaDailyHatasi ? vivaYanit({ hata: err.message }, err.status) : vivaHata(err);
}
export async function GET(req: Request) {
  try {
    const depo = await depoOlustur(new URL(req.url).searchParams.get("etkinlik_id"));
    return vivaYanit(vivaOdaSonucu(await depo.islem("durum")));
  } catch (err) { return hata(err); }
}
export async function POST(req: Request) {
  try {
    const v = await vivaGirdi(req);
    const depo = await depoOlustur(v.etkinlik_id);
    const sonuc = await vivaDailyOdaHazirla(depo);
    return vivaYanit(sonuc, sonuc.bekle ? 202 : 200);
  } catch (err) { return hata(err); }
}
