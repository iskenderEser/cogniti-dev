import {agoraVitrinBaglami} from "@/lib/agora/vitrinSunucu";
import {partnerJsonOku,partnerYanit} from "@/lib/agora/partnerHttp";
import {medyaUuid} from "@/lib/agora/partnerMedyaSunucu";
import {bunnyCdnImzaliUrl} from "@/lib/ogrenmeAraci/bunnyStorage";
import {URETICI_ROLLER} from "@/lib/utils/roller";
import {ureticiYetenegi} from "@/lib/uretici/yetenekler";
import {agoraYayinKurali} from "@/lib/agora/yayinAyarlari";
import {urunFirmayaAitMi,teknikFirmayaAitMi} from "@/lib/uretici/talepKaynakSahipligi";
export async function GET(){
 try{
 const b=await agoraVitrinBaglami();if(!b||!URETICI_ROLLER.includes(b.rol))return partnerYanit({hata:"Bu alana erişiminiz yok."},403);
 const {data,error}=await b.db.rpc("agora_yayinlarim_oku",{p_auth_id:b.authId});
 if(error||!Array.isArray(data))return partnerYanit({hata:"Agora yayınlarınız alınamadı."},503);
 const {data:profil,error:profilHatasi}=await b.db.from("kullanicilar").select("firma_id,takim_id").eq("kullanici_id",b.authId).single();
 if(profilHatasi||!profil?.firma_id)return partnerYanit({hata:"Firma bilgileri alınamadı."},503);
 return partnerYanit({profil,yayinlar:data.map(y=>{const {kapak_yolu,...bilgi}=y;return {...bilgi,kapak_url:kapak_yolu?bunnyCdnImzaliUrl(kapak_yolu):null};})});
 }catch{return partnerYanit({hata:"Agora yayınlarınız alınamadı."},503);}
}
export async function POST(request:Request){
 const body=await partnerJsonOku(request);if(!body.ok)return body.yanit;
 const d=body.veri;
 if(!medyaUuid(d.siparis_id)||!medyaUuid(d.istek_id)||typeof d.hedef!=="string"||typeof d.egitim_turu!=="string"
 ||(d.urun_id!=null&&!medyaUuid(d.urun_id))||(d.teknik_id!=null&&!medyaUuid(d.teknik_id)))return partnerYanit({hata:"Yayın ayarları geçersiz."},400);
 try{
 const b=await agoraVitrinBaglami();if(!b||!URETICI_ROLLER.includes(b.rol))return partnerYanit({hata:"Bu işlem için yetkiniz yok."},403);
 const k=agoraYayinKurali(b.rol,d.egitim_turu,d.hedef);if(!k)return partnerYanit({hata:"Hedef veya eğitim türüne yetkiniz yok."},403);
 const {data:profil,error:profilHata}=await b.db.from("kullanicilar").select("firma_id,takim_id").eq("kullanici_id",b.authId).single();
 if(profilHata||!profil?.firma_id||(ureticiYetenegi(b.rol)?.takimZorunlu&&!profil.takim_id))return partnerYanit({hata:"Firma veya takım kaydınız eksik."},409);
 const urun=k.urunGoster?d.urun_id??null:null,teknik=k.teknikGoster?d.teknik_id??null:null;
 if((k.urunZorunlu&&!urun)||(k.teknikZorunlu&&!teknik))return partnerYanit({hata:k.urunZorunlu&&!urun?"Ürün seçimi zorunludur.":"Teknik seçimi zorunludur."},400);
 if(urun&&!(await urunFirmayaAitMi(b.db,urun as string,profil.firma_id)))return partnerYanit({hata:"Ürün firmanıza ait değil."},403);
 if(teknik&&!(await teknikFirmayaAitMi(b.db,teknik as string,profil.firma_id)))return partnerYanit({hata:"Teknik firmanıza ait değil."},403);
 const {data,error}=await b.db.rpc("agora_yayin_ayarla",{p_auth_id:b.authId,p_siparis_id:d.siparis_id,p_istek_id:d.istek_id,p_hedef:d.hedef,p_ayarlar:{egitim_turu:d.egitim_turu,urun_id:urun,teknik_id:teknik}});
 if(error)return partnerYanit({hata:error.code==="40001"?"Bu hazırlık yayımlanmış. Yeni bir yayına alma işlemi başlatın.":"Yayın ayarları kaydedilemedi."},error.code==="42501"?403:error.code==="40001"?409:503);
 return partnerYanit(data);
 }catch{return partnerYanit({hata:"Yayın ayarları kaydedilemedi."},503);}
}
