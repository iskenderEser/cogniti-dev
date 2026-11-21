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
 stat:{partner_sayisi:number;yayin_sayisi:number;canli_yayin_sayisi?:number;siparis_sayisi:number|null;hafta:string};
 partnerler:AgoraPartner[]; yayinlar:AgoraYayini[];
}
export function agoraTokenTutari(fiyat:number):number {
 const kurus = Math.round(fiyat * 100), birim = Math.round(KKO_TOKEN_FIYATI * 100);
 return Math.floor((kurus + birim / 2) / birim);
}
export function agoraRaflari(yayinlar:AgoraYayini[],partnerId:string|null,hedef:string,tur:"video"|"podcast",arama="") {
 const sorgu=arama.trim().toLocaleLowerCase("tr-TR");
 const kayitlar=yayinlar.filter(y=>(!partnerId||y.partner_id===partnerId)&&(!hedef||y.hedef_roller.includes(hedef as HedefRol))&&y.yayin_araci===tur&&(!sorgu||[y.egitim_adi,y.partner_egitim_id,y.sirket_adi,y.kategori,y.aciklama].some(alan=>(alan??"").toLocaleLowerCase("tr-TR").includes(sorgu))));
 const yeni=(a:AgoraYayini,b:AgoraYayini)=>b.yayinlandi_at.localeCompare(a.yayinlandi_at)||a.egitim_id.localeCompare(b.egitim_id);
 const baslik=tur==="podcast"?"En Son Yayınlanan Podcastlar":"En Son Yayınlanan Videolar";
 return [{baslik,yayinlar:[...kayitlar].sort(yeni)}].filter(r=>r.yayinlar.length>0);
}
