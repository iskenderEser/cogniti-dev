export const SOSYAL_IKON_BUCKET = "store-urun-gorselleri";
export const SOSYAL_LINKLER_TABLO = "cogniti_sosyal_linkler";
export const SOSYAL_IKON_MAX_BOYUT = 5 * 1024 * 1024;
export const SOSYAL_LINK_AD_AZAMI = 80;

export interface KamuSosyalLink {
  id: string;
  ad: string;
  url: string;
  ikonUrl: string;
}

export interface SosyalLinkItem extends KamuSosyalLink {
  sira: number;
  gorunur: boolean;
  createdAt?: string;
}

export type SosyalIkonUzanti = "png" | "jpg" | "webp" | "svg";

export type SosyalIkonKontrolSonuc =
  | { gecerli: true; uzanti: SosyalIkonUzanti; mime: string }
  | { gecerli: false; hata: string };

export function sosyalLinkKurulumuEksik(hata: { code?: string } | null | undefined): boolean {
  return hata?.code === "42P01" || hata?.code === "PGRST205";
}

export function sosyalLinkAdNormalizeEt(hamAd: string): string | null {
  const temiz = hamAd.trim();
  if (!temiz || temiz.length > SOSYAL_LINK_AD_AZAMI) return null;
  return temiz;
}

export function sosyalLinkUrlNormalizeEt(hamUrl: string): string | null {
  const temiz = hamUrl.trim();
  if (!temiz) return null;

  let aday = temiz;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(aday)) {
    if (aday.startsWith("/") || !/^[^\s/]+\.[^\s/]+/.test(aday)) return null;
    aday = `https://${aday}`;
  }

  try {
    const parsed = new URL(aday);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname || !parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function svgIcerigiGuvenliMi(metin: string): boolean {
  if (!/<svg[\s>]/i.test(metin)) return false;
  if (/<script[\s>]/i.test(metin)) return false;
  if (/javascript:/i.test(metin)) return false;
  if (/\son[a-z]+\s*=/i.test(metin)) return false;
  return true;
}

export async function sosyalIkonDosyaKontrol(dosya: File): Promise<SosyalIkonKontrolSonuc> {
  if (!dosya.size || dosya.size > SOSYAL_IKON_MAX_BOYUT) {
    return { gecerli: false, hata: "En fazla 5 MB boyutunda, boş olmayan bir ikon dosyası yükleyebilirsiniz." };
  }

  const mime = dosya.type.toLowerCase();
  const adKucuk = dosya.name.toLowerCase();

  if (mime === "image/svg+xml" || adKucuk.endsWith(".svg")) {
    const metin = await dosya.text();
    if (!svgIcerigiGuvenliMi(metin)) {
      return { gecerli: false, hata: "SVG dosyası geçersiz veya güvenli olmayan öğeler içeriyor." };
    }
    return { gecerli: true, uzanti: "svg", mime: "image/svg+xml" };
  }

  const baytlar = new Uint8Array(await dosya.slice(0, 12).arrayBuffer());
  if (mime === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => baytlar[i] === v)) {
    return { gecerli: true, uzanti: "png", mime: "image/png" };
  }
  if ((mime === "image/jpeg" || mime === "image/jpg") && baytlar[0] === 255 && baytlar[1] === 216 && baytlar[2] === 255) {
    return { gecerli: true, uzanti: "jpg", mime: "image/jpeg" };
  }
  if (
    mime === "image/webp"
    && new TextDecoder().decode(baytlar.slice(0, 4)) === "RIFF"
    && new TextDecoder().decode(baytlar.slice(8, 12)) === "WEBP"
  ) {
    return { gecerli: true, uzanti: "webp", mime: "image/webp" };
  }

  return { gecerli: false, hata: "İkon için yalnızca SVG, PNG, JPEG veya WebP dosyası yükleyebilirsiniz." };
}
