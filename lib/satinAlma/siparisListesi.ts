import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
export type EsnekSiparisKaydi = {
  siparis_id: string; siparis_tarihi: string; satin_alan_ad_soyad: string; satin_alan_rol: string;
  bakiye_turu: "kisisel" | "firma_ortak"; token_adedi: number; birim_fiyat: number; toplam_tutar: number; son_kullanim_at: string;
};
export type SiparisListesi = { firma_id: string; siparisler: EsnekSiparisKaydi[]; toplam: number; sayfa: number; sayfa_boyutu: number };
export function siparisListesiGecerli(v: unknown): v is SiparisListesi {
  if (!v || typeof v !== "object") return false;
  const d = v as SiparisListesi;
  return uuidGecerliMi(d.firma_id) && Number.isSafeInteger(d.toplam) && d.toplam >= 0
    && Number.isSafeInteger(d.sayfa) && d.sayfa >= 0 && d.sayfa <= 1000000 && d.sayfa_boyutu === 20
    && Array.isArray(d.siparisler) && d.siparisler.length <= 20 && d.siparisler.length <= d.toplam
    && d.siparisler.every(s => s && uuidGecerliMi(s.siparis_id)
      && typeof s.siparis_tarihi === "string" && Number.isFinite(Date.parse(s.siparis_tarihi))
      && typeof s.son_kullanim_at === "string" && Number.isFinite(Date.parse(s.son_kullanim_at))
      && typeof s.satin_alan_ad_soyad === "string" && typeof s.satin_alan_rol === "string"
      && ["kisisel", "firma_ortak"].includes(s.bakiye_turu) && Number.isSafeInteger(s.token_adedi) && s.token_adedi > 0
      && typeof s.birim_fiyat === "number" && Number.isFinite(s.birim_fiyat) && s.birim_fiyat > 0
      && typeof s.toplam_tutar === "number" && Number.isFinite(s.toplam_tutar) && s.toplam_tutar > 0
      && Math.abs(s.toplam_tutar - Math.round(s.birim_fiyat * 100) * s.token_adedi / 100) < 0.001);
}
