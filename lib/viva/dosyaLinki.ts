// Daily'nin döndürdüğü adres aynen kullanılır; video URL'sinden sohbet URL'si türetilmez.
export function vivaDailyDosyaLinki(veri: unknown, tur: "video" | "sohbet", simdi = Date.now()): { url: string; bitis: number } | null {
  if (!veri || typeof veri !== "object") return null;
  const kok = veri as Record<string, unknown>;
  function dogrula(url: unknown, bitis: unknown) {
    if (typeof url !== "string" || typeof bitis !== "number" || !Number.isFinite(bitis) || bitis * 1000 <= simdi) return null;
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" || u.hostname !== "b.daily.co" || u.port || u.username || u.password) return null;
      return { url, bitis };
    } catch { return null; }
  }
  if (tur === "video") return dogrula(kok.download_link, kok.expires);
  // Ek çıktı alanları farklı yanıt sürümlerinde iç içe olabilir. Yalnız açıkça
  // chat-webvtt/sohbet dosyası olarak etiketlenen sağlayıcı bağlantısını kabul et.
  let kalan = 100;
  function ara(deger: unknown, etiket: string, bitis: unknown, derinlik: number): { url: string; bitis: number } | null {
    if (--kalan < 0 || derinlik > 6) return null;
    if (typeof deger === "string") return /chat[-_. ]?(webvtt|vtt)|chat-webvtt/i.test(etiket) ? dogrula(deger, bitis) : null;
    if (!deger || typeof deger !== "object") return null;
    const d = deger as Record<string, unknown>;
    const ad = [etiket, d.type, d.kind, d.name, d.filename].filter(x => typeof x === "string").join(" ");
    const son = d.expires ?? bitis;
    if (/chat[-_. ]?(webvtt|vtt)|chat-webvtt/i.test(ad)) {
      const link = dogrula(d.download_link ?? d.url ?? d.link, son);
      if (link) return link;
    }
    for (const [anahtar, v] of Object.entries(d)) {
      const link = ara(v, `${ad} ${anahtar}`, son, derinlik + 1);
      if (link) return link;
    }
    return null;
  }
  return ara(kok, "", kok.expires, 0);
}
