import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

export const SIPARIS_PAKET_ADLARI = {
  esnek: "Esnek Paket",
  abonelik_baslangic: "Abonelik Başlangıç",
  abonelik_devam: "Abonelik Devam",
  kko: "Kullandığın Kadar Öde",
} as const;

export type SiparisKaydi = {
  kayit_id: string; siparis_tarihi: string; satin_alan_ad_soyad: string;
  bakiye_turu: "kisisel" | "firma_ortak"; paket_turu: keyof typeof SIPARIS_PAKET_ADLARI;
  token_adedi: number; birim_fiyat: number; toplam_tutar: number; kdv: number;
};
export type SiparisListesi = { firma_id: string; siparisler: SiparisKaydi[]; toplam: number; sayfa: number; sayfa_boyutu: number };
export function siparisListesiGecerli(v: unknown): v is SiparisListesi {
  if (!v || typeof v !== "object") return false;
  const d = v as SiparisListesi;
  return uuidGecerliMi(d.firma_id) && Number.isSafeInteger(d.toplam) && d.toplam >= 0
    && Number.isSafeInteger(d.sayfa) && d.sayfa >= 0 && d.sayfa <= 1000000 && d.sayfa_boyutu === 20
    && Array.isArray(d.siparisler) && d.siparisler.length <= 20 && d.siparisler.length <= d.toplam
    && d.siparisler.every(s => s && uuidGecerliMi(s.kayit_id)
      && typeof s.siparis_tarihi === "string" && Number.isFinite(Date.parse(s.siparis_tarihi))
      && typeof s.satin_alan_ad_soyad === "string"
      && typeof s.paket_turu === "string" && Object.hasOwn(SIPARIS_PAKET_ADLARI, s.paket_turu)
      && ["kisisel", "firma_ortak"].includes(s.bakiye_turu) && Number.isSafeInteger(s.token_adedi) && s.token_adedi > 0
      && Number.isFinite(s.birim_fiyat) && s.birim_fiyat > 0
      && Number.isFinite(s.toplam_tutar) && s.toplam_tutar >= 0
      && Number.isFinite(s.kdv) && s.kdv >= 0);
}
