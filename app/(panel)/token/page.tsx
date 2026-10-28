"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { YONETICI_ROLLER, YONLENDIRICI_ROLLER } from "@/lib/utils/roller";
import styles from "./token.module.css";

type Alici={ alici:string; asim_miktari:number };
type Hareket={ kaynak_id:string; gonderen_id:string; gonderen:string; created_at:string; islem_turu:string; miktar:number; asim_miktari:number; alicilar:Alici[] };
type Yukleme={ miktar:number; kalan:number; yukleme_turu:string; created_at:string; son_kullanim_at:string|null; suresi_doldu:boolean };
type Rapor={ hesap_var:boolean; kapsam?:string; yonetici?:boolean; paket_turu?:string; bakiye?:number; paket_asimi?:number; toplam?:number; kayitlar?:Hareket[]; yuklemeler?:Yukleme[] };
const turler:Record<string,string>={yayin:"Yayın",tclub_oneri:"T-Club önerisi",cclub_challenge:"C-Club challenge",eclub_oneri:"E-Club önerisi",eczanem_musteri:"Eczanem gönderimi",viva_davet:"Viva daveti"};
const n=(v:number)=>new Intl.NumberFormat("tr-TR").format(v);
const tarih=(v:string)=>new Date(v).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"short",timeStyle:"short"});
export default function TokenSayfasi(){
 const { kullanici }=useAuth();
 const rol=(kullanici?.rol??"").toLowerCase();
 const [data,setData]=useState<Rapor|null>(null),[hata,setHata]=useState(""),[yukleniyor,setYukleniyor]=useState(true);
 const [kapsam,setKapsam]=useState("kapsam"),[arama,setArama]=useState(""),[tur,setTur]=useState(""),[sayfa,setSayfa]=useState(0);
 const [acik,setAcik]=useState<string|null>(null);
 const yukle=useCallback(async(signal:AbortSignal)=>{
  setYukleniyor(true);setHata("");
  try {const params=new URLSearchParams({kapsam,arama,tur,sayfa:String(sayfa)});const res=await fetch(`/token/api/rapor?${params}`,{cache:"no-store",signal});const json=await res.json();if(!res.ok)throw new Error(json.hata||"Token bilgileri alınamadı.");setData(json as Rapor);}
  catch(e){if(!signal.aborted)setHata(e instanceof Error?e.message:"Token bilgileri alınamadı.");}
  finally{if(!signal.aborted)setYukleniyor(false)}
 },[kapsam,arama,tur,sayfa]);
 useEffect(()=>{const controller=new AbortController();const timer=window.setTimeout(()=>void yukle(controller.signal),200);return()=>{window.clearTimeout(timer);controller.abort()}},[yukle]);
 if(kullanici?.kimlik_turu==="eclub_kisi" || kullanici?.kimlik_turu==="musteri") return <main className={styles.page}><p>Bu sayfaya erişiminiz bulunmuyor.</p></main>;
 const liste=data?.kayitlar??[];const scope=data?.kapsam??"benim";
 const scopeName=scope==="firma"?"Firma geneli":scope==="takim"?"Takımım":scope==="bolge"?"Bölgem":"Benim gönderimlerim";
 const kapsamYetkisi=YONETICI_ROLLER.includes(rol)||YONLENDIRICI_ROLLER.includes(rol);
 return <main className={styles.page}>
  <div className={styles.breadcrumb}>Cogniti　›　<span>Token Kullanımı</span></div>
  <h1>Token Kullanımı</h1><p className={styles.subtitle}>Firmanızın token bakiyesini ve kullanım hareketlerini takip edin.</p>
  {hata && <p role="alert" className={styles.error}>{hata}</p>}
  {!data && yukleniyor ? <p>Bilgiler yükleniyor…</p> : data && !data.hesap_var ? <p>Firmanız için henüz token hesabı açılmadı.</p> : data?.hesap_var && <>
   <div className={styles.stats}>
    <div><span>KALAN TOKEN</span><strong>{n(data.bakiye??0)}</strong><small>Firmanızın kullanılabilir bakiyesi</small></div>
    <div><span>PAKET</span><strong className={styles.paket}>{data.paket_turu==="aylik"?"Aylık paket":"Kullandığın Kadar Öde"}</strong><small>{data.paket_turu==="aylik"?"2 ay token kullanım süresi":"Aylık 1.500 token kullanım limiti"}</small></div>
    <div><span>{(kapsam==="benim"?"Kendi kullanımım":scopeName+" kullanımı").toLocaleUpperCase("tr-TR")}</span><strong>{n(data.toplam??0)}</strong><small>Toplam tüketilen token</small></div>
   </div>
   {(data.paket_asimi??0)>0 && <p className={styles.asim}>Paket aşımı: {n(data.paket_asimi??0)} token</p>}
   <div className={styles.heading}><h2>Token hareketleri</h2><p>Gönderimlerinize ait kullanım kayıtları</p></div>
   <div className={styles.bar}><div className={styles.tabs}>
    {kapsamYetkisi && <button className={kapsam==="kapsam"?styles.selected:""} onClick={()=>{setKapsam("kapsam");setSayfa(0)}}>{rol==="bm"?"Bölgem":rol==="tm"?"Takımım":"Firma geneli"}</button>}
    <button className={kapsam==="benim"||!kapsamYetkisi?styles.selected:""} onClick={()=>{setKapsam("benim");setSayfa(0)}}>Benim gönderimlerim</button></div>
    <div className={styles.filters}><input aria-label="Hareketlerde ara" placeholder="İsim veya işlem ara..." value={arama} onChange={e=>{setArama(e.target.value);setSayfa(0)}}/><select aria-label="İşlem türü" value={tur} onChange={e=>{setTur(e.target.value);setSayfa(0)}}><option value="">Tüm işlemler</option>{Object.entries(turler).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div></div>
   <div className={styles.list} aria-busy={yukleniyor}>
    <div className={styles.tableHead}><span>İŞLEM</span><span>GÖNDEREN</span><span>TARİH</span><span>TOKEN</span><span/></div>
    {!liste.length && <p className={styles.empty}>{yukleniyor?"Yükleniyor…":"Bu seçimde gösterilecek kayıt yok."}</p>}
    {liste.slice(0,25).map((row,i)=>{const key=`${row.islem_turu}-${row.kaynak_id}-${row.gonderen_id}-${row.created_at}`;return <div key={key}>
     <div className={styles.row}><div><b>{turler[row.islem_turu]??"Gönderim"}</b><small>{n(row.miktar)} alıcı{row.asim_miktari?` · ${n(row.asim_miktari)} paket aşımı`:""}</small><small className={styles.mobile}>{row.gonderen} · {tarih(row.created_at)}</small></div><div className={styles.desktop}>{row.gonderen}</div><div className={styles.desktop}>{tarih(row.created_at)}</div><strong>−{n(row.miktar)}</strong><button className={styles.expand} aria-label="Alıcıları göster" aria-expanded={acik===key} onClick={()=>setAcik(acik===key?null:key)}>⌄</button></div>
     {acik===key && <div className={styles.detail}>{row.alicilar.map((a,j)=><div key={`${i}-${j}`}><span>{a.alici}</span><span>1 token{a.asim_miktari?" · Paket aşımı":""}</span></div>)}</div>}
    </div>})}
   </div>
   <div className={styles.pagination}><span>Sayfa {sayfa+1}</span><div><button disabled={sayfa===0||yukleniyor} onClick={()=>setSayfa(s=>s-1)}>Önceki</button><button disabled={liste.length<=25||yukleniyor} onClick={()=>setSayfa(s=>s+1)}>Sonraki</button></div></div>
   {data.yonetici && <section className={styles.loads}><div className={styles.heading}><h2>Token yüklemeleri</h2><p>Son yüklemeler ve kullanım durumları</p></div><div className={styles.list}>{(data.yuklemeler??[]).length===0?<p className={styles.empty}>Yükleme kaydı yok.</p>:(data.yuklemeler??[]).map((x,i)=><div className={styles.load} key={`${x.created_at}-${i}`}><div><b>{n(x.miktar)} token</b><small>{tarih(x.created_at)} · Kalan: {n(x.suresi_doldu?0:x.kalan)}</small></div><span>{x.suresi_doldu?"Süresi doldu":x.son_kullanim_at?`Son kullanım: ${new Date(x.son_kullanim_at).toLocaleDateString("tr-TR",{timeZone:"Europe/Istanbul"})}`:"Süresiz"}</span></div>)}</div></section>}
  </>}
 </main>;
}
