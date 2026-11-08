export interface TaahhutluPaket { ad:string; token:number; birim:number; aylik:number }
export function taahhutluPaketlerGecerli(v:unknown):v is TaahhutluPaket[]{
 return Array.isArray(v)&&v.length===3&&v.every((p,i)=>p&&p.ad===`Paket ${i+1}`
  &&[p.token,p.birim,p.aylik].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>0)
  &&Number.isSafeInteger(p.token));
}
