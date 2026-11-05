"use client";

import { useRef, useState } from "react";
import PartnerKabugu from "@/components/agora/PartnerKabugu";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PartnerEgitimFormu, { type PartnerEgitimFormKaydi } from "./PartnerEgitimFormu";
import styles from "./egitimler.module.css";

export default function PartnerEgitimSayfasi({sirketAdi,egitim,istekId}:{sirketAdi:string;logoSurumu:number;egitim:PartnerEgitimFormKaydi|null;istekId:string}) {
  const router=useRouter();
  const [degisti,setDegisti]=useState(false),[mesgul,setMesgul]=useState(false),[vazgec,setVazgec]=useState(false);
  const kilit=useRef(false),hedef=useRef<string>("/partner/egitimler");
  const [hata,setHata]=useState("");
  async function ayrilmayiTamamla(){
    if(kilit.current)return;
    if(hedef.current!=="cikis"){router.push(hedef.current);return;}
    kilit.current=true;setMesgul(true);setHata("");
    try{
      const r=await fetch("/partner/api/cikis",{method:"POST",signal:AbortSignal.timeout(15000)});
      if(!r.ok)throw new Error();
      window.location.replace("/partner");
    }catch{setHata("Çıkış tamamlanamadı. Yeniden deneyin.");kilit.current=false;setMesgul(false);}
  }
  function ayril(yol:string){
    if(kilit.current)return;
    hedef.current=yol;
    if(degisti)setVazgec(true);else void ayrilmayiTamamla();
  }
  const listeyeDon=()=>ayril("/partner/egitimler");
  return <PartnerKabugu className={styles.page} firmaAdi={sirketAdi} onCikis={()=>ayril("cikis")} onAnaSayfa={listeyeDon} onGit={ayril} engelli={mesgul}>
    <div className={styles.icerik}>
      <div className={styles.baslik}><h1>{egitim ? "Taslağı Düzenle" : <><svg aria-hidden="true" className="inline-block rounded-full align-middle" width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="10" fill="var(--tema-hata)" />
          <path d="M0 10h20M10 0v20" stroke="white" strokeWidth="1" />
        </svg>{" "}Yeni Eğitim</>}</h1><Button type="button" variant="outline" disabled={mesgul} onClick={listeyeDon}><ArrowLeft size={16} aria-hidden="true"/>Eğitimlerim</Button></div>
      {hata&&<p role="alert" className={styles.hata}>{hata}</p>}
      <PartnerEgitimFormu ikiSutun egitim={egitim} istekId={istekId} baslikGoster={false} onDegisiklik={setDegisti}
        onKapat={egitim ? listeyeDon : undefined} onIslem={aktif=>{kilit.current=aktif;setMesgul(aktif);}}
        onKaydedildi={async()=>{setDegisti(false);router.replace("/partner/egitimler?kaydedildi=1");}}/>
    </div>
    <AlertDialog open={vazgec} onOpenChange={setVazgec}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Kaydedilmemiş Değişiklikler</AlertDialogTitle><AlertDialogDescription>Kaydetmediğiniz bilgiler kaybolacak. Bu sayfadan ayrılmak istiyor musunuz?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Düzenlemeye Devam Et</AlertDialogCancel><AlertDialogAction onClick={()=>void ayrilmayiTamamla()}>Kaydetmeden Çık</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </PartnerKabugu>;
}
