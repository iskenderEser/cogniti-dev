import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

export interface PartnerRaporKaydi {
  egitim_id: string;
  partner_egitim_id: string;
  egitim_adi: string;
  satis_fiyati: number | null;
  satilan_adet: number;
  toplam_satis: number;
  begeni_sayisi: number;
  favori_sayisi: number;
}
export interface PartnerRaporListesi {
  partner_id: string;
  toplam: number;
  sayfa: number;
  sayfa_boyutu: number;
  kayitlar: PartnerRaporKaydi[];
}
export function raporSayfasi(deger: string | null): number | null {
  if (deger === null) return 1;
  if (!/^[1-9]\d{0,5}$/.test(deger)) return null;
  const sayfa = Number(deger);
  return sayfa <= 100000 ? sayfa : null;
}
function kayitGecerli(deger: unknown): deger is PartnerRaporKaydi {
  if (!deger || typeof deger !== "object" || Array.isArray(deger)) return false;
  const r = deger as Record<string, unknown>;
  return uuidGecerliMi(r.egitim_id)
    && typeof r.partner_egitim_id === "string" && r.partner_egitim_id.length > 0
    && typeof r.egitim_adi === "string" && r.egitim_adi.length > 0
    && (r.satis_fiyati === null || (typeof r.satis_fiyati === "number" && Number.isFinite(r.satis_fiyati) && r.satis_fiyati >= 0))
    && typeof r.toplam_satis === "number" && Number.isFinite(r.toplam_satis) && r.toplam_satis >= 0
    && ["satilan_adet", "begeni_sayisi", "favori_sayisi"].every(k => Number.isSafeInteger(r[k]) && Number(r[k]) >= 0);
}
export function partnerRaporListesiGecerli(deger: unknown, partnerId: string, sayfa: number): deger is PartnerRaporListesi {
  if (!deger || typeof deger !== "object" || Array.isArray(deger)) return false;
  const r = deger as Record<string, unknown>;
  if (r.partner_id !== partnerId || !Number.isSafeInteger(r.toplam) || Number(r.toplam) < 0
    || r.sayfa !== sayfa || r.sayfa_boyutu !== 20 || !Array.isArray(r.kayitlar)
    || r.kayitlar.length > 20 || r.kayitlar.length > Number(r.toplam)) return false;
  const kayitlar: unknown[] = r.kayitlar;
  return kayitlar.every(kayitGecerli) && new Set(kayitlar.map(k => k.egitim_id)).size === kayitlar.length;
}
export function raporOkumaHatasi(kod?: string): { status: number; mesaj: string } {
  if (["42P01", "42703", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(kod ?? "")) {
    return { status: 503, mesaj: "Partner raporları SQL kurulumu bekleniyor." };
  }
  if (kod === "42501") return { status: 403, mesaj: "Raporları görme yetkiniz bulunmuyor." };
  if (kod === "22023") return { status: 400, mesaj: "Geçersiz rapor sayfası." };
  return { status: 503, mesaj: "Raporlar okunamadı. Yeniden deneyin." };
}
