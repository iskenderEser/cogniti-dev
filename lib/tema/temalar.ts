/** Renk değerleri app/tema.css içindedir; bu kayıt yalnız seçim kimliklerini taşır. */
export const TEMALAR = {
  mavi: { ad: "Kırık beyaz–mavi" },
  yesil: { ad: "Sütlü kahve–yeşil" },
} as const;

export type Tema = keyof typeof TEMALAR;

export const VARSAYILAN_TEMA: Tema = "mavi";

export const TEMA_TERCIHI_ANAHTARI = "hb_tema";
// Eski akış otomatik seçim de yazıyordu. Yalnız yeni açık seçimler geçerlidir.
export const TEMA_TERCIHI_SURUM_ANAHTARI = "hb_tema_surumu";
export const TEMA_TERCIHI_SURUMU = 2;
export const MISAFIR_TEMA_ANAHTARI = "hb_misafir_tema";
// Eski ortak kayıt başlangıç rengi olamaz; bu anahtara yalnız açık seçim yazılır.
export const TARAYICI_TEMA_ANAHTARI = "hb_tarayici_tema_secimi";

export function temaGecerliMi(deger: unknown): deger is Tema {
  return deger === "mavi" || deger === "yesil";
}

// Başlıkta eşzamanlı çalışır: login içeriği çizilmeden kayıtlı rengi uygular.
export const LOGIN_TEMA_BASLANGIC_BETIGI = `(()=>{
  if(window.location.pathname!=="/login"&&window.location.pathname!=="/")return;
  let tema=${JSON.stringify(VARSAYILAN_TEMA)};
  try{const secim=window.localStorage.getItem(${JSON.stringify(TARAYICI_TEMA_ANAHTARI)});
    if(secim==="mavi"||secim==="yesil")tema=secim;
  }catch{}
  document.documentElement.setAttribute("data-tema",tema);
})();`;
