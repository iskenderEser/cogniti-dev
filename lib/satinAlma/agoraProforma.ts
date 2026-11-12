import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { proformaOnayiGecerli, type ProformaOnayi, type ProformaTarafi } from "./esnekProforma";

type AgoraBelgesi = {
  belge_no: string;
  tarih: string;
  duzenleyen: ProformaTarafi;
  alici: ProformaTarafi;
  yayin_adi: string;
  is_ortagi: string;
  toplam_tutar: number;
  kdv: number;
};

export type AgoraProformaKaydi = {
  kayit_id: string;
  siparis_tarihi: string;
  satin_alan_ad_soyad: string;
  yayin_adi: string;
  is_ortagi: string;
  toplam_tutar: number;
  kdv: number;
  proforma: AgoraBelgesi;
  onay: ProformaOnayi | null;
};

export type AgoraProformaListesi = {
  firma_id: string;
  ay: string;
  siparisler: AgoraProformaKaydi[];
  toplam: number;
  sayfa: number;
  sayfa_boyutu: number;
  admin_onayi: boolean;
};

export function agoraProformaAyiGecerli(ay: unknown): ay is string {
  return typeof ay === "string" && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(ay);
}

function tarafGecerli(v: unknown): v is ProformaTarafi {
  return !!v && typeof v === "object" && ["unvan", "adres", "vergi_dairesi", "vergi_numarasi"]
    .every(k => typeof (v as Record<string, unknown>)[k] === "string");
}

export function agoraProformaListesiGecerli(v: unknown): v is AgoraProformaListesi {
  if (!v || typeof v !== "object") return false;
  const d = v as AgoraProformaListesi;
  return uuidGecerliMi(d.firma_id) && agoraProformaAyiGecerli(d.ay) && typeof d.admin_onayi === "boolean"
    && [d.toplam, d.sayfa].every(n => Number.isSafeInteger(n) && n >= 0) && d.sayfa_boyutu === 20
    && Array.isArray(d.siparisler) && d.siparisler.every(s => {
      if (!s || !uuidGecerliMi(s.kayit_id) || typeof s.siparis_tarihi !== "string" || !Number.isFinite(Date.parse(s.siparis_tarihi))) return false;
      const b = s.proforma;
      return [s.satin_alan_ad_soyad, s.yayin_adi, s.is_ortagi].every(x => typeof x === "string")
        && [s.toplam_tutar, s.kdv].every(n => Number.isFinite(n) && n >= 0)
        && !!b && b.belge_no === `PF-A-${s.kayit_id}` && b.tarih === s.siparis_tarihi
        && tarafGecerli(b.duzenleyen) && tarafGecerli(b.alici)
        && b.yayin_adi === s.yayin_adi && b.is_ortagi === s.is_ortagi
        && b.toplam_tutar === s.toplam_tutar && b.kdv === s.kdv
        && (s.onay === null || proformaOnayiGecerli(s.onay));
    });
}
