const secimler = new Map<string, string>();
const dinleyiciler = new Set<() => void>();

export function eclubFirmaUrunSeciminiOku(anahtar: string | null): string | null {
  if (!anahtar || typeof window === "undefined") return null;
  try { return window.sessionStorage.getItem(anahtar) ?? secimler.get(anahtar) ?? null; }
  catch { return secimler.get(anahtar) ?? null; }
}

export function eclubFirmaUrunSeciminiYaz(anahtar: string, urunId: string): void {
  secimler.set(anahtar, urunId);
  try { window.sessionStorage.setItem(anahtar, urunId); }
  catch { /* Depolama kapalıysa seçim mevcut tarayıcı oturumunun belleğinde korunur. */ }
  for (const dinleyici of dinleyiciler) dinleyici();
}

export function eclubFirmaUrunSecimineAboneOl(dinleyici: () => void): () => void {
  dinleyiciler.add(dinleyici);
  return () => { dinleyiciler.delete(dinleyici); };
}
