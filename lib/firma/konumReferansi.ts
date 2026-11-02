import referans from "./referans/il-ilce.json";
import { ilinVergiDaireleri } from "./vergiDairesiReferansi";

export const ilSecenekleri = referans.iller.map(il => ({deger:String(il.il_id),etiket:il.il_adi}))
  .sort((a,b)=>a.etiket.localeCompare(b.etiket,"tr-TR"));

export function ilinIlceleri(ilId: number | null) {
  return referans.ilceler.filter(ilce=>ilce.il_id===ilId)
    .map(ilce=>({deger:String(ilce.ilce_id),etiket:ilce.ilce_adi}))
    .sort((a,b)=>a.etiket.localeCompare(b.etiket,"tr-TR"));
}

/** Formların gönderdiği kimlikleri tek referans listesinden çözer. */
export function firmaKonumunuDogrula(body: Record<string,unknown>) {
  const ilId=body.il_id, ilceId=body.ilce_id, kod=body.vergi_dairesi_kodu;
  if (typeof ilId!=="number" || !Number.isInteger(ilId) || !referans.iller.some(il=>il.il_id===ilId))
    return {gecerli:false as const,hata:"Geçerli bir il seçin.",alanlar:["il_id"]};
  if (typeof ilceId!=="number" || !Number.isInteger(ilceId) || !referans.ilceler.some(ilce=>ilce.il_id===ilId && ilce.ilce_id===ilceId))
    return {gecerli:false as const,hata:"Seçilen ile bağlı bir ilçe seçin.",alanlar:["ilce_id"]};
  const daire=typeof kod==="string" ? ilinVergiDaireleri(ilId).find(daire=>daire.deger===kod) : undefined;
  if (!daire) return {gecerli:false as const,hata:"Seçilen ile bağlı bir vergi dairesi seçin.",alanlar:["vergi_dairesi_kodu"]};
  return {gecerli:true as const,veri:{il_id:ilId,ilce_id:ilceId,vergi_dairesi_kodu:daire.deger,vergi_dairesi:daire.etiket}};
}
