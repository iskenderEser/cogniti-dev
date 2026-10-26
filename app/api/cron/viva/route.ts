import { createAdminClient } from "@/lib/supabase/server";
import { cronYetkiliMi } from "@/lib/eclub/gonderimPlanIsleyici";
import { vivaSunucuMutabakat } from "@/lib/viva/yasamSunucu";
import { vivaYanit } from "@/lib/viva/sunucu";
import { vivaKayitMutabakat } from "@/lib/viva/kayitSunucu";
import { vivaEpostaKuyrugunuIsle } from "@/lib/viva/epostaGonderimSunucu";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
async function isle(req: Request) {
  if (!cronYetkiliMi(req.headers.get("authorization"), process.env.CRON_SECRET)) return vivaYanit({ hata: "Yetkisiz erişim." }, 401);
  const db = createAdminClient();
  const bas = Date.now();
  let kayit = { islenen: 0, hatali: 0 };
  try { kayit = await vivaKayitMutabakat(db); } catch { kayit.hatali++; }
  let eposta = { islenen: 0, gonderilen: 0, hatali: 0, aktif: false };
  try { eposta = await vivaEpostaKuyrugunuIsle(db, new URL(req.url).origin, bas + 25_000); } catch { eposta.hatali++; }
  const { data, error } = await db.rpc("viva_daily_yasam_siradaki");
  if (error || !Array.isArray(data)) return vivaYanit({ hata: "Viva işleri okunamadı." }, 503);
  let islenen = 0, hatali = 0;
  for (const id of data) {
    if (Date.now() - bas > 40_000) break;
    try { await vivaSunucuMutabakat(String(id), db); islenen++; } catch { hatali++; }
  }
  return vivaYanit({ islenen, hatali, kayit, eposta }, hatali || kayit.hatali || eposta.hatali ? 503 : 200);
}
export const GET = isle;
export const POST = isle;
