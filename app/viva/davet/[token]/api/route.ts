import { cookies } from "next/headers";
import { vivaCookieAdi, vivaGirdi, vivaHata, vivaHash, vivaKodGonder, vivaKodHash, vivaMisafirRpc, vivaToken, vivaYanit, VivaHatasi } from "@/lib/viva/sunucu";

type Baglam = { params: Promise<{ token: string }> };
export async function GET(_req: Request, ctx: Baglam) {
  try {
    const { token } = await ctx.params;
    const oturum = (await cookies()).get(vivaCookieAdi(token))?.value;
    return vivaYanit(await vivaMisafirRpc(token, "bilgi", { oturum_hash: oturum ? vivaHash(oturum) : null }));
  } catch (err) { return vivaHata(err); }
}
export async function POST(req: Request, ctx: Baglam) {
  try {
    const { token } = await ctx.params;
    const v = await vivaGirdi(req);
    if (v.islem === "kod") return vivaYanit(await vivaKodGonder(token));
    if (v.islem !== "dogrula" || typeof v.kod !== "string" || !/^\d{6}$/.test(v.kod)) throw new VivaHatasi("Altı haneli doğrulama kodunu girin.");
    const oturum = vivaToken();
    const data = await vivaMisafirRpc(token, "dogrula", { kod_hash: vivaKodHash(token, v.kod), oturum_hash: vivaHash(oturum) });
    const yanit = vivaYanit(data);
    yanit.cookies.set(vivaCookieAdi(token), oturum, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: `/viva/davet/${token}`, expires: new Date(data.oturum_bitis),
    });
    return yanit;
  } catch (err) { return vivaHata(err); }
}
