import { uuidGecerliMi } from '@/lib/uretim/rpcTemel';
export type VivaAlimSatiri = { etkinlik_id:string; yayin_tarihi:string; yayin_adi:string; duzenleyen:string; katilimci_sayisi:number; kisi_dakika:number; birim_fiyat:number; tutar:number };
export type VivaAlimListesi = { firma_id:string; donem:string; satirlar:VivaAlimSatiri[]; toplam_tutar:number; kdv:number; genel_tutar:number };
export function vivaAlimDonemiGecerli(v:unknown):v is string {return typeof v==='string'&&/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(v);}
export function vivaAlimTutari(saniye:number,usd:number,kur:number,katsayi:number) {
 if(!Number.isFinite(saniye)||saniye<0||![usd,kur,katsayi].every(n=>Number.isFinite(n)&&n>0))throw Error('Viva kullanım fiyatı doğrulanamadı.');
 const birimKurus=Math.round(usd*kur*katsayi*100),tutarKurus=Math.round(saniye*birimKurus/60);
 if(birimKurus<=0||!Number.isSafeInteger(birimKurus)||!Number.isSafeInteger(tutarKurus))throw Error('Viva kullanım tutarı doğrulanamadı.');
 return {birim_fiyat:birimKurus/100,tutar:tutarKurus/100};
}
export function vivaAlimToplamlari(satirlar:VivaAlimSatiri[]) {
 const toplam=satirlar.reduce((n,s)=>n+Math.round(s.tutar*100),0),kdv=Math.round(toplam/5);
 if(!Number.isSafeInteger(toplam)||!Number.isSafeInteger(kdv))throw Error('Viva aylık toplamı doğrulanamadı.');
 return {toplam_tutar:toplam/100,kdv:kdv/100,genel_tutar:(toplam+kdv)/100};
}
export function vivaAlimListesiGecerli(v:unknown):v is VivaAlimListesi {
 if(!v||typeof v!=='object')return false;const d=v as VivaAlimListesi;
 return uuidGecerliMi(d.firma_id)&&vivaAlimDonemiGecerli(d.donem)&&Array.isArray(d.satirlar)
 &&d.satirlar.every(s=>s&&uuidGecerliMi(s.etkinlik_id)&&typeof s.yayin_tarihi==='string'&&Number.isFinite(Date.parse(s.yayin_tarihi))
 &&typeof s.yayin_adi==='string'&&typeof s.duzenleyen==='string'&&Number.isSafeInteger(s.katilimci_sayisi)&&s.katilimci_sayisi>=0
 &&Number.isFinite(s.kisi_dakika)&&s.kisi_dakika>0&&Number.isFinite(s.birim_fiyat)&&s.birim_fiyat>0&&Number.isFinite(s.tutar)&&s.tutar>=0)
 &&[d.toplam_tutar,d.kdv,d.genel_tutar].every(n=>Number.isFinite(n)&&n>=0);
}

export type VivaAlimYaniti = { firma_id:string; arama:string; belgeler:VivaAlimListesi[] };
export function vivaAlimYanitiGecerli(v:unknown):v is VivaAlimYaniti {
 if(!v||typeof v!=='object')return false;const d=v as VivaAlimYaniti;
 return uuidGecerliMi(d.firma_id)&&typeof d.arama==='string'&&Array.isArray(d.belgeler)
 &&d.belgeler.every(b=>vivaAlimListesiGecerli(b)&&b.firma_id===d.firma_id);
}
