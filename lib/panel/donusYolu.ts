const UUID_DESEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Giriş sonrası yalnız güvenli iç panel adreslerine yönlendirir.
 * Şu an önerilen yayın bağlantıları için `/ana-sayfa?yayin_id=...(&oneri_id=...)` yolunu doğrular.
 */
export function panelDonusYolu(aranan: string): string | null {
  const ham = new URLSearchParams(aranan).get("donus");
  if (!ham || !ham.startsWith("/") || ham.startsWith("//")) return null;
  if (ham.split("?").length > 2) return null;

  const [yol, sorgu = ""] = ham.split("?");
  if (yol !== "/ana-sayfa") return null;
  if (!sorgu) return "/ana-sayfa";

  const p = new URLSearchParams(sorgu);
  const anahtarlar = [...p.keys()];
  if (anahtarlar.length !== new Set(anahtarlar).size || anahtarlar.length > 2) return null;
  if (anahtarlar.some((k) => k !== "yayin_id" && k !== "oneri_id")) return null;

  const yayinId = p.get("yayin_id");
  const oneriId = p.get("oneri_id");
  if (!yayinId || !UUID_DESEN.test(yayinId)) return null;
  if (oneriId !== null && !UUID_DESEN.test(oneriId)) return null;

  const temiz = new URLSearchParams({ yayin_id: yayinId });
  if (oneriId) temiz.set("oneri_id", oneriId);
  return `/ana-sayfa?${temiz.toString()}`;
}
