import { proformaOnayiGecerli, type ProformaOnayi, type ProformaTarafi } from "./esnekProforma";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

type Belge = {
  belge_no: string; tarih: string; duzenleyen: ProformaTarafi; alici: ProformaTarafi;
  hizmet: string; icerik: string; token_adedi: number; birim_fiyat: number; toplam_tutar: number; kdv: number;
};

export type IcerikAlimi = {
  talep_id: string; tarih: string; icerik: string; uretici: string;
  bakiye_turu: "kisisel" | "firma_ortak"; token_adedi: number;
  belge: Belge | null; onay: ProformaOnayi | null;
};

export type IcerikAlimListesi = {
  firma_id: string; sayfa: number; toplam: number; admin_onayi: boolean; alimlar: IcerikAlimi[];
};

function tarafGecerli(taraf: ProformaTarafi | null | undefined) {
  return !!taraf && [taraf.unvan, taraf.adres, taraf.vergi_dairesi, taraf.vergi_numarasi].every(v => typeof v === "string");
}

export function icerikAlimListesiGecerli(veri: unknown): veri is IcerikAlimListesi {
  const liste = veri as IcerikAlimListesi | null;
  return !!liste && uuidGecerliMi(liste.firma_id) && typeof liste.admin_onayi === "boolean"
    && Number.isSafeInteger(liste.sayfa) && liste.sayfa >= 0 && Number.isSafeInteger(liste.toplam) && liste.toplam >= 0
    && Array.isArray(liste.alimlar) && liste.alimlar.length <= 20 && liste.alimlar.every(a => {
      if (!a || !uuidGecerliMi(a.talep_id) || typeof a.icerik !== "string" || typeof a.uretici !== "string"
        || typeof a.tarih !== "string" || !Number.isFinite(Date.parse(a.tarih))
        || !Number.isSafeInteger(a.token_adedi) || a.token_adedi <= 0
        || (a.bakiye_turu !== "kisisel" && a.bakiye_turu !== "firma_ortak")) return false;
      const b = a.belge;
      if (b === null) return a.onay === null;
      return !!b && b.belge_no === `PF-I-${a.talep_id}` && b.tarih === a.tarih && b.token_adedi === a.token_adedi
        && tarafGecerli(b.duzenleyen) && tarafGecerli(b.alici) && typeof b.hizmet === "string" && typeof b.icerik === "string"
        && Number.isFinite(b.birim_fiyat) && b.birim_fiyat > 0
        && Number.isFinite(b.toplam_tutar) && b.toplam_tutar >= 0 && Number.isFinite(b.kdv) && b.kdv >= 0
        && (a.onay === null || proformaOnayiGecerli(a.onay));
    });
}
