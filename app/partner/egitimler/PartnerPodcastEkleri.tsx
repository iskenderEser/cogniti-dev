"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { Button } from "@/components/ui/button";
import { PodcastTranskriptEditoru } from "@/app/(panel)/talepler/_components/PodcastTranskriptEditoru";
interface Ekler {surum:number;kapak_url:string|null;transkript:{durum:string;kaynak?:string;taslak_metin?:string;onaylanan_metin?:string}}
export default function PartnerPodcastEkleri({egitimId,yuklemeId,disabled,onIslem,onHazirlik,onDegisiklik}:{egitimId:string;yuklemeId:string;disabled:boolean;onIslem:(n:boolean)=>void;onHazirlik:(n:boolean)=>void;onDegisiklik?:(n:boolean)=>void}){
 const [ek,setEk]=useState<Ekler|null>(null),[metin,setMetin]=useState(""),[degisti,setDegisti]=useState(false),[hata,setHata]=useState("");
 const [mesgul,setMesgul]=useState(false),[acik,setAcik]=useState(false),[sekme,setSekme]=useState<"ai"|"dosya"|"metin">("dosya");
 const kilit=useRef(false),yasiyor=useRef(true),okuma=useRef(0),ekRef=useRef(ek);
 ekRef.current=ek;
 const uygula=useCallback((d:Ekler)=>{setEk(d);setMetin(d.transkript.onaylanan_metin??d.transkript.taslak_metin??"");setDegisti(false);},[]);
 const oku=useCallback(async(signal?:AbortSignal)=>{
  const s=++okuma.current;
  const r=await fetch(`/partner/api/medya/podcast-ekleri?egitim_id=${egitimId}&yukleme_id=${yuklemeId}`,{cache:"no-store",signal});const d=await r.json();
  if(!r.ok)throw new Error(d.hata||"Podcast ekleri okunamadı.");
  if(yasiyor.current&&s===okuma.current&&!kilit.current)uygula(d);
 },[egitimId,yuklemeId,uygula]);
 useEffect(()=>{yasiyor.current=true;const c=new AbortController();void oku(c.signal).catch(e=>{if(!c.signal.aborted)setHata(e.message);});return()=>{yasiyor.current=false;c.abort();};},[oku]);
 useEffect(()=>{onDegisiklik?.(degisti);return()=>onDegisiklik?.(false);},[degisti,onDegisiklik]);
 const aiBekliyor=ek?.transkript.durum==="ai_bekliyor"||ek?.transkript.durum==="ai_isleniyor";
 useEffect(()=>{if(!aiBekliyor)return;const c=new AbortController();let calisiyor=false;const timer=setInterval(()=>{if(calisiyor)return;calisiyor=true;void oku(c.signal).catch(e=>{if(!c.signal.aborted)setHata(e.message);}).finally(()=>{calisiyor=false;});},3000);return()=>{clearInterval(timer);c.abort();};},[aiBekliyor,oku]);
 useEffect(()=>{onHazirlik(!!ek&&!degisti&&["yok","onaylandi","iptal"].includes(ek.transkript.durum)&&!mesgul);},[ek,degisti,mesgul,onHazirlik]);
 async function islem(tur:string,metin?:string,file?:File,rol?:string):Promise<{ok:boolean;hata?:string}>{
  if(kilit.current||disabled||!ekRef.current)return {ok:false,hata:"İşlem henüz hazır değil."};
  kilit.current=true;++okuma.current;setMesgul(true);onIslem(true);setHata("");
  try{
   let body:FormData|string,headers:HeadersInit|undefined;
   if(file){const f=new FormData();f.set("egitim_id",egitimId);f.set("yukleme_id",yuklemeId);f.set("surum",String(ekRef.current.surum));f.set("rol",rol!);f.set("dosya",file);body=f;}
   else{body=JSON.stringify({egitim_id:egitimId,yukleme_id:yuklemeId,surum:ekRef.current.surum,islem:tur,metin});headers={"Content-Type":"application/json"};}
   const r=await fetch("/partner/api/medya/podcast-ekleri",{method:file?"PUT":"POST",headers,body,signal:AbortSignal.timeout(30000)});const d=await r.json();
   if(!r.ok)throw new Error(d.hata||"Podcast ekleri kaydedilemedi.");
   if(yasiyor.current)uygula(d);return {ok:true};
  }catch(e){const mesaj=e instanceof Error?e.message:"Podcast ekleri kaydedilemedi.";if(yasiyor.current)setHata(mesaj);return {ok:false,hata:mesaj};}
  finally{kilit.current=false;if(yasiyor.current){setMesgul(false);onIslem(false);}}
 }
 const onayli=ek?.transkript.durum==="onaylandi"&&!degisti;
 return <fieldset disabled={disabled||mesgul} className="mt-3 space-y-3" aria-label="Podcast Yayın Görseli ve Transkript">
  <div><p className="mb-2 text-sm font-bold">Yayın Görseli <span className="font-normal">(İsteğe bağlı)</span></p>
   {ek?.kapak_url&&<img src={ek.kapak_url} alt="Podcast yayın görseli" className="mb-2 max-h-40 max-w-full rounded-lg object-contain"/>}
   <label className="inline-flex cursor-pointer rounded-lg border px-3 py-2 text-sm">{ek?.kapak_url?"Görseli Değiştir":"Görsel Yükle"}<input aria-label="Podcast Yayın Görseli Yükle" type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" disabled={disabled||mesgul||!ek} onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void islem("kapak",undefined,f,"kapak");}}/></label>
   {ek?.kapak_url&&<Button type="button" variant="outline" className="ml-2" onClick={()=>void islem("kapak_kaldir")}>Görseli Kaldır</Button>}
   {!ek?.kapak_url&&<p className="mt-1 text-xs text-muted-foreground">Görsel seçilmezse standart podcast kapağı kullanılır.</p>}
  </div>
  <div><p className="mb-2 text-sm font-bold">Transkript <span className="font-normal">(İsteğe bağlı)</span></p>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="outline" disabled={!ek||mesgul} onClick={()=>{setSekme("dosya");setAcik(true);}}>Manuel Transkript Ekle</Button>
    <Button type="button" disabled={!ek||mesgul||aiBekliyor} onClick={()=>{setSekme("ai");setAcik(true);void islem("ai");}}>AI ile Transkript Oluştur</Button>
   </div>
   <p className="mt-2 text-xs">{degisti?"Metin değiştirildi; yeniden onaylayın.":onayli?"Transkript Onaylandı":aiBekliyor?"AI transkripti hazırlanıyor…":ek?.transkript.durum==="hata"?"AI işlemi tamamlanamadı. Tekrar deneyin veya transkriptsiz devam edin.":ek?.transkript.durum==="ai_taslak"||ek?.transkript.durum==="manuel_taslak"?"Transkript onayınızı bekliyor.":"Transkript eklenmedi."}</p>
   <fieldset disabled={aiBekliyor}><PodcastTranskriptEditoru sunucudaKayitli bekleyenDosya={null} metin={metin} onaylandi={onayli} aiIstendi={ek?.transkript.kaynak==="ai"}
    acik={acik} onAcikDegisti={setAcik} sekme={sekme} onSekmeDegisti={setSekme}
    islemDurumu={ek?.transkript.durum==="ai_bekliyor"?"ai_kuyrukta":ek?.transkript.durum==="ai_isleniyor"?"ai_isleniyor":ek?.transkript.durum==="hata"?"hata":ek?.transkript.durum==="ai_taslak"||onayli?"transkript_hazir":"bosta"}
    onAiBaslat={async()=>{await islem("ai");}} aiYukleniyor={aiBekliyor} hataMesaji={hata||null}
    onDosyaSec={file=>{void islem("metin",undefined,file,"transkript");}} onMetinDegisti={v=>{setMetin(v);setDegisti(true);}}
    onOnayla={()=>{}} onIptalEt={()=>{setAcik(false);}} onSunucuOnayla={v=>islem("onayla",v)} onSunucuIptal={()=>islem("iptal")}/></fieldset>
   {(degisti||ek?.transkript.durum!=="yok"&&ek?.transkript.durum!=="iptal")&&<Button type="button" variant="outline" disabled={!ek||mesgul} onClick={()=>{void islem("iptal").then(d=>{if(d.ok)setAcik(false);});}}>Transkriptsiz Devam Et</Button>}
  </div>
  {hata&&<p role="alert" className="text-sm text-red-600">{hata}</p>}
 </fieldset>;
}
