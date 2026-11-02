// Cogniti merkezî çek kataloğundaki minimum TL tutarı.
export function minimumSiparisTlGecerliMi(deger: unknown): deger is number {
  return typeof deger === "number"
    && Number.isFinite(deger)
    && deger > 0
    && deger <= 9999999999.99
    && Number(deger.toFixed(2)) === deger;
}

// PostgreSQL integer alanıyla aynı sınır: seçilen çeke özel firma baz puanı.
export function bazPuanGecerliMi(deger: unknown): deger is number {
  return typeof deger === "number" && Number.isInteger(deger)
    && deger >= 1 && deger <= 2147483647;
}
