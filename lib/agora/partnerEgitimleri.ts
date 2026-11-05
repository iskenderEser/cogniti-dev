export const EGITIM_DURUMLARI = { taslak: "Taslak", yayinda: "Yayında", pasif: "Pasif" };
export type PartnerEgitimDurumu = keyof typeof EGITIM_DURUMLARI;
export interface PartnerEgitimi {
  egitim_id: string; egitim_adi: string; kategori: string | null;
  yayin_araci: "video" | "podcast" | null; fiyat_tl: number | null;
  durum: PartnerEgitimDurumu; surum: number; olusturuldu_at: string; guncellendi_at: string;
}
export interface PartnerEgitimListesi { kayitlar: PartnerEgitimi[]; toplam: number }
export function partnerEgitimListesiGecerli(data: unknown): data is PartnerEgitimListesi {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!Number.isSafeInteger(d.toplam) || Number(d.toplam) < 0 || !Array.isArray(d.kayitlar)) return false;
  return d.kayitlar.every((r: unknown) => {
    if (!r || typeof r !== "object") return false;
    const e = r as Record<string, unknown>;
    return ["egitim_id", "egitim_adi", "olusturuldu_at", "guncellendi_at"].every(k => typeof e[k] === "string")
      && typeof e.durum === "string" && Object.hasOwn(EGITIM_DURUMLARI, e.durum)
      && Number.isSafeInteger(e.surum) && Number(e.surum) > 0
      && (e.kategori === null || typeof e.kategori === "string")
      && (e.yayin_araci === null || ["video", "podcast"].includes(String(e.yayin_araci)))
      && (e.fiyat_tl === null || (typeof e.fiyat_tl === "number" && Number.isFinite(e.fiyat_tl) && e.fiyat_tl >= 0));
  });
}
export function egitimAdiDogrula(value: unknown) {
  if (typeof value !== "string") return null;
  const ad = value.trim();
  return ad.length >= 3 && ad.length <= 200 && !/[\u0000-\u001f\u007f]/.test(ad) ? ad : null;
}
