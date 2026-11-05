export const partnerYanit = (veri: unknown, status = 200) => Response.json(veri, {
  status, headers: { "Cache-Control": "private, no-store" },
});
export async function partnerJsonOku(request: Request, maxBytes = 4096): Promise<
  { ok: true; veri: Record<string, unknown> } | { ok: false; yanit: Response }
> {
  if (request.headers.get("origin") !== new URL(request.url).origin) return { ok: false, yanit: partnerYanit({ hata: "İstek doğrulanamadı." }, 403) };
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return { ok: false, yanit: partnerYanit({ hata: "Geçersiz istek." }, 415) };
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, yanit: partnerYanit({ hata: "Bilgiler okunamadı." }, 400) };
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let size = 0, text = "";
    while (true) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return { ok: false, yanit: partnerYanit({ hata: "İstek çok uzun." }, 413) }; }
      text += decoder.decode(part.value, { stream: true });
    }
    const veri: unknown = JSON.parse(text + decoder.decode());
    if (!veri || typeof veri !== "object" || Array.isArray(veri)) throw new Error("Geçersiz istek");
    return { ok: true, veri: veri as Record<string, unknown> };
  } catch { return { ok: false, yanit: partnerYanit({ hata: "Bilgiler okunamadı." }, 400) }; }
  finally { reader.releaseLock(); }
}
