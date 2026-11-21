"use client";

import { useRef, useState } from "react";
import PartnerKabugu from "@/components/agora/PartnerKabugu";
import { useRouter } from "next/navigation";
import { ArrowLeft, EyeOff, Power, Send, Trash2 } from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PartnerEgitimFormu, { type PartnerEgitimFormKaydi } from "./PartnerEgitimFormu";
import styles from "./egitimler.module.css";

export default function PartnerEgitimSayfasi({sirketAdi,egitim,istekId}:{sirketAdi:string;logoSurumu:number;egitim:PartnerEgitimFormKaydi|null;istekId:string}) {
  const router=useRouter();
  const { mesajlar, basari } = useHataMesaji();
  const [degisti,setDegisti]=useState(false),[mesgul,setMesgul]=useState(false),[vazgec,setVazgec]=useState(false);
  const [silmeAcik,setSilmeAcik]=useState(false),[yayimlaAcik,setYayimlaAcik]=useState(false);
  const [guncelDurum,setGuncelDurum]=useState(egitim?.durum??"taslak");
  const [guncelSurum,setGuncelSurum]=useState(egitim?.surum??0);
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
  async function egitimiSil(){
    if(!egitim||kilit.current)return;
    kilit.current=true;setMesgul(true);setHata("");
    try{
      const r=await fetch("/partner/api/egitimler",{method:"DELETE",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(15000),body:JSON.stringify({egitim_id:egitim.egitim_id,surum:guncelSurum})});
      const d=await r.json();
      if(!r.ok)throw new Error(typeof d.hata==="string"?d.hata:"Yayın silinemedi.");
      setSilmeAcik(false);setDegisti(false);
      router.replace("/partner/egitimler");
    }catch(e){setHata(e instanceof Error?e.message:"Yayın silinemedi.");kilit.current=false;setMesgul(false);}
  }
  async function yayimla(){
    if(!egitim||kilit.current)return;
    kilit.current=true;setMesgul(true);setHata("");
    try{
      const r=await fetch("/partner/api/yayinla",{method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(30000),body:JSON.stringify({egitim_id:egitim.egitim_id,surum:guncelSurum})});
      const d=await r.json();
      if(!r.ok)throw new Error(typeof d.hata==="string"?d.hata:"Yayın yayımlanamadı.");
      setYayimlaAcik(false);setDegisti(false);
      router.replace("/partner/egitimler?kaydedildi=1");
    }catch(e){setHata(e instanceof Error?e.message:"Yayın yayımlanamadı.");kilit.current=false;setMesgul(false);}
  }
  async function durumDegistir(hedefDurum:"yayinda"|"pasif"){
    if(!egitim||kilit.current)return;
    kilit.current=true;setMesgul(true);setHata("");
    try{
      const r=await fetch("/partner/api/egitimler",{method:"PATCH",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(15000),body:JSON.stringify({egitim_id:egitim.egitim_id,surum:guncelSurum,durum:hedefDurum})});
      const d=await r.json();
      if(!r.ok)throw new Error(typeof d.hata==="string"?d.hata:"Yayın durumu değiştirilemedi.");
      setGuncelDurum(hedefDurum);
      if(Number.isSafeInteger(d.surum))setGuncelSurum(d.surum);
      basari(typeof d.mesaj==="string"?d.mesaj:(hedefDurum==="yayinda"?"Yayın yeniden aktife alındı.":"Yayın pasife alındı."));
      router.refresh();
    }catch(e){setHata(e instanceof Error?e.message:"Yayın durumu değiştirilemedi.");}
    finally{kilit.current=false;setMesgul(false);}
  }
  const solAltAksiyonlar=egitim?<div className="flex flex-wrap items-center gap-2">
    {guncelDurum==="taslak"&&<Button type="button" variant="outline" disabled={mesgul} onClick={()=>{setHata("");setYayimlaAcik(true);}}><Send size={14} aria-hidden="true"/>Agora’da Yayımla</Button>}
    {guncelDurum==="yayinda"&&<Button type="button" variant="outline" disabled={mesgul} onClick={()=>void durumDegistir("pasif")}><EyeOff size={14} aria-hidden="true"/>Pasife Al</Button>}
    {guncelDurum==="pasif"&&<Button type="button" className="bg-[var(--tema-kontrol-eylem)] text-white hover:bg-[var(--tema-kontrol-eylem)] hover:brightness-95" disabled={mesgul} onClick={()=>void durumDegistir("yayinda")}><Power size={14} aria-hidden="true"/>Aktife Al</Button>}
    <Button type="button" variant="outline" className="text-red-600 hover:text-red-700" disabled={mesgul} onClick={()=>{setHata("");setSilmeAcik(true);}}><Trash2 size={14} aria-hidden="true"/>Yayını Sil</Button>
  </div>:undefined;
  return <PartnerKabugu className={styles.page} firmaAdi={sirketAdi} onCikis={()=>ayril("cikis")} onAnaSayfa={listeyeDon} onGit={ayril} engelli={mesgul}>
    <HataMesajiContainer mesajlar={mesajlar} />
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--tema-cizgi)] pb-4">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[1.4px] text-[var(--tema-kontrol-eylem)]">
            COGNITI AGORA
          </p>
          <h1 className="m-0 mt-1 text-2xl font-bold text-[var(--tema-baslik)]">
            Video ve Podcast Yayın Planlama
          </h1>
          <p className="m-0 mt-1 text-xs text-[var(--tema-ikincil-metin)]">
            Yayın detaylarını, öğrenme aracını, soru setini ve fiyatını planlayın.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={mesgul} onClick={listeyeDon}><ArrowLeft size={16} aria-hidden="true"/>Agora Video ve Podcast Yayınlar</Button>
      </div>
      {hata&&<p role="alert" className={styles.hata}>{hata}</p>}
      <PartnerEgitimFormu ikiSutun egitim={egitim} istekId={istekId} baslikGoster={false} solAltAksiyonlar={solAltAksiyonlar} onizlemeDurumu={guncelDurum} onDegisiklik={setDegisti}
        onKapat={egitim ? listeyeDon : undefined} onIslem={aktif=>{kilit.current=aktif;setMesgul(aktif);}}
        onKaydedildi={async()=>{setDegisti(false);router.replace("/partner/egitimler?kaydedildi=1");}}/>
    </div>
    <AlertDialog open={silmeAcik} onOpenChange={open=>{if(!open&&!kilit.current)setSilmeAcik(false);}}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Yayını Sil</AlertDialogTitle><AlertDialogDescription>“{egitim?.egitim_adi}” yayınını silmek istediğinize emin misiniz? Yayın, listenizden kaldırılacak.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={mesgul}>İptal</AlertDialogCancel><AlertDialogAction className={styles.silOnayButonu} disabled={mesgul} onClick={e=>{e.preventDefault();void egitimiSil();}}>{mesgul?"Siliniyor…":"Sil"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={yayimlaAcik} onOpenChange={open=>{if(!open&&!kilit.current)setYayimlaAcik(false);}}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle className="sr-only">Yayımlama Onayı</AlertDialogTitle><AlertDialogDescription>Yayınınız Cogniti Agora&apos;da firmaların tercihine sunulacaktır. Onaylıyor musunuz?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={mesgul}>Hayır</AlertDialogCancel><AlertDialogAction disabled={mesgul} onClick={e=>{e.preventDefault();void yayimla();}}>{mesgul?"Yayımlanıyor…":"Evet"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={vazgec} onOpenChange={setVazgec}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Kaydedilmemiş Değişiklikler</AlertDialogTitle><AlertDialogDescription>Kaydetmediğiniz bilgiler kaybolacak. Bu sayfadan ayrılmak istiyor musunuz?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Düzenlemeye Devam Et</AlertDialogCancel><AlertDialogAction onClick={()=>void ayrilmayiTamamla()}>Kaydetmeden Çık</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </PartnerKabugu>;
}
