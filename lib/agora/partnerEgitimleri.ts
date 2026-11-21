export const EGITIM_DURUMLARI = { taslak: "Taslak", yayinda: "Yayında", pasif: "Pasif" };
export type PartnerEgitimDurumu = keyof typeof EGITIM_DURUMLARI;
export interface PartnerEgitimi {
  partner_egitim_id?: string;
  kapak_video_guid?: string | null;
  egitim_id: string; egitim_adi: string; kategori: string | null;
  yayin_araci: "video" | "podcast" | null; fiyat_tl: number | null;
  durum: PartnerEgitimDurumu; surum: number; olusturuldu_at: string; guncellendi_at: string;
}
export interface PartnerEgitimListesi {
  kayitlar: PartnerEgitimi[];
  toplam: number;
  video_sayisi?: number;
  podcast_sayisi?: number;
}
const gecerliSayac = (deger: unknown) => Number.isSafeInteger(deger) && Number(deger) >= 0;
export function partnerEgitimListesiGecerli(data: unknown): data is PartnerEgitimListesi {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (
    !gecerliSayac(d.toplam)
    || (d.video_sayisi !== undefined && !gecerliSayac(d.video_sayisi))
    || (d.podcast_sayisi !== undefined && !gecerliSayac(d.podcast_sayisi))
    || !Array.isArray(d.kayitlar)
  ) return false;
  return d.kayitlar.every((r: unknown) => {
    if (!r || typeof r !== "object") return false;
    const e = r as Record<string, unknown>;
    return ["egitim_id", "egitim_adi", "olusturuldu_at", "guncellendi_at"].every(k => typeof e[k] === "string")
      && (e.partner_egitim_id === undefined || (typeof e.partner_egitim_id === "string" && /^PE-[1-9]\d*0\d{3}$/.test(e.partner_egitim_id)))
      && (e.kapak_video_guid === undefined || e.kapak_video_guid === null || (typeof e.kapak_video_guid === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(e.kapak_video_guid)))
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
