import { vivaWebhookDogrula, vivaWebhookOlayi } from "@/lib/viva/webhook";
import { createAdminClient } from "@/lib/supabase/server";
import { vivaDailyAyar } from "@/lib/viva/daily";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;
const yanit = (status: number) => Response.json({ ok: status === 200 }, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(req: Request) {
  let olay: unknown;
  try {
    if (!req.body) return yanit(400);
    const reader = req.body.getReader(); const parcalar: Uint8Array[] = []; let boyut = 0;
    while (true) { const r = await reader.read(); if (r.done) break; boyut += r.value.byteLength; if (boyut > 65_536) { await reader.cancel(); return yanit(413); } parcalar.push(r.value); }
    olay = JSON.parse(Buffer.concat(parcalar).toString("utf8"));
    if (!vivaWebhookDogrula(olay, req.headers.get("x-webhook-timestamp"), req.headers.get("x-webhook-signature"))) return yanit(401);
  } catch (e) { return yanit(e instanceof Error && e.message === "WEBHOOK_AYAR_EKSIK" ? 503 : 400); }
  // İlk kurulum/yeniden etkinleştirme testi: DB veya sağlayıcı çağrısı yok.
  if (olay && typeof olay === "object" && "test" in olay && olay.test === "test" && Object.keys(olay).length === 1) return yanit(200);
  const o = vivaWebhookOlayi(olay); if (!o) return yanit(200);
  try {
    const { error } = await createAdminClient().rpc("viva_daily_kayit_islem", { p_auth: null, p_etkinlik: null, p_islem: "olay_al", p_veri: { ...o, domain: vivaDailyAyar().domain } });
    return yanit(error ? 503 : 200);
  } catch { return yanit(503); }
}
