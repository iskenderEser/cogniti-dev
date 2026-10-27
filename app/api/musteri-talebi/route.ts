const SECENEKLER = new Set(["Kullandığın Kadar Öde", "10.000 token / ay", "30.000 token / ay", "75.000 token / ay"]);
const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return hata("İstek doğrulanamadı.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return hata("İstek doğrulanamadı.", 415);
  if (Number(request.headers.get("content-length") ?? 0) > 8192) return hata("Talep çok uzun.", 413);
  let data: unknown;
  try { const text = await request.text(); if (text.length > 8192) return hata("Talep çok uzun.", 413); data = JSON.parse(text); } catch { return hata("Form bilgileri okunamadı.", 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return hata("Form bilgileri geçersiz.", 400);
  const d = data as Record<string, unknown>;
  if (d.website) return hata("Talep gönderilemedi.", 400);
  const metin = (v: unknown, max: number) => typeof v === "string" && v.trim().length <= max ? v.trim() : "";
  const firma = metin(d.firma, 150), ad = metin(d.ad, 150), eposta = metin(d.eposta, 254), telefon = metin(d.telefon, 30), not = metin(d.not, 2000), secim = metin(d.secim, 60);
  if (!firma || !ad || /[\r\n]/.test(firma + ad + eposta + telefon) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta) || !/^[+\d\s().-]{10,30}$/.test(telefon) || telefon.replace(/\D/g, "").length < 10 || !SECENEKLER.has(secim) || (typeof d.not === "string" && d.not.trim().length > 2000)) return hata("Lütfen form alanlarını geçerli bilgilerle doldurun.", 400);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MUSTERI_TALEP_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM || process.env.ECLUB_CEK_EMAIL_FROM;
  if (!apiKey || !from) return hata("Talebiniz şu anda gönderilemiyor. Lütfen info@mill.tr adresinden bize ulaşın.", 503);
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: ["info@mill.tr"], reply_to: eposta, subject: "Cogniti müşteri talebi", text: `Firmanızın Adı: ${firma}\nAdınız Soyadınız: ${ad}\nE-postanız: ${eposta}\nCep Telefon Numaranız: ${telefon}\nİlgilenilen seçenek: ${secim}\nEk bilgi: ${not || "—"}` }) });
    if (!response.ok) return hata("Talebiniz gönderilemedi. Lütfen tekrar deneyin veya info@mill.tr adresinden bize ulaşın.", 502);
    return Response.json({ mesaj: "Talebiniz alındı, sizinle iletişime geçeceğiz." });
  } catch { return hata("Talebiniz gönderilemedi. Lütfen tekrar deneyin veya info@mill.tr adresinden bize ulaşın.", 502); }
}
