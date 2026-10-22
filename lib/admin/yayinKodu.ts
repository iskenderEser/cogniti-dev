// Admin tekil silme alanında yayın kodunun sayısal bölümünü çözer.
// Örnek: "hepifarma_30058" -> 30058. Talep numarası global benzersizdir;
// gerçek talep UUID'si yalnız sunucuda veritabanından bulunur.
export function yayinKoduNumarasiniCoz(deger: unknown): number | null {
  if (typeof deger !== "string") return null;

  const sonParca = deger.trim().split("_").pop() ?? "";
  if (!/^\d+$/.test(sonParca)) return null;

  const talepNo = Number(sonParca);
  return Number.isSafeInteger(talepNo) && talepNo > 0 ? talepNo : null;
}
