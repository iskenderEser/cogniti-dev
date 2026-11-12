import {uuidGecerliMi} from '@/lib/uretim/rpcTemel';
import {vivaAlimDonemiGecerli,vivaAlimListesiGecerli,type VivaAlimListesi} from './vivaAlimlari';
import {proformaOnayiGecerli,type ProformaOnayi,type ProformaTarafi} from './esnekProforma';
export {proformaOnayiGecerli};
export type VivaBelgesi=VivaAlimListesi&{belge_no:string;tarih:string;duzenleyen:ProformaTarafi;alici:ProformaTarafi};
export type VivaProforma={firma_id:string;ay:string;admin_onayi:boolean;belge:VivaBelgesi|null;bekleyen:number;onaylanabilir:boolean;onay:ProformaOnayi|null};
function taraf(v:ProformaTarafi){return !!v&&['unvan','adres','vergi_dairesi','vergi_numarasi'].every(k=>typeof (v as unknown as Record<string,unknown>)[k]==='string');}
export function vivaProformaGecerli(v:unknown):v is VivaProforma {
 if(!v||typeof v!=='object')return false;const d=v as VivaProforma;
 if(!uuidGecerliMi(d.firma_id)||!vivaAlimDonemiGecerli(d.ay)||typeof d.admin_onayi!=='boolean'||typeof d.onaylanabilir!=='boolean'||!Number.isSafeInteger(d.bekleyen)||d.bekleyen<0||(d.onay!==null&&!proformaOnayiGecerli(d.onay)))return false;
 if(d.belge===null)return d.onay===null;
 const b=d.belge;return vivaAlimListesiGecerli(b)&&b.firma_id===d.firma_id&&b.donem===d.ay&&b.belge_no===`PF-V-${d.ay.replace('-','')}-${d.firma_id}`&&typeof b.tarih==='string'&&Number.isFinite(Date.parse(b.tarih))&&taraf(b.duzenleyen)&&taraf(b.alici);
}
