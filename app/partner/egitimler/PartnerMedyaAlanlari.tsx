"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { bunnyTusYukle, type BunnyVezneIzni } from "@/lib/video/bunnyTusIstemci";
import { dosyaSha256Parcali } from "@/lib/ogrenmeAraci/sha256Istemci";
import { dosyaBeyaniDogrula } from "@/lib/ogrenmeAraci/sozlesme";
import styles from "./egitimler.module.css";

interface Medya { yukleme_id:string; rol?:string; dosya_adi:string; durum:string; izleme_url?:string|null; dinleme_url?:string|null; sure_saniye?:number|null }
interface Taslak {egitim_id:string;surum:number}
async function json(url:string,body:unknown,method="POST",headers:Record<string,string>={}) {
  const r=await fetch(url,{method,headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  const d=await r.json();if(!r.ok)throw new Error(d.hata||"Yükleme işlemi tamamlanamadı.");return d;
}
function sureOku(file:File):Promise<number> {
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),video=document.createElement("video");
    const temizle=()=>{clearTimeout(timer);video.removeAttribute("src");video.load();URL.revokeObjectURL(url);};
    const timer=setTimeout(()=>{temizle();reject(new Error("Tanıtım videosunun süresi okunamadı."));},15000);
    video.preload="metadata";video.onloadedmetadata=()=>{const n=video.duration;temizle();if(Number.isFinite(n)&&n>0)resolve(n);else reject(new Error("Video süresi okunamadı."));};
    video.onerror=()=>{temizle();reject(new Error("Video dosyası okunamadı."));};video.src=url;
  });
}
function podcastGonder(file:File,yukleme:{endpoint:string;headers:Record<string,string>},yuzde:(n:number)=>void):Promise<string> {
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open("PUT",yukleme.endpoint);xhr.timeout=30*60*1000;
    for(const [k,v] of Object.entries(yukleme.headers))xhr.setRequestHeader(k,v);
    xhr.upload.onprogress=e=>{if(e.lengthComputable)yuzde(Math.round(e.loaded/e.total*100));};
    xhr.onload=()=>{try{const d=JSON.parse(xhr.responseText);if(xhr.status<200||xhr.status>=300||d.tamamlandi!==true||typeof d.yukleme_makbuzu!=="string")throw new Error(d.hata||"Podcast aktarımı doğrulanamadı.");resolve(d.yukleme_makbuzu);}catch(e){reject(e);}};
    xhr.onerror=xhr.ontimeout=()=>reject(new Error("Podcast aktarımı kesildi. Yeniden yükleyin."));xhr.send(file);
  });
}
export default function PartnerMedyaAlanlari({egitimId,egitimAdi,istekId,tur,disabled,onTaslak,onIslem}:{
  egitimId:string|null;egitimAdi:string;istekId:string;tur:"video"|"podcast";disabled:boolean;
  onTaslak:(t:Taslak)=>void;onIslem:(aktif:boolean)=>void;
}) {
  const [videolar,setVideolar]=useState<Medya[]>([]),[podcast,setPodcast]=useState<Medya|null>(null);
  const [aktif,setAktif]=useState<string|null>(null),[yuzde,setYuzde]=useState(0),[hata,setHata]=useState(""),[mesaj,setMesaj]=useState("");
  const kilit=useRef(false),yasiyor=useRef(true),okumaSurumu=useRef(0);
  useEffect(()=>{yasiyor.current=true;return()=>{yasiyor.current=false;};},[]);
  const oku=useCallback(async(id:string)=>{
    const surum=++okumaSurumu.current;
    const results=await Promise.all(["video","podcast"].map(async(t)=>{const r=await fetch(`/partner/api/medya/${t}?egitim_id=${id}`,{cache:"no-store",signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw new Error(d.hata||"Dosya bilgileri okunamadı.");return d;}));
    if(yasiyor.current&&surum===okumaSurumu.current){setVideolar(results[0].videolar);setPodcast(results[1].podcast);}
  },[]);
  useEffect(()=>{if(egitimId)void oku(egitimId).catch(e=>{if(yasiyor.current)setHata(e.message);});},[egitimId,oku]);
  async function yukle(file:File,rol:"egitim"|"tanitim") {
    if(kilit.current||disabled)return;
    kilit.current=true;setAktif(rol);setYuzde(0);setHata("");setMesaj("");onIslem(true);
    let id=egitimId;
    try{
      if(egitimAdi.trim().length<3)throw new Error("Önce Eğitim Adını Girin.");
      const video=rol==="tanitim"||tur==="video";
      if(video){
        if(!["video/mp4","video/webm","video/quicktime"].includes(file.type)||file.size<=0||file.size>5*1024**3)throw new Error("MP4, WebM veya MOV seçin (en fazla 5 GB).");
        if(rol==="tanitim"&&await sureOku(file)>120)throw new Error("Tanıtım Videosu En Fazla 2 Dakika Olmalıdır.");
        const d=await json("/partner/api/medya/video",{egitim_id:id,egitim_adi:egitimAdi,istek_id:istekId,rol,dosya_adi:file.name,mime_type:file.type,dosya_boyutu:file.size}) as Taslak&BunnyVezneIzni;
        id=d.egitim_id;onTaslak(d);
        await bunnyTusYukle(file,d,n=>{if(yasiyor.current)setYuzde(n);});
        await json("/partner/api/medya/video",{egitim_id:id,yukleme_id:d.yukleme_id},"PUT",{"x-agora-partner":"1"});
        if(yasiyor.current)setMesaj("Video Aktarıldı. İşlenme Durumunu Kontrol Edebilirsiniz.");
      }else{
        const kontrol=dosyaBeyaniDogrula({aracTuru:"podcast",dosyaAdi:file.name,mimeType:file.type,dosyaBoyutu:file.size});if(!kontrol.ok)throw new Error(kontrol.hata);
        const checksum=await dosyaSha256Parcali(file);
        const d=await json("/partner/api/medya/podcast",{egitim_id:id,egitim_adi:egitimAdi,istek_id:istekId,dosya_adi:file.name,mime_type:file.type,dosya_boyutu:file.size,checksum_sha256:checksum});
        id=d.egitim_id;onTaslak(d);
        const makbuz=await podcastGonder(file,d.yukleme,n=>{if(yasiyor.current)setYuzde(n);});
        await json("/partner/api/medya/podcast",{egitim_id:id,yukleme_id:d.yukleme_id,makbuz},"PATCH");
        if(yasiyor.current)setMesaj("Podcast Yüklendi.");
      }
      if(id)await oku(id);
    }catch(e){if(yasiyor.current)setHata(e instanceof Error?e.message:"Dosya yüklenemedi.");}
    finally{kilit.current=false;if(yasiyor.current){setAktif(null);onIslem(false);}}
  }
  function kart(rol:"egitim"|"tanitim") {
    const video=rol==="tanitim"||tur==="video",dosya=video?videolar.find(v=>v.rol===rol):podcast;
    return <section className={styles.medyaKarti}>
      <h3>{rol==="tanitim"?"Tanıtım Videosu":tur==="video"?"Eğitim Videosu":"Podcast Dosyası"}</h3>
      <p className={styles.bilgi}>{rol==="tanitim"?"En Fazla 2 Dakika · MP4, WebM, MOV":video?"MP4, WebM, MOV · En Fazla 5 GB":"MP3, M4A, AAC · En Fazla 250 MB"}</p>
      <label className={styles.medyaSecim} htmlFor={`partner-medya-${rol}`}>{dosya?"Yeni Dosya Yükle":"Dosya Seç"}</label>
      <input id={`partner-medya-${rol}`} aria-label={rol==="tanitim"?"Tanıtım Videosu Yükle":video?"Eğitim Videosu Yükle":"Podcast Yükle"} type="file" disabled={disabled||aktif!==null} accept={video?".mp4,.webm,.mov":".mp3,.m4a,.aac"} className={styles.medyaInput} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void yukle(file,rol);}} />
      {aktif===rol&&<div role="status"><progress max={100} value={yuzde} aria-label="Yükleme İlerlemesi" /> %{yuzde} Yükleniyor…</div>}
      {dosya&&<div className={styles.medyaSonuc}><strong>{dosya.dosya_adi}</strong><p>{dosya.durum==="hazir"?"Yüklendi":dosya.durum==="isleniyor"?"Aktarıldı · İşleniyor":dosya.durum==="hata"?(rol==="tanitim"&&Number(dosya.sure_saniye)>120?"2 Dakika Sınırı Aşıldı · Yeniden Yükleyin":"İşlenemedi · Yeniden Yükleyin"):"Aktarım Tamamlanmadı · Yeniden Yükleyin"}</p>
        {dosya.izleme_url&&<iframe title={rol==="tanitim"?"Tanıtım Videosu Önizleme":"Eğitim Videosu Önizleme"} src={dosya.izleme_url} allow="fullscreen" allowFullScreen />}
        {dosya.dinleme_url&&<audio controls preload="metadata" src={dosya.dinleme_url}>Tarayıcınız Ses Oynatmayı Desteklemiyor.</audio>}
      </div>}
    </section>;
  }
  return <div className={styles.medyaAlani}>
    <div className={styles.medyaKartlar}>{kart("egitim")}{kart("tanitim")}</div>
    {egitimId&&<Button type="button" variant="outline" disabled={disabled||aktif!==null} onClick={()=>{setHata("");void oku(egitimId).catch(e=>setHata(e.message));}}>Dosya Durumunu Kontrol Et</Button>}
    {mesaj&&<p role="status" className={styles.bilgi}>{mesaj}</p>}
    {hata&&<p role="alert" className={styles.hata}>{hata}</p>}
  </div>;
}
