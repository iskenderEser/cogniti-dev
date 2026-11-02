// Eczanem kazancını ürün tarifesinden bağımsız olarak yayın bazında belirler.
export type EczanemKazanimModeli = "indirimli" | "indirimsiz";

export function eczanemKazanimKosullariHatasi(
  model: unknown,
  kosullar: { barkod?: unknown; puan?: unknown; tl?: unknown; satisFiyati?: unknown },
): string | null {
  if (model !== "indirimli" && model !== "indirimsiz") {
    return "Eczanem yayını için İndirimli veya İndirimsiz seçin.";
  }
  if (model === "indirimsiz") {
    return Object.values(kosullar).some((deger) => deger != null && deger !== "")
      ? "İndirimsiz yayında barkod, puan–TL karşılığı veya satış fiyatı gönderilemez."
      : null;
  }
  if (typeof kosullar.barkod !== "string" || !kosullar.barkod.trim()) {
    return "Eczanem yayınında barkod zorunludur.";
  }
  if (kosullar.puan != null || kosullar.tl != null) {
    return "Eczanem puan–TL karşılığı merkezi firma tanımından alınır.";
  }
  if (typeof kosullar.satisFiyati !== "number" || !Number.isFinite(kosullar.satisFiyati) || kosullar.satisFiyati <= 0) {
    return "Eczanem yayınında pozitif satış fiyatı zorunludur.";
  }
  return null;
}
