export type PartnerIlkGirisDurumu = "bekliyor" | "onaylandi" | "reddedildi";
export interface PartnerBasvurusu {
  partner_id: string;
  ad_soyad: string;
  eposta: string;
  cep_telefonu: string;
  olusturuldu_at: string;
  ilk_giris_durumu: PartnerIlkGirisDurumu;
  karar_at: string | null;
  giris_surum: number;
}
export interface PartnerBasvuruListesi { kayitlar: PartnerBasvurusu[]; toplam: number }
export const PARTNER_DURUM_ETIKETLERI: Record<PartnerIlkGirisDurumu, string> = {
  bekliyor: "Onay bekliyor", onaylandi: "İlk giriş onaylandı", reddedildi: "Reddedildi",
};
export function partnerListesiGecerli(data: unknown): data is PartnerBasvuruListesi {
  if (!data || typeof data !== "object" || !("kayitlar" in data) || !("toplam" in data) || !Array.isArray(data.kayitlar) || !Number.isInteger(data.toplam) || Number(data.toplam) < 0) return false;
  return data.kayitlar.every((r: unknown) => {
    if (!r || typeof r !== "object") return false;
    const d = r as Record<string, unknown>;
    return ["partner_id", "ad_soyad", "eposta", "cep_telefonu", "olusturuldu_at"].every(k => typeof d[k] === "string")
      && typeof d.ilk_giris_durumu === "string" && Object.hasOwn(PARTNER_DURUM_ETIKETLERI, d.ilk_giris_durumu)
      && Number.isSafeInteger(d.giris_surum) && Number(d.giris_surum) > 0 && (d.karar_at === null || typeof d.karar_at === "string");
  });
}
