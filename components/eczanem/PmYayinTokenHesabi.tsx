"use client";
import {useState} from "react";
import type {BakiyeTuru} from "@/lib/satinAlma/esnekPaket";
import {PmTokenHesapSecimi} from "./PmTokenHesapSecimi";
import {TOKEN_BAKIYE_YENILE_OLAYI} from "@/components/panel/TokenBakiyeOzeti";
type Ozet={eski_yayin:boolean;hesap_turu:BakiyeTuru|null;blokeli:number;tuketilen:number;serbest:number};
export default function PmYayinTokenHesabi({yayinId}:{yayinId:string}){
 const [acik,setAcik]=useState(false),[ozet,setOzet]=useState<Ozet|null>(null),[secim,setSecim]=useState<BakiyeTuru|null>(null),[hata,setHata]=useState(''),[busy,setBusy]=useState(false);
 async function oku(kaydet=false){if(busy)return;setBusy(true);setHata('');try{
  const r=await fetch('/yayin-yonetimi/api/eczanem-token-hesabi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({yayinId,...(kaydet?{hesapTuru:secim}:{})})});const d=await r.json();if(!r.ok)throw Error(d.hata??'Hesap alınamadı.');
  if(!d||typeof d.eski_yayin!=='boolean'||![null,'kisisel','firma_ortak'].includes(d.hesap_turu)||![d.blokeli,d.tuketilen,d.serbest].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Hesap bilgisi doğrulanamadı.');
  setOzet(d);if(kaydet)window.dispatchEvent(new Event(TOKEN_BAKIYE_YENILE_OLAYI));
 }catch(e){setHata(e instanceof Error?e.message:'İşlem tamamlanamadı.');}finally{setBusy(false);}}
 return <div className="my-2 text-xs text-[var(--tema-kontrol-metin)]" onClick={e=>e.stopPropagation()}>
 <button type="button" disabled={busy} className="text-[var(--tema-kontrol-eylem)]" onClick={()=>{if(!acik){setAcik(true);void oku();}else setAcik(false);}}>Eczanem Token Hesabı {acik?'▴':'▾'}</button>
 {acik&&<div className="mt-2 rounded-lg border border-[var(--tema-kontrol-cizgi)] p-3">
 {busy&&<p role="status">İşleniyor…</p>}{hata&&<p role="alert">{hata} <button type="button" disabled={busy} onClick={()=>void oku()}>Yenile</button></p>}
 {ozet?.eski_yayin?<p>Bu yayın mevcut Firma Token Hesabı ile sürüyor. Kullanım ayrıntıları Token Kullanımı sayfasındadır.</p>:ozet?.hesap_turu?<><p>{ozet.hesap_turu==='kisisel'?'Kişisel Token Hesabı':'Firma Token Hesabı'}</p><p>Blokeli {ozet.blokeli.toLocaleString('tr-TR')} · Kullanılan {ozet.tuketilen.toLocaleString('tr-TR')} · Serbest kalan {ozet.serbest.toLocaleString('tr-TR')}</p><button type="button" disabled={busy} onClick={()=>void oku()} className="mt-2 text-[var(--tema-kontrol-eylem)]">Yenile</button></>:ozet&&<><PmTokenHesapSecimi deger={secim} onDegistir={setSecim}/><button type="button" disabled={busy||!secim} onClick={()=>void oku(true)}>Hesabı onayla ve sabitle</button></>}
 </div>}
 </div>;
}
