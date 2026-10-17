import { HESAPLANAN_RENKLER, type HesaplananRenkAnahtari } from "./hesaplananRenkler.generated";

/** DOM dışındaki işlevsel renk hesapları da CSS'den üretilen kaynağı kullanır. */
export function hesaplananRenk(ad: HesaplananRenkAnahtari, tema: "mavi" | "yesil" = "mavi"): string {
  return HESAPLANAN_RENKLER[tema][ad];
}

/** ECharts/Canvas'a CSS var() yerine gerçek renk verilir. Kapsayıcının teması geçerlidir. */
export function cizimRenkCozucu(oge?: Element | null): (renk: string) => string {
  const tema = oge?.closest("[data-tema]")?.getAttribute("data-tema") === "yesil" ? "yesil" : "mavi";
  const stil = oge?.ownerDocument.defaultView?.getComputedStyle(oge);
  const bellek = new Map<string, string>();
  const coz = (renk: string): string => {
    if (bellek.has(renk)) return bellek.get(renk)!;
    const sonuc = renk.replace(/var\((--[\w-]+)\)/g, (ifade, ad: string) => {
      const deger = stil?.getPropertyValue(ad).trim() || HESAPLANAN_RENKLER[tema][ad as HesaplananRenkAnahtari];
      return deger && deger !== ifade ? coz(deger) : ifade;
    });
    bellek.set(renk, sonuc);
    return sonuc;
  };
  return coz;
}

const renkAlanlari = new Set(["color", "backgroundColor", "borderColor", "shadowColor", "textBorderColor", "textShadowColor", "fill", "stroke"]);

/** Yalnız renk alanlarını çözer; veri, formatter ve diğer çizim ayarlarına dokunmaz. */
export function grafikRenkleriniCoz<T>(secenek: T, coz: (renk: string) => string = cizimRenkCozucu()): T {
  const renk = (deger: unknown): unknown => {
    if (typeof deger === "string") return coz(deger);
    if (Array.isArray(deger)) return deger.map(renk);
    if (typeof deger === "function") {
      return function (this: unknown, ...args: unknown[]) { return renk(deger.apply(this, args)); };
    }
    return gez(deger);
  };
  const gez = (deger: unknown): unknown => {
    if (Array.isArray(deger)) return deger.map(gez);
    if (!deger || typeof deger !== "object" || Object.getPrototypeOf(deger) !== Object.prototype) return deger;
    return Object.fromEntries(Object.entries(deger).map(([ad, icerik]) => [ad, renkAlanlari.has(ad) ? renk(icerik) : gez(icerik)]));
  };
  return gez(secenek) as T;
}

/** Tema değişimi çizimi günceller; grafik örneği ve animasyon durumu korunur. */
export function cizimTemasiniIzle(oge: Element, guncelle: () => void): () => void {
  const Gozlemci = oge.ownerDocument.defaultView?.MutationObserver;
  if (!Gozlemci) return () => {};
  const gozlemci = new Gozlemci(guncelle);
  for (let ata: Element | null = oge; ata; ata = ata.parentElement) {
    gozlemci.observe(ata, { attributes: true, attributeFilter: ["data-tema"] });
  }
  return () => gozlemci.disconnect();
}
