import { PARTNER_LOGO_BOYUTU } from "@/lib/agora/partnerProfil";

// formData() çağrısından önce akışın tamamına boyut sınırı uygulanır.
export async function partnerProfilFormOku(request: Request) {
  const tip = request.headers.get("content-type") ?? "";
  if (!tip.toLowerCase().startsWith("multipart/form-data;")) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const parcalar: Uint8Array<ArrayBuffer>[] = [];
  let boyut = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      boyut += value.byteLength;
      if (boyut > PARTNER_LOGO_BOYUTU + 65536) { await reader.cancel(); return null; }
      parcalar.push(Uint8Array.from(value));
    }
    return await new Response(new Blob(parcalar), { headers: { "content-type": tip } }).formData();
  } catch { return null; } finally { reader.releaseLock(); }
}
