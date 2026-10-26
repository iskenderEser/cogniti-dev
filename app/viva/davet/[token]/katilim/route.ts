import { cookies } from "next/headers";
import { vivaCookieAdi, vivaGirdi, vivaHata, vivaYanit } from "@/lib/viva/sunucu";
import { VivaDailyHatasi } from "@/lib/viva/daily";
import { vivaKatilimHazirla } from "@/lib/viva/katilim";
import { vivaMisafirKatilimDeposu } from "@/lib/viva/katilimSunucu";

export const runtime = "nodejs";
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    await vivaGirdi(req);
    const { token } = await ctx.params;
    const oturum = (await cookies()).get(vivaCookieAdi(token))?.value;
    const sonuc = await vivaKatilimHazirla(vivaMisafirKatilimDeposu(token, oturum));
    return vivaYanit(sonuc, sonuc.durum === "bekliyor" ? 202 : 200);
  } catch (err) {
    return err instanceof VivaDailyHatasi ? vivaYanit({ hata: err.message }, err.status) : vivaHata(err);
  }
}
