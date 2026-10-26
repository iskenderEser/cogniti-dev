import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { VIVA_DAILY_OLAYLAR } from "./webhook-events.mjs";

export { VIVA_DAILY_OLAYLAR };
export function vivaWebhookDogrula(olay: unknown, timestamp: string | null, signature: string | null, secret = process.env.DAILY_WEBHOOK_SECRET, simdi = Date.now()) {
  if (!secret || !/^[A-Za-z0-9+/]{43}=$/.test(secret)) throw new Error("WEBHOOK_AYAR_EKSIK");
  if (!timestamp || !/^\d{10}(?:\d{3})?$/.test(timestamp) || !signature || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
  const zaman = Number(timestamp) * (timestamp.length === 10 ? 1000 : 1);
  if (Math.abs(simdi - zaman) > 300_000) return false;
  // Daily'nin belgelenmiş imzası: timestamp + '.' + JSON.stringify(event).
  const beklenen = createHmac("sha256", Buffer.from(secret, "base64")).update(`${timestamp}.${JSON.stringify(olay)}`).digest();
  const gelen = Buffer.from(signature, "base64");
  return gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen);
}
export function vivaWebhookOlayi(value: unknown) {
  const o = value as { id?: unknown; type?: unknown; payload?: unknown };
  if (!o || typeof o.id !== "string" || !o.id || o.id.length > 256 || typeof o.type !== "string" || !VIVA_DAILY_OLAYLAR.includes(o.type as typeof VIVA_DAILY_OLAYLAR[number]) || !o.payload || typeof o.payload !== "object" || Array.isArray(o.payload)) return null;
  const p = o.payload as Record<string, unknown>;
  // İsim, e-posta, userData, share_token, s3key ve indirme URL'si alınmaz.
  const veri = Object.fromEntries(["room", "room_name", "meeting_id", "session_id", "user_id", "recording_id", "instance_id", "start_ts", "joined_at", "left_at", "timestamp"].flatMap(k => {
    const v = p[k]; return typeof v === "string" && v.length <= 256 || typeof v === "number" && Number.isFinite(v) ? [[k, v]] : [];
  }));
  const tekil = o.type.startsWith("participant.") && typeof veri.session_id === "string"
    ? `${o.type}:${veri.session_id}` : o.type.startsWith("recording.") && typeof (veri.recording_id ?? veri.instance_id) === "string"
      ? `${o.type}:${veri.recording_id ?? veri.instance_id}` : o.id;
  return { anahtar: createHash("sha256").update(tekil).digest("hex"), tur: o.type, veri };
}
