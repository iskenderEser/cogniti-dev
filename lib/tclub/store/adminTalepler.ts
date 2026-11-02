import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
export interface FirmaTalepOzeti { firma_id:string;firma_adi:string;aktif:boolean;modul_acik:boolean;toplam:number;bekleyen:number;hazirlanan:number;tamamlanan:number;iptal:number;puan:number;tl:number;tl_eksik:number }
export interface CekTeslimi { cek_kodu:string;kullanim_linki:string|null;teslim_at?:string }
export interface AdminCekTalebi {
 siparis_id:string;firma_id:string;kullanici_id:string;urun_id:string;adet:number;puan_birim_fiyat:number;toplam_puan:number;toplam_tl:number|null;cek_birim_tl:number|null;
 durum:"beklemede"|"hazirlaniyor"|"teslim_edildi"|"iptal";created_at:string;teslim_alma_at:string|null;toplu_talep_anahtari:string|null;iptal_sebebi:string|null;
 kullanicilar:{ad:string;soyad:string;rol:string;eposta:string}|null;store_urunler:{ad:string;gorsel_url:string|null}|null;teslimler:CekTeslimi[];
 eposta:{durum:string;hata_kodu:string|null;deneme:number;gonderim_at:string|null;alici?:string}|null;
 gecmis:{islem:string;aciklama:string|null;created_at:string;yapan:string}[];
}
export interface FirmaTalepKesiti { firma:{firma_id:string;firma_adi:string};ozet:Omit<FirmaTalepOzeti,"firma_id"|"firma_adi"|"aktif"|"modul_acik">;cek_ozeti:{urun_id:string;ad:string;adet:number;puan:number;tl:number|null}[];talepler:AdminCekTalebi[];toplam:number;sayfa:number;sunucu_zamani:string }
export function httpsBaglantiGecerli(value:string) { if(!value)return true;try { const url=new URL(value);return url.protocol==="https:" && !!url.hostname && !url.username && !url.password && value.length<=2048; } catch{return false;} }
export function talepFiltreleriniOku(q:URLSearchParams) {
 const firma=q.get("firma"),durum=q.get("durum")||null,bas=q.get("bas")||null,son=q.get("son")||null,arama=(q.get("arama")||"").trim(),sayfa=Number(q.get("sayfa")||1);
 const tarih=(s:string|null)=>{
  if(!s)return true;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const [y,m,d]=s.split("-").map(Number);
  const leap=y%4===0&&(y%100!==0||y%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  return y>=1&&m>=1&&m<=12&&d>=1&&d<=days[m-1];
 };
 if(!uuidGecerliMi(firma)||!tarih(bas)||!tarih(son)||(bas&&son&&bas>son)||arama.length>200||!Number.isInteger(sayfa)||sayfa<1||sayfa>1000000||(durum&&!["beklemede","hazirlaniyor","teslim_edildi","iptal"].includes(durum)))return null;
 return{p_firma:firma,p_durum:durum,p_bas:bas,p_son:son,p_arama:arama,p_sayfa:sayfa,p_export:q.get("export")==="1"};
}
