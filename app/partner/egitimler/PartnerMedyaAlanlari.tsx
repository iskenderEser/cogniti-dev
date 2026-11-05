"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { SORGU_ARALIGI_MS, TAVAN_SANIYE } from "@/lib/video/islemeDurumu";
import { Button } from "@/components/ui/button";
import { bunnyTusYukle, type BunnyVezneIzni } from "@/lib/video/bunnyTusIstemci";
import { dosyaSha256Parcali } from "@/lib/ogrenmeAraci/sha256Istemci";
import { dosyaBeyaniDogrula } from "@/lib/ogrenmeAraci/sozlesme";
import { PartnerYayinOynaticisi } from "@/components/agora/AgoraDenemeOynaticisi";
import styles from "./egitimler.module.css";

interface Medya { yukleme_id:string; rol?:string; dosya_adi:string; durum:string; izleme_url?:string|null; dinleme_url?:string|null; sure_saniye?:number|null }
interface Taslak {egitim_id:string;surum:number}
async function json(url:string,body:unknown,method="POST",headers:Record<string,string>={}) {
  const r=await fetch(url,{method,headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  const d=await r.json();if(!r.ok)throw new Error(d.hata||"Yükleme işlemi tamamlanamadı.");return d;
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
export default function PartnerMedyaAlanlari({egitimId,egitimAdi,istekId,tur,disabled,onTurDegis,onTaslak,onIslem,onHazirlik}:{
  egitimId:string|null;egitimAdi:string;istekId:string;tur:"video"|"podcast";disabled:boolean;
  onTurDegis:(tur:"video"|"podcast")=>void;
  onHazirlik?:(durum:{egitimId:string|null;tur:"video"|"podcast";hazir:boolean})=>void;
  onTaslak:(t:Taslak)=>void;onIslem:(aktif:boolean)=>void;
}) {
  const [videolar,setVideolar]=useState<Medya[]>([]),[podcast,setPodcast]=useState<Medya|null>(null);
  const [aktif,setAktif]=useState<string|null>(null),[yuzde,setYuzde]=useState(0),[hata,setHata]=useState(""),[mesaj,setMesaj]=useState("");
  const kilit=useRef(false),yasiyor=useRef(true),okumaSurumu=useRef(0);
  useEffect(() => {
    const dosya = tur === "video" ? videolar.find(v => v.rol === "egitim") : podcast;
    onHazirlik?.({egitimId, tur, hazir: aktif === null && (dosya?.durum === "hazir" || (tur === "video" && dosya?.durum === "isleniyor"))});
  }, [egitimId, tur, videolar, podcast, aktif, onHazirlik]);

  useEffect(()=>{yasiyor.current=true;return()=>{yasiyor.current=false;};},[]);
  const oku=useCallback(async(id:string)=>{
    const surum=++okumaSurumu.current;
    // Video ve podcast erişimleri bağımsızdır; diğer aracın hatası seçili dosyayı kapatamaz.
    const r=await fetch(`/partner/api/medya/${tur}?egitim_id=${id}`,{cache:"no-store",signal:AbortSignal.timeout(20000)});
    const d=await r.json();if(!r.ok)throw new Error(d.hata||"Dosya bilgileri okunamadı.");
    if(yasiyor.current&&surum===okumaSurumu.current){
      if(tur==="video")setVideolar(d.videolar);else setPodcast(d.podcast);
    }
  },[tur]);
  useEffect(()=>{
    let gecerli=true;
    setVideolar([]);setPodcast(null);
    if(egitimId)void oku(egitimId).catch(e=>{if(gecerli&&yasiyor.current)setHata(e.message);});
    return()=>{gecerli=false;};
  },[egitimId,oku]);
  const videoIsleniyor = tur === "video" && videolar.some(v => v.rol === "egitim" && v.durum === "isleniyor");
  useEffect(() => {
    if (!egitimId || !videoIsleniyor) return;
    let gecerli = true;
    let sorgulaniyor = false;
    const baslangic = Date.now();
    const zamanlayici = window.setInterval(async () => {
      if (!gecerli || sorgulaniyor) return;
      if (Date.now() - baslangic >= TAVAN_SANIYE * 1000) {
        window.clearInterval(zamanlayici);
        return;
      }
      sorgulaniyor = true;
      try {
        await oku(egitimId);
      } catch {
        // Geçici bağlantı hatasında sonraki sınırlı sorgu yeniden dener.
      } finally {
        sorgulaniyor = false;
      }
    }, SORGU_ARALIGI_MS);
    return () => { gecerli = false; window.clearInterval(zamanlayici); };
  }, [egitimId, videoIsleniyor, oku]);

  async function yukle(file:File) {
    const rol="egitim";
    if(kilit.current||disabled)return;
    kilit.current=true;setAktif(rol);setYuzde(0);setHata("");setMesaj("");onIslem(true);
    let id=egitimId;
    try{
      if(egitimAdi.trim().length<3)throw new Error("Önce Eğitim Adını Girin.");
      const video=tur==="video";
      if(video){
        if(!["video/mp4","video/webm","video/quicktime"].includes(file.type)||file.size<=0||file.size>5*1024**3)throw new Error("MP4, WebM veya MOV seçin (en fazla 5 GB).");
        const d=await json("/partner/api/medya/video",{egitim_id:id,egitim_adi:egitimAdi,istek_id:istekId,rol,dosya_adi:file.name,mime_type:file.type,dosya_boyutu:file.size}) as Taslak&BunnyVezneIzni;
        id=d.egitim_id;onTaslak(d);
        await bunnyTusYukle(file,d,n=>{if(yasiyor.current)setYuzde(n);});
        await json("/partner/api/medya/video",{egitim_id:id,yukleme_id:d.yukleme_id},"PUT",{"x-agora-partner":"1"});
        if(yasiyor.current)setMesaj("Video Aktarıldı. İşlenme Arka Planda Devam Ederken Soruları Hazırlayabilirsiniz.");
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
  const dosya = tur === "video" ? videolar.find(v => v.rol === "egitim") : podcast;
  const aktarildi = dosya?.durum === "hazir" || dosya?.durum === "isleniyor";
  function kart() {
    const rol="egitim",video=tur==="video";
    return <section className={styles.medyaKarti}>
      <fieldset className={styles.medyaTurleri} aria-labelledby="partner-yayin-araci-baslik" disabled={disabled || aktif !== null}>
        <label><input type="radio" name="partner-medya-turu" value="video" checked={video} onChange={() => onTurDegis("video")} />Video</label>
        <label><input type="radio" name="partner-medya-turu" value="podcast" checked={!video} onChange={() => onTurDegis("podcast")} />Podcast</label>
      </fieldset>
      <div className={styles.medyaIcerik}>
        {!aktarildi && <><label className={styles.medyaSecim} htmlFor={`partner-medya-${rol}`}>
          <Upload className={styles.medyaYuklemeIkonu} size={24} aria-hidden="true" />
          <span>Dosyanızı Yükleyin</span>
          <span className={styles.medyaBoyutBilgisi}>{video ? "(Sınır 5 GB)" : "(Sınır 250 MB)"}</span>
        </label>
        <input id={`partner-medya-${rol}`} aria-label={video?"Eğitim Videosu Yükle":"Podcast Yükle"} type="file" disabled={disabled||aktif!==null} accept={video?".mp4,.webm,.mov":".mp3,.m4a,.aac"} className={styles.medyaInput} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void yukle(file);}} /></>}
        {aktif===rol&&<div role="status"><progress max={100} value={yuzde} aria-label="Yükleme İlerlemesi" /> %{yuzde} Yükleniyor…</div>}
        {dosya&&<div className={styles.medyaSonuc}><strong>{dosya.dosya_adi}</strong>{dosya.durum !== "hazir" && <p>{dosya.durum==="isleniyor"?"Aktarıldı · İşleniyor":dosya.durum==="hata"?"İşlenemedi · Yeniden Yükleyin":"Aktarım Tamamlanmadı · Yeniden Yükleyin"}</p>}
          {egitimId&&dosya.durum==="hazir"&&<PartnerYayinOynaticisi key={tur+":"+dosya.yukleme_id} egitimId={egitimId} tur={tur} yerlesikTamEkran/>}
        </div>}
      </div>
    </section>;
  }
  return <div className={styles.medyaAlani}>
    <div>
      <span id="partner-yayin-araci-baslik" className={styles.alanBasligi}>Yayın Aracı</span>
      {kart()}
    </div>
    {egitimId && dosya?.durum !== "hazir" && <Button type="button" variant="outline" disabled={disabled||aktif!==null} onClick={()=>{setHata("");void oku(egitimId).catch(e=>setHata(e.message));}}>Dosya Durumunu Kontrol Et</Button>}
    {mesaj && dosya?.durum !== "hazir" && <p role="status" className={styles.bilgi}>{mesaj}</p>}
    {hata&&<p role="alert" className={styles.hata}>{hata}</p>}
  </div>;
}
