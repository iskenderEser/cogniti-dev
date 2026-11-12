import { siparisListesiGecerli, type SiparisKaydi, type SiparisListesi } from "./siparisListesi";

export type ProformaTarafi = { unvan: string; adres: string; vergi_dairesi: string; vergi_numarasi: string };
export type EsnekProformaBelgesi = {
  belge_no: string; tarih: string; duzenleyen: ProformaTarafi; alici: ProformaTarafi;
  token_adedi: number; birim_fiyat: number; toplam_tutar: number; kdv: number; son_kullanim_yili: number;
};
export type ProformaOnayi = { tur: "firma" | "admin"; onaylayan: string; tarih: string; aciklama: string };
export type EsnekProformaKaydi = SiparisKaydi & { proforma: EsnekProformaBelgesi; onay: ProformaOnayi | null };
export type EsnekProformaListesi = Omit<SiparisListesi, "siparisler"> & { siparisler: EsnekProformaKaydi[]; admin_onayi: boolean };
export function proformaOnayiGecerli(veri: unknown): veri is ProformaOnayi {
  if (!veri || typeof veri !== "object") return false;
  const v = veri as ProformaOnayi;
  return (v.tur === "firma" || v.tur === "admin") && typeof v.onaylayan === "string"
    && typeof v.tarih === "string" && Number.isFinite(Date.parse(v.tarih))
    && typeof v.aciklama === "string" && v.aciklama.length <= 2000 && (v.tur !== "admin" || v.aciklama.trim().length > 0);
}
function tarafGecerli(v: unknown): v is ProformaTarafi {
  if (!v || typeof v !== "object") return false;
  return ["unvan", "adres", "vergi_dairesi", "vergi_numarasi"].every(k => typeof (v as Record<string, unknown>)[k] === "string");
}
export function esnekProformaListesiGecerli(veri: unknown): veri is EsnekProformaListesi {
  if (!siparisListesiGecerli(veri)) return false;
  const v = veri as EsnekProformaListesi;
  return typeof v.admin_onayi === "boolean" && v.siparisler.every(s => {
    const b = s.proforma;
    return s.paket_turu === "esnek" && !!b && b.belge_no === `PF-E-${s.kayit_id}`
      && typeof b.tarih === "string" && Number.isFinite(Date.parse(b.tarih))
      && tarafGecerli(b.duzenleyen) && tarafGecerli(b.alici)
      && b.token_adedi === s.token_adedi && b.birim_fiyat === s.birim_fiyat
      && b.toplam_tutar === s.toplam_tutar && b.kdv === s.kdv
      && Number.isInteger(b.son_kullanim_yili) && b.son_kullanim_yili >= 2000 && b.son_kullanim_yili <= 9999
      && (s.onay === null || proformaOnayiGecerli(s.onay));
  });
}
