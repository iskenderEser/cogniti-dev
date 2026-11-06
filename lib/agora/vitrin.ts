import { KKO_TOKEN_FIYATI } from "@/lib/token/fiyatlandirma";
import type { HedefRol } from "@/lib/utils/roller";

export interface AgoraPartner { partner_id:string; sirket_adi:string; yayin_sayisi:number }
export interface AgoraYayini {
 egitim_id:string; partner_id:string; sirket_adi:string; partner_egitim_id:string;
 egitim_adi:string; kategori:string; yayin_araci:"video"|"podcast"; fiyat_tl:number;
 hedef_roller:HedefRol[]; aciklama:string; yayinlandi_at:string; kapak_video_guid:string|null;
 begeni_sayisi:number; favori_sayisi:number; begeni_mi:boolean; favori_mi:boolean;
 transkript_var?:boolean; kapak_var?:boolean; kapak_url?:string|null;
 siparis_sayisi:number|null; surum?:number; satin_alindi?:boolean;
}
export interface AgoraVitrinVerisi {
 stat:{partner_sayisi:number;yayin_sayisi:number;siparis_sayisi:number|null;hafta:string};
 partnerler:AgoraPartner[]; yayinlar:AgoraYayini[];
}
export function agoraTokenTutari(fiyat:number):number {
 const kurus = Math.round(fiyat * 100), birim = Math.round(KKO_TOKEN_FIYATI * 100);
 return Math.floor((kurus + birim / 2) / birim);
}
export function agoraRaflari(yayinlar:AgoraYayini[],partnerId:string|null,hedef:string,tur:"video"|"podcast") {
 const kayitlar=yayinlar.filter(y=>(!partnerId||y.partner_id===partnerId)&&(!hedef||y.hedef_roller.includes(hedef as HedefRol))&&y.yayin_araci===tur);
 const yeni=(a:AgoraYayini,b:AgoraYayini)=>b.yayinlandi_at.localeCompare(a.yayinlandi_at)||a.egitim_id.localeCompare(b.egitim_id);
 return [
  {baslik:"Yeniler",yayinlar:[...kayitlar].sort(yeni)},
  {baslik:"En Çok Sipariş Verilenler",yayinlar:kayitlar.filter(y=>(y.siparis_sayisi??0)>0).sort((a,b)=>b.siparis_sayisi!-a.siparis_sayisi!||yeni(a,b))},
  {baslik:"En Çok Beğenilenler",yayinlar:kayitlar.filter(y=>y.begeni_sayisi>0).sort((a,b)=>b.begeni_sayisi-a.begeni_sayisi||yeni(a,b))},
  {baslik:"En Çok Favorilenenler",yayinlar:kayitlar.filter(y=>y.favori_sayisi>0).sort((a,b)=>b.favori_sayisi-a.favori_sayisi||yeni(a,b))},
 ];
}
