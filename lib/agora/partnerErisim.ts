export interface PartnerErisimBilgileri {
  partner_id:string;sirket_adi:string;ad_soyad:string;eposta:string;
  ilk_giris_durumu:"bekliyor"|"onaylandi"|"reddedildi";ilk_giris_karar_at:string|null;
  uyelik_durumu:"profil_bekliyor"|"onay_bekliyor"|"onaylandi"|"reddedildi";uyelik_karar_at:string|null;
  erisim_acik:boolean;erisim_surum:number;erisim_karar_at:string|null;
}
export function partnerErisimGecerli(d:unknown):d is PartnerErisimBilgileri {
  if(!d||typeof d!=="object")return false;
  const r=d as Record<string,unknown>;
  return ["partner_id","sirket_adi","ad_soyad","eposta"].every(k=>typeof r[k]==="string")
    && ["bekliyor","onaylandi","reddedildi"].includes(String(r.ilk_giris_durumu))
    && ["profil_bekliyor","onay_bekliyor","onaylandi","reddedildi"].includes(String(r.uyelik_durumu))
    && typeof r.erisim_acik==="boolean"&&Number.isSafeInteger(r.erisim_surum)&&Number(r.erisim_surum)>0
    && ["ilk_giris_karar_at","uyelik_karar_at","erisim_karar_at"].every(k=>r[k]===null||typeof r[k]==="string");
}
