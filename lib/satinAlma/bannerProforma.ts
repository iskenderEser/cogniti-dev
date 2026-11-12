import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { proformaOnayiGecerli, type ProformaOnayi, type ProformaTarafi } from "./esnekProforma";
import { vivaAlimDonemiGecerli } from "./vivaAlimlari";

export { proformaOnayiGecerli };

type BannerSatiri = {
  tuketim_id: string;
  tarih: string;
  alan: string;
  baslangic?: string;
  haftalik_token?: number;
  islem_turu?: "banner_yayin" | "banner_iptal";
  sira: number;
  hafta_sayisi: number;
  token_adedi: number;
  birim_fiyat: number;
  tutar: number;
  test_kaydi: boolean;
};

type BannerBelgesi = {
  firma_id: string;
  donem: string;
  belge_no: string;
  tarih: string;
  duzenleyen: ProformaTarafi;
  alici: ProformaTarafi;
  satirlar: BannerSatiri[];
  toplam_tutar: number;
  kdv: number;
  genel_tutar: number;
};

export type BannerProforma = {
  firma_id: string;
  ay: string;
  admin_onayi: boolean;
  belge: BannerBelgesi | null;
  bekleyen: number;
  onaylanabilir: boolean;
  onay: ProformaOnayi | null;
};

function tarafGecerli(v: unknown): v is ProformaTarafi {
  return !!v && typeof v === "object" && ["unvan", "adres", "vergi_dairesi", "vergi_numarasi"]
    .every(k => typeof (v as Record<string, unknown>)[k] === "string");
}

export function bannerProformaGecerli(v: unknown): v is BannerProforma {
  if (!v || typeof v !== "object") return false;
  const d = v as BannerProforma;
  if (!uuidGecerliMi(d.firma_id) || !vivaAlimDonemiGecerli(d.ay)
    || typeof d.admin_onayi !== "boolean" || typeof d.onaylanabilir !== "boolean"
    || !Number.isSafeInteger(d.bekleyen) || d.bekleyen < 0
    || (d.onay !== null && !proformaOnayiGecerli(d.onay))) return false;
  if (d.belge === null) return d.onay === null && !d.onaylanabilir;
  const b = d.belge;
  return !!b && b.firma_id === d.firma_id && b.donem === d.ay
    && b.belge_no === `PF-B-${d.ay.replace("-", "")}-${d.firma_id}`
    && typeof b.tarih === "string" && Number.isFinite(Date.parse(b.tarih))
    && tarafGecerli(b.duzenleyen) && tarafGecerli(b.alici)
    && [b.toplam_tutar, b.kdv, b.genel_tutar].every(n => Number.isFinite(n) && n >= 0)
    && Array.isArray(b.satirlar) && b.satirlar.every(s => s && uuidGecerliMi(s.tuketim_id)
      && typeof s.tarih === "string" && Number.isFinite(Date.parse(s.tarih))
      && (s.baslangic === undefined || (typeof s.baslangic === "string" && Number.isFinite(Date.parse(s.baslangic))))
      && (s.haftalik_token === undefined || (Number.isSafeInteger(s.haftalik_token) && s.haftalik_token > 0))
      && (s.islem_turu === undefined || s.islem_turu === "banner_yayin" || s.islem_turu === "banner_iptal")
      && typeof s.alan === "string" && typeof s.test_kaydi === "boolean"
      && [s.sira, s.hafta_sayisi, s.token_adedi].every(n => Number.isSafeInteger(n) && n > 0)
      && Number.isFinite(s.birim_fiyat) && s.birim_fiyat > 0 && Number.isFinite(s.tutar) && s.tutar >= 0);
}
