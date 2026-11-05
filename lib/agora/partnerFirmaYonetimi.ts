export const PARTNER_SAYFALARI = {
  "firma-bilgileri": "Firma Bilgileri",
  yayinlar: "Yayınlar",
  "hak-edisleri": "Hak Edişleri",
  raporlar: "Raporlar",
} as const;
export type PartnerSayfasi = keyof typeof PARTNER_SAYFALARI;
export interface PartnerFirmaOzeti { partner_id:string; sirket_adi:string; uyelik_durumu:string }
export function partnerFirmaListesiGecerli(d:unknown):d is {kayitlar:PartnerFirmaOzeti[];toplam:number} {
  if(!d||typeof d!=="object")return false;
  const v=d as Record<string,unknown>;
  return Number.isSafeInteger(v.toplam)&&Number(v.toplam)>=0&&Array.isArray(v.kayitlar)&&v.kayitlar.every(k=>k&&typeof k==="object"&&typeof k.partner_id==="string"&&typeof k.sirket_adi==="string"&&typeof k.uyelik_durumu==="string");
}
