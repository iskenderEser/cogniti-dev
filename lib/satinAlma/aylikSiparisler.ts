export const SATIN_ALIM_AYLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'] as const;
export function satinAlimAyi(tarih: string | Date = new Date()) {
 const p=new Intl.DateTimeFormat('en',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit'}).formatToParts(new Date(tarih));
 return `${p.find(x=>x.type==='year')!.value}-${p.find(x=>x.type==='month')!.value}`;
}
type AylikListe={firma_id:string;siparisler:{siparis_tarihi:string;onay?:unknown}[];toplam:number;sayfa:number;sayfa_boyutu:number};
/** Ay filtresi ilk 20 kayıtla sınırlı kalmaz; mevcut okuma API'sinin devamını da tarar. */
export async function aylikSiparisleriOku<T extends AylikListe>({yol,firmaId,ay,sayfa,arama,signal,dogrula,sadeceOnayli=false}:{
 yol:string;firmaId:string;ay:string;sayfa:number;arama:string;signal:AbortSignal;sadeceOnayli?:boolean;dogrula:(v:unknown)=>v is T;
}):Promise<T> {
 let ilk:T|undefined;const eslesen:T['siparisler']=[];
 for(let i=0;;i++){
 const q=new URLSearchParams({sayfa:String(i),q:arama,onayli:sadeceOnayli?'1':'0'});
 const r=await fetch(`${yol}?${q}`,{cache:'no-store',signal});const v:unknown=await r.json();
 if(!r.ok||!dogrula(v)||v.firma_id!==firmaId||v.sayfa!==i||(sadeceOnayli&&v.siparisler.some(s=>s.onay==null)))throw Error('Satın alma kayıtları doğrulanamadı.');
 ilk??=v;eslesen.push(...v.siparisler.filter(s=>satinAlimAyi(s.siparis_tarihi)===ay));
 if((i+1)*v.sayfa_boyutu>=v.toplam)break;
 if(!v.siparisler.length)throw Error('Satın alma kayıtlarının devamı alınamadı.');
 }
 return {...ilk!,sayfa,toplam:eslesen.length,siparisler:eslesen.slice(sayfa*ilk!.sayfa_boyutu,(sayfa+1)*ilk!.sayfa_boyutu)};
}
