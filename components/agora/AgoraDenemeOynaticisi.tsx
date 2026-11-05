"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AGORA_KORUMA_SURUMU, AGORA_SESLI_UYARI, AGORA_SESLI_UYARI_ARALIGI, type AgoraDenemeKaynagi } from "@/lib/agora/koruma";
import styles from "./AgoraDenemeOynaticisi.module.css";

/** Partnerin aynı yayını: taslakta normal, yayımlandıktan sonra korumalı oynatım. */
export function AgoraDenemeOynaticisi({ kaynak, yerlesikTamEkran=false }: {kaynak:AgoraDenemeKaynagi;yerlesikTamEkran?:boolean}) {
  return <AgoraDenemeIcerik key={`${kaynak.tur}:${kaynak.url}:${kaynak.korumaSurumu}`} kaynak={kaynak} yerlesikTamEkran={yerlesikTamEkran}/>;
}
function AgoraDenemeIcerik({ kaynak, yerlesikTamEkran=false }: {kaynak:AgoraDenemeKaynagi;yerlesikTamEkran?:boolean}) {
  const korumali=kaynak.korumaSurumu===AGORA_KORUMA_SURUMU;
  const yerlesik = yerlesikTamEkran && !korumali;
  const alan = useRef<HTMLDivElement>(null), ses = useRef<HTMLAudioElement>(null), uyari = useRef<HTMLAudioElement>(null);
  const [oynuyor,setOynuyor] = useState(false), [konum,setKonum] = useState(0), [sure,setSure] = useState(0), [hata,setHata] = useState("");
  const istek = useRef(0), uyariCalisiyor = useRef(false), sonBolum = useRef(-1), devam = useRef(false);
  useEffect(()=>{
    // Kaynak değişimi ve unmount, bekleyen play sözünü de geçersiz kılar.
    const a=ses.current, u=uyari.current;
    a?.setAttribute("disableremoteplayback", "");u?.setAttribute("disableremoteplayback", "");
    return ()=>{istek.current++;devam.current=false;a?.pause();u?.pause();};
  },[]);
  function durdur() { istek.current++;devam.current=false;ses.current?.pause();uyari.current?.pause();uyariCalisiyor.current=false;setOynuyor(false); }
  function basarisiz() { durdur();setHata("Deneme yayınının sesli koruması veya ses dosyası açılamadı. Yeniden deneyin."); }
  async function oynat() {
    if (!ses.current || (korumali&&!uyari.current) || uyariCalisiyor.current) return;
    const no=++istek.current;
    setHata("");devam.current=true;setOynuyor(true);
    const bolum=Math.floor(ses.current.currentTime/AGORA_SESLI_UYARI_ARALIGI);
    try {
      if (korumali&&uyari.current&&sonBolum.current!==bolum) {
        ses.current.pause();uyariCalisiyor.current=true;uyari.current.currentTime=0;
        await uyari.current.play();
        if(no!==istek.current){uyari.current.pause();return;}
        // İçerik yalnız ended olayıyla devam eder; hata veya iptal korumayı atlatmaz.
        return;
      }
      await ses.current.play();
      if(no!==istek.current)ses.current.pause();
    } catch {if(no===istek.current)basarisiz();}
  }
  async function uyariBitti() {
    if(!devam.current || !ses.current || !uyariCalisiyor.current)return;
    sonBolum.current=Math.floor(ses.current.currentTime/AGORA_SESLI_UYARI_ARALIGI);
    uyariCalisiyor.current=false;
    const no=istek.current;
    try{await ses.current.play();if(no!==istek.current)ses.current.pause();}catch{if(no===istek.current)basarisiz();}
  }
  function zaman() {
    const a=ses.current;if(!a)return;setKonum(a.currentTime);
    if(korumali&&devam.current&&!uyariCalisiyor.current&&Math.floor(a.currentTime/AGORA_SESLI_UYARI_ARALIGI)!==sonBolum.current)void oynat();
  }
  if(![0,AGORA_KORUMA_SURUMU].includes(kaynak.korumaSurumu))return <p role="alert">Koruma paketi doğrulanamadı.</p>;
  return <div ref={alan} data-agora-oynatici className={styles.alan} onContextMenu={e=>e.preventDefault()}>
    {kaynak.tur==="video" ? <>
      <div className={styles.video}>
        <iframe title={korumali?"Eğitim Videosu · Ön İzleme":"Eğitim Videosu"} src={kaynak.url} allow={yerlesik ? "autoplay; encrypted-media; fullscreen" : "autoplay; encrypted-media; fullscreen 'none'; picture-in-picture 'none'"} allowFullScreen={yerlesik} />
        {korumali&&<div className={styles.filigran} aria-label="Cogniti Ön İzleme">
          {/* SVG, mevcut Cogniti marka kaynağıdır. Filigran oynatıcıya aittir. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marka/cogniti-blue.svg" alt="Cogniti" /><strong>Ön İzleme</strong>
        </div>}
      </div>
      {!yerlesik && <Button type="button" variant="outline" onClick={()=>{
        if(document.fullscreenElement===alan.current)void document.exitFullscreen().catch(()=>setHata("Tam ekran kapatılamadı."));
        else void alan.current?.requestFullscreen?.().catch(()=>setHata("Tam ekran bu tarayıcıda açılamadı."));
      }}>Tam Ekran</Button>}
    </> : <>
      {korumali&&<p className={styles.etiket}>Cogniti · Deneme Yayını</p>}
      <audio ref={ses} src={kaynak.url} preload="metadata" controlsList="nodownload noremoteplayback"
        onLoadedMetadata={()=>setSure(Number.isFinite(ses.current?.duration)?ses.current!.duration:0)}
        onTimeUpdate={zaman} onSeeking={zaman} onError={basarisiz} onEnded={()=>{durdur();sonBolum.current=-1;if(ses.current)ses.current.currentTime=0;setKonum(0);}} />
      {korumali&&<audio ref={uyari} src={AGORA_SESLI_UYARI} preload="auto" controlsList="nodownload noremoteplayback" onEnded={()=>void uyariBitti()} onError={basarisiz} />}
      <div className={styles.kontroller}>
        <Button type="button" variant="outline" onClick={()=>oynuyor?durdur():void oynat()}>{oynuyor?"Duraklat":"Dinle"}</Button>
        <input aria-label="Podcast Konumu" type="range" min={0} max={sure||0} step={1} value={Math.min(konum,sure||0)} disabled={!sure} onChange={e=>{
          if(!ses.current)return;ses.current.currentTime=Number(e.target.value);setKonum(Number(e.target.value));
          if(devam.current&&!uyariCalisiyor.current)void oynat();
        }} />
        <span>{Math.floor(konum)} / {Math.floor(sure)} sn</span>
      </div>
      {korumali&&<p className={styles.bilgi}>Başlangıçta ve her 30 saniyede “Kogniti — Deneme Yayını” sesli uyarısı duyulur.</p>}
    </>}
    {kaynak.uyari&&<p role="status" className={styles.bilgi}>{kaynak.uyari}</p>}
    {hata&&<p role="alert">{hata}</p>}
  </div>;
}

export function PartnerYayinOynaticisi({egitimId,tur,yerlesikTamEkran=false}:{egitimId:string;tur:"video"|"podcast";yerlesikTamEkran?:boolean}) {
  return <PartnerYayinIcerik key={`${egitimId}:${tur}`} egitimId={egitimId} tur={tur} yerlesikTamEkran={yerlesikTamEkran}/>;
}
function PartnerYayinIcerik({egitimId,tur,yerlesikTamEkran=false}:{egitimId:string;tur:"video"|"podcast";yerlesikTamEkran?:boolean}) {
  const [kaynak,setKaynak]=useState<AgoraDenemeKaynagi|null>(null),[hata,setHata]=useState("");
  useEffect(()=>{
    const c=new AbortController();
    void fetch(`/partner/api/koruma/${egitimId}?tur=${tur}`,{cache:"no-store",signal:c.signal}).then(async r=>{
      const d=await r.json();if(!r.ok)throw new Error(d.hata||"Koruma önizlemesi açılamadı.");
      if(!["video","podcast"].includes(d.tur)||![0,AGORA_KORUMA_SURUMU].includes(d.korumaSurumu)||typeof d.url!=="string")throw new Error("Koruma paketi doğrulanamadı.");
      if(!c.signal.aborted)setKaynak(d);
    }).catch(e=>{if(!c.signal.aborted)setHata(e.message);});
    return()=>c.abort();
  },[egitimId,tur]);
  return kaynak?<AgoraDenemeOynaticisi kaynak={kaynak} yerlesikTamEkran={yerlesikTamEkran}/>:<p role={hata?"alert":"status"}>{hata||"Yayın hazırlanıyor…"}</p>;
}
