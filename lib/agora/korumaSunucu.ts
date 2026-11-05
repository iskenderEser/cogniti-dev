import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { bunnyStorageOrtami } from "@/lib/ogrenmeAraci/bunnyStorage";

/** İndirme kısıtı sunucu erişimini kapsar; tarayıcıya ulaşan medyanın kopyalanamayacağı garantisi değildir. */
export function ayniSiteMedyaIstegi(request: Request): boolean {
  if (request.headers.get("sec-fetch-mode") === "navigate" || request.headers.get("sec-fetch-dest") === "document") return false;
  const site = request.headers.get("sec-fetch-site");
  if (site !== "same-origin") return false;
  const ref = request.headers.get("referer");
  try { return !!ref && new URL(ref).origin === new URL(request.url).origin; } catch { return false; }
}
export async function sesliUyariHazir(): Promise<boolean> {
  try {
    const b = await readFile(path.join(process.cwd(), "public/agora/kogniti-deneme-yayini.wav"));
    return b.length > 1000 && b.toString("ascii",0,4) === "RIFF" && b.toString("ascii",8,12) === "WAVE";
  } catch { return false; }
}

/** Stream kütüphane ayarları diğer Cogniti videolarını etkilediği için kendiliğinden değiştirilmez. */
export function korumaliVideoUrl(guid: string, simdi = Date.now()): string | null {
  const key = process.env.BUNNY_STREAM_TOKEN_KEY;
  const library = process.env.BUNNY_LIBRARY_ID;
  // Bu işaret, alan adı + doğrudan erişim + MediaCage ayarlarının birlikte doğrulandığını bildirir.
  if (!key || !library || process.env.AGORA_BUNNY_KORUMA_DOGRULANDI !== "1" || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(guid)) return null;
  const expires = Math.floor(simdi / 1000) + 3600;
  const token = createHash("sha256").update(key + guid + expires).digest("hex");
  return `https://player.mediadelivery.net/embed/${encodeURIComponent(library)}/${guid}?token=${token}&expires=${expires}&autoplay=false&disableIosPlayer=true`;
}

/** Orijinal CDN adresi istemciye çıkmaz; oturum her istek/Range için üst katmanda yeniden kontrol edilir. */
export async function podcastAkisi(request: Request, dosyaYolu: string, mime: string): Promise<Response> {
  const ortam = bunnyStorageOrtami();
  if (!ortam) return Response.json({ hata: "Podcast erişimi yapılandırılmamış." }, { status:503 });
  if (!dosyaYolu.startsWith("agora/") || dosyaYolu.split("/").some(s=>s === ".." || s === ".")) return new Response(null,{status:403});
  const range = request.headers.get("range");
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return new Response(null,{status:416});
  const yol = dosyaYolu.split("/").map(encodeURIComponent).join("/");
  const upstream = await fetch(`https://${ortam.storageHost}/${encodeURIComponent(ortam.storageZone)}/${yol}`, {
    headers: { AccessKey:ortam.storageAccessKey, ...(range ? {Range:range} : {}) }, cache:"no-store", signal:request.signal,
  });
  if (upstream.status === 416) return new Response(null,{status:416});
  if (!upstream.ok || !upstream.body) return new Response(null,{status:502});
  const headers = new Headers({ "Content-Type":mime, "Content-Disposition":"inline", "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff", "Cross-Origin-Resource-Policy":"same-origin", "Accept-Ranges":"bytes" });
  for (const k of ["content-length","content-range"]) { const v = upstream.headers.get(k); if (v) headers.set(k,v); }
  return new Response(upstream.body,{status:upstream.status === 206 ? 206 : 200,headers});
}
