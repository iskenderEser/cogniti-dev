type KimlikliYayin = { oneri_id: string };

function siraPuani(tohum: string, oneriId: string): number {
  let sonuc = 2166136261;
  for (const karakter of `${tohum}:${oneriId}`) {
    sonuc ^= karakter.charCodeAt(0);
    sonuc = Math.imul(sonuc, 16777619);
  }
  return sonuc >>> 0;
}

export function tohumaGoreYayinSirala<T extends KimlikliYayin>(yayinlar: T[], tohum: string): T[] {
  return [...yayinlar].sort((a, b) =>
    siraPuani(tohum, a.oneri_id) - siraPuani(tohum, b.oneri_id)
      || a.oneri_id.localeCompare(b.oneri_id)
  );
}
