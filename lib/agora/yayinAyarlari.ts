import {TALEP_TURU_KURALLARI,ureticiYetenegi,type TalepTuru} from "@/lib/uretici/yetenekler";
import {ureticiYayinHedefGruplari,ECLUB_HEDEF_ROLLER,ECLUB_ORTAK_YAYIN_GRUBU,type HedefRol} from "@/lib/utils/roller";
export function agoraYayinKurali(rol:string,tur:string,hedef:string){
 const yetenek=ureticiYetenegi(rol);
 const k=yetenek?.acabilecegiTalepTurleri.includes(tur as TalepTuru)?TALEP_TURU_KURALLARI[tur as TalepTuru]:null;
 if(!k||!ureticiYayinHedefGruplari(rol).some(h=>h===hedef))return null;
 const tekniksiz=hedef==="eczanem"||hedef===ECLUB_ORTAK_YAYIN_GRUBU||ECLUB_HEDEF_ROLLER.includes(hedef as HedefRol);
 return {urunGoster:k.urun!=="yok"||hedef==="eczanem",urunZorunlu:k.urun==="zorunlu"||hedef==="eczanem",
 teknikGoster:k.teknik!=="yok"&&!tekniksiz,teknikZorunlu:k.teknik==="zorunlu"&&!tekniksiz};
}
