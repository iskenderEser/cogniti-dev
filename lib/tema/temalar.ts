/** Renk değerleri app/tema.css içindedir; bu kayıt yalnız seçim kimliklerini taşır. */
export const TEMALAR = {
  mavi: { ad: "Kırık beyaz–mavi" },
  yesil: { ad: "Sütlü kahve–yeşil" },
} as const;

export type Tema = keyof typeof TEMALAR;

export const VARSAYILAN_TEMA: Tema = "mavi";

export const TEMA_TERCIHI_ANAHTARI = "hb_tema";
export const MISAFIR_TEMA_ANAHTARI = "hb_misafir_tema";

export function temaGecerliMi(deger: unknown): deger is Tema {
  return deger === "mavi" || deger === "yesil";
}
