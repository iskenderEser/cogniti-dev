// Yeni kurgu: gerçek gönderimden başlayan öğrenme süresi ve tekrar aralığı ayrı kavramlardır.
export const ECLUB_OGRENME_GECERLILIK_GUN = 15;
export const ECLUB_YAYIN_TEKRAR_ARALIGI_GUN = 15;

export const ECLUB_EMEKLI_GONDERI_ANAHTARLARI = new Set<string>([
  "eclub_ayni_video_tekrar_bekleme_gun",
  "eclub_aylik_gonderim_limiti",
  "eclub_gonderim_araligi_gun",
  "eclub_alici_pencere_gun",
  "eclub_alici_haftalik_limit",
]);

export const ECLUB_GONDERI_AYARLARI = [
  {
    anahtar: "eclub_oneri_gecerlilik_gun",
    baslik: "Yayın tamamlama süresi",
    aciklama: "Gerçek gönderimden başlayan puanlı ve sorulu geçerlilik süresi. Yeni kurguda 15 gündür.",
    birim: "gün",
    varsayilan: ECLUB_OGRENME_GECERLILIK_GUN,
  },
] as const;

export type EclubGonderiAyariAnahtari = typeof ECLUB_GONDERI_AYARLARI[number]["anahtar"];

export const ECLUB_GONDERI_AYAR_ANAHTARLARI = new Set<string>(
  ECLUB_GONDERI_AYARLARI.map((ayar) => ayar.anahtar),
);

export function eclubGonderiAyariMi(anahtar: string): anahtar is EclubGonderiAyariAnahtari {
  return ECLUB_GONDERI_AYAR_ANAHTARLARI.has(anahtar);
}

export function eclubGonderiAyariVarsayilani(anahtar: EclubGonderiAyariAnahtari): number {
  return ECLUB_GONDERI_AYARLARI.find((ayar) => ayar.anahtar === anahtar)!.varsayilan;
}

/** Admin ayarı üzerinden eski 7 gün veya farklı bir süre yeniden etkinleştirilemez. */
export function eclubGonderiAyariDegeriGecerliMi(anahtar: string, deger: unknown): boolean {
  return eclubGonderiAyariMi(anahtar) && deger === eclubGonderiAyariVarsayilani(anahtar);
}
