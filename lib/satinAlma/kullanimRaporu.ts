import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
export type TokenHesabi = { bakiye_id: string; bakiye_turu: "kisisel" | "firma_ortak"; sahip_id: string | null; sahip_adi: string; paket_turu?: "kko" | "esnek"; toplam: number; kullanilan: number; kalan: number; ayrilan: number; suresi_dolan: number };
export type TokenTuketimSatiri = { id: string; bakiye_id: string; gonderen_id: string; gonderen: string; gonderen_rol: string; yayin_id: string; akis: "saha" | "eclub" | "eczanem" | "onceki_eclub"; token: number; ilk_tarih: string; son_tarih: string; firma_adi: string | null; talep_no: number | null; urun_adi: string | null; arac_turu: string | null };
export type EsnekKullanimRaporu = { firma_id: string; hesap_id: string | null; sayfa: number; hesaplar: TokenHesabi[]; satirlar: TokenTuketimSatiri[]; kayit_sayisi: number; tuketim_toplami: number };
const adet = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const tarih = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v));
export function esnekKullanimRaporuGecerli(veri: unknown): veri is EsnekKullanimRaporu {
  if (!veri || typeof veri !== "object") return false;
  const d = veri as EsnekKullanimRaporu;
  return uuidGecerliMi(d.firma_id) && (d.hesap_id === null || uuidGecerliMi(d.hesap_id)) && adet(d.sayfa) && adet(d.kayit_sayisi) && adet(d.tuketim_toplami)
    && Array.isArray(d.hesaplar) && d.hesaplar.every(h => h && uuidGecerliMi(h.bakiye_id) && typeof h.sahip_adi === "string"
      && ((h.bakiye_turu === "kisisel" && uuidGecerliMi(h.sahip_id)) || (h.bakiye_turu === "firma_ortak" && h.sahip_id === null))
      && (h.paket_turu === undefined || h.paket_turu === "kko" || h.paket_turu === "esnek")
      && [h.toplam, h.kullanilan, h.kalan, h.ayrilan, h.suresi_dolan].every(adet)
      && h.toplam === h.kullanilan + h.kalan + h.ayrilan + h.suresi_dolan)
    && (d.hesap_id === null || d.hesaplar.some(h => h.bakiye_id === d.hesap_id))
    && Array.isArray(d.satirlar) && d.satirlar.length <= 50 && d.satirlar.length <= d.kayit_sayisi
    && d.satirlar.every(s => s && uuidGecerliMi(s.id) && uuidGecerliMi(s.gonderen_id) && uuidGecerliMi(s.yayin_id)
      && d.hesaplar.some(h => h.bakiye_id === s.bakiye_id) && (d.hesap_id === null || s.bakiye_id === d.hesap_id)
      && typeof s.gonderen === "string" && typeof s.gonderen_rol === "string" && ["saha", "eclub", "eczanem", "onceki_eclub"].includes(s.akis)
      && adet(s.token) && s.token > 0 && tarih(s.ilk_tarih) && tarih(s.son_tarih)
      && (s.firma_adi === null || typeof s.firma_adi === "string") && (s.talep_no === null || adet(s.talep_no))
      && (s.urun_adi === null || typeof s.urun_adi === "string") && (s.arac_turu === null || typeof s.arac_turu === "string"));
}
