import type { PartnerKayitliProfil } from "@/lib/agora/partnerProfil";

export const PARTNER_UYELIK_ETIKETLERI = { onay_bekliyor: "Onay Bekliyor", onaylandi: "Onaylandı", reddedildi: "Reddedildi" };
export type PartnerUyelikDurumu = keyof typeof PARTNER_UYELIK_ETIKETLERI;
export interface PartnerUyelikBasvurusu {
  partner_id: string; ad_soyad: string; eposta: string; cep_telefonu: string;
  uyelik_durumu: PartnerUyelikDurumu; uyelik_surum: number;
  uyelik_karar_at: string | null; profil: PartnerKayitliProfil & { guncellendi_at: string };
}
export interface PartnerUyelikListesi { toplam: number; kayitlar: PartnerUyelikBasvurusu[] }
export function partnerUyelikListesiGecerli(data: unknown): data is PartnerUyelikListesi {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!Number.isSafeInteger(d.toplam) || Number(d.toplam) < 0 || !Array.isArray(d.kayitlar)) return false;
  return d.kayitlar.every((k: unknown) => {
    if (!k || typeof k !== "object") return false;
    const r = k as Record<string, unknown>, f = r.profil as Record<string, unknown> | null;
    return ["partner_id", "ad_soyad", "eposta", "cep_telefonu"].every(a => typeof r[a] === "string")
      && typeof r.uyelik_durumu === "string" && Object.hasOwn(PARTNER_UYELIK_ETIKETLERI, r.uyelik_durumu)
      && Number.isSafeInteger(r.uyelik_surum) && Number(r.uyelik_surum) > 0
      && (r.uyelik_karar_at === null || typeof r.uyelik_karar_at === "string")
      && !!f && ["sirket_adi", "adres", "vergi_dairesi_kodu", "vergi_dairesi", "vergi_no", "iban", "logo_yolu", "guncellendi_at"].every(a => typeof f[a] === "string")
      && ["il_id", "ilce_id", "surum"].every(a => Number.isSafeInteger(f[a]) && Number(f[a]) > 0);
  });
}
