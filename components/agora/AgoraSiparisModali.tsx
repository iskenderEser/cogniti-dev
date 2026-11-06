"use client";
import { useRef,useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel } from "@/components/ui/alert-dialog";
import { AgoraPodcastBilgisi } from "./AgoraPodcastBilgisi";
import { agoraTokenTutari,type AgoraYayini } from "@/lib/agora/vitrin";
export function AgoraSiparisModali({yayin,onKapat,onTamam}:{yayin:AgoraYayini;onKapat:()=>void;onTamam:(mevcut:boolean,borc:number)=>void}) {
 const [mesgul,setMesgul]=useState(false),[hata,setHata]=useState("");const kilit=useRef(false);
 async function siparisVer(){
  if(kilit.current)return;kilit.current=true;setMesgul(true);setHata("");
  try{
   const r=await fetch("/agora/api/siparis",{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body:JSON.stringify({egitim_id:yayin.egitim_id,surum:yayin.surum,fiyat_tl:yayin.fiyat_tl})});
   const d=await r.json();if(!r.ok)throw new Error(d.hata||"Sipariş tamamlanamadı.");
   onTamam(d.mevcut===true,Number(d.borca_yazilan_token)||0);
  }catch(e){setHata(e instanceof Error?e.message:"Sipariş tamamlanamadı.");}
  finally{kilit.current=false;setMesgul(false);}
 }
 return <AlertDialog open onOpenChange={acik=>{if(!acik&&!mesgul)onKapat();}}><AlertDialogContent>
  <AlertDialogHeader><AlertDialogTitle>Sipariş Onayı</AlertDialogTitle><AlertDialogDescription>
   {yayin.sirket_adi} tarafından üretilen “{yayin.egitim_adi}” yayınını {agoraTokenTutari(yayin.fiyat_tl).toLocaleString("tr-TR")} token karşılığında satın almayı onaylıyor musunuz?
   Yayın, hazır soru setiyle birlikte sizin yayın havuzunuza eklenecektir.
  </AlertDialogDescription></AlertDialogHeader>
  <AgoraPodcastBilgisi yayin={yayin}/>
  {hata&&<p role="alert" className="text-sm text-red-600">{hata}</p>}
  <AlertDialogFooter><AlertDialogCancel disabled={mesgul}>Hayır</AlertDialogCancel><Button disabled={mesgul||(yayin.yayin_araci==="podcast"&&(typeof yayin.transkript_var!=="boolean"||typeof yayin.kapak_var!=="boolean"))} onClick={()=>void siparisVer()}>{mesgul?"İşleniyor…":"Evet"}</Button></AlertDialogFooter>
 </AlertDialogContent></AlertDialog>;
}
