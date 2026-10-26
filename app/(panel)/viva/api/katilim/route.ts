import { vivaGirdi, vivaHata, vivaYanit } from "@/lib/viva/sunucu";
import { VivaDailyHatasi } from "@/lib/viva/daily";
import { vivaKatilimHazirla } from "@/lib/viva/katilim";
import { vivaUyeKatilimDeposu } from "@/lib/viva/katilimSunucu";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const v = await vivaGirdi(req);
    const sonuc = await vivaKatilimHazirla(await vivaUyeKatilimDeposu(v.etkinlik_id));
    return vivaYanit(sonuc, sonuc.durum === "bekliyor" ? 202 : 200);
  } catch (err) {
    return err instanceof VivaDailyHatasi ? vivaYanit({ hata: err.message }, err.status) : vivaHata(err);
  }
}
