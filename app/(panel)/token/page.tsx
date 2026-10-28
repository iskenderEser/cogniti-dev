"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import styles from "./token.module.css";
import TokenUrunFiltresi from "./_components/TokenUrunFiltresi";

type Yukleme={ miktar:number; kalan:number; yukleme_turu:string; created_at:string; son_kullanim_at:string|null; suresi_doldu:boolean };
type GunSonu={ hazir:boolean; veri_tarihi:string; plan_limiti?:number|null; kalan_token?:number; kullandigim_token?:number };
type Rapor={ gun_sonu?:GunSonu|null; hesap_var:boolean; kapsam?:string; yonetici?:boolean; paket_turu?:string; bakiye?:number; paket_asimi?:number; toplam?:number; yuklemeler?:Yukleme[] };
const stat=(v:number|null|undefined)=>v==null?"—":n(v);
const n=(v:number)=>new Intl.NumberFormat("tr-TR").format(v);
const tarih=(v:string)=>new Date(v).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"short",timeStyle:"short"});
export default function TokenSayfasi(){
 const { kullanici }=useAuth();
 const rol=(kullanici?.rol??"").toLowerCase();
 const [data,setData]=useState<Rapor|null>(null),[hata,setHata]=useState(""),[yukleniyor,setYukleniyor]=useState(true);
 const yukle=useCallback(async(signal:AbortSignal)=>{
  setYukleniyor(true);setHata("");
  try {const res=await fetch("/token/api/rapor",{cache:"no-store",signal});const json=await res.json();if(!res.ok)throw new Error(json.hata||"Token bilgileri alınamadı.");setData(json as Rapor);}
  catch(e){if(!signal.aborted)setHata(e instanceof Error?e.message:"Token bilgileri alınamadı.");}
  finally{if(!signal.aborted)setYukleniyor(false)}
 },[]);
 useEffect(()=>{const controller=new AbortController();void yukle(controller.signal);return()=>controller.abort()},[yukle]);
 if(kullanici?.kimlik_turu==="eclub_kisi" || kullanici?.kimlik_turu==="musteri") return <main className={styles.page}><p>Bu sayfaya erişiminiz bulunmuyor.</p></main>;
 const scope=data?.kapsam??"benim";
 const scopeName=scope==="firma"?"Firma geneli":scope==="takim"?"Takımım":scope==="bolge"?"Bölgem":"Benim gönderimlerim";
 const uttGorunumu=rol==="utt" || rol==="kd_utt";
 return <main className={styles.page}>
  <div className={styles.breadcrumb}>Cogniti　›　<span>Token Kullanımı</span></div>
  <h1>Token Kullanımı</h1><p className={styles.subtitle}>Firmanızın token bakiyesini ve kullanımını takip edin.</p>
  {hata && <p role="alert" className={styles.error}>{hata}</p>}
  {!data && yukleniyor ? <p>Bilgiler yükleniyor…</p> : data && !data.hesap_var ? <p>Firmanız için henüz token hesabı açılmadı.</p> : data?.hesap_var && <>
   {uttGorunumu ? <>
    <div className={styles.uttStats}>
     <article><div><span>Kullanım Planı</span><strong>{stat(data.gun_sonu?.plan_limiti)}</strong><small>Aylık token limiti</small></div></article>
     <article><div><span>Kalan Token</span><strong>{stat(data.gun_sonu?.kalan_token)}</strong><small>Tüm firma kullanımı sonrası kalan</small></div></article>
     <article><div><span>Kullandığım Token</span><strong>{stat(data.gun_sonu?.kullandigim_token)}</strong><small>Gönderilerinizin toplamı</small></div></article>
    </div><p className={styles.statNote}>{data.gun_sonu?.hazir ? `Veriler ${new Date(data.gun_sonu.veri_tarihi+"T12:00:00+03:00").toLocaleDateString("tr-TR",{timeZone:"Europe/Istanbul"})} gün sonu itibarıyladır. Bugünkü işlemler yarın yansır.` : data.gun_sonu ? "Token hesabınızın ilk gün sonu verileri yarın gösterilecek." : "Gün sonu token hesabı henüz kullanıma açılmadı."}</p>
   </> : <div className={styles.stats}>
    <div><span>KALAN TOKEN</span><strong>{n(data.bakiye??0)}</strong><small>Firmanızın kullanılabilir bakiyesi</small></div>
    <div><span>PAKET</span><strong className={styles.paket}>{data.paket_turu==="aylik"?"Aylık paket":"Kullandığın Kadar Öde"}</strong><small>{data.paket_turu==="aylik"?"2 ay token kullanım süresi":"Aylık 1.500 token kullanım limiti"}</small></div>
    <div><span>{(scope==="benim"?"Kendi kullanımım":scopeName+" kullanımı").toLocaleUpperCase("tr-TR")}</span><strong>{n(data.toplam??0)}</strong><small>Toplam tüketilen token</small></div>
   </div>}
   {(data.paket_asimi??0)>0 && <p className={styles.asim}>Paket aşımı: {n(data.paket_asimi??0)} token</p>}
   <div className={styles.heading}><h2>Token Kullanım Detayları</h2></div>
   {uttGorunumu && kullanici && <TokenUrunFiltresi key={kullanici.id} />}
   {data.yonetici && <section className={styles.loads}><div className={styles.heading}><h2>Token yüklemeleri</h2><p>Son yüklemeler ve kullanım durumları</p></div><div className={styles.list}>{(data.yuklemeler??[]).length===0?<p className={styles.empty}>Yükleme kaydı yok.</p>:(data.yuklemeler??[]).map((x,i)=><div className={styles.load} key={`${x.created_at}-${i}`}><div><b>{n(x.miktar)} token</b><small>{tarih(x.created_at)} · Kalan: {n(x.suresi_doldu?0:x.kalan)}</small></div><span>{x.suresi_doldu?"Süresi doldu":x.son_kullanim_at?`Son kullanım: ${new Date(x.son_kullanim_at).toLocaleDateString("tr-TR",{timeZone:"Europe/Istanbul"})}`:"Süresiz"}</span></div>)}</div></section>}
  </>}
 </main>;
}
